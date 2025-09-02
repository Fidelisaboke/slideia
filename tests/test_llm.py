"""
Test LLM layer: propose_outline and draft_slide stubs.
"""
import pytest

from slideia.llm import draft_slide, propose_outline


def test_propose_outline_raises_without_api_key(monkeypatch):
    """Should raise RuntimeError if no API key is set (simulate missing key)."""
    monkeypatch.setattr("os.getenv", lambda k, default=None: None)
    with pytest.raises(RuntimeError):
        propose_outline("Test", "Audience", "formal", 2)


def test_draft_slide_raises_without_api_key(monkeypatch):
    """Should raise RuntimeError if no API key is set (simulate missing key)."""
    monkeypatch.setattr("os.getenv", lambda k, default=None: None)
    with pytest.raises(RuntimeError):
        draft_slide({"title": "Test"})
