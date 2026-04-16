import pytest
import httpx
from unittest.mock import AsyncMock, MagicMock, patch
from slideia.infra.openrouter import OpenRouterLLM, _extract_json

# --- Tests for _extract_json_from_markdown ---


def test_extract_json_pure_json():
    text = '{"title": "Test"}'
    assert _extract_json(text) == text


def test_extract_json_markdown_block():
    text = 'Here is the result:\n```json\n{"title": "Test"}\n```\nHope it helps!'
    assert _extract_json(text) == '{"title": "Test"}'


def test_extract_json_markdown_case_insensitive():
    text = '```JSON\n{"a": 1}\n```'
    assert _extract_json(text) == '{"a": 1}'


def test_extract_json_empty():
    assert _extract_json(None) == ""
    assert _extract_json("") == ""


def test_extract_json_invalid_then_valid():
    text = '```json\n{invalid}\n```\n```json\n{"valid": true}\n```'
    assert _extract_json(text) == '{"valid": true}'


# --- Tests for OpenRouterLLM ---


@pytest.fixture
def llm():
    return OpenRouterLLM(api_key="fake_key", model="fake_model")


@pytest.mark.asyncio
async def test_llm_call_success(llm):
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"choices": [{"message": {"content": '```json\n{"result": "ok"}\n```'}}]}
    mock_resp.raise_for_status = MagicMock()

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock, return_value=mock_resp):
        result = await llm._execute_call("test prompt")
        assert result == {"result": "ok"}


@pytest.mark.asyncio
async def test_llm_call_retry_success(llm):
    # First response is 429, second is 200
    mock_429 = MagicMock(spec=httpx.Response)
    mock_429.status_code = 429

    # We must mock the request object for HTTPStatusError
    mock_request = MagicMock(spec=httpx.Request)
    mock_429.request = mock_request

    mock_200 = MagicMock(spec=httpx.Response)
    mock_200.status_code = 200
    mock_200.json.return_value = {"choices": [{"message": {"content": '{"status": "retry_success"}'}}]}

    # Setup side_effect for _execute_call
    # Instead of patching httpx directly, we can patch _execute_call
    # OR we can patch post and handle the raise_for_status

    with patch.object(llm, "_execute_call", new_callable=AsyncMock) as mock_exec:
        # 1st call raises 429 error
        mock_exec.side_effect = [
            httpx.HTTPStatusError("Rate limit", request=mock_request, response=mock_429),
            {"status": "retry_success"},
        ]

        with patch("asyncio.sleep", new_callable=AsyncMock) as mock_sleep:
            result = await llm._call("test prompt")
            assert result == {"status": "retry_success"}
            assert mock_exec.call_count == 2
            mock_sleep.assert_awaited_once_with(2.0)


@pytest.mark.asyncio
async def test_llm_call_max_retries_fail(llm):
    mock_429 = MagicMock(spec=httpx.Response)
    mock_429.status_code = 429
    mock_request = MagicMock(spec=httpx.Request)

    with patch.object(llm, "_execute_call", new_callable=AsyncMock) as mock_exec:
        mock_exec.side_effect = httpx.HTTPStatusError("Rate limit", request=mock_request, response=mock_429)

        with patch("asyncio.sleep", new_callable=AsyncMock):
            with pytest.raises(httpx.HTTPStatusError):
                await llm._call("test prompt")
            assert mock_exec.call_count == 3


@pytest.mark.asyncio
async def test_llm_stream_call_success(llm):
    async def mock_generator(*args, **kwargs):
        yield "Hello"
        yield " world"

    with patch.object(llm, "_execute_stream_call", side_effect=mock_generator) as mock_exec:
        chunks = []
        async for chunk in llm.stream_call([{"role": "user", "content": "hi"}]):
            chunks.append(chunk)

        assert chunks == ["Hello", " world"]
        mock_exec.assert_called_once()


@pytest.mark.asyncio
async def test_llm_propose_outline(llm):
    with patch.object(llm, "_call", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = {"slides": []}
        result = await llm.propose_outline("T", "A", "Tone", 3)
        assert result == {"slides": []}
        mock_call.assert_called_once()


@pytest.mark.asyncio
async def test_llm_draft_slide(llm):
    with patch.object(llm, "_call", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = {"bullets": ["B"]}
        result = await llm.draft_slide({"title": "T", "summary": "S"})
        assert result == {"bullets": ["B"]}
        mock_call.assert_called_once()


@pytest.mark.asyncio
async def test_llm_regenerate_slide(llm):
    with patch.object(llm, "_call", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = {"bullets": ["New"]}
        result = await llm.regenerate_slide("T", "S", "Make it fun")
        assert result == {"bullets": ["New"]}
        mock_call.assert_called_once()


@pytest.mark.asyncio
async def test_llm_stream_call_retry(llm):
    # Mock _execute_stream_call to fail then succeed
    mock_request = MagicMock(spec=httpx.Request)
    mock_429 = MagicMock(spec=httpx.Response)
    mock_429.status_code = 429

    async def fail_once(*args, **kwargs):
        if not hasattr(fail_once, "called"):
            fail_once.called = True
            raise httpx.HTTPStatusError("429", request=mock_request, response=mock_429)
        yield "Recovered"

    with patch.object(llm, "_execute_stream_call", side_effect=fail_once):
        with patch("asyncio.sleep", new_callable=AsyncMock):
            chunks = []
            async for chunk in llm.stream_call([{"role": "user", "content": "hi"}]):
                chunks.append(chunk)
            assert chunks == ["Recovered"]


@pytest.mark.asyncio
async def test_llm_draft_slides_batch(llm):
    with patch.object(llm, "_call", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = {"slides": [{"title": "S1"}, {"title": "S2"}]}
        result = await llm.draft_slides_batch("Topic", "Audience", [{"title": "S1"}, {"title": "S2"}])
        assert len(result["slides"]) == 2
        assert result["slides"][0]["title"] == "S1"
        assert mock_call.call_count == 1
        # Check that it uses a higher max_tokens
        mock_call.assert_called_once()
        args, kwargs = mock_call.call_args
        assert kwargs.get("max_tokens") == 4096
