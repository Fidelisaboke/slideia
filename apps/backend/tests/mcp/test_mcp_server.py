from unittest.mock import patch

import pytest
from slideia.mcp import server


def test_generate_pptx_tool_creates_file(tmp_path):
    # Patch export_slides to just create a file
    with patch(
        "slideia.mcp.server.export_slides", return_value="/tmp/fake.pptx"
    ) as mock_export:
        input_path = tmp_path / "input.json"
        output_path = tmp_path / "output.pptx"
        input_path.write_text("{}", encoding="utf-8")
        result = server.generate_pptx_tool(str(input_path), str(output_path))
        mock_export.assert_called_once_with(str(input_path), str(output_path))
        assert result == "/tmp/fake.pptx"


def test_propose_outline_tool_calls_llm():
    with patch.object(server, "llm") as mock_llm:
        mock_llm.propose_outline.return_value = {"title": "T", "slides": []}
        result = server.propose_outline_tool("topic", "audience", "tone", 3)
        mock_llm.propose_outline.assert_called_once_with("topic", "audience", "tone", 3)
        assert result["title"] == "T"
        assert isinstance(result["slides"], list)


def test_draft_slide_tool_calls_llm():
    with patch.object(server, "llm") as mock_llm:
        mock_llm.draft_slide.return_value = {"title": "S", "bullets": ["A"]}
        slide_spec = {"title": "S"}
        result = server.draft_slide_tool(slide_spec)
        mock_llm.draft_slide.assert_called_once_with(slide_spec)
        assert result["title"] == "S"
        assert "bullets" in result


def test_generate_pptx_tool_file_not_found(tmp_path):
    # Simulate export_slides raising FileNotFoundError
    with patch("slideia.mcp.server.export_slides", side_effect=FileNotFoundError):
        with pytest.raises(FileNotFoundError):
            server.generate_pptx_tool("/no/such/file.json", str(tmp_path / "out.pptx"))


def test_propose_outline_tool_llm_error():
    with patch.object(server, "llm") as mock_llm:
        mock_llm.propose_outline.side_effect = Exception("LLM fail")
        with pytest.raises(Exception) as exc:
            server.propose_outline_tool("topic", "audience", "tone", 1)
        assert "LLM fail" in str(exc.value)


def test_draft_slide_tool_llm_error():
    with patch.object(server, "llm") as mock_llm:
        mock_llm.draft_slide.side_effect = Exception("Draft fail")
        with pytest.raises(Exception) as exc:
            server.draft_slide_tool({"title": "S"})
        assert "Draft fail" in str(exc.value)
