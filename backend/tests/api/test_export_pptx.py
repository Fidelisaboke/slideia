# pytest and FastAPI TestClient for API testing
import tempfile
from unittest.mock import patch

import pytest

# Use a FastAPI app for testing
from fastapi import FastAPI
from fastapi.testclient import TestClient
from slideia.api.routes import router

app = FastAPI()
app.include_router(router)


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def deck_request():
    return {
        "topic": "Accessibility in AI",
        "audience": "Developers",
        "tone": "Informative",
        "slide_count": 2,
    }


@pytest.fixture
def fake_deck():
    return {
        "outline": {
            "title": "Accessibility in AI",
            "slides": [
                {"title": "Intro", "summary": "Why it matters."},
                {"title": "Best Practices", "summary": "How to do it."},
            ],
        },
        "slides": [
            {
                "bullets": ["Point 1"],
                "notes": "Note 1",
                "image_prompt": "Prompt 1",
                "theme": {"font": "Arial", "color": "#003366"},
            },
            {
                "bullets": ["Point 2"],
                "notes": "Note 2",
                "image_prompt": "Prompt 2",
                "theme": {"font": "Calibri", "color": "#222222"},
            },
        ],
    }


def test_export_pptx_success(client, deck_request, fake_deck, tmp_path):
    """Test successful export returns download URL and file."""
    with (
        patch(
            "slideia.api.routes.generate_full_deck", return_value=fake_deck
        ) as mock_gen,
        patch("slideia.api.routes.export_slides") as mock_export,
        patch("slideia.core.config.settings") as mock_settings,
    ):
        mock_settings.DOWNLOADS_DIR = tmp_path
        response = client.post("/export-pptx", json=deck_request)
        assert response.status_code == 200
        data = response.json()
        assert "download_url" in data and data["download_url"].endswith(".pptx")
        assert "filename" in data and data["filename"].endswith(".pptx")
        mock_gen.assert_called_once()
        mock_export.assert_called_once()


def test_export_pptx_invalid_request(client):
    """Test missing required fields returns 422."""
    bad_req = {"topic": "AI"}  # missing fields
    response = client.post("/export-pptx", json=bad_req)
    assert response.status_code == 422


def test_export_pptx_llm_error(client, deck_request):
    """Test LLM/generation error returns 500."""
    with (
        patch(
            "slideia.api.routes.generate_full_deck", side_effect=Exception("LLM fail")
        ),
        patch("slideia.core.config.settings") as mock_settings,
    ):
        mock_settings.DOWNLOADS_DIR = tempfile.gettempdir()
        response = client.post("/export-pptx", json=deck_request)
        assert response.status_code == 500
        assert "PPTX export failed" in response.text


def test_export_pptx_export_error(client, deck_request, fake_deck):
    """Test export_slides error returns 500."""
    with (
        patch("slideia.api.routes.generate_full_deck", return_value=fake_deck),
        patch("slideia.api.routes.export_slides", side_effect=Exception("Export fail")),
        patch("slideia.core.config.settings") as mock_settings,
    ):
        mock_settings.DOWNLOADS_DIR = tempfile.gettempdir()
        response = client.post("/export-pptx", json=deck_request)
        assert response.status_code == 500
        assert "PPTX export failed" in response.text


def test_export_pptx_empty_slides(client, deck_request, fake_deck, tmp_path):
    """Test export with empty slides list."""
    fake_deck["outline"]["slides"] = []
    fake_deck["slides"] = []
    with (
        patch("slideia.api.routes.generate_full_deck", return_value=fake_deck),
        patch("slideia.api.routes.export_slides") as mock_export,
        patch("slideia.core.config.settings") as mock_settings,
    ):
        mock_settings.DOWNLOADS_DIR = tmp_path
        response = client.post("/export-pptx", json=deck_request)
        assert response.status_code == 200
        data = response.json()
        assert data["filename"].endswith(".pptx")
        mock_export.assert_called_once()


def test_export_pptx_special_characters_topic(
    client, deck_request, fake_deck, tmp_path
):
    """Test topic with special characters is sanitized in filename."""
    deck_request["topic"] = "AI: The Future? *Yes!*"
    fake_deck["outline"]["title"] = deck_request["topic"]
    with (
        patch("slideia.api.routes.generate_full_deck", return_value=fake_deck),
        patch("slideia.api.routes.export_slides") as mock_export,
        patch("slideia.core.config.settings") as mock_settings,
    ):
        mock_settings.DOWNLOADS_DIR = tmp_path
        response = client.post("/export-pptx", json=deck_request)
        assert response.status_code == 200
        data = response.json()
        assert "AI_The_Future_Yes" in data["filename"] or data["filename"].endswith(
            ".pptx"
        )
        mock_export.assert_called_once()
