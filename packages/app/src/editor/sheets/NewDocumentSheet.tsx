import type { PalettePreset } from "@agentsdraw/core";
import { parseDiagram } from "@agentsdraw/core";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { isTauri } from "../../platform/isTauri.js";
import { useDocument } from "../state/useDocument.js";

type StartMode = "blank" | "load" | "preset";

export function NewDocumentSheet() {
  const open = useDocument((s) => s.showNewDocSheet);
  const setOpen = useDocument((s) => s.setShowNewDocSheet);
  const newDocument = useDocument((s) => s.newDocument);
  const loadPaletteFrom = useDocument((s) => s.loadPaletteFrom);
  const [startMode, setStartMode] = useState<StartMode>("blank");
  const [preset, setPreset] = useState<Exclude<PalettePreset, "empty">>("universal");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCreate = () => {
    if (startMode === "preset") {
      newDocument(preset);
      setOpen(false);
      return;
    }
    if (startMode === "blank") {
      newDocument("empty");
      setOpen(false);
      return;
    }
  };

  const applyLoadedPalette = (raw: string) => {
    const doc = parseDiagram(JSON.parse(raw));
    newDocument("empty");
    loadPaletteFrom(doc);
    setOpen(false);
  };

  const onLoadPalette = async () => {
    setStartMode("load");
    if (!isTauri()) {
      fileInputRef.current?.click();
      return;
    }
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { readTextFile } = await import("@tauri-apps/plugin-fs");
    const path = await open({ multiple: false, filters: [{ name: "Diagram", extensions: ["adraw"] }] });
    if (typeof path !== "string") {
      setStartMode("blank");
      return;
    }
    const raw = await readTextFile(path);
    applyLoadedPalette(raw);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl sm:max-w-xl" hideClose>
        <input
          ref={fileInputRef}
          type="file"
          accept=".adraw,application/json"
          className="srOnly"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = "";
            if (!f) {
              setStartMode("blank");
              return;
            }
            void f.text().then(applyLoadedPalette).catch(() => setStartMode("blank"));
          }}
        />
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            variant={startMode === "blank" ? "default" : "outline"}
            className="h-auto flex-col gap-2 py-6"
            onClick={() => setStartMode("blank")}
          >
            <span className="text-2xl" aria-hidden>
              ✨
            </span>
            <span className="text-center text-sm font-medium leading-snug">Empty palette</span>
          </Button>
          <Button
            type="button"
            variant={startMode === "load" ? "default" : "outline"}
            className="h-auto flex-col gap-2 py-6"
            onClick={() => void onLoadPalette()}
          >
            <span className="text-2xl" aria-hidden>
              ⤵
            </span>
            <span className="text-center text-sm font-medium leading-snug">
              Load palette from existing document
            </span>
          </Button>
        </div>
        <p className="text-sm font-medium text-muted-foreground">Start with palette preset</p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            type="button"
            variant={startMode === "preset" && preset === "universal" ? "default" : "outline"}
            className="h-auto flex-col gap-2 py-4"
            onClick={() => {
              setStartMode("preset");
              setPreset("universal");
            }}
          >
            <div className="thumb universalThumb h-16 w-full rounded-md" />
            <span className="text-xs">Universal</span>
          </Button>
          <Button
            type="button"
            variant={startMode === "preset" && preset === "grayscale" ? "default" : "outline"}
            className="h-auto flex-col gap-2 py-4"
            onClick={() => {
              setStartMode("preset");
              setPreset("grayscale");
            }}
          >
            <div className="thumb grayThumb h-16 w-full rounded-md" />
            <span className="text-xs">Grayscale</span>
          </Button>
          <Button
            type="button"
            variant={startMode === "preset" && preset === "flowchart" ? "default" : "outline"}
            className="h-auto flex-col gap-2 py-4"
            onClick={() => {
              setStartMode("preset");
              setPreset("flowchart");
            }}
          >
            <div className="thumb flowThumb h-16 w-full rounded-md" />
            <span className="text-xs">Flowchart</span>
          </Button>
        </div>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onCreate} disabled={startMode === "load"}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
