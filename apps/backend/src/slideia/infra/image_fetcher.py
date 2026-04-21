import logging

import httpx
from slideia.core.config import settings

logger = logging.getLogger(__name__)


class ImageFetcher:
    def __init__(self):
        self.unsplash_url = "https://api.unsplash.com/search/photos"
        self.unsplash_headers = {
            "Authorization": f"Client-ID {settings.UNSPLASH_ACCESS_KEY}",
            "Accept-Version": "v1",
        }

    async def fetch_image_url(self, query: str) -> str | None:
        """
        Searches for an image and returns the URL.
        """
        if not query:
            return None

        # Try Unsplash first
        if settings.UNSPLASH_ACCESS_KEY:
            url = await self._fetch_unsplash_url(query)
            if url:
                return url

        # TODO: Fallback to AI image generation once implemented

        return None

    async def _fetch_unsplash_url(self, query: str) -> str | None:
        params = {
            "query": query,
            "per_page": 1,
            "orientation": "landscape",
            "content_filter": "high",
        }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(self.unsplash_url, headers=self.unsplash_headers, params=params)

                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    if results:
                        return results[0]["urls"]["regular"]
                else:
                    logger.warning(f"Unsplash API Error: {response.status_code}")
        except Exception as e:
            logger.error(f"Failed to fetch Unsplash image for query '{query}': {e}")

        return None

    async def generate_image(self, prompt: str) -> str | None:
        """
        Generates an image using an Image Generator model.
        TODO: Implement image generation.
        """
        return None

    async def download_image(self, url: str) -> bytes | None:
        """Downloads the actual image bytes to embed in PPTX."""
        if not url:
            return None

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    return response.content
        except Exception as e:
            logger.error(f"Failed to download image from {url}: {e}")

        return None
