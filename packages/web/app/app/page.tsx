"use client";

import { EditorShellLicensed } from "@autodraw/editor";

export default function WebEditorPage() {
  return (
    <div id="autodraw-app-root" className="dark h-[100dvh] w-full overflow-hidden bg-background text-foreground">
      <EditorShellLicensed />
    </div>
  );
}
