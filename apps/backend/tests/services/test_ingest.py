from unittest.mock import MagicMock, patch
from slideia.services.ingest import (
    extract_text_from_plain,
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_file_text,
    chunk_document_text,
)


def test_extract_text_plain():
    content = b"Hello, World!\nThis is a test."
    text = extract_text_from_plain(content)
    assert text == "Hello, World!\nThis is a test."


def test_extract_text_plain_utf8_fallback():
    content = b"Hello, World! \xff This is invalid utf8."
    text = extract_text_from_plain(content)
    assert "Hello, World!" in text
    # \xff should be replaced by replacement char (usually \ufffd)
    assert "\ufffd" in text


@patch("slideia.services.ingest.PdfReader")
def test_extract_text_pdf(mock_pdf_reader):
    mock_page_1 = MagicMock()
    mock_page_1.extract_text.return_value = "Page 1 Content"
    mock_page_2 = MagicMock()
    mock_page_2.extract_text.return_value = "Page 2 Content"

    mock_reader = MagicMock()
    mock_reader.pages = [mock_page_1, mock_page_2]
    mock_pdf_reader.return_value = mock_reader

    content = b"dummy pdf data"
    text = extract_text_from_pdf(content)
    assert text == "Page 1 Content\n\nPage 2 Content"
    mock_pdf_reader.assert_called_once()


@patch("slideia.services.ingest.Document")
def test_extract_text_docx(mock_document):
    mock_para_1 = MagicMock()
    mock_para_1.text = "Paragraph 1"
    mock_para_2 = MagicMock()
    mock_para_2.text = "Paragraph 2"
    mock_para_3 = MagicMock()
    mock_para_3.text = ""  # empty paragraphs should be ignored

    mock_doc = MagicMock()
    mock_doc.paragraphs = [mock_para_1, mock_para_2, mock_para_3]
    mock_document.return_value = mock_doc

    content = b"dummy docx data"
    text = extract_text_from_docx(content)
    assert text == "Paragraph 1\n\nParagraph 2"
    mock_document.assert_called_once()


@patch("slideia.services.ingest.extract_text_from_pdf")
@patch("slideia.services.ingest.extract_text_from_docx")
@patch("slideia.services.ingest.extract_text_from_plain")
def test_extract_file_text_routing(mock_plain, mock_docx, mock_pdf):
    content = b"data"

    extract_file_text(content, "pdf")
    mock_pdf.assert_called_once_with(content)

    extract_file_text(content, "docx")
    mock_docx.assert_called_once_with(content)

    extract_file_text(content, "txt")
    mock_plain.assert_called_once_with(content)


def test_chunk_document_text_within_limit():
    text = "Short text."
    chunked, truncated = chunk_document_text(text, max_chars=50)
    assert chunked == "Short text."
    assert not truncated


def test_chunk_document_text_paragraph_boundary():
    text = "Paragraph 1.\n\nParagraph 2.\n\nParagraph 3."
    # Length of "Paragraph 1.\n\nParagraph 2." is 26 chars.
    # We set max_chars=35 to fit P1 & P2 but not P3.
    chunked, truncated = chunk_document_text(text, max_chars=35)
    assert chunked == "Paragraph 1.\n\nParagraph 2."
    assert truncated


def test_chunk_document_text_line_boundary_fallback():
    # If the first paragraph itself exceeds max_chars, but we can split by line
    text = "Line 1.\nLine 2.\nLine 3."
    # "Line 1.\nLine 2." is 15 chars.
    chunked, truncated = chunk_document_text(text, max_chars=20)
    assert chunked == "Line 1.\nLine 2."
    assert truncated


def test_chunk_document_text_hard_slice_fallback():
    # If even a single line exceeds max_chars, it will fall back to character slice
    text = "SingleVeryLongLineThatExceedsLimit"
    chunked, truncated = chunk_document_text(text, max_chars=10)
    assert chunked == "SingleVery"
    assert truncated
