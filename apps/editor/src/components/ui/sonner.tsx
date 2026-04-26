import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = ComponentProps<typeof Sonner>;

/**
 * Opinionated toasts ([Sonner](https://ui.shadcn.com/docs/components/radix/sonner)).
 * Uses explicit zinc-like colors so toasts look correct when portaled to `body` on web
 * (editor CSS variables live under `#autodraw-app-root`).
 */
export function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-[hsl(240,4%,16%)] group-[.toaster]:bg-[hsl(240,6%,10%)] group-[.toaster]:text-[hsl(0,0%,98%)] group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-[hsl(240,5%,64.9%)]",
          actionButton: "group-[.toast]:bg-[hsl(217,91%,60%)] group-[.toast]:text-[hsl(0,0%,100%)]",
          cancelButton: "group-[.toast]:bg-[hsl(240,4%,16%)] group-[.toast]:text-[hsl(0,0%,98%)]",
        },
      }}
      {...props}
    />
  );
}
