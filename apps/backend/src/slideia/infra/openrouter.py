import json
import re
from collections.abc import AsyncGenerator

import httpx
from slideia.core.logging import get_logger
from slideia.domain.llm.interfaces import OutlineGenerator, SlideGenerator
from slideia.domain.llm.prompts import OUTLINE_PROMPT, SLIDE_PROMPT, REGENERATE_SLIDE_PROMPT

logger = get_logger(__name__)

OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"


def _extract_json_from_markdown(text: str | None) -> str:
    if text is None:
        return ""
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

    async def _call(self, prompt: str, max_tokens: int = 2048) -> dict:
        """Call OpenRouter with exponential backoff for rate limits."""
        max_retries = 3
        base_delay = 2.0

        for attempt in range(max_retries):
            try:
                return await self._execute_call(prompt, max_tokens)
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    if attempt < max_retries - 1:
                        delay = base_delay * (2**attempt)
                        logger.warning(
                            f"Rate limit hit (429). Retrying in {delay}s... (Attempt {attempt + 1}/{max_retries})"
                        )
                        import asyncio

                        await asyncio.sleep(delay)
                        continue
                raise
        # This point should not be reached due to 'raise' above
        raise RuntimeError("Max retries exceeded")

    async def _execute_call(self, prompt: str, max_tokens: int = 2048) -> dict:
        logger.info("Calling OpenRouter LLM...")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
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
            )

            response.raise_for_status()
            resp_json = response.json()

            # Check for choices and message
            choices = resp_json.get("choices")
            if not choices or not choices[0].get("message"):
                logger.error(f"Invalid OpenRouter response structure: {resp_json}")
                raise ValueError("OpenRouter returned an empty or invalid response structure.")

            message = choices[0]["message"]
            content = message.get("content")

            if content is None:
                # Check for refusals (OpenRouter specific)
                refusal = message.get("refusal")
                if refusal:
                    logger.error(f"Model refusal: {refusal}")
                    raise ValueError(f"Model refused request: {refusal}")

                logger.error(f"OpenRouter returned null content. Full response: {resp_json}")
                raise ValueError(
                    "OpenRouter returned null content. The model may have refused the request or encountered an error."
                )

            extracted = _extract_json_from_markdown(content)
            if not extracted:
                logger.error(f"Failed to extract JSON from: {content}")
                raise ValueError("Failed to extract JSON from model response.")

            return json.loads(extracted)

    async def propose_outline(self, topic: str, audience: str, tone: str, slide_count: int) -> dict:
        prompt = OUTLINE_PROMPT.format(
            topic=topic,
            audience=audience,
            tone=tone,
            slide_count=slide_count,
        )
        return await self._call(prompt)

    async def draft_slide(self, slide_spec: dict) -> dict:
        prompt = SLIDE_PROMPT.format(
            title=slide_spec.get("title", "Slide"),
            summary=slide_spec.get("summary", ""),
        )
        return await self._call(prompt)

    async def regenerate_slide(self, title: str, summary: str, instruction: str | None = None) -> dict:
        """Re-draft a slide's content, optionally guided by user instruction."""
        if instruction:
            instruction_block = f"USER INSTRUCTION:\n{instruction}\n\nPlease incorporate the above instruction when generating the new content."
        else:
            instruction_block = "Create fresh, varied content that differs from any previous version."

        prompt = REGENERATE_SLIDE_PROMPT.format(
            title=title,
            summary=summary,
            instruction_block=instruction_block,
        )
        return await self._call(prompt)

    async def stream_call(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        """Stream content deltas from OpenRouter with retry logic for rate limits."""
        max_retries = 3
        base_delay = 2.0

        for attempt in range(max_retries):
            try:
                async for chunk in self._execute_stream_call(messages, max_tokens):
                    yield chunk
                return  # Successfully finished streaming
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 429:
                    if attempt < max_retries - 1:
                        delay = base_delay * (2**attempt)
                        logger.warning(
                            f"Rate limit hit (429) during stream initiation. Retrying in {delay}s... (Attempt {attempt + 1}/{max_retries})"
                        )
                        import asyncio

                        await asyncio.sleep(delay)
                        continue
                raise

    async def _execute_stream_call(
        self,
        messages: list[dict[str, str]],
        max_tokens: int = 2048,
    ) -> AsyncGenerator[str, None]:
        logger.info("Starting streaming call to OpenRouter...")

        request_body = {
            "model": self.model,
            "messages": messages,
            "max_tokens": max_tokens,
            "stream": True,
        }

        async with httpx.AsyncClient(timeout=httpx.Timeout(60.0)) as client:
            async with client.stream(
                "POST",
                OPENROUTER_API_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=request_body,
            ) as response:
                response.raise_for_status()

                async for raw_line in response.aiter_lines():
                    line = raw_line.strip()

                    # SSE protocol: skip empty lines and comments
                    if not line or line.startswith(":"):
                        continue

                    # Strip the "data: " prefix
                    if not line.startswith("data: "):
                        continue
                    data_str = line[len("data: ") :]

                    # OpenAI-compatible stream terminator
                    if data_str == "[DONE]":
                        logger.info("Stream complete.")
                        return

                    try:
                        chunk = json.loads(data_str)
                    except json.JSONDecodeError:
                        logger.warning(f"Skipping malformed SSE chunk: {data_str[:120]}")
                        continue

                    # Extract the content delta
                    choices = chunk.get("choices", [])
                    if not choices:
                        continue

                    delta = choices[0].get("delta", {})
                    content = delta.get("content")
                    if content:
                        yield content
