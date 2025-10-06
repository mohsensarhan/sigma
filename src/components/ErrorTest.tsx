import { useState } from 'react';

export function ErrorTest() {
  const [shouldError, setShouldError] = useState(false);

  if (shouldError) {
    throw new Error('Test error from ErrorTest component');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md w-full border border-white/20">
        <h2 className="text-2xl font-bold text-white mb-4">Error Boundary Test</h2>
        <p className="text-gray-300 mb-6">
          Click the button below to trigger a test error and verify that the error boundary catches it properly.
        </p>
        <button
          onClick={() => setShouldError(true)}
          className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
        >
          Trigger Test Error
        </button>
      </div>
    </div>
  );
}