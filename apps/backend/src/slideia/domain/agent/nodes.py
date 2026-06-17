import asyncio
import json
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from slideia.core.config import settings
from slideia.core.logging import get_logger
from slideia.domain.agent.state import AgentState
from slideia.infra.openrouter import OpenRouterLLM

logger = get_logger(__name__)

# Initialize LLM for the nodes
llm = OpenRouterLLM(
    api_key=settings.OPENROUTER_API_KEY.get_secret_value(),
    model=settings.OPENROUTER_MODEL,
)

# ── Prompt Constants ──────────────────────────────────────────────────────

INTENT_SYSTEM_PROMPT = """You are the intent classifier for Slideia, an AI-powered presentation generator.
Analyze the user's latest prompt and the conversation history. Decide which of the following intents best fits:

1. CREATE_DECK: The user wants to generate a new presentation, create an outline, draft slides from scratch, or start a new deck on a specific topic.
2. EDIT_DECK: The user wants to modify, refine, update, delete, reorder, or style slides in their existing presentation deck. Examples: "add a slide about security", "change title of slide 2", "make the bullets shorter", "use a modern theme".
3. CHAT: The user is asking a general question, explaining a concept, discussing presentation layout, or conversing without wanting to create or modify a slide deck.

Response MUST be a valid JSON object ONLY, with the following format:
{{
  "intent": "CREATE_DECK" | "EDIT_DECK" | "CHAT",
  "instruction": "If the intent is EDIT_DECK, state the exact edit instructions. If CREATE_DECK, summarize the presentation topic and configuration requested. If CHAT, keep this null."
}}
"""

REFINEMENT_PROMPT_TEMPLATE = """You are the Slideia presentation editor agent.
Your task is to modify the existing presentation slide deck based on the user's instructions.

CURRENT PRESENTATION STATE:
- Topic: {topic}
- Audience: {audience}
- Tone: {tone}
- Theme: {theme_preset}
- Slides JSON:
{slides_json}

USER INSTRUCTION:
{instruction}

{file_context_block}

INSTRUCTIONS:
1. Apply the user's requested edit precisely.
2. If they ask to add a slide, insert it in the logical position. Choose the most appropriate layout:
   - "bullets": standard slide with 3-5 bullet points (default, use for general/detailed content)
   - "statement": a single bold statement, quote or takeaway (use for openers, closers, or key focus slides)
   - "big_number": focuses on one key statistic or metric with context (use when data/stats are the primary highlight)
3. If they ask to modify a slide (e.g., update slide 2), change only the target slide while leaving other slides intact.
4. If they ask to change a slide's layout (e.g., "make slide 3 a big statement"), update its "layout" and adjust the fields accordingly (e.g., clear "bullets" and populate "statement").
5. If they ask to change the overall tone, theme, palette, or font, update the appropriate fields.
6. If they ask to delete a slide, remove it.
7. Ensure the result is a complete, valid slide deck matching the schema.

LAYOUT CONTENT REQUIREMENTS:
Depending on each slide's "layout", generate the corresponding fields:
- For layout "bullets":
  - "bullets": A list of 3-5 concise, actionable bullet points (max 10-12 words each).
  - "statement": null, "big_number": null, "big_number_context": null
- For layout "statement":
  - "statement": A single bold, high-impact statement, key takeaway, or quote (1 sentence, max 15 words) summarizing the core message.
  - "bullets": [], "big_number": null, "big_number_context": null
- For layout "big_number":
  - "big_number": A single key statistic, percentage, or metric (e.g., "73%", "5.2 Billion", "$10M+").
  - "big_number_context": A short phrase/sentence providing the context for this number (max 8-10 words).
  - "bullets": [], "statement": null

OUTPUT FORMAT (valid JSON only):
{{
  "title": "Presentation Topic",
  "palette": ["#Hex1", "#Hex2", "#Hex3"],
  "font": "Font Name (e.g., Aptos Display, Calibri, Inter)",
  "theme_summary": "Theme Style",
  "slides": [
    {{
      "title": "Slide Title",
      "layout": "bullets" | "statement" | "big_number",
      "bullets": ["Bullet 1", "Bullet 2"],
      "statement": "Optional bold statement",
      "big_number": "Optional number",
      "big_number_context": "Optional context for number",
      "notes": "Speaker notes for presentation",
      "image_prompt": "Image prompt describing a slide graphic",
      "citations": ["Source 1"]
    }}
  ],
  "citations": ["Source 1", "Source 2"]
}}

Return ONLY valid JSON. Do not wrap in markdown code blocks.
"""

# ── Node Implementations ──────────────────────────────────────────────────


