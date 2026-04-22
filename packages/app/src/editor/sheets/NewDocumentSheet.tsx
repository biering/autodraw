import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDocument } from "../state/useDocument.js";

export function NewDocumentSheet() {
  const open = useDocument((s) => s.showNewDocSheet);
  const setOpen = useDocument((s) => s.setShowNewDocSheet);
  const newDocument = useDocument((s) => s.newDocument);

  const onCreate = () => {
    newDocument("universal");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md sm:max-w-md" hideClose>
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Start with the built-in palette. You can pick shapes and colors from it when you add
          elements.
        </p>
        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onCreate}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
