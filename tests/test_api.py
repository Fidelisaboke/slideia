"""
Test FastAPI LLM API endpoints for slideia.
"""
import pytest
from fastapi.testclient import TestClient
from slideia.api import app

def test_generate_outline_returns_500():
    client = TestClient(app)
    payload = {
        "topic": "AI in Education",
        "audience": "Teachers",
        "tone": "formal",
        "slides": 5
    }
    response = client.post("/generate_outline", json=payload)
    assert response.status_code == 500
    assert "not implemented" in response.json()["detail"].lower()
