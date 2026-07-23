import io
import pytest
from fastapi import HTTPException, UploadFile
from slideia.api.file_utils import (
    read_file_text,
    extract_file_contexts,
    MAX_FILE_SIZE_BYTES,
)


@pytest.mark.anyio
async def test_read_file_text_success_txt():
    content = b"Hello, this is a plain text file."
    upload = UploadFile(
        filename="test.txt",
        file=io.BytesIO(content),
        size=len(content),
        headers={"content-type": "text/plain"},
    )
    result = await read_file_text(upload)
    assert result == "Hello, this is a plain text file."


@pytest.mark.anyio
async def test_read_file_text_unsupported_type():
    content = b"some binary data"
    upload = UploadFile(
        filename="test.exe",
        file=io.BytesIO(content),
        size=len(content),
        headers={"content-type": "application/octet-stream"},
    )
    with pytest.raises(HTTPException) as exc_info:
        await read_file_text(upload)
    assert exc_info.value.status_code == 415
    assert "Unsupported file type" in exc_info.value.detail


@pytest.mark.anyio
async def test_read_file_text_size_limit():
    # Construct a payload slightly larger than MAX_FILE_SIZE_BYTES
    large_content = b"A" * (MAX_FILE_SIZE_BYTES + 10)
    upload = UploadFile(
        filename="large.txt",
        file=io.BytesIO(large_content),
        size=len(large_content),
        headers={"content-type": "text/plain"},
    )
    with pytest.raises(HTTPException) as exc_info:
        await read_file_text(upload)
    assert exc_info.value.status_code == 413
    assert "exceeds the 5 MB limit" in exc_info.value.detail


@pytest.mark.anyio
async def test_extract_file_contexts_empty():
    context, truncated = await extract_file_contexts([])
    assert context == ""
    assert truncated is False


@pytest.mark.anyio
async def test_extract_file_contexts_multiple():
    files = [
        UploadFile(
            filename="a.txt",
            file=io.BytesIO(b"Content A"),
            headers={"content-type": "text/plain"},
        ),
        UploadFile(
            filename="b.md",
            file=io.BytesIO(b"Content B"),
            headers={"content-type": "text/markdown"},
        ),
    ]
    context, truncated = await extract_file_contexts(files)
    assert not truncated
    assert "Content A" in context
    assert "Content B" in context
    assert "--- File: a.txt ---" in context
    assert "--- File: b.md ---" in context


@pytest.mark.anyio
async def test_extract_file_contexts_too_many_files():
    files = [
        UploadFile(
            filename=f"{i}.txt",
            file=io.BytesIO(b"Content"),
            headers={"content-type": "text/plain"},
        )
        for i in range(6)
    ]
    with pytest.raises(HTTPException) as exc_info:
        await extract_file_contexts(files)
    assert exc_info.value.status_code == 422
    assert "Too many files" in exc_info.value.detail


@pytest.mark.anyio
async def test_extract_file_contexts_total_size_limit():
    # Construct files that cumulatively exceed MAX_TOTAL_SIZE_BYTES
    # 3 files of 4MB each, which is under the 5MB per-file limit but exceeds 10MB total.
    part_size = 4 * 1024 * 1024
    files = [
        UploadFile(
            filename=f"{i}.txt",
            file=io.BytesIO(b"A" * part_size),
            headers={"content-type": "text/plain"},
        )
        for i in range(3)
    ]
    with pytest.raises(HTTPException) as exc_info:
        await extract_file_contexts(files)
    assert exc_info.value.status_code == 413
    assert "Total uploaded file size exceeds the 10 MB limit" in exc_info.value.detail


@pytest.mark.anyio
async def test_extract_file_contexts_truncation():
    # Construct a file exceeding character limits (MAX_CHARACTER_LIMIT = 30000)
    large_text = "A" * 35000
    upload = UploadFile(
        filename="big.txt",
        file=io.BytesIO(large_text.encode("utf-8")),
        headers={"content-type": "text/plain"},
    )
    context, truncated = await extract_file_contexts([upload])
    assert truncated
    assert len(context) <= 35000
    assert "[Warning: Reference document text was truncated" in context
