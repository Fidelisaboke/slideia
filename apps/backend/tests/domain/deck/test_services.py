import os

import pytest
from slideia.domain.deck.models import Deck, Slide
from slideia.domain.deck.services import create_minimal_template, generate_full_deck


class DummyLLM:
    def __init__(self, outline=None, slides=None):
        self._outline = outline or {
            "title": "Test Deck",
            "slides": [
                {"title": "Slide 1", "summary": "Summary 1"},
                {"title": "Slide 2", "summary": "Summary 2"},
            ],
        }
        self._slides = slides or [
            {
                "title": "Slide 1",
                "bullets": ["A", "B"],
                "notes": "N1",
                "image_prompt": "P1",
                "theme": {},
            },
            {
                "title": "Slide 2",
                "bullets": ["C"],
                "notes": "N2",
                "image_prompt": "P2",
                "theme": {},
            },
        ]
        self._slide_idx = 0

    def propose_outline(self, topic, audience, tone, slide_count):
        return self._outline

    def draft_slide(self, slide_spec):
        # Return next slide or a default
        if self._slide_idx < len(self._slides):
            slide = self._slides[self._slide_idx]
            self._slide_idx += 1
            return slide
        return {
            "title": slide_spec.get("title", "Untitled"),
            "bullets": [],
            "notes": "",
            "image_prompt": "",
            "theme": {},
        }


class DummyCache:
    def __init__(self):
        self._store = {}
        self.get_called = False
        self.set_called = False

    def get(self, *args):
        self.get_called = True
        return self._store.get(args)

    def set(self, *args):
        self.set_called = True
        self._store[args[:-1]] = args[-1]


def test_generate_full_deck_new_generation():
    llm = DummyLLM()
    cache = DummyCache()
    deck = generate_full_deck("topic", "audience", "tone", 2, llm, cache)
    assert isinstance(deck, Deck)
    assert deck.outline["title"] == "Test Deck"
    assert len(deck.outline["slides"]) == 2
    assert len(deck.slides) == 2
    assert all(isinstance(s, Slide) for s in deck.slides)
    assert cache.set_called
    assert cache.get_called


def test_generate_full_deck_uses_cache():
    llm = DummyLLM()
    cache = DummyCache()
    # Pre-populate cache
    cached = {
        "outline": {"title": "Cached Deck", "slides": [{"title": "C1"}]},
        "slides": [
            {
                "title": "C1",
                "bullets": ["X"],
                "notes": "",
                "image_prompt": "",
                "theme": {},
            }
        ],
    }
    cache._store[("topic", "audience", "tone", 1)] = cached
    deck = generate_full_deck("topic", "audience", "tone", 1, llm, cache)
    assert deck.outline["title"] == "Cached Deck"
    assert len(deck.slides) == 1
    assert deck.slides[0].title == "C1"
    assert cache.get_called
    # Should not call set again
    assert not cache.set_called


def test_generate_full_deck_empty_outline():
    llm = DummyLLM(outline={"title": "Empty", "slides": []}, slides=[])
    cache = DummyCache()
    deck = generate_full_deck("topic", "audience", "tone", 0, llm, cache)
    assert deck.outline["slides"] == []
    assert deck.slides == []


def test_generate_full_deck_slide_type_handling():
    # Slide with missing fields, type mismatches
    llm = DummyLLM(
        outline={"title": "Deck", "slides": [{"title": 123, "summary": None}]},
        slides=[
            {
                "title": 123,
                "bullets": "A\nB",
                "notes": 456,
                "image_prompt": 789,
                "theme": "notadict",
            }
        ],
    )
    cache = DummyCache()
    deck = generate_full_deck("topic", "audience", "tone", 1, llm, cache)
    assert isinstance(deck, Deck)
    assert isinstance(deck.slides[0], Slide)
    assert str(deck.slides[0].title) == "123"


def test_create_minimal_template(tmp_path):
    out_path = tmp_path / "min_template.pptx"
    create_minimal_template(str(out_path))
    assert os.path.exists(out_path)
    # Should be a valid pptx file
    prs = None
    try:
        prs = __import__("pptx").Presentation(str(out_path))
    except Exception:
        pytest.fail("Generated file is not a valid pptx")
    assert prs is not None
    assert len(prs.slides) == 2
    assert prs.slides[0].shapes.title.text == "Title Placeholder"
    assert prs.slides[1].shapes.title.text == "Content Title"
