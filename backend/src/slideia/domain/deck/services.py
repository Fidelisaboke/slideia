import os
import sys

from pptx import Presentation
from slideia.domain.deck.models import Deck
from slideia.infra.cache import Cache, RedisCache
from slideia.infra.openrouter import OpenRouterLLM

if os.getenv("ENV") == "test":
    cache = Cache()
else:
    cache = RedisCache()

llm = OpenRouterLLM(
    api_key=os.getenv("OPENROUTER_API_KEY"), model=os.getenv("OPENROUTER_MODEL")
)


def create_minimal_template(path: str):
    """Create a minimal PowerPoint template with one title slide and one content slide.

    Args:
        path (str): The file path to save the template.
    """
    prs = Presentation()

    # Title slide layout
    title_slide_layout = prs.slide_layouts[0]
    slide = prs.slides.add_slide(title_slide_layout)
    slide.shapes.title.text = "Title Placeholder"
    if len(slide.placeholders) > 1:
        slide.placeholders[1].text = "Subtitle Placeholder"

    # Content slide layout
    content_layout = prs.slide_layouts[1]
    slide = prs.slides.add_slide(content_layout)
    slide.shapes.title.text = "Content Title"
    if len(slide.placeholders) > 1:
        body_shape = slide.placeholders[1]
        tf = body_shape.text_frame
        tf.text = "Bullet 1\n Bullet 2"

    # Save template
    prs.save(path)


def generate_full_deck(
    topic: str,
    audience: str,
    tone: str,
    slide_count: int,
) -> Deck:
    cached = cache.get(topic, audience, tone, slide_count)
    if cached:
        return cached

    print("[generate_full_deck] Generating new deck", file=sys.stderr)

    outline = llm.propose_outline(
        topic=topic,
        audience=audience,
        tone=tone,
        slide_count=slide_count,
    )

    slides_content = []
    for slide_spec in outline.get("slides", []):
        slides_content.append(llm.draft_slide(slide_spec))

    result = {
        "outline": outline,
        "slides": slides_content,
    }

    cache.set(topic, audience, tone, slide_count, result)
    return result
