from typing import AsyncGenerator
from pptx import Presentation
from slideia.core.logging import get_logger
from slideia.domain.deck.models import Deck, Slide
from slideia.infra.cache import Cache, RedisCache
from slideia.infra.openrouter import OpenRouterLLM

logger = get_logger(__name__)


def create_minimal_template(path: str):
    """Create a minimal PowerPoint template with one title slide and one content slide.

    Args:
        path (str): The file path to save the template.
    """
    prs = Presentation()

    # Title slide layout
    title_slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(title_slide_layout)
    slide.shapes.title.text = "Title Placeholder"
    if len(slide.placeholders) > 1:
        slide.placeholders[1].text = "Subtitle Placeholder"

    # Content slide layout
    content_layout = prs.slide_layouts[1]
    slide = prs.slides.add_slide(content_layout)
    slide.shapes.title.text = "Content Title"
    if len(slide.placeholders) > 1:
        body_shape = slide.placeholders[1]
        tf = body_shape.text_frame
        tf.text = "Bullet 1\n Bullet 2"

    # Save template
    prs.save(path)


async def generate_full_deck(
    topic: str,
    audience: str,
    tone: str,
    slide_count: int,
    llm: OpenRouterLLM,
    cache: Cache | RedisCache,
) -> Deck:
    cached = cache.get(topic, audience, tone, slide_count)
    if cached:
        return Deck(
            outline=cached.get("outline", {}),
            slides=[Slide(**s) for s in cached.get("slides", [])],
        )

    logger.info("Generating new deck...")

    outline = await llm.propose_outline(
        topic=topic,
        audience=audience,
        tone=tone,
        slide_count=slide_count,
    )

    slides_content = []
    for slide_spec in outline.get("slides", []):
        slides_content.append(await llm.draft_slide(slide_spec))

    logger.info("Deck generation complete!")
    result = {
        "outline": outline,
        "slides": slides_content,
    }

    cache.set(topic, audience, tone, slide_count, result)
    logger.info("Cached the generated deck.")

    return Deck(
        outline=outline,
        slides=[Slide(**s) for s in slides_content],
    )


async def generate_full_deck_stream(
    topic: str,
    audience: str,
    tone: str,
    slide_count: int,
    llm: OpenRouterLLM,
    cache: Cache | RedisCache,
) -> AsyncGenerator[dict, None]:
    """
    Generate a full deck and yield progress events.
    """
    cached = cache.get(topic, audience, tone, slide_count)
    if cached:
        logger.info("Serving cached deck via stream.")
        yield {
            "step": "complete",
            "progress": 100,
            "message": "Loaded from cache!",
            "data": cached
        }
        return

    logger.info("Starting streaming generation...")
    
    # Step 1: Outline
    yield {
        "step": "outline",
        "progress": 10,
        "message": "Analyzing topic and structuring the story..."
    }
    
    outline = await llm.propose_outline(
        topic=topic,
        audience=audience,
        tone=tone,
        slide_count=slide_count,
    )
    
    total_slides = len(outline.get("slides", []))
    slides_content = []
    
    # Step 2: Slides
    for i, slide_spec in enumerate(outline.get("slides", [])):
        title = slide_spec.get("title", "Untitled Slide")
        progress = 10 + int((i / total_slides) * 80)
        
        yield {
            "step": "slide",
            "index": i + 1,
            "total": total_slides,
            "title": title,
            "progress": progress,
            "message": f"Drafting slide {i + 1} of {total_slides}: {title}"
        }
        
        slide_content = await llm.draft_slide(slide_spec)
        slides_content.append(slide_content)

    # Step 3: Complete
    result = {
        "outline": outline,
        "slides": slides_content,
    }
    
    cache.set(topic, audience, tone, slide_count, result)
    
    yield {
        "step": "complete",
        "progress": 100,
        "message": "Presentation ready!",
        "data": result
    }


async def propose_outline_stream(
    topic: str,
    audience: str,
    tone: str,
    slide_count: int,
    llm: OpenRouterLLM,
    cache: Cache | RedisCache,
) -> AsyncGenerator[dict, None]:
    """
    Propose an outline and yield progress events.
    """
    # Check cache
    cached = cache.get(topic, audience, tone, slide_count)
    if cached:
        logger.info("Serving cached outline via stream.")
        yield {
            "step": "complete",
            "progress": 100,
            "message": "Loaded from cache!",
            "data": cached.get("outline", {})
        }
        return

    logger.info("Starting streaming outline proposal...")
    
    yield {
        "step": "outline",
        "progress": 20,
        "message": "Analyzing theme and context..."
    }
    
    # We don't have sub-steps for LLM.propose_outline yet, 
    # but we can simulate progress and use the async call.
    yield {
        "step": "outline",
        "progress": 50,
        "message": "Drafting structural framework..."
    }
    
    outline = await llm.propose_outline(
        topic=topic,
        audience=audience,
        tone=tone,
        slide_count=slide_count,
    )
    
    yield {
        "step": "outline",
        "progress": 90,
        "message": "Finalizing presentation structure..."
    }
    
    # We yield the final result
    yield {
        "step": "complete",
        "progress": 100,
        "message": "Outline complete!",
        "data": outline
    }
