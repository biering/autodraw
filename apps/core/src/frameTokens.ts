import type { FrameColor } from "./schema.js";

export const FRAME_COLOR_OPTIONS: FrameColor[] = ["gray", "blue", "green", "pink", "yellow"];

/** Swatch for nested colour menu (same in light/dark). */
export function frameColorSwatchHex(c: FrameColor): string {
  switch (c) {
    case "gray":
      return "#94a3b8";
    case "blue":
      return "#3b82f6";
    case "green":
      return "#22c55e";
    case "pink":
      return "#ec4899";
    case "yellow":
      return "#eab308";
    default:
      return "#94a3b8";
  }
}

/** SVG export uses a fixed light palette (canonical .adraw preview). */
export function frameSvgStrokeFill(color: FrameColor | undefined): {
  stroke: string;
  fill: string;
} {
  switch (color) {
    case "blue":
      return { stroke: "#3b82f6", fill: "rgba(59, 130, 246, 0.08)" };
    case "green":
      return { stroke: "#22c55e", fill: "rgba(34, 197, 94, 0.08)" };
    case "pink":
      return { stroke: "#ec4899", fill: "rgba(236, 72, 153, 0.08)" };
    case "yellow":
      return { stroke: "#ca8a04", fill: "rgba(234, 179, 8, 0.12)" };
    case "gray":
    default:
      return { stroke: "#b0b0b8", fill: "rgba(0, 0, 0, 0.03)" };
  }
}

/** In-canvas frame chrome (matches editor dark/light). */
export function frameCanvasChrome(
  color: FrameColor | undefined,
  canvasTheme: "light" | "dark",
): { border: string; fill: string } {
  const dark = canvasTheme === "dark";
  if (color === "blue") {
    return dark
      ? { border: "rgba(96, 165, 250, 0.85)", fill: "rgba(59, 130, 246, 0.18)" }
      : { border: "rgba(37, 99, 235, 0.9)", fill: "rgba(59, 130, 246, 0.14)" };
  }
  if (color === "green") {
    return dark
      ? { border: "rgba(74, 222, 128, 0.85)", fill: "rgba(34, 197, 94, 0.18)" }
      : { border: "rgba(22, 163, 74, 0.85)", fill: "rgba(34, 197, 94, 0.14)" };
  }
  if (color === "pink") {
    return dark
      ? { border: "rgba(244, 114, 182, 0.85)", fill: "rgba(236, 72, 153, 0.18)" }
      : { border: "rgba(219, 39, 119, 0.85)", fill: "rgba(236, 72, 153, 0.14)" };
  }
  if (color === "yellow") {
    return dark
      ? { border: "rgba(250, 204, 21, 0.9)", fill: "rgba(234, 179, 8, 0.18)" }
      : { border: "rgba(202, 138, 4, 0.9)", fill: "rgba(234, 179, 8, 0.18)" };
  }
  // gray + default
  return dark
    ? { border: "rgba(148, 163, 184, 0.5)", fill: "rgba(30, 32, 38, 0.35)" }
    : { border: "rgba(100, 116, 139, 0.45)", fill: "rgba(15, 23, 42, 0.04)" };
}
