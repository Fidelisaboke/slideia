"""
FastAPI app exposing LLM generation endpoints for slideia.
"""

import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from slideia.api.routes import router as api_router
from slideia.core.config import settings
from slideia.core.logging import setup_logging

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for FastAPI app."""
    setup_logging()
    yield


app = FastAPI(title="slideia API", version="0.4.0", lifespan=lifespan)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_FRONTEND_URL", "")],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the downloads directory
settings.DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount(
    "/api/v1/downloads",
    StaticFiles(directory=str(settings.DOWNLOADS_DIR)),
    name="downloads",
)

app.include_router(api_router, prefix="/api/v1")
