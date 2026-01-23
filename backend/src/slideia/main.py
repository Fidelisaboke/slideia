"""
FastAPI app exposing LLM generation endpoints for slideia.
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from slideia.api.routes import router as api_router
from slideia.core.config import settings

load_dotenv()

app = FastAPI(title="slideia API", version="0.4.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("NEXT_FRONTEND_URL", "")],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount the downloads directory
app.mount("/api/v1/downloads", StaticFiles(directory=str(settings.DOWNLOADS_DIR)), name="downloads")

app.include_router(api_router, prefix="/api/v1")
