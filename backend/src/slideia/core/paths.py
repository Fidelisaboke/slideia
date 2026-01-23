from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]  # backend/src
BACKEND_DIR = BASE_DIR.parent                # backend
DOWNLOADS_DIR = BASE_DIR / "downloads"
ENV_FILE = BACKEND_DIR / ".env"
