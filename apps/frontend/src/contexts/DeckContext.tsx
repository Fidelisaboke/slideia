"use client";

import React, { createContext, useContext, useState } from "react";
import {
  ProposeOutlineResponse,
  GenerateDeckResponse,
  ThemePreset,
} from "@/types/api";

export type Step = "form" | "outline" | "deck";

interface DeckContextValue {
  step: Step;
  setStep: (step: Step) => void;
  topic: string;
  setTopic: (topic: string) => void;
  audience: string;
  setAudience: (audience: string) => void;
  tone: string;
  setTone: (tone: string) => void;
  slideCount: number;
  setSlideCount: (count: number) => void;
  themePreset: ThemePreset;
  setThemePreset: (preset: ThemePreset) => void;
  outline: ProposeOutlineResponse | null;
  setOutline: (outline: ProposeOutlineResponse | null) => void;
  deck: GenerateDeckResponse | null;
  setDeck: (deck: GenerateDeckResponse | null) => void;
  currentSlideIndex: number;
  setCurrentSlideIndex: (index: number) => void;
  resetDeckState: () => void;
}

const DeckContext = createContext<DeckContextValue | undefined>(undefined);

export function DeckProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState<Step>("form");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("Professional");
  const [slideCount, setSlideCount] = useState(5);
  const [themePreset, setThemePreset] = useState<ThemePreset>("Purple Mint");
  const [outline, setOutline] = useState<ProposeOutlineResponse | null>(null);
  const [deck, setDeck] = useState<GenerateDeckResponse | null>(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const resetDeckState = () => {
    setStep("form");
    setTopic("");
    setAudience("");
    setTone("Professional");
    setSlideCount(5);
    setThemePreset("Purple Mint");
    setOutline(null);
    setDeck(null);
    setCurrentSlideIndex(0);
  };

  return (
    <DeckContext.Provider
      value={{
        step,
        setStep,
        topic,
        setTopic,
        audience,
        setAudience,
        tone,
        setTone,
        slideCount,
        setSlideCount,
        themePreset,
        setThemePreset,
        outline,
        setOutline,
        deck,
        setDeck,
        currentSlideIndex,
        setCurrentSlideIndex,
        resetDeckState,
      }}
    >
      {children}
    </DeckContext.Provider>
  );
}

export function useDeck() {
  const context = useContext(DeckContext);
  if (!context) {
    throw new Error("useDeck must be used within a DeckProvider");
  }
  return context;
}
