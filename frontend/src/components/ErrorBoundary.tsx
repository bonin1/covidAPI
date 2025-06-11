import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  error: string;
  onRetry?: () => void;
  title?: string;
}

const ErrorBoundary = ({ error, onRetry, title = "Something went wrong" }: ErrorBoundaryProps) => {
  return (
    <div className="min-h-64 flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorBoundary;
