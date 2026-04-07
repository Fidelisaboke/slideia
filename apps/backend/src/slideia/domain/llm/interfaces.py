from abc import ABC, abstractmethod
from typing import Dict


class OutlineGenerator(ABC):
    """Contract for proposing slide outlines."""

    @abstractmethod
    def propose_outline(
        self,
        topic: str,
        audience: str,
        tone: str,
        slide_count: int,
    ) -> Dict:
        """Return a structured outline as a dict."""
        pass


class SlideGenerator(ABC):
    """Contract for drafting slide content."""

    @abstractmethod
    def draft_slide(self, slide_spec: Dict) -> Dict:
        """Return drafted slide content."""
        pass
