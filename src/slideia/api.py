"""
FastAPI app exposing LLM generation endpoints for slideia.
"""

import json
import os
import sys
import tempfile
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from slideia.llm import draft_slide, propose_outline
from slideia.tools.exporter import export_slides
from slideia.utils.cache import RedisCache

cache = RedisCache()

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


def generate_full_deck(topic: str, audience: str, tone: str, slide_count: int) -> dict:
    """
    Generate complete deck with caching.

    Returns:
        {
            "outline": {...},
            "slides": [...]
        }
    """
    # Check cache first
    cached = cache.get(topic, audience, tone, slide_count)
    if cached:
        return cached

    print("[generate_full_deck] Generating new deck (not in cache)", file=sys.stderr)

    # Generate outline
    outline = propose_outline(
        topic=topic,
        audience=audience,
        tone=tone,
        slide_count=slide_count,
    )

    # Draft all slides
    slides_content = []
    for i, slide_spec in enumerate(outline.get("slides", [])):
        print(
            f"[generate_full_deck] Drafting slide {i + 1}/{len(outline.get('slides', []))}",
            file=sys.stderr,
        )
        slide_content = draft_slide(slide_spec)
        slides_content.append(slide_content)

    # Prepare result
    result = {"outline": outline, "slides": slides_content}

    # Cache it
    cache.set(topic, audience, tone, slide_count, result)

    return result


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
        # Generate full deck (outline + slides) and cache it
        deck = generate_full_deck(
            request.topic, request.audience, request.tone, request.slide_count
        )

        # Return only the outline to the user
        return deck["outline"]

    except Exception as e:
        print(f"[propose-outline] ERROR: {e}", file=sys.stderr)
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
        # Use cached deck if available
        deck = generate_full_deck(
            request.topic, request.audience, request.tone, request.slide_count
        )

        return deck

    except Exception as e:
        print(f"[generate-deck] ERROR: {e}", file=sys.stderr)
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

    try:
        print("\n[export-pptx] Starting export...", file=sys.stderr)

        # Use cached deck if available
        deck = generate_full_deck(
            request.topic, request.audience, request.tone, request.slide_count
        )

        outline = deck["outline"]
        slides_content = deck["slides"]

        print(
            f"[export-pptx] Using deck with {len(slides_content)} slides",
            file=sys.stderr,
        )

        # Prepare data for export
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

        # Generate filename
        safe_topic = "".join(
            c for c in request.topic if c.isalnum() or c in (" ", "-", "_")
        ).strip()
        safe_topic = safe_topic.replace(" ", "_")[:50]
        if not safe_topic:
            safe_topic = "presentation"

        output_filename = f"{safe_topic}.pptx"
        output_path = DOWNLOADS_DIR / output_filename

        # Export to PPTX
        print(f"[export-pptx] Exporting to {output_path}", file=sys.stderr)
        export_slides(json_path, str(output_path))

        print("[export-pptx] ✓ Export complete!", file=sys.stderr)

        # Return download URL
        return {
            "download_url": f"/downloads/{output_filename}",
            "filename": output_filename,
        }

    except Exception as e:
        print(f"[export-pptx] ERROR: {e}", file=sys.stderr)
        raise HTTPException(status_code=500, detail=f"PPTX export failed: {e}")

    finally:
        if json_path and os.path.exists(json_path):
            try:
                os.unlink(json_path)
            except Exception:
                pass


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
