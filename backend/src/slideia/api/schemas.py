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
