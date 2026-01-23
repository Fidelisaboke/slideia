"""
Test MCP tool discovery and registration for slideia.
"""

import asyncio
import importlib
import pytest


@pytest.mark.asyncio
async def test_mcp_tools_discoverable():
    """Test MCP tool registration/discovery using FastMCP public API."""
    server = importlib.import_module("slideia.server")
    mcp = getattr(server, "mcp", None)
    assert mcp is not None
    # Should have at least one tool registered (try list_tools() or _tools)
    if hasattr(mcp, "list_tools"):
        tools = mcp.list_tools()
        if asyncio.iscoroutine(tools):
            tools = await tools
    elif hasattr(mcp, "_tools"):
        tools = mcp._tools
    else:
        raise AssertionError("FastMCP has no public tool registry API")
    assert tools and len(tools) > 0
    # Tool names should include known ones
    if isinstance(tools, dict):
        tool_names = list(tools.keys())
    else:
        tool_names = [getattr(t, "name", str(t)) for t in tools]
    assert any("pptx" in n or "slide" in n for n in tool_names)
