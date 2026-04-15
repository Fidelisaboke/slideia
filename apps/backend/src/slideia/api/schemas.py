from pydantic import BaseModel


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


class ExportResponse(BaseModel):
    download_url: str
    filename: str


# ── Slide Regeneration ────────────────────────────────────────────────


class RegenerateSlideRequest(BaseModel):
    """Request body for regenerating a single slide's content."""

    title: str
    summary: str
    instruction: str | None = None


# ── Full Deck Export (user-edited state) ──────────────────────────────


class SlideExportItem(BaseModel):
    """A single slide's data as edited by the user."""

    title: str
    summary: str
    bullets: list[str]
    notes: str = ""
    image_prompt: str = ""
    theme: dict | None = None


class FullDeckExportRequest(BaseModel):
    """Request body for exporting a user-edited deck to PowerPoint."""

    topic: str
    audience: str
    slides: list[SlideExportItem]
