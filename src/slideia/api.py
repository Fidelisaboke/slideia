"""
api.py
FastAPI app exposing LLM generation endpoints for slideia.
"""
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from slideia.llm import propose_outline

app = FastAPI(title="slideia LLM API")

class OutlineRequest(BaseModel):
    topic: str
    audience: str
    tone: str
    slides: int

@app.post("/generate_outline")
def generate_outline(request: OutlineRequest):
    """
    Generate a slide outline using the LLM integration.
    """
    try:
        result = propose_outline(
            topic=request.topic,
            audience=request.audience,
            tone=request.tone,
            slides=request.slides
        )
        return result
    except NotImplementedError as e:
        raise HTTPException(status_code=500, detail=str(e))
