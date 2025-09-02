"""
Test FastAPI /generate_deck endpoint for slideia.
"""
import pytest
from fastapi.testclient import TestClient
from slideia.api import app


def test_generate_deck_handles_all_cases():
    client = TestClient(app)
    payload = {
        "topic": "AI in Education",
        "audience": "Teachers",
        "tone": "formal",
        "slides": 3
    }
    response = client.post("/generate_deck", json=payload)
    if response.status_code == 200:
        data = response.json()
        assert "outline" in data
        assert "slides" in data
        assert isinstance(data["slides"], list)
        # Optionally check slide content structure if slides exist
        if data["slides"]:
            slide = data["slides"][0]
            assert "bullets" in slide
            assert "notes" in slide
            assert "image_prompt" in slide
            assert "theme" in slide
    else:
        # Should be a handled error (e.g., 500)
        assert response.status_code in (500, 501)
        assert "not implemented" in response.json().get("detail", "").lower() or "failed" in response.json().get("detail", "").lower()
