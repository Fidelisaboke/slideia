'use client';

import { ProposeOutlineResponse } from '@/types/api';

interface OutlineViewProps {
  outline: ProposeOutlineResponse;
  topic: string;
  audience: string;
  tone: string;
  slideCount: number;
  onGenerate: () => void;
  isGenerating: boolean;
}

export default function OutlineView({
  outline,
  topic,
  audience,
  tone,
  slideCount,
  onGenerate,
  isGenerating,
}: OutlineViewProps) {
  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {outline.title}
        </h2>
        <span className="text-sm text-gray-500">
          {slideCount} slides
        </span>
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200 space-y-2">
        <div>
          <p className="text-xs text-gray-600 font-medium">Topic:</p>
          <p className="text-sm text-gray-800">{topic}</p>
        </div>
        <div className="flex gap-4">
          <>
            <p className="text-xs text-gray-600 font-medium">Audience:</p>
            <p className="text-sm text-gray-800">{audience}</p>
          </>
          <>
            <p className="text-xs text-gray-600 font-medium">Tone:</p>
            <p className="text-sm text-gray-800 capitalize">{tone}</p>
          </>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {outline.slides.map((slide, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 rounded-md border border-gray-200 hover:border-blue-300 transition"
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm mr-3">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-1">
                  {slide.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {slide.summary}
                </p>
                {slide.citations && slide.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500 font-medium mb-1">
                      Sources:
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {slide.citations.map((citation, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-1">•</span>
                          <span>{citation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-md transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {isGenerating ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 mr-3"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Generating Full Deck...
          </span>
        ) : (
          '✨ Generate Complete Deck'
        )}
      </button>
    </div>
  );
}
