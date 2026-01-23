"""Cache utility for Slideia."""

import hashlib
import json
import os
from copy import deepcopy
from datetime import datetime, timedelta

import redis
from dotenv import load_dotenv
from slideia.core.logging import get_logger

load_dotenv()


logger = get_logger(__name__)


class RedisCache:
    """
    Redis-backed cache with TTL.
    This implementation is used in production.
    """

    def __init__(self):
        redis_url = os.getenv("REDIS_URL")
        if not redis_url:
            raise RuntimeError("REDIS_URL is not set")

        self._ttl_seconds = int(os.getenv("CACHE_TTL_MINUTES", "60")) * 60
        self._client = redis.from_url(redis_url, decode_responses=True)

    def _generate_key(
        self, topic: str, audience: str, tone: str, slide_count: int
    ) -> str:
        raw = f"{topic}|{audience}|{tone}|{slide_count}"
        return f"deck:{hashlib.md5(raw.encode()).hexdigest()}"

    def get(
        self, topic: str, audience: str, tone: str, slide_count: int
    ) -> dict | None:
        key = self._generate_key(topic, audience, tone, slide_count)
        try:
            value = self._client.get(key)
            if value is None:
                logger.info(f"MISS {key[:12]}...")
                return None

            logger.info(f"HIT {key[:12]}...")
            return json.loads(value)
        except (redis.exceptions.RedisError, json.JSONDecodeError) as e:
            logger.error(f"GET Error for key {key[:12]}...: {e}")
            return None

    def set(
        self,
        topic: str,
        audience: str,
        tone: str,
        slide_count: int,
        data: dict,
    ):
        key = self._generate_key(topic, audience, tone, slide_count)

        try:
            self._client.setex(
                key,
                self._ttl_seconds,
                json.dumps(data),
            )

            logger.info(f"SET {key[:12]}... (ttl={self._ttl_seconds}s)")
        except redis.exceptions.RedisError as e:
            logger.error(f"SET Error for key {key[:12]}...: {e}")

    def clear(self):
        for key in self._client.scan_iter(match="deck:*"):
            self._client.delete(key)
        logger.info("CLEARED cache keys")


class Cache:
    """
    Simple in-memory cache with expiration.
    NOTE: This is deprecated and `RedisCache` is to be used instead in production.
    """

    def __init__(self, ttl_minutes: int = 60):
        self._cache: dict[str, tuple] = {}  # key -> (data, expiry_time)
        self._ttl_minutes = ttl_minutes

    def _generate_key(
        self, topic: str, audience: str, tone: str, slide_count: int
    ) -> str:
        """Generate cache key from request parameters."""
        data = f"{topic}|{audience}|{tone}|{slide_count}"
        return hashlib.md5(data.encode()).hexdigest()

    def get(
        self, topic: str, audience: str, tone: str, slide_count: int
    ) -> dict | None:
        """Get cached data if it exists and hasn't expired."""
        key = self._generate_key(topic, audience, tone, slide_count)

        if key in self._cache:
            data, expiry = self._cache[key]
            if datetime.now() < expiry:
                logger.info(f"HIT for key {key[:8]}...")
                return deepcopy(data)
            else:
                logger.info(f"EXPIRED for key {key[:8]}...")
                del self._cache[key]

        logger.info(f"MISS for key {key[:8]}...")
        return None

    def set(self, topic: str, audience: str, tone: str, slide_count: int, data: dict):
        """Store data in cache with expiration."""
        key = self._generate_key(topic, audience, tone, slide_count)
        expiry = datetime.now() + timedelta(minutes=self._ttl_minutes)
        self._cache[key] = (data, expiry)
        logger.info(
            f"SET for key {key[:8]}... (expires in {self._ttl_minutes}m)",
        )

    def clear(self):
        """Clear all cached data."""
        self._cache.clear()
        logger.info("CLEARED cache keys")
