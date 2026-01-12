'use client';

import { useState } from 'react';

interface SlideFormProps {
    onSubmit: (data: {
        topic: string;
        audience: string;
        tone: string;
        slideCount: number;
    }) => void;
    isLoading: boolean;
}

export default function SlideForm({ onSubmit, isLoading }: SlideFormProps) {
    const [topic, setTopic] = useState('');
    const [audience, setAudience] = useState('');
    const [tone, setTone] = useState('');
    const [slideCount, setSlideCount] = useState(5);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (topic.trim() && audience.trim()) {
            onSubmit({ topic, audience, tone, slideCount});
        }
    };

return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Create Your Presentation
      </h2>
      
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="topic"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Presentation Topic *
          </label>
          <input
            id="topic"
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Climate Change Solutions"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label
            htmlFor="audience"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Target Audience *
          </label>
          <input
            id="audience"
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g., Business executives, Students, General public"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
            disabled={isLoading}
            required
          />
        </div>

        <div>
          <label
            htmlFor="tone"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Presentation Tone
          </label>
          <select
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition bg-white"
            disabled={isLoading}
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="academic">Academic</option>
            <option value="persuasive">Persuasive</option>
            <option value="informative">Informative</option>
            <option value="inspirational">Inspirational</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="slideCount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Number of Slides: {slideCount}
          </label>
          <input
            id="slideCount"
            type="range"
            min="3"
            max="20"
            value={slideCount}
            onChange={(e) => setSlideCount(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>3</span>
            <span>20</span>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isLoading || !topic.trim() || !audience.trim()}
          className="w-full enabled:bg-gradient-to-r enabled:from-blue-600 enabled:to-purple-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-md transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
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
              Processing...
            </span>
          ) : (
            'Generate Outline'
          )}
        </button>
      </form>
    </div>
  );
}