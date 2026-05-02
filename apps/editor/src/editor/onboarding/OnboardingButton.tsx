"use client";

import { Rocket } from "lucide-react";
import { useMemo } from "react";
import { Button } from "../../components/ui/button";
import { cn } from "../../lib/utils";
import { canvasFloatingTriggerClass } from "../canvas/chrome";
import { useDocument } from "../state/useDocument";
import { useOnboarding } from "./useOnboarding";

export function OnboardingButton() {
  const canvasTheme = useDocument((s) => s.canvasTheme);
  const isDarkCanvas = canvasTheme === "dark";
  const openFromUser = useOnboarding((s) => s.openFromUser);

  const triggerClass = useMemo(
    () => canvasFloatingTriggerClass(isDarkCanvas, "right-4", { layout: "iconLabel" }),
    [isDarkCanvas],
  );

  return (
    <Button
      type="button"
      variant="ghost"
      className={cn(
        triggerClass,
        "font-sans [&_svg]:size-5",
        isDarkCanvas ? "hover:text-white" : "hover:text-black",
      )}
      aria-label="Connect your agent"
      title="Connect your agent"
      onClick={() => openFromUser()}
    >
      <Rocket className="shrink-0" strokeWidth={1.75} aria-hidden />
      <span>Connect</span>
    </Button>
  );
}
