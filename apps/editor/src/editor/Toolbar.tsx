import { Download, Moon, Sun, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { Button } from "../components/ui/button";
import { exportAdrawInBrowser, importAdrawInBrowser } from "../platform/files";
import { isTauri } from "../platform/isTauri";
import { redoDocument, undoDocument, useDocument } from "./state/useDocument";

const GITHUB_REPO_HREF = "https://github.com/biering/autodraw";

/** GitHub mark (simple-icons path); lucide-react does not ship brand icons in this version. */
function IconGithubMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="currentColor"
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </svg>
  );
}

function IconPlus() {
  return (
    <svg className="block shrink-0" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
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
            ) : null}
            <ToolbarDiagramName />
          </div>

          <span className="h-[26px] w-px shrink-0 bg-black/[0.08]" aria-hidden />

          <div className="flex shrink-0 items-center gap-1">
            {!isTauri() ? (
              <>
                <Button
                  type="button"
                  variant="toolbarGhost"
                  size="icon"
                  className="h-9 w-9 rounded-full [-webkit-app-region:no-drag] [app-region:no-drag]"
                  title="Import .adraw file"
                  aria-label="Import .adraw file"
                  onClick={() => void importAdrawInBrowser()}
                >
                  <Upload className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="toolbarGhost"
                  className="h-9 gap-1.5 rounded-full px-2.5 text-[13px] font-semibold [-webkit-app-region:no-drag] [app-region:no-drag] [&_svg]:size-[18px]"
                  title="Save as .adraw file"
                  aria-label="Save as .adraw file"
                  onClick={() => exportAdrawInBrowser()}
                >
                  <Download strokeWidth={1.75} aria-hidden />
                  <span>Save</span>
                </Button>
                <Button
                  variant="toolbarGhost"
                  className="h-9 gap-1.5 rounded-full px-2.5 text-[13px] font-semibold [-webkit-app-region:no-drag] [app-region:no-drag] [&_svg]:shrink-0"
                  title="Star this repo on GitHub"
                  asChild
                >
                  <a
                    href={GITHUB_REPO_HREF}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5"
                    aria-label="Star — opens the Autodraw repository on GitHub in a new tab"
                  >
                    <IconGithubMark className="shrink-0" />
                    <span>Star</span>
                  </a>
                </Button>
              </>
            ) : null}
            <Button
              type="button"
              variant="toolbarGhost"
              size="icon"
              className="h-9 w-9 rounded-full [-webkit-app-region:no-drag] [app-region:no-drag]"
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
              variant="toolbarGhost"
              size="icon"
              className="h-9 w-9 rounded-full [-webkit-app-region:no-drag] [app-region:no-drag]"
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
