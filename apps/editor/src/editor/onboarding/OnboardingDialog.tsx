"use client";

/**
 * Shell adapted from blocks.so `@blocks-so/dialog-11` (Multi-Step Wizard).
 * @see https://blocks.so/dialogs/dialog-11
 * Body uses `@blocks-so/onboarding-03`-style step list via {@link OnboardingSteps}.
 */

import { Rocket } from "lucide-react";
import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Separator } from "../../components/ui/separator";
import { OnboardingSteps } from "./OnboardingSteps";
import { ConnectStep } from "./steps/ConnectStep";
import { ExampleStep } from "./steps/ExampleStep";
import { VerifyStep } from "./steps/VerifyStep";
import { WelcomeStep } from "./steps/WelcomeStep";
import { useOnboarding } from "./useOnboarding";
import { ONBOARDING_WIZARD_STEPS } from "./wizardSteps";

const STEP_MAX = 3;

const STEP_BODIES = [WelcomeStep, ConnectStep, VerifyStep, ExampleStep] as const;

export function OnboardingDialog() {
  const open = useOnboarding((s) => s.open);
  const step = useOnboarding((s) => s.step);
  const setStep = useOnboarding((s) => s.setStep);
  const close = useOnboarding((s) => s.close);

  const StepBody = STEP_BODIES[step] ?? WelcomeStep;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent
        className="flex max-h-[min(92vh,820px)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        hideClose={false}
      >
        <DialogHeader className="mb-0 shrink-0 border-b border-border px-6 py-4 text-left">
          <DialogTitle>Getting started</DialogTitle>
          <DialogDescription>
            Connect an AI agent to Autodraw via MCP, verify the tools, then try an example diagram.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="flex min-h-0 flex-col border-border md:w-80 md:border-r">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
              <div className="flex items-center space-x-3">
                <div className="inline-flex shrink-0 items-center justify-center rounded-sm bg-muted p-3">
                  <Rocket className="size-5 text-foreground" aria-hidden />
                </div>
                <div className="space-y-0.5">
                  <h3 className="text-balance text-sm font-medium text-foreground">Autodraw + agents</h3>
                  <p className="text-pretty text-sm text-muted-foreground">MCP, CLI, and this canvas share the same format.</p>
                </div>
              </div>
              <Separator />
              <h4 className="text-balance text-sm font-medium text-foreground">Why MCP?</h4>
              <p className="text-pretty text-sm leading-6 text-muted-foreground">
                The stdio server reads and writes{" "}
                <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">.adraw</code> JSON on your machine—mirroring
                the <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">autodraw</code> CLI.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border p-4">
              <Button type="button" variant="ghost" disabled={step === 0} onClick={() => setStep(step - 1)}>
                Back
              </Button>
              <Button type="button" variant="outline" onClick={() => close()}>
                Skip
              </Button>
              {step < STEP_MAX ? (
                <Button type="button" className="md:ml-auto" onClick={() => setStep(step + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="button" className="md:ml-auto" onClick={() => close()}>
                  Finish
                </Button>
              )}
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
              <OnboardingSteps
                steps={ONBOARDING_WIZARD_STEPS}
                activeStep={step}
                onStepChange={setStep}
              />
              <Separator />
              <StepBody />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
