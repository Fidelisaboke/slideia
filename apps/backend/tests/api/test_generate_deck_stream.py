import json
from unittest.mock import patch

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from slideia.api.routes import router

app = FastAPI()
app.include_router(router)


@pytest.fixture
def client():
    # Use standard TestClient for SSE (it supports iter_lines)
    return TestClient(app)


@pytest.fixture
def deck_request():
    return {
        "topic": "Streaming Test",
        "audience": "Developers",
        "tone": "Casual",
        "slide_count": 2,
    }


def test_generate_deck_stream_success(client, deck_request):
    """Test successful streaming of generation progress."""

    async def fake_stream(*args, **kwargs):
        yield {"step": "outline", "progress": 10, "message": "Outline..."}
        yield {
            "step": "slide",
            "index": 1,
            "total": 1,
            "title": "S1",
            "progress": 50,
            "message": "Slide 1...",
        }
        yield {"step": "complete", "progress": 100, "message": "Done!", "data": {"outline": {}, "slides": []}}

    with patch("slideia.api.routes.generate_full_deck_stream", side_effect=fake_stream):
        response = client.post("/generate-deck/stream", json=deck_request)

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

        events = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        assert len(events) == 3
        assert events[0]["step"] == "outline"
        assert events[1]["step"] == "slide"
        assert events[2]["step"] == "complete"


def test_generate_deck_stream_error(client, deck_request):
    """Test error handling in generation stream."""

    async def fake_stream_error(*args, **kwargs):
        yield {"step": "outline", "progress": 10, "message": "Outline..."}
        raise Exception("Stream failed")

    with patch("slideia.api.routes.generate_full_deck_stream", side_effect=fake_stream_error):
        response = client.post("/generate-deck/stream", json=deck_request)

        events = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        assert any(e["step"] == "error" for e in events)
        assert any("Stream failed" in e["message"] for e in events if e["step"] == "error")
