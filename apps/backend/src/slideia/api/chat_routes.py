"""Chat streaming endpoint.

Accepts a user prompt + optional file attachments via multipart/form-data,
injects file contents as context into the LLM prompt, and streams the
response back token-by-token as Server-Sent Events.
"""

import asyncio
import json

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage

from slideia.api.chat_schemas import ChatRequest
from slideia.core.logging import get_logger
from slideia.domain.agent.graph import graph
from slideia.services.ingest import extract_file_text, chunk_document_text

logger = get_logger(__name__)

chat_router = APIRouter(prefix="/chat", tags=["chat"])


# ── Constants ────────────────────────────────────────────────────────────

MAX_FILES = 5
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB per file
MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB total

ALLOWED_CONTENT_TYPES: dict[str, str] = {
    "text/plain": "txt",
    "text/markdown": "md",
    "text/csv": "csv",
    "application/json": "json",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}

SYSTEM_PROMPT = """You are Slideia, an AI assistant that helps users create \
presentation slide decks. You can discuss topics, help refine ideas, and \
generate structured outlines and slide content.

When the user asks you to create a presentation, respond with a well-structured \
outline and content suggestions. Be helpful, concise, and professional.

If the user provides files for context, use their content to inform your \
response. Reference specific details from the files when relevant."""


# ── File text extraction ─────────────────────────────────────────────────


async def _read_file_text(upload: UploadFile) -> str:
    """Read an UploadFile and return its text content.

    Raises:
        HTTPException 415: If the content type is not supported.
        HTTPException 413: If the file exceeds the size limit.
    """
    content_type = upload.content_type or ""

    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type: {content_type}. "
            f"Allowed: {', '.join(ALLOWED_CONTENT_TYPES.values())}",
        )

    raw = await upload.read()

    if len(raw) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File '{upload.filename}' exceeds the 5 MB limit.",
        )

    ext = ALLOWED_CONTENT_TYPES[content_type]

    try:
        return extract_file_text(raw, ext)
    except Exception as exc:
        logger.error(f"Failed to parse file '{upload.filename}': {exc}")
        raise HTTPException(
            status_code=422,
            detail=f"Failed to extract text from file '{upload.filename}': {exc}",
        )


# ── SSE helpers ──────────────────────────────────────────────────────────


def _sse_event(data: dict) -> str:
    """Format a dict as an SSE data line."""
    return f"data: {json.dumps(data)}\n\n"


# ── Endpoint ─────────────────────────────────────────────────────────────


@chat_router.post("/stream")
async def chat_stream(
    payload: str = Form(...),
    files: list[UploadFile] = File(default=[]),
):
    """Stream an LLM chat response as Server-Sent Events.

    Expects multipart/form-data with:
    - ``payload``: JSON string matching ``ChatRequest`` schema.
    - ``files`` (optional): Up to 5 files for context injection.

    Returns:
        StreamingResponse with ``text/event-stream`` media type.
        Each event is ``data: {"token": "..."}`` or ``data: {"done": true}``
        or ``data: {"error": "..."}`` on failure.
    """
    # ── 1. Parse & validate the JSON payload ─────────────────────────
    try:
        request_data = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid JSON in 'payload' field: {exc}")

    try:
        chat_request = ChatRequest(**request_data)
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    # ── 2. Validate file constraints ─────────────────────────────────
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=422,
            detail=f"Too many files. Maximum is {MAX_FILES}.",
        )

    # ── 3. Extract text from uploaded files & handle limits ──────────
    file_contexts: list[str] = []
    total_size = 0
    total_chars = 0
    MAX_CHARACTER_LIMIT = 30000
    truncated = False

    for upload in files:
        text = await _read_file_text(upload)
        total_size += len(text.encode("utf-8"))

        if total_size > MAX_TOTAL_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Total uploaded file size exceeds the 10 MB limit.",
            )

        if total_chars + len(text) > MAX_CHARACTER_LIMIT:
            remaining_limit = MAX_CHARACTER_LIMIT - total_chars
            text, file_truncated = chunk_document_text(text, max_chars=remaining_limit)
            if file_truncated:
                truncated = True

        total_chars += len(text)
        file_contexts.append(f"--- File: {upload.filename} ---\n{text}\n--- End of {upload.filename} ---")
        if truncated:
            file_contexts.append("\n\n[Warning: Reference document text was truncated to fit context limits]")
            break

    combined_file_context = "\n\n".join(file_contexts) if file_contexts else ""

    # ── 4. Set up the LangGraph Initial State ────────────────────────
    initial_messages = []
    for msg in chat_request.conversation_history:
        if msg.role == "user":
            initial_messages.append(HumanMessage(content=msg.content))
        else:
            initial_messages.append(AIMessage(content=msg.content))

    initial_state = {
        "messages": initial_messages,
        "topic": chat_request.topic or "",
        "audience": chat_request.audience or "",
        "tone": chat_request.tone or "",
        "slide_count": chat_request.slide_count or 5,
        "theme_preset": chat_request.theme_preset or "",
        "deck": chat_request.deck,
        "prompt": chat_request.prompt,
        "file_context": combined_file_context,
        "intent": "",
        "instruction": None,
        "error": None,
        "retry_count": 0,
    }

    logger.info(
        f"Agent stream request: prompt_len={len(chat_request.prompt)}, "
        f"history_len={len(chat_request.conversation_history)}, "
        f"files={len(files)}, has_deck={chat_request.deck is not None}"
    )

    # ── 5. Run the LangGraph agent and stream response ───────────────
    queue = asyncio.Queue()

    async def run_agent_task():
        try:
            config = {"configurable": {"queue": queue}}
            await graph.ainvoke(initial_state, config=config)
        except Exception as e:
            logger.error(f"Agent execution task failed: {e}")
            await queue.put({"error": str(e)})
        finally:
            await queue.put({"done": True})

    agent_task = asyncio.create_task(run_agent_task())

    async def event_generator():
        try:
            if truncated:
                yield _sse_event(
                    {"token": "*(Note: Uploaded documents were truncated to fit context limits)*\n\n"}
                )

            while True:
                item = await queue.get()
                if "done" in item:
                    break
                if "error" in item:
                    yield _sse_event({"error": item["error"]})
                    break
                if "token" in item:
                    yield _sse_event({"token": item["token"]})
                if "deck_update" in item:
                    yield _sse_event({"deck_update": item["deck_update"]})
                if "status" in item:
                    yield _sse_event({"status": item["status"]})

            yield _sse_event({"done": True})
        except Exception as exc:
            logger.error(f"SSE generator error: {exc}")
            yield _sse_event({"error": str(exc)})
        finally:
            await agent_task

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
