import { Moon, Sun } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";
import { redoDocument, undoDocument, useDocument } from "./state/useDocument.js";

function IconSpark() {
  return (
    <svg className="block shrink-0" width="20" height="20" viewBox="0 0 20 20" aria-hidden>
      <defs>
        <linearGradient id="iosSparkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
      </defs>
      <rect x="1.5" y="1.5" width="17" height="17" rx="5" fill="url(#iosSparkGrad)" />
      <path
        d="M10 5.5l.6 2.2 2.2.6-2.2.6L10 11l-.6-2.1-2.2-.6 2.2-.6L10 5.5z"
        fill="white"
        opacity="0.95"
      />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="block shrink-0" width="18" height="18" viewBox="0 0 18 18" aria-hidden>
      <path d="M9 4v10M4 9h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function Toolbar() {
  const canvasTheme = useDocument((s) => s.canvasTheme);
  const setCanvasTheme = useDocument((s) => s.setCanvasTheme);

  useHotkeys("mod+z", (e) => {
    e.preventDefault();
    undoDocument();
  });
  useHotkeys("mod+shift+z", (e) => {
    e.preventDefault();
    redoDocument();
  });

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-4 pt-[calc(10px+env(safe-area-inset-top,0px))]">
      <nav
        className="pointer-events-auto flex max-w-[min(960px,calc(100vw-32px))] items-center gap-2.5 rounded-full border border-black/[0.06] bg-[rgba(253,253,254,0.94)] py-1.5 pl-2.5 pr-2 text-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_28px_rgba(0,0,0,0.1),0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-180 [-webkit-app-region:drag] [app-region:drag]"
        data-tauri-drag-region
        aria-label="Editor toolbar"
      >
        <div className="flex shrink-0 items-center gap-2 pl-0.5 pr-1">
          <IconSpark />
          <span className="whitespace-nowrap text-[15px] font-semibold tracking-tight text-[#1d1d1f]">
            Diagram
          </span>
        </div>

        <span className="h-[26px] w-px shrink-0 bg-black/[0.08]" aria-hidden />

        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-[#1d1d1f] hover:bg-black/[0.06] [-webkit-app-region:no-drag] [app-region:no-drag]"
            title={
              canvasTheme === "light"
                ? "Use dark drawing background"
                : "Use light drawing background"
            }
            aria-label={
              canvasTheme === "light"
                ? "Switch drawing area to dark"
                : "Switch drawing area to light"
            }
            onClick={() => setCanvasTheme(canvasTheme === "light" ? "dark" : "light")}
          >
            {canvasTheme === "light" ? (
              <Moon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            ) : (
              <Sun className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-[#1d1d1f] hover:bg-black/[0.06] [-webkit-app-region:no-drag] [app-region:no-drag]"
            title="Add element"
            onClick={() => window.dispatchEvent(new CustomEvent("agentsdraw:open-add-element"))}
          >
            <IconPlus />
          </Button>
        </div>
      </nav>
    </div>
  );
}
