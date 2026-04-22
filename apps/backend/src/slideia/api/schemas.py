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
    palette: list[str] | None = None
    font: str | None = None
