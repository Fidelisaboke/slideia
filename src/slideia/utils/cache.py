"""Cache utility for Slideia."""

import hashlib
import os
import sys
from copy import deepcopy
from datetime import datetime, timedelta
import redis
import json


class RedisCache:
    """
    Redis-backed cache wth TTL.
    This implementation is used in production.
    """

    def __init__(self):
        self._ttl_seconds = int(os.getenv("CACHE_TTL_MINUTES", "60")) * 60
        self._client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", "6379")),
            decode_responses=True,
        )

    def _generate_key(
        self, topic: str, audience: str, tone: str, slide_count: int
    ) -> str:
        raw = f"{topic}|{audience}|{tone}|{slide_count}"
        return f"deck:{hashlib.md5(raw.encode()).hexdigest()}"

    def get(
        self, topic: str, audience: str, tone: str, slide_count: int
    ) -> dict | None:
        key = self._generate_key(topic, audience, tone, slide_count)

        value = self._client.get(key)
        if value is None:
            print(f"[REDIS] MISS {key[:12]}...", file=sys.stderr)
            return None

        print(f"[REDIS] HIT {key[:12]}...", file=sys.stderr)
        return json.loads(value)

    def set(
        self,
        topic: str,
        audience: str,
        tone: str,
        slide_count: int,
        data: dict,
    ):
        key = self._generate_key(topic, audience, tone, slide_count)

        self._client.setex(
            key,
            self._ttl_seconds,
            json.dumps(data),
        )

        print(
            f"[REDIS] SET {key[:12]}... (ttl={self._ttl_seconds}s)",
            file=sys.stderr,
        )

    def clear(self):
        self._client.flushdb()
        print("[REDIS] CLEARED", file=sys.stderr)


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
                print(f"[CACHE] HIT for key {key[:8]}...", file=sys.stderr)
                return deepcopy(data)
            else:
                print(f"[CACHE] EXPIRED for key {key[:8]}...", file=sys.stderr)
                del self._cache[key]

        print(f"[CACHE] MISS for key {key[:8]}...", file=sys.stderr)
        return None

    def set(self, topic: str, audience: str, tone: str, slide_count: int, data: dict):
        """Store data in cache with expiration."""
        key = self._generate_key(topic, audience, tone, slide_count)
        expiry = datetime.now() + timedelta(minutes=self._ttl_minutes)
        self._cache[key] = (data, expiry)
        print(
            f"[CACHE] SET for key {key[:8]}... (expires in {self._ttl_minutes}m)",
            file=sys.stderr,
        )

    def clear(self):
        """Clear all cached data."""
        self._cache.clear()
        print("[CACHE] CLEARED", file=sys.stderr)
