
"""
Main server entry point for the slideia package.
Exposes slide generation MCP tools.
"""


from mcp.server.fastmcp import FastMCP

from slideia.tools.exporter import generate_pptx

# Import LLM functions for MCP tool exposure
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



# MCP tool: Generate a slide outline using LLM APIs
@mcp.tool()
def propose_outline_tool(topic: str, audience: str, tone: str, slides: int):
    """
    Generate a slide outline for a presentation using LLM APIs.
    Args:
        topic (str): Presentation topic
        audience (str): Intended audience
        tone (str): Desired tone
        slides (int): Number of slides
    Returns:
        dict: Outline with title, slides, and optional citations
    """
    return propose_outline(topic, audience, tone, slides)

# MCP tool: Draft a single slide using LLM APIs
@mcp.tool()
def draft_slide_tool(slide_spec: dict):
    """
    Draft the content for a single slide using LLM APIs.
    Args:
        slide_spec (dict): Slide specification (title, summary, etc)
    Returns:
        dict: Drafted slide content (bullets, notes, image_prompt, theme)
    """
    return draft_slide(slide_spec)

if __name__ == "__main__":
    mcp.run
