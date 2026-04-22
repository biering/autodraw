import { Moon, Sun } from "lucide-react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "@/components/ui/button";
import { redoDocument, undoDocument, useDocument } from "./state/useDocument.js";

function IconSpark() {
  return (
    <svg className="iosAppSpark" width="20" height="20" viewBox="0 0 20 20" aria-hidden>
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
    <svg className="iosTbIcon" width="18" height="18" viewBox="0 0 18 18" aria-hidden>
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
    <div className="toolbarOverlay">
      <nav className="iosToolbar" data-tauri-drag-region aria-label="Editor toolbar">
        <div className="iosToolbarLead">
          <IconSpark />
          <span className="iosToolbarAppName">Diagram</span>
        </div>

        <span className="iosToolbarRule" aria-hidden="true" />

        <div className="iosToolbarActions">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="iosIconBtn h-9 w-9 rounded-full border-0 bg-transparent text-[#1d1d1f] shadow-none hover:bg-black/[0.06]"
            title={canvasTheme === "light" ? "Use dark drawing background" : "Use light drawing background"}
            aria-label={canvasTheme === "light" ? "Switch drawing area to dark" : "Switch drawing area to light"}
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
            className="iosIconBtn h-9 w-9 rounded-full border-0 bg-transparent text-[#1d1d1f] shadow-none hover:bg-black/[0.06]"
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
