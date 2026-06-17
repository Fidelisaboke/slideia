from dataclasses import dataclass


@dataclass
class Slide:
    bullets: list[str]
    title: str | None = None
    notes: str | None = None
    image_prompt: str | None = None
    theme: dict | None = None
    layout: str = "bullets"
    statement: str | None = None
    big_number: str | None = None
    big_number_context: str | None = None


@dataclass
class Deck:
    outline: dict
    slides: list[Slide]
    palette: list[str] | None = None
    font: str | None = None
    citations: list[str] | None = None

    def to_dict(self) -> dict:
        return {
            "outline": self.outline,
            "palette": self.palette,
            "font": self.font,
            "citations": self.citations,
            "slides": [
                {
                    "title": slide.title,
                    "bullets": slide.bullets,
                    "notes": slide.notes,
                    "image_prompt": slide.image_prompt,
                    "theme": slide.theme,
                    "layout": slide.layout,
                    "statement": slide.statement,
                    "big_number": slide.big_number,
                    "big_number_context": slide.big_number_context,
                }
                for slide in self.slides
            ],
        }
