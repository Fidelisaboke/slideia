"""
Main server entry point for the slideia package.
Exposes slide generation MCP tools.
"""

from mcp.server.fastmcp import FastMCP

from slideia.core.config import settings
from slideia.domain.deck.exporter import export_slides
from slideia.infra.openrouter import OpenRouterLLM

mcp = FastMCP(name="slideia")
llm = OpenRouterLLM(settings.OPENROUTER_API_KEY, settings.OPENROUTER_MODEL)


@mcp.tool()
def generate_pptx_tool(input_path: str, output_path: str) -> str:
    """
    Generate a PowerPoint file from a JSON slide deck specification.
    Args:
        input_path (str): Path to input JSON file with slide deck specification
        output_path (str): Path to output PowerPoint file
    Returns:
        str: Path to generated PowerPoint file
    """
    return export_slides(input_path, output_path)


@mcp.tool()
def propose_outline_tool(topic: str, audience: str, tone: str, slides_count: int):
    """
    Generate a slide outline for a presentation using LLM APIs.
    Args:
        topic (str): Presentation topic
        audience (str): Intended audience
        tone (str): Desired tone
        slides_count (int): Number of slides
    Returns:
        dict: Outline with title, slides, and optional citations
    """
    return llm.propose_outline(topic, audience, tone, slides_count)


@mcp.tool()
def draft_slide_tool(slide_spec: dict):
    """
    Draft the content for a single slide using LLM APIs.
    Args:
        slide_spec (dict): Slide specification (title, summary, etc)
    Returns:
        dict: Drafted slide content (bullets, notes, image_prompt, theme)
    """
    return llm.draft_slide(slide_spec)


if __name__ == "__main__":
    mcp.run()
