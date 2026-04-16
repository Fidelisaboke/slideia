import pytest
from unittest.mock import AsyncMock, MagicMock
from slideia.domain.deck.services import generate_full_deck_stream, propose_outline_stream


@pytest.fixture
def mock_llm():
    llm = MagicMock()
    llm.propose_outline = AsyncMock()
    llm.draft_slide = AsyncMock()
    return llm


@pytest.fixture
def mock_cache():
    cache = MagicMock()
    cache.get.return_value = None
    return cache


@pytest.mark.asyncio
async def test_generate_full_deck_stream_success(mock_llm, mock_cache):
    # Setup mock outline
    mock_llm.propose_outline.return_value = {
        "title": "Test Presentation",
        "slides": [{"title": "Slide 1", "summary": "S1"}],
    }
    mock_llm.draft_slide.return_value = {"bullets": ["B1"], "notes": "N1", "image_prompt": "P1"}

    events = []
    async for event in generate_full_deck_stream("T", "A", "Tone", 1, mock_llm, mock_cache):
        events.append(event)

    # Expected steps: outline, slide (1), complete
    assert len(events) == 3
    assert events[0]["step"] == "outline"
    assert events[1]["step"] == "slide"
    assert events[1]["index"] == 1
    assert events[2]["step"] == "complete"
    assert events[2]["data"]["outline"]["title"] == "Test Presentation"

    mock_cache.set.assert_called_once()


@pytest.mark.asyncio
async def test_generate_full_deck_stream_cache_hit(mock_llm, mock_cache):
    mock_cache.get.return_value = {"outline": {"title": "Cached"}, "slides": []}

    events = []
    async for event in generate_full_deck_stream("T", "A", "Tone", 1, mock_llm, mock_cache):
        events.append(event)

    assert len(events) == 1
    assert events[0]["step"] == "complete"
    assert events[0]["data"]["outline"]["title"] == "Cached"
    mock_llm.propose_outline.assert_not_called()


@pytest.mark.asyncio
async def test_propose_outline_stream_success(mock_llm, mock_cache):
    mock_llm.propose_outline.return_value = {"title": "New Outline", "slides": []}

    events = []
    async for event in propose_outline_stream("Topic", "Audience", "Tone", 5, mock_llm, mock_cache):
        events.append(event)

    # Expected steps: outline (3 yields), complete
    assert len(events) == 4
    assert all(e["step"] == "outline" for e in events[:3])
    assert events[3]["step"] == "complete"
    assert events[3]["data"]["title"] == "New Outline"
