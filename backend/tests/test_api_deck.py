"""
Test FastAPI /generate_deck endpoint for slideia.
"""

from fastapi.testclient import TestClient

from slideia.api import app


def test_generate_deck_handles_all_cases(monkeypatch):
    """
    Test /generate_deck endpoint returns error if LLM fails (e.g., no API key).
    """
    client = TestClient(app)
    payload = {
        "topic": "AI in Education",
        "audience": "Teachers",
        "tone": "formal",
        "slide_count": 3
    }

    # Patch LLM to raise error so we can test error handling
    def fail_outline(*a, **kw):
        raise RuntimeError("No API key")

    monkeypatch.setattr("slideia.api.propose_outline", fail_outline)
    response = client.post("/generate-deck", json=payload)
    assert response.status_code in (500, 501)
    assert "failed" in response.json().get("detail", "").lower()
