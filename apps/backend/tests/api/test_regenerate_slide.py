from unittest.mock import patch, AsyncMock

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from slideia.api.routes import router

app = FastAPI()
app.include_router(router)


@pytest.fixture
def client():
    return TestClient(app)


def test_regenerate_slide_success(client):
    """Test successful slide regeneration."""
    request_data = {
        "title": "Old Title",
        "summary": "Old Summary",
        "instruction": "Make it more professional",
    }
    mock_result = {
        "bullets": ["New point 1", "New point 2"],
        "notes": "New speaker notes",
        "image_prompt": "A professional business scene",
        "theme": {"font": "Arial", "color": "#000000"},
    }

    with patch(
        "slideia.api.routes.llm.regenerate_slide", new_callable=AsyncMock, return_value=mock_result
    ) as mock_llm:
        response = client.post("/regenerate-slide", json=request_data)

        assert response.status_code == 200
        data = response.json()
        assert data == mock_result
        mock_llm.assert_called_once_with(
            title="Old Title", summary="Old Summary", instruction="Make it more professional"
        )


def test_regenerate_slide_no_instruction(client):
    """Test regeneration without optional instruction."""
    request_data = {"title": "Title", "summary": "Summary"}
    mock_result = {"bullets": ["P1"], "notes": "N1", "image_prompt": "I1"}

    with patch("slideia.api.routes.llm.regenerate_slide", new_callable=AsyncMock, return_value=mock_result):
        response = client.post("/regenerate-slide", json=request_data)
        assert response.status_code == 200


def test_regenerate_slide_error(client):
    """Test 500 error when LLM fails."""
    request_data = {"title": "T", "summary": "S"}

    with patch(
        "slideia.api.routes.llm.regenerate_slide", new_callable=AsyncMock, side_effect=Exception("LLM fail")
    ):
        response = client.post("/regenerate-slide", json=request_data)
        assert response.status_code == 500
        assert "Oops!" in response.json()["detail"]


def test_regenerate_slide_invalid_request(client):
    """Test 422 error for missing fields."""
    response = client.post("/regenerate-slide", json={"title": "T"})  # missing summary
    assert response.status_code == 422
