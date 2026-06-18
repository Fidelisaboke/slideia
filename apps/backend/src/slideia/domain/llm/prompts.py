OUTLINE_PROMPT = """Create a PowerPoint presentation outline for a {slide_count}-slide deck.

PRESENTATION DETAILS:
- Topic: {topic}
- Audience: {audience}
- Tone: {tone}
- Theme Preference: {theme_instruction}

INSTRUCTIONS:
1. Create a compelling presentation title that captures the main theme
2. Design {slide_count} content slides (excluding title slide)
3. Each slide should have a clear, concise title (max 6 words)
4. Each slide should have a brief summary (1-2 sentences describing the slide's purpose)
5. Ensure logical flow between slides
6. Include citations only if relevant facts/data are referenced. Provide both per-slide citations and a consolidated list of all references.
7. Assign a layout to each slide based on its content/purpose. Choose the most appropriate option from:
   - "bullets": standard slide with 3-5 bullet points (default, use for general/detailed content)
   - "statement": a single bold statement, quote or takeaway (use for openers, closers, or key focus slides)
   - "big_number": focuses on one key statistic or metric with context (use when data/stats are the primary highlight)
   - "two_column": side-by-side comparison layout (use for pros/cons, before/after, or contrasting ideas)
   - "steps": numbered sequential process (use for workflows, how-to guides, or timelines)
   - "quote": a notable attributed quote (use sparingly, for expert opinions or powerful testimonials)

OUTPUT FORMAT (valid JSON only):
{{
  "title": "Presentation Title Here",
  "theme_summary": "Description of the visual style and color palette based on {theme_instruction}",
  "palette": ["#Hex1", "#Hex2", "#Hex3"],
  "font": "Font Name (e.g., Aptos Display, Calibri, Inter)",
  "slides": [
    {{
      "title": "Slide Title",
      "summary": "Brief 1-2 sentence description of what this slide covers",
      "layout": "bullets" | "statement" | "big_number" | "two_column" | "steps" | "quote",
      "citations": ["Source 1"]
    }}
  ],
  "citations": ["Source 1", "Source 2"]
}}

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, no extra text. Do not wrap in ```json blocks.
"""


SLIDE_PROMPT = """Create content for a PowerPoint slide.

SLIDE INFORMATION:
- Title: {title}
- Purpose: {summary}
- Layout: {layout}

LAYOUT CONTENT REQUIREMENTS:
Depending on the requested "Layout", generate the corresponding fields:

1. For layout "bullets":
   - "bullets": A list of 3-5 concise, actionable bullet points (max 10-12 words each).
   - All other layout fields: null or []

2. For layout "statement":
   - "statement": A single bold, high-impact statement, key takeaway, or quote (1 sentence, max 15 words) summarizing the core message.
   - All other layout fields: null or []

3. For layout "big_number":
   - "big_number": A single key statistic, percentage, or metric (e.g., "73%", "5.2 Billion", "$10M+").
   - "big_number_context": A short phrase/sentence providing the context for this number (max 8-10 words).
   - All other layout fields: null or []

4. For layout "two_column":
   - "column_left_title": A short label for the left column (e.g., "Before", "Pros", "Current State").
   - "column_left": A list of 2-4 bullet points for the left column.
   - "column_right_title": A short label for the right column (e.g., "After", "Cons", "Future State").
   - "column_right": A list of 2-4 bullet points for the right column.
   - All other layout fields: null or []

5. For layout "steps":
   - "steps": An ordered list of 3-6 steps (each step: short imperative sentence, max 10 words).
   - All other layout fields: null or []

6. For layout "quote":
   - "quote_text": The verbatim quote (1-2 sentences max).
   - "quote_attribution": The attribution (e.g., "— Elon Musk, CEO of Tesla").
   - All other layout fields: null or []

COMMON FIELDS:
- "notes": Speaker notes (2-3 sentences)
- "image_prompt": A 1-sentence prompt describing a relevant professional visual/graphic for this slide (set to null for "statement", "big_number", "two_column", "steps", and "quote" layouts as they do not contain images).

OUTPUT FORMAT (valid JSON only):
{{
  "bullets": [],
  "statement": null,
  "big_number": null,
  "big_number_context": null,
  "column_left_title": null,
  "column_left": [],
  "column_right_title": null,
  "column_right": [],
  "steps": [],
  "quote_text": null,
  "quote_attribution": null,
  "notes": "...",
  "image_prompt": null
}}

CRITICAL RULES:
- Return ONLY valid JSON. Do not wrap in markdown code blocks.
- Only populate the fields relevant to the requested layout. Set all others to null or [].
"""


