from dataclasses import dataclass


@dataclass
class Slide:
    title: str
    bullets: list[str]
    notes: str | None = None
    image_prompt: str | None = None
    theme: dict | None = None


@dataclass
class Deck:
    outline: dict
    slides: list[Slide]

    def to_dict(self) -> dict:
        return {
            "outline": self.outline,
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
