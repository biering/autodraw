"use client";

import { Rocket } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { useDocument } from "../state/useDocument";
import { useOnboarding } from "./useOnboarding";

export function OnboardingButton() {
  const canvasTheme = useDocument((s) => s.canvasTheme);
  const isDarkCanvas = canvasTheme === "dark";
  const openFromUser = useOnboarding((s) => s.openFromUser);

  const triggerClass = useMemo(
    () =>
      cn(
        "fixed right-4 top-[calc(10px+env(safe-area-inset-top,0px))] z-[85] h-10 w-10 rounded-full shadow-md [-webkit-app-region:no-drag] [app-region:no-drag]",
        isDarkCanvas
          ? "border border-white/[0.14] bg-[rgba(255,255,255,0.08)] hover:bg-white/12"
          : "border border-black/[0.12] bg-[rgba(0,0,0,0.02)] hover:bg-black/10",
      ),
    [isDarkCanvas],
  );

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={triggerClass}
      aria-label="Getting started"
      title="Getting started"
      onClick={() => openFromUser()}
    >
      <Rocket
        className={cn("h-5 w-5", isDarkCanvas ? "text-white" : "text-black")}
        strokeWidth={1.75}
        aria-hidden
      />
    </Button>
  );
}
