'use client';

import { useState } from 'react';
import { GenerateDeckResponse } from '@/types/api';
import { apiClient } from '@/lib/apiClient';

interface DeckViewProps {
  deck: GenerateDeckResponse;
  topic: string;
  audience: string;
  tone: string;
  slideCount: number;
  onReset: () => void;
}

export default function DeckView({
  deck, topic, audience, tone, slideCount, onReset
}: DeckViewProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportPptx = async() => {
    setIsExporting(true);
    setExportError(null);

    try {
      const response = await apiClient.exportPptx({
        topic,
        audience,
        tone,
        slide_count: slideCount,
      });

      const downloadUrl = apiClient.getDownloadUrl(response.download_url);
      window.open(downloadUrl, '_blank');
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'Failed to export PowerPoint. Please try again.'
      );
    } finally {
      setIsExporting(false);
    }
  }


  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <svg
            className="w-8 h-8 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          {deck.outline.title}
        </h2>
        <p className="text-gray-600">
          Your presentation on <span className="font-semibold">{topic}</span> has been
          generated successfully.
        </p>
      </div>

      {/* Export Error Alert */}
      {exportError && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
          <svg
            className="w-5 h-5 text-red-600 mr-3 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <p className="text-sm text-red-700">{exportError}</p>
          </div>
          <button
            onClick={() => setExportError(null)}
            className="text-red-400 hover:text-red-600 ml-4"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Slides Preview */}
      <div className="space-y-6 mb-6">
        {deck.slides.map((slide, index) => (
          <div
            key={index}
            className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-gray-200 hover:border-blue-300 transition"
          >
            <div className="flex items-start mb-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-base mr-4">
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-1">
                  {deck.outline.slides[index].title}
                </h3>
                <p className="text-sm text-gray-600">
                  {deck.outline.slides[index].summary}
                </p>
              </div>
            </div>

            {/* Bullet Points */}
            <div className="ml-14 mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Key Points:
              </h4>
              <ul className="space-y-2">
                {slide.bullets.map((bullet, bulletIdx) => (
                  <li
                    key={bulletIdx}
                    className="flex items-start text-gray-700"
                  >
                    <span className="text-blue-600 mr-2 mt-1">▪</span>
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Speaker Notes */}
            {slide.notes && (
              <div className="ml-14 mb-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Speaker Notes:
                </h4>
                <p className="text-xs text-gray-600">{slide.notes}</p>
              </div>
            )}

            {/* Image Prompt */}
            {slide.image_prompt && (
              <div className="ml-14 p-3 bg-purple-50 rounded-md border border-purple-200">
                <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center">
                  <svg
                    className="w-4 h-4 mr-1 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Suggested Image:
                </h4>
                <p className="text-xs text-gray-600 italic">{slide.image_prompt}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleExportPptx}
          disabled={isExporting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-md transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
        >
          {isExporting ? (
            <>
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
              Exporting...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export to PowerPoint
            </>
          )}
        </button>
        <button
          onClick={onReset}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
        >
          Create Another Presentation
        </button>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: Click "Export to PowerPoint" to download your presentation as a .pptx file
          </p>
        </div>
      </div>
    </div>
  );
}
