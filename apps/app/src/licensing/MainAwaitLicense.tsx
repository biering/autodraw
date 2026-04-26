/**
 * Main webview placeholder until the license window unlocks it.
 * Does not mount the editor or ActivationGate (those live in license.html).
 * The `autodraw-license-sync` listener is registered in `main.tsx` as early as possible.
 */
export function MainAwaitLicense() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#131316] text-sm text-[#a1a1aa]">
      <img
        src="/img/logo-1024x.png"
        alt=""
        width={56}
        height={56}
        className="h-14 w-14 object-contain opacity-90"
        decoding="async"
      />
      <p>Waiting for license activation…</p>
    </div>
  );
}
