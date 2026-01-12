"""
LLM integration layer for slideia.

This module provides functions to interact with a language model (LLM) for:
- Proposing a slide outline for a given topic, audience, tone, and number of slides.
- Drafting the content of a single slide based on a slide specification.

LLM API endpoints, model names, and request logic are factored into constants and helpers for maintainability.
"""

import json
import os
import re
import time
from typing import Dict, Optional

import requests

# === Constants for LLM Providers ===
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


# === Helper Functions ===
def _extract_json_from_markdown(text: str) -> str:
    """
    Extract JSON from a Markdown code block if present.

    Many LLMs return JSON wrapped in Markdown code blocks (e.g., ```json ... ```),
    which is not valid for json.loads(). This helper strips the code block and returns
    the raw JSON string for parsing.

    Args:
        text (str): The text possibly containing a Markdown code block.

    Returns:
        str: The extracted JSON string, or the original text if no code block is found.
    """
    # Find all code blocks labeled as json
    matches = re.findall(r"```json\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    for match in matches:
        candidate = match.strip()
        # Try to parse, return the first valid JSON
        try:
            json.loads(candidate)
            return candidate
        except Exception:
            continue
    # Fallback: try to parse the whole text if no code block matched
    return text.strip()


def _call_openrouter(
    prompt: str, api_key: str, max_tokens: int = 1024, retries: int = 2
) -> Optional[Dict]:
    """Call OpenRouter API with the given prompt and return parsed JSON if possible."""
    for _ in range(retries):
        try:
            response = requests.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": os.getenv("OPENROUTER_MODEL"),
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens,
                },
                timeout=20,
            )

            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                extracted_content = _extract_json_from_markdown(content)
                return json.loads(extracted_content)

            # Handle rate limiting or server errors
            print(f"OpenRouter API error {response.status_code}: {response.text}")

        except Exception:
            pass

        time.sleep(1)
    return None


def propose_outline(topic: str, audience: str, tone: str, slide_count: int) -> Dict:
    """
    Propose a slide outline for a presentation using an LLM API (OpenRouter).

    Requires environment variable OPENROUTER_API_KEY.

    Args:
        topic (str): The topic of the presentation.
        audience (str): The intended audience.
        tone (str): The desired tone (e.g., formal, informal).
        slide_count (int): Number of slides to generate.

    Returns:
        Dict: A dictionary with keys: title, slides (list of dicts), citations (optional).
    """
    prompt = f"""Create a PowerPoint presentation outline for a {slide_count}-slide deck.

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

IMPORTANT: Return ONLY valid JSON. No markdown, no explanations, no extra text."""

    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key:
        result = _call_openrouter(prompt, api_key)
        if result:
            return result

    raise RuntimeError("No valid API key found or all LLM API calls failed.")


def draft_slide(slide_spec: Dict) -> Dict:
    """
    Draft the content for a single slide using OpenRouter.

    Requires environment variable OPENROUTER_API_KEY.

    Args:
        slide_spec (Dict): Specification for the slide (e.g., title, summary, etc).

    Returns:
        Dict: A dictionary with keys: bullets (list), notes (str), image_prompt (str), theme (dict).
    """

    title = slide_spec.get("title", "Slide")
    summary = slide_spec.get("summary", "")

    prompt = f"""Create content for a PowerPoint slide.

SLIDE INFORMATION:
- Title: {title}
- Purpose: {summary}

CONTENT REQUIREMENTS:

1. BULLET POINTS (3-5 bullets):
   - Each bullet should be concise and actionable (max 10-12 words)
   - Focus on key takeaways, not repeating the summary
   - Use parallel structure (all bullets start similarly)
   - Make bullets specific and concrete, not vague
   - NO bullet should just restate the summary

2. SPEAKER NOTES (2-3 sentences):
   - Talking points for the presenter
   - Additional context or examples
   - Things to emphasize or explain
   - Should complement bullets, not duplicate them

3. IMAGE PROMPT (1 sentence):
   - Describe a relevant visual, chart, or icon
   - Be specific about what to show
   - Consider: photos, diagrams, charts, icons, or illustrations
   - Example: "Line chart showing revenue growth over 5 years"

4. THEME (optional styling):
   - Use professional color scheme
   - Suggested colors: {{
       "primary": "#1E40AF" (blue),
       "secondary": "#059669" (green),
       "accent": "#DC2626" (red),
       "neutral": "#374151" (gray)
     }}

OUTPUT FORMAT (valid JSON only):
{{
  "bullets": [
    "First key point or takeaway",
    "Second key point or takeaway",
    "Third key point or takeaway"
  ],
  "notes": "Speaker notes with additional context, examples, or points to emphasize during presentation.",
  "image_prompt": "Specific description of visual element to include",
  "theme": {{
    "font": "Calibri",
    "color": "#1E40AF"
  }}
}}

CRITICAL RULES:
- Bullets must be DIFFERENT from the summary (no redundancy!)
- Each bullet must be unique and valuable
- Keep bullets concise (max 12 words each)
- Return ONLY valid JSON, no markdown, no extra text
- Ensure all brackets and quotes are properly closed"""

    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key:
        result = _call_openrouter(prompt, api_key)
        if result:
            return result

    raise RuntimeError("No valid API key found or all LLM API calls failed.")
