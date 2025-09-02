"""
Test FastAPI /generate_deck endpoint for slideia.
"""
import pytest
from fastapi.testclient import TestClient
from slideia.api import app

def test_generate_deck_returns_500():
    client = TestClient(app)
    payload = {
        "topic": "AI in Education",
        "audience": "Teachers",
        "tone": "formal",
        "slides": 3
    }
    response = client.post("/generate_deck", json=payload)
    assert response.status_code == 500
    assert "not implemented" in response.json()["detail"].lower() or "failed" in response.json()["detail"].lower()
