import json
import os
import pytest
from unittest.mock import patch, MagicMock
from slideia.domain.deck.pdf_exporter import export_deck_to_pdf


@pytest.fixture
def mock_deck_json(tmp_path):
    deck_data = {
        "title": "Test Presentation",
        "slides": [
            {
                "title": "Slide 1",
                "summary": "This is a summary",
                "bullets": ["Bullet 1", "Bullet 2"],
                "image_prompt": "A scenic view",
            }
        ],
    }
    file_path = tmp_path / "deck.json"
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(deck_data, f)
    return str(file_path)


@pytest.mark.asyncio
async def test_export_deck_to_pdf_success(mock_deck_json, tmp_path):
    output_pdf = str(tmp_path / "output.pdf")

    # Mock httpx content to simulate image fetching
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.content = b"fake-image-bytes"
        mock_get.return_value = mock_resp

        # Mock reportlab parts or just run it to see if it generates a file
        # Integration test style is often better for PDF rendering
        await export_deck_to_pdf(mock_deck_json, output_pdf)

        assert os.path.exists(output_pdf)
        assert os.path.getsize(output_pdf) > 0


@pytest.mark.asyncio
async def test_export_deck_to_pdf_file_not_found():
    with pytest.raises(FileNotFoundError):
        await export_deck_to_pdf("non_existent.json", "out.pdf")


@pytest.mark.asyncio
async def test_export_deck_to_pdf_empty_slides(tmp_path):
    deck_data = {"title": "Empty", "slides": []}
    input_path = str(tmp_path / "empty.json")
    with open(input_path, "w", encoding="utf-8") as f:
        json.dump(deck_data, f)

    output_pdf = str(tmp_path / "empty.pdf")
    await export_deck_to_pdf(input_path, output_pdf)
    assert os.path.exists(output_pdf)
