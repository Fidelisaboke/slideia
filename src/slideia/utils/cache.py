import hashlib
import sys
from datetime import datetime, timedelta


class Cache:
    """Simple in-memory cache with expiration."""

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
                return data
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
