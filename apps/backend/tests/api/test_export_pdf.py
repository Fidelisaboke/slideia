import tempfile
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from slideia.api.routes import router

app = FastAPI()
app.include_router(router)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def full_deck_request():
    """Fixture for the FullDeckExportRequest schema."""
    return {
        "topic": "Accessibility in AI",
        "audience": "Developers",
        "slides": [
            {
                "title": "Intro to Accessibility",
                "summary": "Why it matters in modern UI.",
                "bullets": ["Point 1", "Point 2"],
                "notes": "Speaker notes here",
                "image_prompt": "A modern accessible interface",
            },
            {
                "title": "Best Practices",
                "summary": "How to implement it.",
                "bullets": ["Bullet A", "Bullet B"],
                "notes": "More notes",
                "image_prompt": "Code snippet showing ARIA labels",
            },
        ],
        "palette": ["#7C3AED", "#10B981"],
        "font": "Sora",
        "citations": ["Source 1", "Source 2"],
    }


def test_export_pdf_success(client, full_deck_request, tmp_path):
    """Test successful export returns download URL and file using provided slides."""
    with (
        patch("slideia.api.routes.ImageFetcher.fetch_image_url", return_value="http://fake.url/img.jpg"),
        patch("slideia.api.routes.export_deck_to_pdf") as mock_export,
        patch("slideia.core.config.settings") as mock_settings,
    ):
        mock_settings.DOWNLOADS_DIR = tmp_path
        response = client.post("/export-pdf", json=full_deck_request)

        assert response.status_code == 200
        data = response.json()
        assert "download_url" in data and data["download_url"].endswith(".pdf")
        assert "filename" in data and data["filename"].endswith(".pdf")
        assert "Accessibility_in_AI" in data["filename"]
        mock_export.assert_called_once()


def test_export_pdf_invalid_request(client):
    """Test missing required fields returns 422."""
    bad_req = {"topic": "AI", "audience": "All"}
    response = client.post("/export-pdf", json=bad_req)
    assert response.status_code == 422


def test_export_pdf_export_error(client, full_deck_request):
    """Test export_deck_to_pdf error returns 500."""
    with (
        patch("slideia.api.routes.ImageFetcher.fetch_image_url", return_value="http://fake.url/img.jpg"),
        patch("slideia.api.routes.export_deck_to_pdf", side_effect=Exception("Export fail")),
        patch("slideia.core.config.settings") as mock_settings,
    ):
        mock_settings.DOWNLOADS_DIR = tempfile.gettempdir()
        response = client.post("/export-pdf", json=full_deck_request)
        assert response.status_code == 500
        assert response.json()["detail"].startswith("Oops! Something went wrong")


def test_export_pdf_empty_slides(client, full_deck_request, tmp_path):
    """Test export with empty slides list."""
    full_deck_request["slides"] = []
    with (
        patch("slideia.api.routes.export_deck_to_pdf") as mock_export,
        patch("slideia.core.config.settings") as mock_settings,
    ):
        mock_settings.DOWNLOADS_DIR = tmp_path
        response = client.post("/export-pdf", json=full_deck_request)
        assert response.status_code == 200
        data = response.json()
        assert data["filename"].endswith(".pdf")
        mock_export.assert_called_once()
