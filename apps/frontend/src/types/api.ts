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

export interface SlideContent {
  bullets: string[];
  notes: string;
  image_prompt: string;
  theme?: Record<string, string>;
}

export interface GenerateDeckResponse {
  outline: ProposeOutlineResponse;
  slides: SlideContent[];
}

export interface ExportPptxRequest {
  topic: string;
  audience: string;
  tone: string;
  slide_count: number;
}

export interface ExportPptxResponse {
  download_url: string;
  filename: string;
}

// ── Slide Regeneration ───────────────────────────────────────────────

export interface RegenerateSlideRequest {
  title: string;
  summary: string;
  instruction?: string;
}

export type RegenerateSlideResponse = SlideContent;

// ── Full Deck Export (user-edited state) ─────────────────────────────

export interface SlideExportItem {
  title: string;
  summary: string;
  bullets: string[];
  notes: string;
  image_prompt: string;
  theme?: Record<string, string>;
}

export interface FullDeckExportRequest {
  topic: string;
  audience: string;
  slides: SlideExportItem[];
}

// ── Errors ───────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  message?: string;
}

// ── Streaming Progress ───────────────────────────────────────────────

export interface GenerationProgressEvent {
  step: "outline" | "slide" | "complete" | "error";
  progress: number;
  message: string;
  index?: number;
  total?: number;
  title?: string;
  data?: ProposeOutlineResponse | GenerateDeckResponse;
}
