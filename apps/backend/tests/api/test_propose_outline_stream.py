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
    return TestClient(app)


@pytest.fixture
def outline_request():
    return {
        "topic": "Streaming Outline Test",
        "audience": "Developers",
        "tone": "Casual",
        "slide_count": 2,
    }


def test_propose_outline_stream_success(client, outline_request):
    """Test successful streaming of outline generation progress."""

    async def fake_outline_stream(*args, **kwargs):
        yield {"step": "outline", "progress": 20, "message": "Analyzing..."}
        yield {
            "step": "complete",
            "progress": 100,
            "message": "Done!",
            "data": {"title": "Test Title", "slides": []},
        }

    with patch("slideia.api.routes.propose_outline_stream", side_effect=fake_outline_stream):
        response = client.post("/propose-outline/stream", json=outline_request)

        assert response.status_code == 200
        assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

        events = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        assert len(events) == 2
        assert events[0]["step"] == "outline"
        assert events[1]["step"] == "complete"
        assert events[1]["data"]["title"] == "Test Title"


def test_propose_outline_stream_error(client, outline_request):
    """Test error handling in outline generation stream."""

    async def fake_outline_stream_error(*args, **kwargs):
        yield {"step": "outline", "progress": 20, "message": "Analyzing..."}
        raise Exception("Outline failed")

    with patch("slideia.api.routes.propose_outline_stream", side_effect=fake_outline_stream_error):
        response = client.post("/propose-outline/stream", json=outline_request)

        events = []
        for line in response.iter_lines():
            if line.startswith("data: "):
                events.append(json.loads(line[6:]))

        assert any(e["step"] == "error" for e in events)
        assert "Outline failed" in next(e["message"] for e in events if e["step"] == "error")
