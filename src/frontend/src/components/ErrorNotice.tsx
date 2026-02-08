import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface ErrorNoticeProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onStartOver?: () => void;
}

export default function ErrorNotice({
  title = 'Something went wrong',
  message,
  onRetry,
  onStartOver
}: ErrorNoticeProps) {
  return (
    <Alert variant="destructive" className="border-2">
      <AlertCircle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">{title}</AlertTitle>
      <AlertDescription className="mt-2 space-y-4">
        <p className="text-sm leading-relaxed">{message}</p>
        <div className="flex flex-col sm:flex-row gap-2">
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          )}
          {onStartOver && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStartOver}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

