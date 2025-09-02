"""
Pytest fixtures for slideia tests.
Provides reusable temp directory and sample JSON deck input.
"""
import json
import pytest


@pytest.fixture
def tmp_export_dir(tmp_path):
    """Temporary directory for exporter output."""
    return tmp_path


@pytest.fixture
def sample_deck_json(tmp_path):
    """Create a sample deck JSON file and return its path."""
    deck = {
        "title": "Accessibility in AI",
        "subtitle": "A modern approach",
        "slides": [
            {
                "title": "Introduction",
                "summary": "Why accessibility matters.",
                "bullets": ["Legal requirements", "User experience"],
                "image_prompt": "A person using a screen reader",
                "theme": {"font": "Arial", "color": "#003366"}
            },
            {
                "title": "Best Practices",
                "summary": "How to make slides accessible.",
                "bullets": ["Alt text for images", "High contrast colors"],
                "theme": {"font": "Calibri", "color": "#222222"}
            }
        ]
    }
    path = tmp_path / "deck.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(deck, f)
    return str(path)
