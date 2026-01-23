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
def deck_request():
    return {
        "topic": "Accessibility in AI",
        "audience": "Developers",
        "tone": "Informative",
        "slide_count": 2,
    }


@pytest.fixture
def fake_deck():
    class FakeDeck:
        def __init__(self):
            self.outline = {
                "title": "Accessibility in AI",
                "slides": [
                    {"title": "Intro", "summary": "Why it matters."},
                    {"title": "Best Practices", "summary": "How to do it."},
                ],
            }
            self.slides = [
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
            ]

        def to_dict(self):
            return {"outline": self.outline, "slides": self.slides}

    return FakeDeck()


def test_generate_deck_llm_error(client, deck_request):
    """Test LLM/service error returns 500."""
    with patch(
        "slideia.api.routes.generate_full_deck", side_effect=Exception("LLM fail")
    ):
        response = client.post("/generate-deck", json=deck_request)
        assert response.status_code == 500
        assert "Deck generation failed" in response.text


def test_generate_deck_empty_slides(client, deck_request, fake_deck):
    """Test deck with empty slides list."""
    fake_deck.outline["slides"] = []
    fake_deck.slides = []
    with patch("slideia.api.routes.generate_full_deck", return_value=fake_deck):
        response = client.post("/generate-deck", json=deck_request)
        assert response.status_code == 200
        data = response.json()
        assert data["outline"]["slides"] == []
        assert data["slides"] == []


def test_generate_deck_large_slide_count(client, fake_deck):
    """Test large slide count is handled."""
    req = {
        "topic": "Big Deck",
        "audience": "All",
        "tone": "Neutral",
        "slide_count": 50,
    }
    fake_deck.outline["slides"] = [{"title": f"Slide {i + 1}"} for i in range(50)]
    fake_deck.slides = [{"bullets": [f"Bullet {i + 1}"]} for i in range(50)]
    with patch("slideia.api.routes.generate_full_deck", return_value=fake_deck):
        response = client.post("/generate-deck", json=req)
        assert response.status_code == 200
        data = response.json()
        assert len(data["outline"]["slides"]) == 50
        assert len(data["slides"]) == 50


def test_generate_deck_special_characters(client, deck_request, fake_deck):
    """Test topic with special characters is accepted."""
    deck_request["topic"] = "AI: The Future? *Yes!*"
    fake_deck.outline["title"] = deck_request["topic"]
    with patch("slideia.api.routes.generate_full_deck", return_value=fake_deck):
        response = client.post("/generate-deck", json=deck_request)
        assert response.status_code == 200
        data = response.json()
        assert data["outline"]["title"] == deck_request["topic"]
