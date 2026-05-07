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
    """Fixture for the new FullDeckExportRequest schema."""
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
    }


def test_export_pptx_success(client, full_deck_request, tmp_path):
    """Test successful export returns download URL and file using provided slides."""
    with (
        patch("slideia.api.routes.ImageFetcher.fetch_image_url", return_value="http://fake.url/img.jpg"),
        patch("slideia.api.routes.export_slides") as mock_export,
        patch("slideia.core.config.settings") as mock_settings,
    ):
        mock_settings.DOWNLOADS_DIR = tmp_path
        response = client.post("/export-pptx", json=full_deck_request)

        assert response.status_code == 200
        data = response.json()
        assert "download_url" in data and data["download_url"].endswith(".pptx")
        assert "filename" in data and data["filename"].endswith(".pptx")
        assert "Accessibility_in_AI" in data["filename"]
        mock_export.assert_called_once()


def test_export_pptx_invalid_request(client):
    """Test missing required fields returns 422."""
    # slides is now required
    bad_req = {"topic": "AI", "audience": "All"}
    response = client.post("/export-pptx", json=bad_req)
    assert response.status_code == 422


def test_export_pptx_export_error(client, full_deck_request):
    """Test export_slides error returns 500."""
    with (
        patch("slideia.api.routes.ImageFetcher.fetch_image_url", return_value="http://fake.url/img.jpg"),
        patch("slideia.api.routes.export_slides", side_effect=Exception("Export fail")),
        patch("slideia.core.config.settings") as mock_settings,
    ):
        mock_settings.DOWNLOADS_DIR = tempfile.gettempdir()
        response = client.post("/export-pptx", json=full_deck_request)
        assert response.status_code == 500
        assert response.json()["detail"].startswith("Oops! Something went wrong")


def test_export_pptx_empty_slides(client, full_deck_request, tmp_path):
    """Test export with empty slides list."""
    full_deck_request["slides"] = []
    with (
        patch("slideia.api.routes.export_slides") as mock_export,
        patch("slideia.core.config.settings") as mock_settings,
    ):
        mock_settings.DOWNLOADS_DIR = tmp_path
        response = client.post("/export-pptx", json=full_deck_request)
        assert response.status_code == 200
        data = response.json()
        assert data["filename"].endswith(".pptx")
        mock_export.assert_called_once()


def test_export_pptx_special_characters_topic(client, full_deck_request, tmp_path):
    """Test topic with special characters is sanitized in filename."""
    full_deck_request["topic"] = "AI: The Future? *Yes!*"
    with (
        patch("slideia.api.routes.ImageFetcher.fetch_image_url", return_value="http://fake.url/img.jpg"),
        patch("slideia.api.routes.export_slides") as mock_export,
        patch("slideia.core.config.settings") as mock_settings,
    ):
        mock_settings.DOWNLOADS_DIR = tmp_path
        response = client.post("/export-pptx", json=full_deck_request)
        assert response.status_code == 200
        data = response.json()
        assert "AI_The_Future_Yes" in data["filename"]
        mock_export.assert_called_once()
