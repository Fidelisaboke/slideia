'use client';

import { Download, RotateCcw, CheckCircle2 } from 'lucide-react';

interface DownloadReadyProps {
  pptxUrl: string;
  topic: string;
  onReset: () => void;
}

export default function DownloadReady({
  pptxUrl,
  topic,
  onReset,
}: DownloadReadyProps) {
  const handleDownload = () => {
    window.open(pptxUrl, '_blank');
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 glass-panel glow-border rounded-2xl">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-14 h-14
                        rounded-2xl bg-secondary/10 mb-4">
          <CheckCircle2 className="w-7 h-7 text-secondary" />
        </div>
        <h2 className="text-2xl font-bold font-(family-name:--font-sora) text-foreground mb-2">
          Presentation Ready!
        </h2>
        <p className="text-muted-foreground">
          Your presentation on <span className="font-semibold text-foreground">{topic}</span> has been
          generated successfully.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleDownload}
          className="w-full gradient-button text-white font-semibold py-3 px-6 rounded-xl
                     shadow-md shadow-primary/20
                     hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0
                     transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download PowerPoint
        </button>

        <button
          onClick={onReset}
          className="w-full text-muted-foreground hover:text-primary font-medium
                     py-3 px-6 rounded-xl border border-border
                     hover:border-primary/30 hover:bg-primary/5
                     transition-all duration-200 flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Create Another Presentation
        </button>
      </div>

      <div className="mt-6 p-4 bg-background-subtle rounded-xl border border-border">
        <p className="text-xs text-muted-foreground mb-2">Download URL:</p>
        <code className="text-xs text-primary break-all">{pptxUrl}</code>
      </div>
    </div>
  );
}
