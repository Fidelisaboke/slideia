OUTLINE_PROMPT = """Create a PowerPoint presentation outline for a {slide_count}-slide deck.

PRESENTATION DETAILS:
- Topic: {topic}
- Audience: {audience}
- Tone: {tone}

INSTRUCTIONS:
1. Create a compelling presentation title that captures the main theme
2. Design {slide_count} content slides (excluding title slide)
3. Each slide should have a clear, concise title (max 6 words)
4. Each slide should have a brief summary (1-2 sentences describing the slide's purpose)
5. Ensure logical flow between slides
6. Include citations only if relevant facts/data are referenced

OUTPUT FORMAT (valid JSON only):
{{
  "title": "Presentation Title Here",
  "slides": [
    {{
      "title": "Slide Title",
      "summary": "Brief 1-2 sentence description of what this slide covers"
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

CONTENT REQUIREMENTS:

1. BULLET POINTS (3-5 bullets):
   - Each bullet should be concise and actionable (max 10-12 words)
   - Focus on key takeaways, not repeating the summary
   - Use parallel structure
   - No redundancy

2. SPEAKER NOTES (2-3 sentences)

3. IMAGE PROMPT (1 sentence)

4. THEME (optional styling)

OUTPUT FORMAT (valid JSON only):
{{
  "bullets": [...],
  "notes": "...",
  "image_prompt": "...",
  "theme": {{
    "font": "Calibri",
    "color": "#1E40AF"
  }}
}}

CRITICAL RULES:
- Return ONLY valid JSON. Do not wrap in markdown code blocks.
"""


REGENERATE_SLIDE_PROMPT = """Regenerate the content for a PowerPoint slide.

SLIDE INFORMATION:
- Title: {title}
- Purpose: {summary}

{instruction_block}

CONTENT REQUIREMENTS:

1. BULLET POINTS (3-5 bullets):
   - Each bullet should be concise and actionable (max 10-12 words)
   - Focus on key takeaways, not repeating the summary
   - Use parallel structure
   - No redundancy

2. SPEAKER NOTES (2-3 sentences)

3. IMAGE PROMPT (1 sentence)

4. THEME (optional styling)

OUTPUT FORMAT (valid JSON only):
{{
  "bullets": [...],
  "notes": "...",
  "image_prompt": "...",
  "theme": {{
    "font": "Calibri",
    "color": "#1E40AF"
  }}
}}

CRITICAL RULES:
- Return ONLY valid JSON. Do not wrap in markdown code blocks.
- Generate FRESH content that is different from the previous version
"""


BATCH_SLIDE_PROMPT = """Create content for multiple PowerPoint slides in one go.

PRESENTATION CONTEXT:
- Topic: {topic}
- Audience: {audience}

SLIDES TO DRAFT:
{slides_specs}

CONTENT REQUIREMENTS FOR EACH SLIDE:
1. BULLET POINTS (3-5 bullets):
   - Concise and actionable (max 10-12 words)
   - Focus on key takeaways
2. SPEAKER NOTES (2-3 sentences)
3. IMAGE PROMPT (1 sentence)
4. THEME (optional styling: font and color)

OUTPUT FORMAT (valid JSON only):
{{
  "slides": [
    {{
      "title": "Slide Title",
      "bullets": ["Bullet 1", "Bullet 2", ...],
      "notes": "...",
      "image_prompt": "...",
      "theme": {{"font": "...", "color": "..."}}
    }},
    ...
  ]
}}

CRITICAL RULES:
- Return ONLY valid JSON.
- Ensure the "slides" array matches the number and order of slides requested.
- No markdown, no filler text.
"""
