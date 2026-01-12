"""
FastAPI app exposing LLM generation endpoints for slideia.
"""

import json
import os
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from slideia.llm import draft_slide, propose_outline
from slideia.tools.exporter import export_slides

load_dotenv()

app = FastAPI(title="slideia API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_FRONTEND_URL", "")],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directory to store generated files
# Use absolute path relative to the src directory
DOWNLOADS_DIR = Path(__file__).parent.parent / "downloads"
DOWNLOADS_DIR.mkdir(exist_ok=True)

# Mount the downloads directory
app.mount("/downloads", StaticFiles(directory=str(DOWNLOADS_DIR)), name="downloads")


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
            slide_count=request.slide_count,
        )
        return outline
    except Exception as e:
        print(f"Error generating outline: {e}")
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
            "slides": [ {"bullets": [...], "notes": str, "image_prompt": str, "theme": dict}, ... ]
        }

    Returns HTTP 500 with error message if LLM call fails.
    """
    try:
        outline = propose_outline(
            topic=request.topic,
            audience=request.audience,
            tone=request.tone,
            slide_count=request.slide_count,
        )
        slides_content = []
        for slide_spec in outline.get("slides", []):
            try:
                slide_content = draft_slide(slide_spec)
                slides_content.append(slide_content)
            except Exception as e:
                print(f"Error drafting slide {slide_spec.get('title', '')}: {e}")
                raise HTTPException(status_code=500, detail=f"Drafting failed: {e}")
        return {"outline": outline, "slides": slides_content}
    except Exception as e:
        print(f"Error generating deck: {e}")
        raise HTTPException(status_code=500, detail=f"Deck generation failed: {e}")


# POST: /export-pptx: Export deck to a PowerPoint file
@app.post("/export-pptx")
def export_pptx(request: DeckRequest):
    """
    Export a slide deck to a PowerPoint (.pptx) file.

    Request JSON:
        {"topic": str, "audience": str, "tone": str, "slide_count": int}

    Response JSON:
        {"download_url": str, "filename": str}

    Returns HTTP 500 with error message if LLM call or export fails.
    """
    json_path = None
    output_path = None

    try:
        # Generate full deck
        outline = propose_outline(
            topic=request.topic,
            audience=request.audience,
            tone=request.tone,
            slide_count=request.slide_count,
        )

        slides_content = []
        for slide_spec in outline.get("slides", []):
            slide_content = draft_slide(slide_spec)
            slides_content.append(slide_content)

        # Data for export
        deck_data = {
            "title": outline.get("title", request.topic),
            "subtitle": f"For {request.audience}",
            "slides": [],
        }

        for i, slide_spec in enumerate(outline.get("slides", [])):
            slide_data = {
                "title": slide_spec.get("title", f"Slide {i + 1}"),
                "summary": slide_spec.get("summary", ""),
                "bullets": slides_content[i].get("bullets", []),
                "image_prompt": slides_content[i].get("image_prompt", ""),
                "notes": slides_content[i].get("notes", ""),
                "theme": slides_content[i].get("theme", {}),
            }
            deck_data["slides"].append(slide_data)

        # Create temporary JSON file
        with tempfile.NamedTemporaryFile(
            mode="w", delete=False, suffix=".json", encoding="utf-8"
        ) as tmp_json:
            json_path = tmp_json.name
            json.dump(deck_data, tmp_json, indent=2)

        # Generate output filename
        safe_topic = "".join(
            c for c in request.topic if c.isalnum() or c in (" ", "-", "_")
        ).strip()
        safe_topic = safe_topic.replace(" ", "_")[:50]
        output_filename = f"{safe_topic}.pptx"
        output_path = DOWNLOADS_DIR / output_filename

        # Export to PPTX
        export_slides(json_path, str(output_path))

        # Clean up temporary JSON file
        os.unlink(json_path)

        # Return download URL
        download_url = f"/downloads/{output_filename}"
        return {"download_url": download_url, "filename": output_filename}
    except Exception as e:
        print(f"Error exporting PPTX: {e}")
        raise HTTPException(status_code=500, detail=f"PPTX export failed: {e}")

    finally:
        # Clean up temporary files if they exist
        if json_path and os.path.exists(json_path):
            os.unlink(json_path)


# GET /health: Health check endpoint
@app.get("/health")
def health_check():
    """Health check endpoint."""
    files = list(DOWNLOADS_DIR.glob("*.pptx"))
    return {
        "status": "ok",
        "downloads_dir": str(DOWNLOADS_DIR),
        "downloads_exists": DOWNLOADS_DIR.exists(),
        "pptx_files": [f.name for f in files],
        "file_count": len(files),
    }
