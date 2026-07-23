"""Shared file processing utilities for API routes.

Handles validation of file count, size, type, extraction of text from
various formats, and chunking/truncation of combined reference text.
"""

from fastapi import HTTPException, UploadFile
from slideia.core.logging import get_logger
from slideia.services.ingest import extract_file_text, chunk_document_text

logger = get_logger(__name__)

# ── Constants ────────────────────────────────────────────────────────────

MAX_FILES = 5
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB per file
MAX_TOTAL_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB total
MAX_CHARACTER_LIMIT = 30000

ALLOWED_CONTENT_TYPES: dict[str, str] = {
    "text/plain": "txt",
    "text/markdown": "md",
    "text/csv": "csv",
    "application/json": "json",
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
}


async def read_file_text(upload: UploadFile) -> str:
    """Read an UploadFile and return its text content.

    Raises:
        HTTPException 415: If the content type is not supported.
        HTTPException 413: If the file exceeds the size limit.
        HTTPException 422: If text extraction fails.
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


async def extract_file_contexts(files: list[UploadFile]) -> tuple[str, bool]:
    """Extract text from a list of files and combine them.

    Ensures total size and total character counts are respected. Truncates text
    and sets the was_truncated flag to True if the total character limit is exceeded.

    Raises:
        HTTPException 422: If file count exceeds the limit.
        HTTPException 413: If cumulative size exceeds the limit.
    """
    if len(files) > MAX_FILES:
        raise HTTPException(
            status_code=422,
            detail=f"Too many files. Maximum is {MAX_FILES}.",
        )

    # 1. Read files and validate cumulative file size limit
    raw_file_data: list[tuple[str, str]] = []
    total_size = 0

    for upload in files:
        text = await read_file_text(upload)
        total_size += len(text.encode("utf-8"))

        if total_size > MAX_TOTAL_SIZE_BYTES:
            raise HTTPException(
                status_code=413,
                detail="Total uploaded file size exceeds the 10 MB limit.",
            )

        raw_file_data.append((upload.filename or "file", text))

    # 2. Combine contexts and apply character limit truncation
    file_contexts: list[str] = []
    total_chars = 0
    truncated = False

    for filename, text in raw_file_data:
        if total_chars + len(text) > MAX_CHARACTER_LIMIT:
            remaining_limit = MAX_CHARACTER_LIMIT - total_chars
            text, file_truncated = chunk_document_text(text, max_chars=remaining_limit)
            if file_truncated:
                truncated = True

        total_chars += len(text)
        file_contexts.append(f"--- File: {filename} ---\n{text}\n--- End of {filename} ---")
        if truncated:
            file_contexts.append("\n\n[Warning: Reference document text was truncated to fit context limits]")
            break

    combined_file_context = "\n\n".join(file_contexts) if file_contexts else ""
    return combined_file_context, truncated
