"""Document content ingestion and chunking utilities."""

from io import BytesIO
from pypdf import PdfReader
from docx import Document


def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF file content using pypdf."""
    reader = PdfReader(BytesIO(content))
    pages: list[str] = []
    for page in reader.pages:
        text = page.extract_text()
        if text:
            pages.append(text)
    return "\n\n".join(pages)


def extract_text_from_docx(content: bytes) -> str:
    """Extract text from Word .docx file content using python-docx."""
    doc = Document(BytesIO(content))
    return "\n\n".join(para.text for para in doc.paragraphs if para.text)


def extract_text_from_plain(content: bytes) -> str:
    """Decode plain-text files (txt, md, csv, json) with error fallback."""
    return content.decode("utf-8", errors="replace")


def extract_file_text(content: bytes, ext: str) -> str:
    """Extract text content from raw bytes according to the file extension.

    Supported extensions: pdf, docx, txt, md, csv, json.
    """
    if ext == "pdf":
        return extract_text_from_pdf(content)
    if ext == "docx":
        return extract_text_from_docx(content)
    return extract_text_from_plain(content)


def chunk_document_text(text: str, max_chars: int = 30000) -> tuple[str, bool]:
    """Chunk or truncate text to fit the max_chars limit, splitting at natural boundaries.

    Returns a tuple of (truncated_text, is_truncated).
    """
    if len(text) <= max_chars:
        return text, False

    # Try to split by paragraph first
    paragraphs = text.split("\n\n")
    current_text = []
    current_len = 0

    for para in paragraphs:
        # Account for the double newline separator when joining
        sep_len = 2 if current_text else 0
        if current_len + sep_len + len(para) <= max_chars:
            current_text.append(para)
            current_len += sep_len + len(para)
        else:
            # If we couldn't even fit the first paragraph, try line-by-line
            if not current_text:
                lines = para.split("\n")
                for line in lines:
                    line_sep_len = 1 if current_text else 0
                    if current_len + line_sep_len + len(line) <= max_chars:
                        current_text.append(line)
                        current_len += line_sep_len + len(line)
                    else:
                        # Hard character cut if a single line is too large
                        if not current_text:
                            return para[:max_chars], True
                        break
                return "\n".join(current_text), True
            break

    return "\n\n".join(current_text), True
