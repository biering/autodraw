import { Download, Moon, Sun, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "../components/ui/button";
import { exportAdrawInBrowser, importAdrawInBrowser } from "../platform/files";
import { isTauri } from "../platform/isTauri";
import { redoDocument, undoDocument, useDocument } from "./state/useDocument";

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

function ToolbarDiagramName() {
  const name = useDocument((s) => s.diagram.name);
  const setDiagramName = useDocument((s) => s.setDiagramName);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipBlurCommitRef = useRef(false);

  useEffect(() => {
    if (!editing) return;
    const id = window.requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.select();
    });
    return () => window.cancelAnimationFrame(id);
  }, [editing]);

  const commit = () => {
    setDiagramName(draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={draft}
        maxLength={256}
        aria-label="Diagram name"
        className="min-w-[4ch] max-w-[220px] shrink rounded-md border border-black/[0.12] bg-white/90 px-1.5 py-0.5 text-[15px] font-semibold tracking-tight text-[#1d1d1f] shadow-sm outline-none [-webkit-app-region:no-drag] [app-region:no-drag] focus-visible:ring-2 focus-visible:ring-[#007aff]/35"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            skipBlurCommitRef.current = false;
            commit();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            skipBlurCommitRef.current = true;
            setDraft(name);
            setEditing(false);
          }
        }}
        onBlur={() => {
          if (skipBlurCommitRef.current) {
            skipBlurCommitRef.current = false;
            return;
          }
          commit();
        }}
      />
    );
  }

  return (
    <button
      type="button"
      className="max-w-[220px] shrink truncate rounded-md px-1 py-0.5 text-left text-[15px] font-semibold tracking-tight text-[#1d1d1f] [-webkit-app-region:no-drag] [app-region:no-drag] hover:bg-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]/35"
      title="Rename diagram"
      onClick={() => {
        setDraft(name);
        setEditing(true);
      }}
    >
      {name}
    </button>
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
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80]">
      {/*
       * Full-width transparent drag band (macOS overlay title bar): keeps window draggable and
       * leaves traffic lights usable; canvas shows through above the pill. Nav sits on top.
       */}
      <div
        className="pointer-events-auto absolute inset-x-0 top-0 h-[calc(52px+env(safe-area-inset-top,0px))] [-webkit-app-region:drag] [app-region:drag]"
        data-tauri-drag-region
        aria-hidden
      />
      <div className="pointer-events-none relative flex justify-center px-4 pt-[calc(10px+env(safe-area-inset-top,0px))]">
        <nav
          className="pointer-events-auto relative z-[1] flex max-w-[min(960px,calc(100vw-32px))] items-center gap-2.5 rounded-full border border-black/[0.06] bg-[rgba(253,253,254,0.94)] py-1.5 pl-2.5 pr-2 text-[#1d1d1f] shadow-[inset_0_1px_0_rgba(255,255,255,0.8),0_8px_28px_rgba(0,0,0,0.06)] backdrop-blur-xl backdrop-saturate-180 [-webkit-app-region:drag] [app-region:drag]"
          data-tauri-drag-region
          aria-label="Editor toolbar"
        >
          <div className="flex shrink-0 items-center gap-2 pl-0.5 pr-1">
            {isTauri() ? (
              <img
                src="/img/app-icon.png"
                alt=""
                width={20}
                height={20}
                className="block h-5 w-5 shrink-0 object-contain [-webkit-app-region:no-drag] [app-region:no-drag]"
                decoding="async"
              />
            ) : (
              <IconSpark />
            )}
            <ToolbarDiagramName />
          </div>

          <span className="h-[26px] w-px shrink-0 bg-black/[0.08]" aria-hidden />

          <div className="flex shrink-0 items-center gap-1">
            {!isTauri() ? (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full text-[#1d1d1f] hover:bg-black/[0.06] [-webkit-app-region:no-drag] [app-region:no-drag]"
                  title="Import .adraw file"
                  aria-label="Import .adraw file"
                  onClick={() => void importAdrawInBrowser()}
                >
                  <Upload className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 gap-1.5 rounded-full px-2.5 text-[13px] font-semibold text-[#1d1d1f] hover:bg-black/[0.06] [-webkit-app-region:no-drag] [app-region:no-drag] [&_svg]:size-[18px]"
                  title="Save as .adraw file"
                  aria-label="Save as .adraw file"
                  onClick={() => exportAdrawInBrowser()}
                >
                  <Download strokeWidth={1.75} aria-hidden />
                  <span>Save</span>
                </Button>
              </>
            ) : null}
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
              onClick={() => window.dispatchEvent(new CustomEvent("autodraw:open-add-element"))}
            >
              <IconPlus />
            </Button>
          </div>
        </nav>
      </div>
    </div>
  );
}
