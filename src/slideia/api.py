"""
FastAPI app exposing LLM generation endpoints for slideia.
"""


from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from slideia.llm import propose_outline, draft_slide

load_dotenv()

app = FastAPI(title="slideia LLM API")

class DeckRequest(BaseModel):
    topic: str
    audience: str
    tone: str
    slides: int


# POST /generate_deck: Generate a full slide deck (outline + drafted slides)
@app.post("/generate_deck")
def generate_deck(request: DeckRequest):
    """
    Generate a full slide deck by first proposing an outline and then drafting each slide.

    Request JSON:
        {"topic": str, "audience": str, "tone": str, "slides": int}

    Response JSON:
        {
            "outline": {"title": str, "slides": [ ... ], ...},
            "slides": [ {"bullets": [...], "notes": str, "image_prompt": str, "theme": ...}, ... ]
        }

    Returns HTTP 500 with error message if LLM call fails.
    """
    try:
        outline = propose_outline(
            topic=request.topic,
            audience=request.audience,
            tone=request.tone,
            slides=request.slides
        )
        slides_content = []
        for slide_spec in outline.get('slides', []):
            try:
                slide_content = draft_slide(slide_spec)
                slides_content.append(slide_content)
            except Exception as e:
                # If drafting is not implemented or fails, return HTTP 500
                raise HTTPException(status_code=500, detail=f"Drafting failed: {e}")
        return {"outline": outline, "slides": slides_content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Deck generation failed: {e}")
