import { cn } from "../../lib/utils";

/** Shared frosted “glass” border + fill for canvas chrome (dock shell, floating triggers). */
export function canvasChromeGlass(isDarkCanvas: boolean, opts?: { hover?: boolean }): string {
  const base = isDarkCanvas
    ? "border border-white/[0.14] bg-[rgba(255,255,255,0.08)]"
    : "border border-black/[0.12] bg-[rgba(0,0,0,0.02)]";
  if (!opts?.hover) return base;
  return cn(base, isDarkCanvas ? "hover:bg-white/12" : "hover:bg-black/10");
}

/** Top-right floating chrome (e.g. Connect onboarding). */
export function canvasFloatingTriggerClass(
  isDarkCanvas: boolean,
  insetRight: "right-4" | "right-16",
  opts?: { layout?: "icon" | "iconLabel" },
): string {
  const layout = opts?.layout ?? "icon";
  return cn(
    "fixed top-[calc(10px+env(safe-area-inset-top,0px))] z-[85] shadow-md [-webkit-app-region:no-drag] [app-region:no-drag]",
    "inline-flex h-10 shrink-0 items-center justify-center",
    layout === "iconLabel"
      ? "gap-2 rounded-full px-3.5 text-sm font-medium"
      : "w-10 rounded-full",
    insetRight === "right-4" ? "right-4" : "right-16",
    canvasChromeGlass(isDarkCanvas, { hover: true }),
    layout === "iconLabel" && (isDarkCanvas ? "text-white" : "text-black"),
  );
}

/** Bottom-left zoom dock outer shell (no row hover on the shell itself). */
export function canvasZoomDockShellClass(isDarkCanvas: boolean): string {
  return cn(
    "fixed bottom-[max(16px,env(safe-area-inset-bottom,0px))] left-[max(16px,env(safe-area-inset-left,0px))] z-[75] flex flex-col overflow-hidden rounded-xl",
    canvasChromeGlass(isDarkCanvas),
  );
}
