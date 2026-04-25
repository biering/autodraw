import {
  styleById,
  type DiagramV1,
  type NodeShape,
  type NodeStyleDefinition,
} from "@autodraw/core";

/** Palette style ids shown in the “Color” row (add-element + node context menu), in order. */
export const CREATION_MENU_COLOR_IDS: readonly string[] = [
  "yellow",
  "orange",
  "pink",
  "blue",
  "green",
  "gray",
];

/** Shapes offered in creation and node context menus (overrides style default when set on the node). */
export const CREATION_MENU_SHAPES: readonly NodeShape[] = ["roundedRect", "rectangle"];

/**
 * Color swatches for menus: one entry per {@link CREATION_MENU_COLOR_IDS}, resolved via
 * {@link styleById} so `diagram.customStyles` overrides apply (e.g. a custom “gray”).
 */
export function creationMenuColors(diagram: DiagramV1): NodeStyleDefinition[] {
  const out: NodeStyleDefinition[] = [];

  for (const id of CREATION_MENU_COLOR_IDS) {
    const s = styleById(diagram, id);
    if (s) {
      out.push(s);
    }
  }

  return out;
}

export function creationMenuShapes(): readonly NodeShape[] {
  return CREATION_MENU_SHAPES;
}
