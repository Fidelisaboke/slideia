import {
    GenerateDeckRequest,
    GenerateDeckResponse,
    ProposeOutlineRequest,
    ProposeOutlineResponse,
    ExportPptxRequest,
    ExportPptxResponse,
    ApiError,
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;

        const response = fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        })
        .then(async (res) => {
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(
                    errorData.message || `API request failed: ${res.statusText}`
                );
            }
            return res.json();
        })
        .catch((error) => {
            if (error instanceof Error) {
                throw new Error(`Network error: ${error.message}`);
            }
            throw new Error('An unexpected error occurred');
        });

        return response;
    };

    async proposeOutline(
        data: ProposeOutlineRequest
    ): Promise<ProposeOutlineResponse> {
        return this.request<ProposeOutlineResponse>('/propose-outline', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    };

    async generateDeck(
        data: GenerateDeckRequest
    ): Promise<GenerateDeckResponse> {
        return this.request<GenerateDeckResponse>('/generate-deck', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    };

    async exportPptx(
        data: ExportPptxRequest
    ): Promise<ExportPptxResponse> {
        return this.request<ExportPptxResponse>('/export-pptx', {
            method: 'POST',
            body: JSON.stringify(data),
        })
    }

    getDownloadUrl(downloadPath: string): string {
        return `${this.baseUrl}${downloadPath}`
    }
}

export const apiClient = new ApiClient(API_BASE_URL);
