/**
 * Main webview placeholder until the license window unlocks it.
 * Does not mount the editor or ActivationGate (those live in license.html).
 * The `autodraw-license-sync` listener is registered in `main.tsx` as early as possible.
 */
export function MainAwaitLicense() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-[#131316] text-sm text-[#a1a1aa]">
      Waiting for license activation…
    </div>
  );
}
