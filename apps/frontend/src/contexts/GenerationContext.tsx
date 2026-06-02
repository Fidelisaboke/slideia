"use client";

import { createContext, useCallback, useContext, useState } from "react";

// ── Context ───────────────────────────────────────────────────────────

interface GenerationContextValue {
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
}

const GenerationContext = createContext<GenerationContextValue>({
  isGenerating: false,
  setIsGenerating: () => {},
});

export function useGenerationState() {
  return useContext(GenerationContext);
}

// ── Provider ──────────────────────────────────────────────────────────

export function GenerationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isGenerating, setIsGeneratingRaw] = useState(false);

  const setIsGenerating = useCallback((v: boolean) => {
    setIsGeneratingRaw(v);
  }, []);

  return (
    <GenerationContext.Provider value={{ isGenerating, setIsGenerating }}>
      {children}
    </GenerationContext.Provider>
  );
}
