import {
  GenerateDeckRequest,
  GenerateDeckResponse,
  ProposeOutlineRequest,
  ProposeOutlineResponse,
  ExportPptxRequest,
  ExportPptxResponse,
  RegenerateSlideRequest,
  RegenerateSlideResponse,
  FullDeckExportRequest,
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

async function request<T>(
  endpoint: string,
  options: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || `API request failed: ${response.statusText}`
    );
  }

  return response.json();
}

export const apiClient = {
  async proposeOutline(data: ProposeOutlineRequest): Promise<ProposeOutlineResponse> {
    return request<ProposeOutlineResponse>('/propose-outline', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async generateDeck(data: GenerateDeckRequest): Promise<GenerateDeckResponse> {
    return request<GenerateDeckResponse>('/generate-deck', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async regenerateSlide(data: RegenerateSlideRequest): Promise<RegenerateSlideResponse> {
    return request<RegenerateSlideResponse>('/regenerate-slide', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async exportPptx(data: ExportPptxRequest | FullDeckExportRequest): Promise<ExportPptxResponse> {
    return request<ExportPptxResponse>('/export-pptx', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async exportPdf(data: FullDeckExportRequest): Promise<ExportPptxResponse> {
    return request<ExportPptxResponse>('/export-pdf', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getDownloadUrl(downloadPath: string): string {
    return `${API_BASE_URL}${downloadPath}`;
  },
};
