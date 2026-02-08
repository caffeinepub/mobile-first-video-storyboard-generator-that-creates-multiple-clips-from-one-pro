import { CheckCircle2, Circle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

type Step = 'prompt' | 'clips' | 'compose' | 'download';

interface MobileStepperProps {
  currentStep: Step;
}

const steps: { key: Step; label: string }[] = [
  { key: 'prompt', label: 'Prompt' },
  { key: 'clips', label: 'Clips' },
  { key: 'compose', label: 'Compose' },
  { key: 'download', label: 'Download' }
];

export default function MobileStepper({ currentStep }: MobileStepperProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStep);

  return (
    <div className="bg-card border-b border-border safe-area-inset">
      <div className="container max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isUpcoming = index > currentIndex;

            return (
              <div key={step.key} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-2 flex-1">
                  <div
                    className={`
                      flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                      ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : ''}
                      ${isCurrent ? 'bg-primary/10 border-primary text-primary scale-110' : ''}
                      ${isUpcoming ? 'bg-background border-muted text-muted-foreground' : ''}
                    `}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Circle className={`w-5 h-5 ${isCurrent ? 'fill-current' : ''}`} />
                    )}
                  </div>
                  <span
                    className={`
                      text-xs font-medium transition-colors
                      ${isCurrent ? 'text-primary' : ''}
                      ${isCompleted ? 'text-foreground' : ''}
                      ${isUpcoming ? 'text-muted-foreground' : ''}
                    `}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <Separator
                    className={`
                      flex-1 mx-2 transition-colors
                      ${index < currentIndex ? 'bg-primary' : 'bg-muted'}
                    `}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

