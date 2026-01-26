from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict
from slideia.core.paths import DOWNLOADS_DIR, ENV_FILE


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=ENV_FILE, env_file_encoding="utf-8", case_sensitive=True
    )

    ENV: str = "development"
    NEXT_FRONTEND_URL: str = "http://localhost:3000"
    OPENROUTER_API_KEY: str
    OPENROUTER_MODEL: str = "xiaomi/mimo-v2-flash:free"
    REDIS_URL: str = "redis://localhost:6379"
    CACHE_TTL_SECONDS: int = 3600
    DOWNLOADS_DIR: Path = DOWNLOADS_DIR
    LOG_LEVEL: str = "INFO"
    UNSPLASH_ACCESS_KEY: str


settings = Settings()
