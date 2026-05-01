"use client";

/**
 * Adapted from blocks.so `@blocks-so/onboarding-03` (Onboarding Steps with Progress).
 * @see https://blocks.so/onboarding/onboarding-03
 * Replaces `@tabler/icons-react` with lucide per project policy.
 */

import { CheckCircle2 } from "lucide-react";
import { Progress } from "../../components/ui/progress";
import { cn } from "../../lib/utils";
import type { OnboardingWizardStep } from "./wizardSteps";

type OnboardingStepsProps = {
  steps: readonly OnboardingWizardStep[];
  activeStep: number;
  onStepChange: (index: number) => void;
};

export function OnboardingSteps({ steps, activeStep, onStepChange }: OnboardingStepsProps) {
  const progressValue = ((activeStep + 1) / steps.length) * 100;

  return (
    <div>
      <h3 className="font-semibold text-foreground text-lg">Progress</h3>
      <p className="mt-1 text-muted-foreground text-sm leading-6">
        Jump back to any completed step, or use Back / Next below.
      </p>
      <div className="mt-4 flex items-center justify-end space-x-4">
        <span className="text-muted-foreground text-sm">
          Step {activeStep + 1}/{steps.length}
        </span>
        <Progress className="w-32" value={progressValue} />
      </div>
      <ul className="mt-4 space-y-4">
        {steps.map((step, index) => {
          const done = index < activeStep;
          const current = index === activeStep;
          const canNavigate = index <= activeStep;
          return (
            <li key={step.id}>
              <button
                type="button"
                disabled={!canNavigate}
                className={cn(
                  "relative w-full rounded-lg border bg-card p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  canNavigate ? "cursor-pointer" : "cursor-not-allowed opacity-60",
                  current ? "border-foreground/20" : "border-border",
                )}
                onClick={() => {
                  if (canNavigate) onStepChange(index);
                }}
              >
                <div className="flex items-start space-x-3">
                  {done ? (
                    <CheckCircle2
                      aria-hidden
                      className="size-6 shrink-0 text-foreground"
                      strokeWidth={2}
                    />
                  ) : (
                    <span
                      aria-hidden
                      className="flex size-6 items-center justify-center font-medium text-muted-foreground"
                    >
                      {step.id}
                    </span>
                  )}
                  <div>
                    <h4
                      className={cn(
                        "font-medium",
                        done ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      {step.title}
                    </h4>
                    <p className="mt-1 text-muted-foreground text-sm leading-6">{step.description}</p>
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
