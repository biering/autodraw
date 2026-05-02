"use client";

/**
 * Connect onboarding: single matrix card + Done (dialog chrome is minimal).
 */

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "../../components/ui/dialog";
import { ConnectStep } from "./steps/ConnectStep";
import { useOnboarding } from "./useOnboarding";

export function OnboardingDialog() {
  const open = useOnboarding((s) => s.open);
  const close = useOnboarding((s) => s.close);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
      }}
    >
      <DialogContent
        className="flex w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 border-0 bg-transparent p-3 shadow-none sm:max-w-2xl"
        hideClose={false}
      >
        <DialogTitle className="sr-only">Connect your agent</DialogTitle>
        <ConnectStep onDone={close} />
      </DialogContent>
    </Dialog>
  );
}
