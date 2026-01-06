export interface ProposeOutlineRequest {
    topic: string;
    audience: string;
    tone: string;
    slide_count: number;
}

export interface ProposeOutlineResponse {
    title: string;
    slides: Array<{
        title: string;
        summary: string;
        citations?: string[];
    }>;
}

export interface GenerateDeckRequest {
    topic: string;
    audience: string;
    tone: string;
    slide_count: number;
}

export interface GenerateDeckResponse {
    outline: ProposeOutlineResponse;
    slides: Array<{
        bullets: string[];
        notes: string;
        image_prompt: string;
    }>;
}

export interface ApiError {
    error: string;
    message?: string;
}