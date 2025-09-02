
"""
llm.py
LLM integration layer for slideia.

This module provides functions to interact with a language model (LLM) for:
- Proposing a slide outline for a given topic, audience, tone, and number of slides.
- Drafting the content of a single slide based on a slide specification.

LLM API endpoints, model names, and request logic are factored into constants and helpers for maintainability.
"""


import os
import requests
import time
from typing import Dict, List, Optional
import json

# === Constants for LLM Providers ===
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "openai/gpt-3.5-turbo"
GOOGLE_AI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent"


# === Helper Functions ===
def _call_openrouter(prompt: str, api_key: str, max_tokens: int = 512, retries: int = 2) -> Optional[Dict]:
    """Call OpenRouter API with the given prompt and return parsed JSON if possible."""
    for _ in range(retries):
        try:
            response = requests.post(
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": OPENROUTER_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": max_tokens
                },
                timeout=20
            )
            if response.status_code == 200:
                content = response.json()["choices"][0]["message"]["content"]
                return json.loads(content)
        except Exception:
            pass
        time.sleep(1)
    return None

def _call_google_ai(prompt: str, api_key: str, retries: int = 2) -> Optional[Dict]:
    """Call Google AI Studio API with the given prompt and return parsed JSON if possible."""
    for _ in range(retries):
        try:
            response = requests.post(
                f"{GOOGLE_AI_API_URL}?key={api_key}",
                json={
                    "contents": [{"parts": [{"text": prompt}]}]
                },
                timeout=20
            )
            if response.status_code == 200:
                candidates = response.json().get("candidates", [])
                if candidates:
                    content = candidates[0]["content"]["parts"][0]["text"]
                    return json.loads(content)
        except Exception:
            pass
        time.sleep(1)
    return None



def propose_outline(topic: str, audience: str, tone: str, slides: int) -> Dict:
    """
    Propose a slide outline for a presentation using a free LLM API (OpenRouter or Google AI Studio).

    Tries OpenRouter (https://openrouter.ai/docs) first, then Google AI Studio (https://aistudio.google.com/app/apikey) as fallback.
    Requires environment variable OPENROUTER_API_KEY or GOOGLE_AI_API_KEY.

    Args:
        topic (str): The topic of the presentation.
        audience (str): The intended audience.
        tone (str): The desired tone (e.g., formal, informal).
        slides (int): Number of slides to generate.

    Returns:
        Dict: A dictionary with keys: title, slides (list of dicts), citations (optional).
    """
    prompt = (
        f"Generate a slide deck outline for the topic '{topic}' for an audience of {audience}. "
        f"The tone should be {tone}. The deck should have {slides} slides. "
        "Return a JSON object with keys: title (str), slides (list of dicts with title and summary), and citations (optional)."
    )

    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key:
        result = _call_openrouter(prompt, api_key)
        if result:
            return result

    api_key = os.getenv("GOOGLE_AI_API_KEY")
    if api_key:
        result = _call_google_ai(prompt, api_key)
        if result:
            return result

    raise RuntimeError("No valid API key found or all LLM API calls failed.")




def draft_slide(slide_spec: Dict) -> Dict:
    """
    Draft the content for a single slide using a free LLM API (OpenRouter or Google AI Studio).

    Tries OpenRouter (https://openrouter.ai/docs) first, then Google AI Studio (https://aistudio.google.com/app/apikey) as fallback.
    Requires environment variable OPENROUTER_API_KEY or GOOGLE_AI_API_KEY.

    Args:
        slide_spec (Dict): Specification for the slide (e.g., title, summary, etc).

    Returns:
        Dict: A dictionary with keys: bullets (list), notes (str), image_prompt (str), theme (str or dict).
    """
    prompt = (
        f"Given the following slide spec as JSON: {json.dumps(slide_spec)}\n"
        "Draft the slide content. Return a JSON object with keys: "
        "bullets (list of str), notes (str), image_prompt (str), and theme (str or dict)."
    )

    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key:
        result = _call_openrouter(prompt, api_key)
        if result:
            return result

    api_key = os.getenv("GOOGLE_AI_API_KEY")
    if api_key:
        result = _call_google_ai(prompt, api_key)
        if result:
            return result

    raise RuntimeError("No valid API key found or all LLM API calls failed.")
