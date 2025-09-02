"""
Unit tests for MCP LLM tools in slideia.server.
"""
import pytest
from slideia.server import propose_outline_tool, draft_slide_tool

def test_propose_outline_tool_raises():
    with pytest.raises(NotImplementedError):
        propose_outline_tool("AI in Education", "Teachers", "formal", 5)

def test_draft_slide_tool_raises():
    with pytest.raises(NotImplementedError):
        draft_slide_tool({"title": "Intro", "bullets": ["A", "B"]})
