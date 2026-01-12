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

function TopicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
    </svg>
  );
}

function AudienceIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
    </svg>
  );
}

function ToneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="p-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-200 text-blue-700 font-bold text-xs mr-2">
              <TopicIcon />
            </span>
            <div>
              <span className="text-xs text-gray-500 font-medium">Topic</span>
              <div className="text-sm text-gray-800 font-semibold truncate max-w-xs" title={topic}>{topic}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-200 text-green-700 font-bold text-xs mr-2">
              <AudienceIcon />
            </span>
            <div>
              <span className="text-xs text-gray-500 font-medium">Audience</span>
              <div className="text-sm text-gray-800 font-semibold truncate max-w-xs" title={audience}>{audience}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="p-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-200 text-yellow-700 font-bold text-xs mr-2">
              <ToneIcon />
            </span>
            <div>
              <span className="text-xs text-gray-500 font-medium">Tone</span>
              <div className="text-sm text-gray-800 font-semibold capitalize truncate max-w-xs" title={tone}>{tone}</div>
            </div>
          </div>
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
