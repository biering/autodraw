import { useEffect } from "react";
import { create } from "zustand";

/** Persisted when the user dismisses the onboarding dialog. */
export const ONBOARDING_SEEN_KEY = "autodraw:onboardingSeen";

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
  openFromUser: () => void;
  openAsFirstRun: () => void;
  close: () => void;
};

export const useOnboarding = create<OnboardingState>((set) => ({
  open: false,
  openFromUser: () => set({ open: true }),
  openAsFirstRun: () => set({ open: true }),
  close: () => {
    persistSeen();
    set({ open: false });
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
