from dataclasses import dataclass


@dataclass
class Slide:
    bullets: list[str]
    title: str | None = None
    notes: str | None = None
    image_prompt: str | None = None
    theme: dict | None = None


@dataclass
class Deck:
    outline: dict
    slides: list[Slide]
    palette: list[str] | None = None
    font: str | None = None

    def to_dict(self) -> dict:
        return {
            "outline": self.outline,
            "palette": self.palette,
            "font": self.font,
            "slides": [
                {
                    "title": slide.title,
                    "bullets": slide.bullets,
                    "notes": slide.notes,
                    "image_prompt": slide.image_prompt,
                    "theme": slide.theme,
                }
                for slide in self.slides
            ],
        }
