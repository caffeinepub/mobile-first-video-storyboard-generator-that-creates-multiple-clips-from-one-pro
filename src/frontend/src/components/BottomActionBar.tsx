import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface ActionButton {
  label: string;
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
}

interface BottomActionBarProps {
  action: ActionButton | null;
}

export default function BottomActionBar({ action }: BottomActionBarProps) {
  if (!action) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm safe-area-inset safe-area-inset-bottom">
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <Button
          onClick={action.onClick}
          disabled={action.disabled || action.loading}
          variant={action.variant || 'default'}
          size="lg"
          className="w-full font-semibold text-base h-14 shadow-lg"
        >
          {action.loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
          {action.label}
        </Button>
      </div>
    </div>
  );
}