REGENERATE_SLIDE_PROMPT = """Regenerate the content for a PowerPoint slide.

SLIDE INFORMATION:
- Title: {title}
- Purpose: {summary}
- Layout: {layout}

{instruction_block}

LAYOUT CONTENT REQUIREMENTS:
Depending on the requested "Layout", generate the corresponding fields:

1. For layout "bullets":
   - "bullets": A list of 3-5 concise, actionable bullet points (max 10-12 words each).
   - All other layout fields: null or []

2. For layout "statement":
   - "statement": A single bold, high-impact statement, key takeaway, or quote (1 sentence, max 15 words) summarizing the core message.
   - All other layout fields: null or []

3. For layout "big_number":
   - "big_number": A single key statistic, percentage, or metric (e.g., "73%", "5.2 Billion", "$10M+").
   - "big_number_context": A short phrase/sentence providing the context for this number (max 8-10 words).
   - All other layout fields: null or []

4. For layout "two_column":
   - "column_left_title": A short label for the left column (e.g., "Before", "Pros", "Current State").
   - "column_left": A list of 2-4 bullet points for the left column.
   - "column_right_title": A short label for the right column (e.g., "After", "Cons", "Future State").
   - "column_right": A list of 2-4 bullet points for the right column.
   - All other layout fields: null or []

5. For layout "steps":
   - "steps": An ordered list of 3-6 steps (each step: short imperative sentence, max 10 words).
   - All other layout fields: null or []

6. For layout "quote":
   - "quote_text": The verbatim quote (1-2 sentences max).
   - "quote_attribution": The attribution (e.g., "— Elon Musk, CEO of Tesla").
   - All other layout fields: null or []

COMMON FIELDS:
- "notes": Speaker notes (2-3 sentences)
- "image_prompt": A 1-sentence prompt describing a relevant professional visual/graphic for this slide (set to null for "statement", "big_number", "two_column", "steps", and "quote" layouts as they do not contain images).

OUTPUT FORMAT (valid JSON only):
{{
  "bullets": [],
  "statement": null,
  "big_number": null,
  "big_number_context": null,
  "column_left_title": null,
  "column_left": [],
  "column_right_title": null,
  "column_right": [],
  "steps": [],
  "quote_text": null,
  "quote_attribution": null,
  "notes": "...",
  "image_prompt": null
}}

CRITICAL RULES:
- Return ONLY valid JSON. Do not wrap in markdown code blocks.
- Generate FRESH content that is different from the previous version.
- Only populate the fields relevant to the requested layout. Set all others to null or [].
"""


BATCH_SLIDE_PROMPT = """Create content for multiple PowerPoint slides in one go.

PRESENTATION CONTEXT:
- Topic: {topic}
- Audience: {audience}
- Theme/Branding: {theme_instruction}

SLIDES TO DRAFT:
{slides_specs}

LAYOUT CONTENT REQUIREMENTS:
Depending on each slide's "layout", generate the corresponding fields:

1. For layout "bullets":
   - "bullets": A list of 3-5 concise, actionable bullet points (max 10-12 words each).
   - All other layout fields: null or []

2. For layout "statement":
   - "statement": A single bold, high-impact statement, key takeaway, or quote (1 sentence, max 15 words).
   - All other layout fields: null or []

3. For layout "big_number":
   - "big_number": A single key statistic, percentage, or metric (e.g., "73%", "5.2 Billion", "$10M+").
   - "big_number_context": A short phrase/sentence providing context (max 8-10 words).
   - All other layout fields: null or []

4. For layout "two_column":
   - "column_left_title": A short label for the left column (e.g., "Before", "Pros").
   - "column_left": A list of 2-4 bullet points for the left column.
   - "column_right_title": A short label for the right column (e.g., "After", "Cons").
   - "column_right": A list of 2-4 bullet points for the right column.
   - All other layout fields: null or []

5. For layout "steps":
   - "steps": An ordered list of 3-6 steps (each step: short imperative sentence, max 10 words).
   - All other layout fields: null or []

6. For layout "quote":
   - "quote_text": The verbatim quote (1-2 sentences max).
   - "quote_attribution": The attribution (e.g., "— Elon Musk, CEO of Tesla").
   - All other layout fields: null or []

COMMON FIELDS FOR ALL SLIDES:
- "notes": Speaker notes (2-3 sentences)
- "image_prompt": A 1-sentence prompt describing a relevant professional visual/graphic for this slide (set to null for "statement", "big_number", "two_column", "steps", and "quote" layouts as they do not contain images).

OUTPUT FORMAT (valid JSON only):
{{
  "slides": [
    {{
      "title": "Slide Title",
      "layout": "bullets" | "statement" | "big_number" | "two_column" | "steps" | "quote",
      "bullets": [],
      "statement": null,
      "big_number": null,
      "big_number_context": null,
      "column_left_title": null,
      "column_left": [],
      "column_right_title": null,
      "column_right": [],
      "steps": [],
      "quote_text": null,
      "quote_attribution": null,
      "notes": "...",
      "image_prompt": null
    }}
  ]
}}

CRITICAL RULES:
- Return ONLY valid JSON.
- Ensure the "slides" array matches the number and order of slides requested.
- Only populate the fields relevant to each slide's layout. Set all others to null or [].
- No markdown, no filler text.
"""


IMAGE_GENERATION_SYSTEM_PROMPT = """You are a professional graphic designer and presentation specialist.

Your task is to generate high-quality, professional images for presentation slides from the image prompt.

"""


IMAGE_GENERATION_USER_PROMPT = """Generate a presentation slide based on the following content:

{image_prompt}

"""


SUMMARIZATION_PROMPT = """You are a professional research assistant. Your task is to summarize the following source materials to help create a presentation deck.

Create a highly structured summary including:
1. Executive Summary: Core message and main takeaway of the documents (1-2 sentences).
2. Key Themes: List 3-5 main themes, each with a brief explanation (2-3 sentences).
3. Critical Data & Statistics: List any key metrics, dates, percentages, or figures mentioned in the text.
4. Key Takeaways/Quotes: List notable quotes or essential statements that could be featured on individual slides.

Keep the total summary size between 1000 and 2000 tokens (approximately 700 to 1500 words).

SOURCE MATERIAL:
{text}
"""
