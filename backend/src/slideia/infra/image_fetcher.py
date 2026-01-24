import logging
import os

import httpx

logger = logging.getLogger(__name__)

UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY")


class ImageFetcher:
    def __init__(self):
        self.base_url = "https://api.unsplash.com/search/photos"
        self.headers = {
            "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}",
            "Accept-Version": "v1",
        }

    async def fetch_image_url(self, query: str) -> str | None:
        """
        Searches for an image and returns the URL.
        Returns None if no image found or API fails.
        """
        if not query or not UNSPLASH_ACCESS_KEY:
            return None

        params = {
            "query": query,
            "per_page": 1,
            "orientation": "landscape",
            "content_filter": "high",
        }

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(
                    self.base_url, headers=self.headers, params=params
                )

                if response.status_code == 200:
                    data = response.json()
                    results = data.get("results", [])
                    if results:
                        # Get the 'regular' size URL (good balance of quality/size)
                        return results[0]["urls"]["regular"]
                else:
                    logger.warning(f"Unsplash API Error: {response.status_code}")

        except Exception as e:
            logger.error(f"Failed to fetch image for query '{query}': {e}")

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
