
"""
server.py
Main server entry point for the slideia package.
Exposes generate_pptx as an MCP tool using FastMCP.
"""


from mcp.server.fastmcp import FastMCP

from slideia.tools.exporter import generate_pptx
from slideia.llm import propose_outline, draft_slide

mcp = FastMCP(name="slideia")

@mcp.tool()
def generate_pptx_tool(topic: str, slides: int = 5) -> str:
    """
    MCP tool wrapper for generate_pptx.
    Args:
        topic (str): The topic/title for the presentation.
        slides (int, optional): Number of content slides to generate. Defaults to 5.
    Returns:
        str: The filename of the generated .pptx deck.
    """
    return generate_pptx(topic, slides)


# LLM-based MCP tools
@mcp.tool()
def propose_outline_tool(topic: str, audience: str, tone: str, slides: int):
    """
    MCP tool wrapper for propose_outline.
    """
    return propose_outline(topic, audience, tone, slides)

@mcp.tool()
def draft_slide_tool(slide_spec: dict):
    """
    MCP tool wrapper for draft_slide.
    """
    return draft_slide(slide_spec)

def main():
    """Main function to start the slideia MCP server."""
    mcp.run()

if __name__ == "__main__":
    main()
