import { ExternalLink, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { getPolarPublicConfig } from "./polarEnv.js";
import { useLicense, type LicenseState } from "./useLicense.js";

export type ActivationGateProps = {
  /** Tauri license window: panel fills the webview (no floating card / letterboxing). */
  fillWindow?: boolean;
};

export function ActivationGate({ fillWindow = false }: ActivationGateProps) {
  const status = useLicense((s: LicenseState) => s.status);
  const error = useLicense((s: LicenseState) => s.error);
  const configMissing = useLicense((s: LicenseState) => s.configMissing);
  const activate = useLicense((s: LicenseState) => s.activate);
  const openCheckout = useLicense((s: LicenseState) => s.openCheckout);
  const openPortal = useLicense((s: LicenseState) => s.openPortal);
  const clearError = useLicense((s: LicenseState) => s.clearError);
  const devBypassLicense = useLicense((s: LicenseState) => s.devBypassLicense);
  const isDev = import.meta.env.DEV;

  const [keyDraft, setKeyDraft] = useState("");
  const [activating, setActivating] = useState(false);
  const cfg = getPolarPublicConfig();
  const priceLabel = cfg?.priceLabel ?? "Buy a License";

  const runActivate = async () => {
    setActivating(true);
    try {
      await activate(keyDraft);
    } finally {
      setActivating(false);
    }
  };

  return (
    <Dialog open modal onOpenChange={() => {}}>
      <DialogContent
        fullscreen={fillWindow}
        hideClose
        className={cn(
          "gap-0 border-zinc-800 bg-[#1a1a1a] p-0 text-zinc-100",
          fillWindow
            ? "shadow-none sm:rounded-none"
            : "max-w-[420px] overflow-hidden shadow-2xl sm:rounded-2xl",
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="shrink-0 border-b border-zinc-800 px-6 pb-5 pt-8 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <img
              src="/img/app-icon.png"
              alt=""
              width={80}
              height={80}
              className="h-20 w-20 object-contain"
              decoding="async"
            />
          </div>
          <DialogHeader className="space-y-2 text-center sm:text-center">
            <DialogTitle className="text-2xl font-bold tracking-tight text-white">
              Welcome to Autodraw
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-400">
              Activate your license to start diagramming. Purchase on Polar, then paste your key
              below.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div
          className={cn("min-h-0 px-6 py-6", fillWindow && "flex flex-1 flex-col overflow-y-auto")}
        >
          {status === "validating" ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <div
                className="h-9 w-9 animate-spin rounded-full border-2 border-zinc-600 border-t-lime-400"
                aria-hidden
              />
              <p className="text-sm text-zinc-400">Checking license…</p>
              {isDev ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                  onClick={() => devBypassLicense()}
                >
                  Skip license (dev only)
                </Button>
              ) : null}
            </div>
          ) : (
            <>
              <div className="flex gap-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-400 text-sm font-bold text-lime-950"
                  aria-hidden
                >
                  1
                </div>
                <div className="min-w-0 flex-1 space-y-4">
                  <div>
                    <h2 className="text-base font-semibold text-white">Activate license</h2>
                  </div>

                  <Button
                    type="button"
                    className="h-11 w-full gap-2 rounded-xl bg-lime-400 font-semibold text-lime-950 hover:bg-lime-300"
                    onClick={() => void openCheckout()}
                    disabled={configMissing}
                  >
                    <ShoppingCart className="h-4 w-4 shrink-0" aria-hidden />
                    {priceLabel}
                  </Button>

                  <p className="text-center text-xs text-zinc-500">Already have a key?</p>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keyDraft}
                      onChange={(e) => {
                        clearError();
                        setKeyDraft(e.target.value);
                      }}
                      placeholder="Paste license key"
                      autoComplete="off"
                      spellCheck={false}
                      className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-black/50 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-400/50"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void runActivate();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      className="shrink-0 rounded-lg bg-[#4a5c24] px-4 font-semibold text-lime-50 hover:bg-[#5a6e2c]"
                      onClick={() => void runActivate()}
                      disabled={configMissing || activating}
                    >
                      {activating ? "…" : "Activate"}
                    </Button>
                  </div>

                  {error ? (
                    <p className="rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                      {error}
                    </p>
                  ) : null}

                  {cfg?.portalUrl ? (
                    <button
                      type="button"
                      className="flex w-full items-center justify-center gap-1.5 text-sm font-medium text-lime-400 underline underline-offset-2 hover:text-lime-300"
                      onClick={() => void openPortal()}
                    >
                      Manage your licenses
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  ) : null}

                  {isDev ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                      onClick={() => devBypassLicense()}
                    >
                      Skip license (dev only)
                    </Button>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
