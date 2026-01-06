"""
FastAPI app exposing LLM generation endpoints for slideia.
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from slideia.llm import draft_slide, propose_outline

load_dotenv()

app = FastAPI(title="slideia LLM API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_FRONTEND_URL", "")],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ProposeOutlineRequest(BaseModel):
    topic: str
    audience: str
    tone: str
    slide_count: int

class DeckRequest(BaseModel):
    topic: str
    audience: str
    tone: str
    slide_count: int


# POST /propose-outline: Propose a slide outline
@app.post("/propose-outline")
def generate_outline(request: ProposeOutlineRequest):
    """
    Propose a slide outline for a presentation.

    Request JSON:
        {"topic": str, "audience": str, "tone": str, "slide_count": int}

    Response JSON:
        {"title": str, "slides": [ ... ], ...}

    Returns HTTP 500 with error message if LLM call fails.
    """
    try:
        outline = propose_outline(
            topic=request.topic,
            audience=request.audience,
            tone=request.tone,
            slide_count=request.slide_count
        )
        return outline
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Outline generation failed: {e}")


# POST /generate-deck: Generate a full slide deck (outline + drafted slides)
@app.post("/generate-deck")
def generate_deck(request: DeckRequest):
    """
    Generate a full slide deck by first proposing an outline and then drafting each slide.

    Request JSON:
        {"topic": str, "audience": str, "tone": str, "slide_count": int}

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
            slide_count=request.slide_count
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
