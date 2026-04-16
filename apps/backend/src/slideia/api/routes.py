import asyncio
import json
import os
import tempfile

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from slideia.api.schemas import (
    DeckRequest,
    FullDeckExportRequest,
    ProposeOutlineRequest,
    RegenerateSlideRequest,
)
from slideia.core.config import settings
from slideia.core.logging import get_logger
from slideia.domain.deck.exporter import export_slides
from slideia.domain.deck.pdf_exporter import export_deck_to_pdf
from slideia.domain.deck.services import (
    Cache,
    RedisCache,
    generate_full_deck,
    generate_full_deck_stream,
    propose_outline_stream,
)
from slideia.infra.image_fetcher import ImageFetcher
from slideia.infra.openrouter import OpenRouterLLM

logger = get_logger(__name__)

router = APIRouter()

if settings.ENVIRONMENT == "test":
    cache = Cache()
else:
    cache = RedisCache()

llm = OpenRouterLLM(api_key=settings.OPENROUTER_API_KEY, model=settings.OPENROUTER_MODEL)


@router.post("/propose-outline")
async def generate_outline(request: ProposeOutlineRequest) -> dict:
    """
    Propose a slide outline for a presentation.

    Request JSON:
        {"topic": str, "audience": str, "tone": str, "slide_count": int}

    Response JSON:
        {"title": str, "slides": [ ... ], ...}

    Returns HTTP 500 with error message if LLM call fails.
    """
    try:
        logger.info(
            f"Generating outline for topic='{request.topic}', "
            f"audience='{request.audience}', slides={request.slide_count}"
        )
        # Use cached deck if available
        deck = await generate_full_deck(
            request.topic,
            request.audience,
            request.tone,
            request.slide_count,
            llm,
            cache,
        )

        # Return only the outline to the user
        logger.info(f"Outline generated successfully with {len(deck.outline.get('slides', []))} slides")
        return deck.outline

    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail="Oops! Something went wrong on our end.")


@router.post("/propose-outline/stream")
async def propose_outline_stream_route(request_data: ProposeOutlineRequest, request: Request):
    """
    Propose an outline and stream progress updates via SSE.
    """

    async def sse_generator():
        try:
            generator = propose_outline_stream(
                request_data.topic,
                request_data.audience,
                request_data.tone,
                request_data.slide_count,
                llm,
                cache,
            )
            async for event in generator:
                if await request.is_disconnected():
                    logger.info("Client disconnected, stopping outline generation.")
                    break
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"Error in outline generation stream: {e}")
            yield f"data: {json.dumps({'step': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")


@router.post("/generate-deck")
async def generate_deck(request: DeckRequest):
    """
    Generate a full slide deck by first proposing an outline and then drafting each slide.
    """
    try:
        logger.info(
            f"Generating full deck for topic='{request.topic}', "
            f"audience='{request.audience}', slides={request.slide_count}"
        )
        # Use cached deck if available
        deck = await generate_full_deck(
            request.topic,
            request.audience,
            request.tone,
            request.slide_count,
            llm,
            cache,
        )

        logger.info(f"Deck generated successfully with {len(deck.slides)} slides")
        return deck.to_dict()

    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail="Oops! Something went wrong on our end.")


@router.post("/generate-deck/stream")
async def generate_deck_stream(request_data: DeckRequest, request: Request):
    """
    Generate a full slide deck and stream progress updates via SSE.
    """

    async def sse_generator():
        try:
            generator = generate_full_deck_stream(
                request_data.topic,
                request_data.audience,
                request_data.tone,
                request_data.slide_count,
                llm,
                cache,
            )
            async for event in generator:
                # Check for disconnection
                if await request.is_disconnected():
                    logger.info("Client disconnected, stopping generation.")
                    break

                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            logger.error(f"Error in generation stream: {e}")
            yield f"data: {json.dumps({'step': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")


@router.post("/regenerate-slide")
async def regenerate_slide(request: RegenerateSlideRequest):
    """
    Regenerate a single slide's content using the LLM.
    """
    try:
        logger.info(
            f"Regenerating slide: title='{request.title}', instruction='{request.instruction or 'none'}'"
        )
        result = await llm.regenerate_slide(
            title=request.title,
            summary=request.summary,
            instruction=request.instruction,
        )
        logger.info("Slide regenerated successfully")
        return result

    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail="Oops! Something went wrong on our end.")


