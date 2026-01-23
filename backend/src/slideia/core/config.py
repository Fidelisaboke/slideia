from pathlib import Path

from pydantic import ConfigDict
from pydantic_settings import BaseSettings
from slideia.core.paths import DOWNLOADS_DIR, ENV_FILE


class Settings(BaseSettings):
    ENV: str = "development"
    NEXT_FRONTEND_URL: str = "http://localhost:3000"
    OPENROUTER_API_KEY: str
    OPENROUTER_MODEL: str = "xiaomi/mimo-v2-flash:free"
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL_SECONDS: int = 3600
    DOWNLOADS_DIR: Path = DOWNLOADS_DIR

    model_config = ConfigDict(
        env_file=ENV_FILE, env_file_encoding="utf-8", case_sensitive=True
    )


settings = Settings()
