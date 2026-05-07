export type ThemePreset =
  | "Purple Mint"
  | "Corporate Blue"
  | "Modern Dark"
  | "Default";

export interface ThemePresetMeta {
  label: string;
  palette: string[]; // primary, secondary, accent
  font: string;
  description: string;
  dark?: boolean; // needs dark background in preview
}

export const THEME_PRESETS: Record<ThemePreset, ThemePresetMeta> = {
  "Purple Mint": {
    label: "Purple Mint",
    palette: ["#7c5cca", "#14b8a6", "#a78bfa"],
    font: "Inter",
    description: "Modern & vibrant — our signature theme",
  },
  "Corporate Blue": {
    label: "Corporate Blue",
    palette: ["#1e40af", "#3b82f6", "#93c5fd"],
    font: "Calibri",
    description: "Professional & clean — ideal for business",
  },
  "Modern Dark": {
    label: "Modern Dark",
    palette: ["#0f172a", "#6366f1", "#e2e8f0"],
    font: "Aptos Display",
    description: "Bold & dramatic — high-contrast dark style",
    dark: true,
  },
  Default: {
    label: "Default",
    palette: ["#1a1a1a", "#444444", "#888888"],
    font: "Calibri",
    description: "Clean & neutral — PowerPoint defaults",
  },
};

export interface ProposeOutlineRequest {
  topic: string;
  audience: string;
  tone: string;
  slide_count: number;
  theme_preset?: ThemePreset;
}

export interface ProposeOutlineResponse {
  title: string;
  slides: Array<{
    title: string;
    summary: string;
    citations?: string[];
  }>;
  palette?: string[];
  font?: string;
}

export interface GenerateDeckRequest {
  topic: string;
  audience: string;
  tone: string;
  slide_count: number;
  theme_preset?: ThemePreset;
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
  palette?: string[];
  font?: string;
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
