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
    prompt = (
        f"Generate a slide deck outline for the topic '{topic}' for an audience of {audience}. "
        f"The tone should be {tone}. The deck should have {slide_count} slides. "
        "Return a JSON object with keys: title (str), slides (list of dicts with title and summary)"
        ", and citations (optional)."
        "Ensure the JSON is complete and valid, and all quotes and brackets are closed."
    )

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
        Dict: A dictionary with keys: bullets (list), notes (str), image_prompt (str), theme (str or dict).
    """
    prompt = (
        f"Given the following slide spec as JSON: {json.dumps(slide_spec)}\n"
        "Draft the slide content. Return only a valid, complete JSON object with keys: "
        "bullets (list of str), notes (str), image_prompt (str), and theme (str or dict)."
        "Do not include Markdown or extra text. Keep the response concise and ensure all brackets"
        " and quotes are closed. It should be a valid JSON."
    )

    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key:
        result = _call_openrouter(prompt, api_key)
        if result:
            return result

    raise RuntimeError("No valid API key found or all LLM API calls failed.")
