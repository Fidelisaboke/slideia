"use client";

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Palette } from "lucide-react";
import { ThemePreset, THEME_PRESETS } from "@/types/api";

interface ThemeSelectorProps {
  value: ThemePreset;
  onChange: (preset: ThemePreset) => void;
  disabled?: boolean;
}

const PRESET_ORDER: ThemePreset[] = [
  "Purple Mint",
  "Corporate Blue",
  "Modern Dark",
  "Default",
];

export default function ThemeSelector({
  value,
  onChange,
  disabled = false,
}: ThemeSelectorProps) {
  return (
    <div>
      <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-3">
        <Palette className="w-4 h-4 text-primary" />
        Presentation Theme
      </label>

      <div className="grid grid-cols-2 gap-2.5">
        {PRESET_ORDER.map((preset) => {
          const meta = THEME_PRESETS[preset];
          const isSelected = value === preset;

          return (
            <motion.button
              key={preset}
              type="button"
              disabled={disabled}
              onClick={() => onChange(preset)}
              whileHover={disabled ? {} : { scale: 1.02 }}
              whileTap={disabled ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className={[
                "relative text-left rounded-xl border p-3 transition-all duration-200 outline-none group",
                "focus-visible:ring-2 focus-visible:ring-primary/60",
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
                isSelected
                  ? "border-primary/60 bg-primary/5 shadow-md shadow-primary/10"
                  : "border-border hover:border-primary/30 hover:bg-background-subtle",
              ].join(" ")}
            >
              {/* Selected checkmark */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2, type: "spring", bounce: 0.4 }}
                    className="z-10 absolute top-2 right-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mini slide preview */}
              <div
                className="w-full h-14 rounded-md mb-2.5 overflow-hidden relative flex items-end"
                style={{
                  background: meta.dark
                    ? meta.palette[0]
                    : `linear-gradient(135deg, ${meta.palette[0]}18, ${meta.palette[1]}12)`,
                  border: `1px solid ${meta.palette[0]}30`,
                }}
              >
                {/* Simulated title bar */}
                <div
                  className="absolute top-2 left-2 right-6 h-1.5 rounded-full"
                  style={{ background: meta.palette[0], opacity: 0.9 }}
                />
                {/* Simulated bullet lines */}
                <div className="absolute top-5 left-2 space-y-1">
                  <div
                    className="h-1 rounded-full w-16"
                    style={{ background: meta.palette[1], opacity: 0.55 }}
                  />
                  <div
                    className="h-1 rounded-full w-12"
                    style={{ background: meta.palette[1], opacity: 0.35 }}
                  />
                </div>
                {/* Accent swatch corner */}
                <div
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-tl-lg"
                  style={{ background: meta.palette[2], opacity: 0.7 }}
                />
              </div>

              {/* Palette swatches */}
              <div className="flex gap-1 mb-1.5">
                {meta.palette.map((color, i) => (
                  <span
                    key={i}
                    className="inline-block w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                    style={{ background: color }}
                  />
                ))}
              </div>

              {/* Labels */}
              <p
                className={`text-xs font-semibold leading-tight ${
                  isSelected ? "text-primary" : "text-foreground"
                }`}
              >
                {meta.label}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-1">
                {meta.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      {/* Active theme font hint */}
      <AnimatePresence mode="wait">
        <motion.p
          key={value}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.2 }}
          className="mt-2 text-[11px] text-muted-foreground/70 flex items-center gap-1"
        >
          <span className="opacity-60">Font:</span>
          <span className="font-medium text-muted-foreground">
            {THEME_PRESETS[value].font}
          </span>
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
