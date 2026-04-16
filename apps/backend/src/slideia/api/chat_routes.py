"""Chat streaming endpoint.

Accepts a user prompt + optional file attachments via multipart/form-data,
injects file contents as context into the LLM prompt, and streams the
response back token-by-token as Server-Sent Events.
"""

import json
from io import BytesIO

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse

from slideia.api.chat_schemas import ChatRequest
from slideia.core.config import settings
from slideia.core.logging import get_logger
from slideia.infra.openrouter import OpenRouterLLM

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


def _extract_text_plain(content: bytes) -> str:
    """Decode plain-text files (txt, md, csv, json)."""
    return content.decode("utf-8", errors="replace")


def _extract_text_pdf(content: bytes) -> str:
    """Extract text from a PDF using PyPDF2."""
    from PyPDF2 import PdfReader

    reader = PdfReader(BytesIO(content))
    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n\n".join(pages)


def _extract_text_docx(content: bytes) -> str:
    """Extract text from a .docx file using python-docx."""
    from docx import Document

    doc = Document(BytesIO(content))
    return "\n\n".join(para.text for para in doc.paragraphs if para.text)


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

    if ext == "pdf":
        return _extract_text_pdf(raw)
    if ext == "docx":
        return _extract_text_docx(raw)

    # txt, md, csv, json — all are plain text
    return _extract_text_plain(raw)


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

    # ── 3. Extract text from uploaded files ──────────────────────────
    file_contexts: list[str] = []
    total_size = 0

    for upload in files:
        text = await _read_file_text(upload)
        total_size += len(text.encode("utf-8"))

        if total_size > MAX_TOTAL_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Total uploaded file size exceeds the 10 MB limit.",
            )

        file_contexts.append(f"--- File: {upload.filename} ---\n{text}\n--- End of {upload.filename} ---")

    # ── 4. Build the LLM message list ────────────────────────────────
    messages: list[dict[str, str]] = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Inject file context into the system prompt if files are present
    if file_contexts:
        file_block = "\n\nThe user has provided the following files for context:\n\n" + "\n\n".join(
            file_contexts
        )
        messages[0]["content"] += file_block

    # Add conversation history
    for msg in chat_request.conversation_history:
        messages.append({"role": msg.role, "content": msg.content})

    # Add the current user prompt
    messages.append({"role": "user", "content": chat_request.prompt})

    logger.info(
        f"Chat stream request: prompt_len={len(chat_request.prompt)}, "
        f"history_len={len(chat_request.conversation_history)}, "
        f"files={len(file_contexts)}"
    )

    # ── 5. Stream the response ───────────────────────────────────────
    llm = OpenRouterLLM(
        api_key=settings.OPENROUTER_API_KEY,
        model=settings.OPENROUTER_MODEL,
    )

    async def event_generator():
        try:
            async for token in llm.stream_call(messages):
                yield _sse_event({"token": token})
            yield _sse_event({"done": True})
        except Exception as exc:
            logger.error(f"Stream error: {exc}")
            yield _sse_event({"error": str(exc)})

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        },
    )
