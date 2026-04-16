"use client";

import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

export default function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-6">
      <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start">
        <AlertCircle className="w-5 h-5 text-destructive mr-3 shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-destructive mb-1">Error</h3>
          <p className="text-sm text-destructive/80">{message}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-destructive/40 hover:text-destructive ml-4 shrink-0 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