async def get_queue(config: RunnableConfig) -> asyncio.Queue | None:
    """Helper to retrieve the SSE stream queue from LangGraph config."""
    if not config or "configurable" not in config:
        return None
    return config["configurable"].get("queue")


async def push_to_queue(config: RunnableConfig, item: dict):
    """Helper to push an update item (token, deck_update, status) to queue."""
    queue = await get_queue(config)
    if queue:
        await queue.put(item)


async def classify_intent_node(state: AgentState, config: RunnableConfig) -> dict:
    """Classifies user intent and sets parameters in the state."""
    logger.info("Node: classify_intent_node")
    await push_to_queue(config, {"status": "Analyzing request..."})

    # Prepare chat history formatted for LLM call
    history_str = ""
    for msg in state["messages"][:-1]:
        role = "User" if isinstance(msg, HumanMessage) else "Assistant"
        history_str += f"{role}: {msg.content}\n"

    prompt = f"{INTENT_SYSTEM_PROMPT}\n\nHISTORY:\n{history_str}\nCURRENT PROMPT:\n{state['prompt']}\n"

    try:
        result = await llm._call(prompt)
        intent = result.get("intent", "CHAT")
        instruction = result.get("instruction")

        # If user asks to edit but there is no current deck, force CREATE_DECK
        if intent == "EDIT_DECK" and not state.get("deck"):
            logger.info("Intent classified as EDIT_DECK but no deck exists. Forcing CREATE_DECK.")
            intent = "CREATE_DECK"
            instruction = state["prompt"]

        logger.info(f"Classified intent: {intent}, instruction: {instruction}")
        return {
            "intent": intent,
            "instruction": instruction,
        }
    except Exception as e:
        logger.error(f"Intent classification failed: {e}")
        return {
            "intent": "CHAT",
            "instruction": None,
        }


async def propose_outline_node(state: AgentState, config: RunnableConfig) -> dict:
    """Proposes outline if starting a new deck."""
    logger.info("Node: propose_outline_node")
    await push_to_queue(config, {"status": "Structuring the story..."})

    topic = state.get("topic") or state["prompt"]
    audience = state.get("audience") or "General Audience"
    tone = state.get("tone") or "Professional"
    slide_count = state.get("slide_count") or 5
    theme_preset = state.get("theme_preset") or "Default"

    # Inject file context if present
    theme_instruction = theme_preset
    if state.get("file_context"):
        theme_instruction += f"\n\nReference Material:\n{state['file_context']}"

    try:
        outline = await llm.propose_outline(
            topic=topic,
            audience=audience,
            tone=tone,
            slide_count=slide_count,
            theme_instruction=theme_instruction,
        )

        return {
            "deck": {
                "outline": outline,
                "palette": outline.get("palette"),
                "font": outline.get("font"),
                "citations": outline.get("citations", []),
                "slides": [],
            },
            "topic": topic,
            "audience": audience,
            "tone": tone,
            "slide_count": slide_count,
        }
    except Exception as e:
        logger.error(f"Outline generation failed: {e}")
        return {"error": f"Failed to propose outline: {e}"}


async def draft_slides_node(state: AgentState, config: RunnableConfig) -> dict:
    """Drafts slide contents for each slide spec in parallel batches."""
    logger.info("Node: draft_slides_node")

    deck = state.get("deck")
    if not deck or not deck.get("outline"):
        return {"error": "No outline found to draft slides from."}

    outline = deck["outline"]
    slide_specs = outline.get("slides", [])
    total_slides = len(slide_specs)

    await push_to_queue(
        config,
        {
            "status": f"Drafting slides (0/{total_slides})...",
            "token": "I'm drafting the slide deck content. ",
        },
    )

    theme_preset = state.get("theme_preset") or "Default"
    topic = state.get("topic") or state["prompt"]
    audience = state.get("audience") or "General Audience"

    semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_LLM_CALLS)
    batch_size = 3
    batches = [slide_specs[i : i + batch_size] for i in range(0, len(slide_specs), batch_size)]
    slides_content = [None] * total_slides
    slides_processed = 0

    async def process_batch(batch, start_idx):
        async with semaphore:
            try:
                res = await llm.draft_slides_batch(topic, audience, batch, theme_instruction=theme_preset)
                return res.get("slides", []), start_idx
            except Exception as e:
                logger.error(f"Batch generation failed: {e}")
                return [], start_idx

    tasks = [process_batch(b, i * batch_size) for i, b in enumerate(batches)]

    for future in asyncio.as_completed(tasks):
        batch_slides, batch_start = await future
        for j, slide in enumerate(batch_slides):
            idx = batch_start + j
            if idx < total_slides:
                slides_content[idx] = slide
                slides_processed += 1
                await push_to_queue(
                    config,
                    {
                        "status": f"Drafting slides ({slides_processed}/{total_slides}): {slide.get('title')}...",
                        "token": f"✓ {slide.get('title')} ",
                    },
                )

    # Flatten and validate non-null slides
    slides_content = [s for s in slides_content if s is not None]

    deck["slides"] = slides_content
    logger.info(f"Finished drafting {len(slides_content)} slides.")

    # Send a deck update event through queue
    await push_to_queue(config, {"deck_update": deck})

    return {
        "deck": deck,
        "messages": [AIMessage(content="I have generated the outline and drafted all of your slides!")],
    }


