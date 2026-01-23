import json
import re

import requests

from slideia.domain.llm.interfaces import OutlineGenerator, SlideGenerator
from slideia.domain.llm.prompts import OUTLINE_PROMPT, SLIDE_PROMPT

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def _extract_json_from_markdown(text: str) -> str:
    matches = re.findall(r"```json\s*(.*?)```", text, re.DOTALL | re.IGNORECASE)
    for match in matches:
        try:
            json.loads(match)
            return match.strip()
        except Exception:
            continue
    return text.strip()


class OpenRouterLLM(OutlineGenerator, SlideGenerator):
    def __init__(self, api_key: str, model: str):
        self.api_key = api_key
        self.model = model

    def _call(self, prompt: str, max_tokens: int = 1024) -> dict:
        response = requests.post(
            OPENROUTER_API_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
            },
            timeout=20,
        )

        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        extracted = _extract_json_from_markdown(content)
        return json.loads(extracted)

    def propose_outline(
        self, topic: str, audience: str, tone: str, slide_count: int
    ) -> dict:
        prompt = OUTLINE_PROMPT.format(
            topic=topic,
            audience=audience,
            tone=tone,
            slide_count=slide_count,
        )
        return self._call(prompt)

    def draft_slide(self, slide_spec: dict) -> dict:
        prompt = SLIDE_PROMPT.format(
            title=slide_spec.get("title", "Slide"),
            summary=slide_spec.get("summary", ""),
        )
        return self._call(prompt)
