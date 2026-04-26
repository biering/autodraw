import { Button } from "../../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { isTauri } from "../../platform/isTauri";
import { newDocumentInteractive, openDocumentInteractive } from "../../platform/files";
import { useDocument } from "../state/useDocument";

/**
 * Shown when there is no `.adraw` on disk yet (user cancelled the launch open dialog, or browser).
 * Mirrors a Finder-style choice: open an existing file or start a new diagram.
 */
export function WelcomeDiagramSheet() {
  const open = useDocument((s) => s.showWelcomeGate);
  const setOpen = useDocument((s) => s.setShowWelcomeGate);
  const newDocument = useDocument((s) => s.newDocument);

  const onNewDiagram = () => {
    if (isTauri()) {
      void newDocumentInteractive();
      setOpen(false);
      return;
    }
    newDocument("universal");
    setOpen(false);
  };

  const onOpenExisting = () => {
    void (async () => {
      const opened = await openDocumentInteractive();
      if (opened || useDocument.getState().filePath) {
        setOpen(false);
      }
    })();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle>Open or create a diagram</DialogTitle>
          <DialogDescription>
            {isTauri()
              ? "Open an existing .adraw file from your Mac, or start a new blank diagram. You can save later with File → Save."
              : "In the desktop app, the system file picker opens first. In the browser, pick Open to use the dev workflow, or New diagram for a blank canvas."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onNewDiagram}
          >
            New diagram
          </Button>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" className="w-full sm:w-auto" onClick={onOpenExisting}>
              Open diagram…
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
