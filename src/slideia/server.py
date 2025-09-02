
"""
server.py
Main server entry point for the slideia package.
Exposes generate_pptx as an MCP tool using FastMCP.
"""


from mcp.server.fastmcp import FastMCP
from slideia.tools.exporter import generate_pptx

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

def main():
    """Main function to start the slideia MCP server."""
    mcp.run()

if __name__ == "__main__":
    main()
