import { useEffect } from "react";
import { create } from "zustand";

/** Persisted when the user finishes, skips, or dismisses the wizard. */
export const ONBOARDING_SEEN_KEY = "autodraw:onboardingSeen";

const STEP_MAX = 3;

function persistSeen(): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(ONBOARDING_SEEN_KEY, "1");
    }
  } catch {
    /* ignore */
  }
}

export function hasSeenOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(ONBOARDING_SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

type OnboardingState = {
  open: boolean;
  step: number;
  setStep: (n: number) => void;
  openFromUser: () => void;
  openAsFirstRun: () => void;
  close: () => void;
};

export const useOnboarding = create<OnboardingState>((set) => ({
  open: false,
  step: 0,
  setStep: (step) => set({ step: Math.max(0, Math.min(STEP_MAX, step)) }),
  openFromUser: () => set({ open: true, step: 0 }),
  openAsFirstRun: () => set({ open: true, step: 0 }),
  close: () => {
    persistSeen();
    set({ open: false, step: 0 });
  },
}));

/** Auto-open onboarding once per browser profile until dismissed. */
export function useFirstRunOnboarding(): void {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasSeenOnboarding()) return;
    useOnboarding.getState().openAsFirstRun();
  }, []);
}