@router.post("/export-pptx")
async def export_pptx(request: FullDeckExportRequest):
    """
    Export a user-edited slide deck to a PowerPoint (.pptx) file.

    Request JSON:
        {
            "topic": str,
            "audience": str,
            "slides": [
                {
                    "title": str,
                    "summary": str,
                    "bullets": [...],
                    "notes": str,
                    "image_prompt": str,
                    "theme": dict | None
                }
            ]
        }

    Response JSON:
        {"download_url": str, "filename": str}

    Returns HTTP 500 with error message if export fails.
    """
    json_path = None

    try:
        logger.info(f"\nStarting PPTX export for topic='{request.topic}'")

        logger.info("Fetching images...")
        image_fetcher = ImageFetcher()

        # Create a list of async tasks for image fetching
        tasks = []
        for slide in request.slides:
            tasks.append(image_fetcher.fetch_image_url(slide.image_prompt))

        # Run tasks concurrently
        image_urls = await asyncio.gather(*tasks)

        logger.info(f"Exporting deck with {len(request.slides)} slides")

        # Prepare data for export from the user-provided state
        deck_data = {
            "title": request.topic,
            "subtitle": f"For {request.audience}",
            "slides": [],
        }

        for i, slide in enumerate(request.slides):
            slide_data = {
                "title": slide.title,
                "summary": slide.summary,
                "bullets": slide.bullets,
                "image_prompt": slide.image_prompt,
                "image_url": image_urls[i],
                "notes": slide.notes,
                "theme": slide.theme,
            }
            deck_data["slides"].append(slide_data)

        # Create temporary JSON file
        with tempfile.NamedTemporaryFile(
            mode="w", delete=False, suffix=".json", encoding="utf-8"
        ) as tmp_json:
            json_path = tmp_json.name
            json.dump(deck_data, tmp_json, indent=2)

        # Generate filename
        safe_topic = "".join(c for c in request.topic if c.isalnum() or c in (" ", "-", "_")).strip()
        safe_topic = safe_topic.replace(" ", "_")[:50]
        if not safe_topic:
            safe_topic = "presentation"

        output_filename = f"{safe_topic}.pptx"
        output_path = settings.DOWNLOADS_DIR / output_filename

        # Export to PPTX
        logger.info(f"Exporting to {output_path}")
        await export_slides(json_path, str(output_path))

        logger.info("✓ Export complete!")

        # Return download URL
        return {
            "download_url": f"/downloads/{output_filename}",
            "filename": output_filename,
        }

    except Exception as e:
        logger.error(str(e))
        raise HTTPException(status_code=500, detail="Oops! Something went wrong on our end.")

    finally:
        if json_path and os.path.exists(json_path):
            try:
                os.unlink(json_path)
                logger.debug(f"Cleaned up temporary file: {json_path}")
            except Exception:
                logger.debug(f"Failed to clean up temporary file: {json_path}")


@router.post("/export-pdf")
async def export_pdf(request: FullDeckExportRequest):
    """
    Export a user-edited slide deck to a PDF file.

    Request JSON: Same as export-pptx
    Response JSON: {"download_url": str, "filename": str}
    """
    json_path = None

    try:
        logger.info(f"\nStarting PDF export for topic='{request.topic}'")

        logger.info("Fetching images...")
        image_fetcher = ImageFetcher()

        # Create a list of async tasks for image fetching
        tasks = []
        for slide in request.slides:
            tasks.append(image_fetcher.fetch_image_url(slide.image_prompt))

        # Run tasks concurrently
        image_urls = await asyncio.gather(*tasks)

        logger.info(f"Exporting deck to PDF with {len(request.slides)} slides")

        # Prepare data for export
        deck_data = {
            "title": request.topic,
            "subtitle": f"For {request.audience}",
            "slides": [],
        }

        for i, slide in enumerate(request.slides):
            slide_data = {
                "title": slide.title,
                "summary": slide.summary,
                "bullets": slide.bullets,
                "image_prompt": slide.image_prompt,
                "image_url": image_urls[i],
                # Notes are ignored in PDF as per user feedback
                "theme": slide.theme,
            }
            deck_data["slides"].append(slide_data)

        # Create temporary JSON file
        with tempfile.NamedTemporaryFile(
            mode="w", delete=False, suffix=".json", encoding="utf-8"
        ) as tmp_json:
            json_path = tmp_json.name
            json.dump(deck_data, tmp_json, indent=2)

        # Generate filename
        safe_topic = "".join(c for c in request.topic if c.isalnum() or c in (" ", "-", "_")).strip()
        safe_topic = safe_topic.replace(" ", "_")[:50]
        if not safe_topic:
            safe_topic = "presentation"

        output_filename = f"{safe_topic}.pdf"
        output_path = settings.DOWNLOADS_DIR / output_filename

        # Export to PDF
        logger.info(f"Exporting to {output_path}")
        await export_deck_to_pdf(json_path, str(output_path))

        logger.info("✓ PDF Export complete!")

        # Return download URL
        return {
            "download_url": f"/downloads/{output_filename}",
            "filename": output_filename,
        }

    except Exception as e:
        logger.error(str(e))
        raise HTTPException(
            status_code=500, detail="Oops! Something went wrong on our end during PDF export."
        )

    finally:
        if json_path and os.path.exists(json_path):
            try:
                os.unlink(json_path)
                logger.debug(f"Cleaned up temporary file: {json_path}")
            except Exception:
                logger.debug(f"Failed to clean up temporary file: {json_path}")


@router.get("/health")
def health_check():
    """Health check endpoint."""
    files = list(settings.DOWNLOADS_DIR.glob("*.pptx"))
    return {
        "status": "ok",
        "downloads_dir": str(settings.DOWNLOADS_DIR),
        "downloads_exists": settings.DOWNLOADS_DIR.exists(),
        "pptx_files": [f.name for f in files],
        "file_count": len(files),
    }
