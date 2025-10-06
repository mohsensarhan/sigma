import { AlertTriangle, Home, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  context?: string;
}

export function ErrorFallback({ error, resetError, context }: ErrorFallbackProps) {
  const contextMessages: Record<string, string> = {
    map: 'Unable to load the journey map. This might be due to a network issue or map service unavailability.',
    payment: 'Payment processing encountered an error. Your payment was not processed.',
    sms: 'Unable to load SMS messages. Please check your connection.',
    journey: 'Unable to load journey details. The journey might not exist or there was a connection error.',
    admin: 'Admin dashboard encountered an error. Some features may be unavailable.',
  };

  const message = context ? contextMessages[context] : 'An unexpected error occurred.';

  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <div className="text-center max-w-md">
        <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">
          {context ? `${context.charAt(0).toUpperCase() + context.slice(1)} Error` : 'Error'}
        </h3>
        <p className="text-gray-300 mb-6">{message}</p>
        
        {import.meta.env.DEV && error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded p-3 mb-4 text-left">
            <p className="text-red-300 text-sm font-mono">{error.message}</p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          {resetError && (
            <button
              onClick={resetError}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          <button
            onClick={() => window.location.href = '/'}
            className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}