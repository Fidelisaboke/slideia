import {
  GenerateDeckRequest,
  GenerateDeckResponse,
  ProposeOutlineRequest,
  ProposeOutlineResponse,
  ExportPptxResponse,
  RegenerateSlideRequest,
  RegenerateSlideResponse,
  FullDeckExportRequest,
  GenerationProgressEvent,
} from "@/types/api";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

async function request<T>(endpoint: string, options: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `API request failed: ${response.statusText}`,
    );
  }

  return response.json();
}

/**
 * Generic SSE stream reader for internal slideia events.
 */
async function streamEvents(
  endpoint: string,
  data: unknown,
  onProgress: (event: GenerationProgressEvent) => void,
  abortController?: AbortController,
): Promise<void> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    signal: abortController?.signal,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `Streaming request failed: ${response.statusText}`,
    );
  }

  if (!response.body) {
    throw new Error("Response body is null");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");

    // Keep the last partial line in the buffer
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;

      const jsonStr = trimmed.slice(6);
      let event: GenerationProgressEvent;

      try {
        event = JSON.parse(jsonStr);
      } catch (err) {
        console.warn("Failed to parse SSE event JSON:", err, trimmed);
        continue;
      }

      // Call onProgress OUTSIDE the catch block so errors propagate correctly
      onProgress(event);
    }
  }
}

export const apiClient = {
  async proposeOutline(
    data: ProposeOutlineRequest,
  ): Promise<ProposeOutlineResponse> {
    return request<ProposeOutlineResponse>("/propose-outline", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async proposeOutlineStream(
    data: ProposeOutlineRequest,
    onProgress: (event: GenerationProgressEvent) => void,
    abortController?: AbortController,
  ): Promise<void> {
    return streamEvents(
      "/propose-outline/stream",
      data,
      onProgress,
      abortController,
    );
  },

  async generateDeck(data: GenerateDeckRequest): Promise<GenerateDeckResponse> {
    return request<GenerateDeckResponse>("/generate-deck", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async generateDeckStream(
    data: GenerateDeckRequest,
    onProgress: (event: GenerationProgressEvent) => void,
    abortController?: AbortController,
  ): Promise<void> {
    return streamEvents(
      "/generate-deck/stream",
      data,
      onProgress,
      abortController,
    );
  },

  async regenerateSlide(
    data: RegenerateSlideRequest,
  ): Promise<RegenerateSlideResponse> {
    return request<RegenerateSlideResponse>("/regenerate-slide", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async exportPptx(data: FullDeckExportRequest): Promise<ExportPptxResponse> {
    return request<ExportPptxResponse>("/export-pptx", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async exportPdf(data: FullDeckExportRequest): Promise<ExportPptxResponse> {
    return request<ExportPptxResponse>("/export-pdf", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getDownloadUrl(downloadPath: string): string {
    return `${API_BASE_URL}${downloadPath}`;
  },
};
