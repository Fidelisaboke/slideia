'use client';

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
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
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
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Presentation Ready!
        </h2>
        <p className="text-gray-600">
          Your presentation on <span className="font-semibold">{topic}</span> has been
          generated successfully.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleDownload}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-md transition duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
        >
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
          Download PowerPoint
        </button>

        <button
          onClick={onReset}
          className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-md transition duration-200 ease-in-out"
        >
          Create Another Presentation
        </button>
      </div>

      <div className="mt-6 p-4 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-xs text-gray-600 mb-2">Download URL:</p>
        <code className="text-xs text-blue-600 break-all">{pptxUrl}</code>
      </div>
    </div>
  );
}
