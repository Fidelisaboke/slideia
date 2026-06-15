from enum import StrEnum

from pydantic import BaseModel


class ThemePreset(StrEnum):
    PURPLE_MINT = "Purple Mint"
    CORPORATE_BLUE = "Corporate Blue"
    MODERN_DARK = "Modern Dark"
    DEFAULT = "Default"


class ProposeOutlineRequest(BaseModel):
    topic: str
    audience: str
    tone: str
    slide_count: int
    theme_preset: ThemePreset = ThemePreset.DEFAULT


class DeckRequest(BaseModel):
    topic: str
    audience: str
    tone: str
    slide_count: int
    theme_preset: ThemePreset = ThemePreset.DEFAULT


class ExportResponse(BaseModel):
    download_url: str
    filename: str


class RegenerateSlideRequest(BaseModel):
    """Request body for regenerating a single slide's content."""

    title: str
    summary: str
    instruction: str | None = None
    layout: str = "bullets"


class SlideExportItem(BaseModel):
    """A single slide's data as edited by the user."""

    title: str
    summary: str
    bullets: list[str]
    notes: str = ""
    image_prompt: str = ""
    theme: dict | None = None
    layout: str = "bullets"
    statement: str | None = None
    big_number: str | None = None
    big_number_context: str | None = None
    column_left_title: str | None = None
    column_left: list[str] | None = None
    column_right_title: str | None = None
    column_right: list[str] | None = None
    steps: list[str] | None = None
    quote_text: str | None = None
    quote_attribution: str | None = None


class FullDeckExportRequest(BaseModel):
    """Request body for exporting a user-edited deck to PowerPoint."""

    topic: str
    audience: str
    slides: list[SlideExportItem]
    palette: list[str] | None = None
    font: str | None = None
    citations: list[str] | None = None