async def refine_deck_node(state: AgentState, config: RunnableConfig) -> dict:
    """Edits/refines the existing deck based on user verbal instruction."""
    logger.info("Node: refine_deck_node")
    await push_to_queue(config, {"status": "Refining slide deck..."})

    deck = state.get("deck")
    if not deck:
        return {"error": "No deck found to refine."}

    instruction = state.get("instruction") or state["prompt"]

    file_block = ""
    if state.get("file_context"):
        file_block = f"USER UPLOADED FILE CONTEXT:\n{state['file_context']}\n"

    prompt = REFINEMENT_PROMPT_TEMPLATE.format(
        topic=state.get("topic", "Presentation"),
        audience=state.get("audience", "Audience"),
        tone=state.get("tone", "Professional"),
        theme_preset=state.get("theme_preset", "Default"),
        slides_json=json.dumps(deck.get("slides", []), indent=2),
        instruction=instruction,
        file_context_block=file_block,
    )

    try:
        updated_deck = await llm._call(prompt, max_tokens=4096)

        # Retain outline title & citations if absent from model output
        deck_update = {
            "outline": deck.get("outline", {}),
            "palette": updated_deck.get("palette") or deck.get("palette"),
            "font": updated_deck.get("font") or deck.get("font"),
            "citations": updated_deck.get("citations") or deck.get("citations", []),
            "slides": updated_deck.get("slides", []),
        }

        # Send updated deck through queue
        await push_to_queue(config, {"deck_update": deck_update})

        msg_text = f"I've updated the presentation based on your request: '{instruction}'."
        await push_to_queue(config, {"token": msg_text})

        return {
            "deck": deck_update,
            "messages": [AIMessage(content=msg_text)],
        }

    except Exception as e:
        logger.error(f"Deck refinement failed: {e}")
        return {"error": f"Failed to refine slide deck: {e}"}


async def validate_node(state: AgentState, config: RunnableConfig) -> dict:
    """Validates the structure, slide count, and formatting constraints."""
    logger.info("Node: validate_node")

    deck = state.get("deck")
    if not deck or "slides" not in deck:
        return {"error": "No slides found in the generated deck."}

    slides = deck["slides"]
    if not slides:
        return {"error": "The slide list is empty."}

    # Verify formatting constraints on slides
    for idx, s in enumerate(slides):
        if not s.get("title"):
            return {"error": f"Slide {idx + 1} is missing a title."}
        if not isinstance(s.get("bullets"), list):
            return {"error": f"Slide {idx + 1} ('{s.get('title')}') bullets must be a list of strings."}

    # If it passed validation, clear error
    return {"error": None}


async def general_chat_node(state: AgentState, config: RunnableConfig) -> dict:
    """Streams a conversational chat response for general Q&A."""
    logger.info("Node: general_chat_node")

    messages = []
    # System prompt
    system_prompt = (
        "You are Slideia, a helpful presentation design assistant. Answer the user's questions "
        "expertly. If relevant, explain how they can use the Slideia features."
    )
    messages.append({"role": "system", "content": system_prompt})

    # History
    for msg in state["messages"][:-1]:
        role = "user" if isinstance(msg, HumanMessage) else "assistant"
        messages.append({"role": role, "content": msg.content})

    # File context
    if state.get("file_context"):
        messages.append({"role": "user", "content": f"Context files:\n{state['file_context']}"})

    # Current prompt
    messages.append({"role": "user", "content": state["prompt"]})

    # Stream the tokens through queue
    full_response = ""
    try:
        async for token in llm.stream_call(messages):
            await push_to_queue(config, {"token": token})
            full_response += token

        return {
            "messages": [AIMessage(content=full_response)],
        }
    except Exception as e:
        logger.error(f"General chat stream failed: {e}")
        err_msg = "I encountered an error trying to connect to the model. Please try again."
        await push_to_queue(config, {"token": err_msg})
        return {
            "messages": [AIMessage(content=err_msg)],
        }
