import { relationshipPresets } from "@agentsdraw/core";
import { memo, useEffect } from "react";

export type NewRelationshipDraft = {
  source: string;
  target: string;
  /** Position inside the canvas wrapper (CSS px). */
  cx: number;
  cy: number;
};

type Props = {
  draft: NewRelationshipDraft;
  onPick: (presetIndex: number) => void;
  onClose: () => void;
};

export const NEW_REL_POPOVER_W = 300;
export const NEW_REL_POPOVER_H = 320;

function PresetThumb({ index }: { index: number }) {
  const stroke = "#1a1a1a";
  const dash =
    index === 4 || index === 5 || index === 6 ? "4 3" : index === 7 ? "1.5 3" : undefined;
  const sw = index === 2 ? 2.2 : 1.2;
  const headOpen = (
    <path d="M 52 28 L 46 24 M 52 28 L 46 32" fill="none" stroke={stroke} strokeWidth={1.2} strokeLinecap="round" />
  );
  const headFilled = <path d="M 52 28 L 46 24 L 46 32 Z" fill={stroke} stroke="none" />;
  const headSquare = <rect x="45" y="24" width="6" height="8" fill="none" stroke={stroke} strokeWidth={1.1} />;
  const tailSquare = <rect x="10" y="24" width="7" height="8" fill="none" stroke={stroke} strokeWidth={1.1} />;
  const pathElbow = (
    <path
      d="M 14 28 H 34 V 28 H 46"
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeDasharray={dash}
    />
  );
  const pathStraight = (
    <path
      d="M 14 28 H 50"
      fill="none"
      stroke={stroke}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeDasharray={dash}
    />
  );

  switch (index) {
    case 0:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathStraight}
          {headOpen}
          <text x="8" y="14" fontSize="7" fill="#666">
            Aa
          </text>
        </svg>
      );
    case 1:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathElbow}
          {headOpen}
          <text x="8" y="14" fontSize="7" fill="#666">
            Aa
          </text>
        </svg>
      );
    case 2:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathElbow}
          {headOpen}
          <text x="8" y="14" fontSize="7" fill="#666">
            Aa
          </text>
        </svg>
      );
    case 3:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          <path
            d="M 14 28 H 34 V 28 H 44"
            fill="none"
            stroke={stroke}
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M 44 28 L 50 24 M 44 28 L 50 32" fill="none" stroke={stroke} strokeWidth={1.2} strokeLinecap="round" />
          <path d="M 44 28 L 38 24 M 44 28 L 38 32" fill="none" stroke={stroke} strokeWidth={1.2} strokeLinecap="round" />
          <text x="8" y="14" fontSize="7" fill="#666">
            Aa
          </text>
        </svg>
      );
    case 4:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathElbow}
          {headOpen}
          <text x="8" y="14" fontSize="7" fill="#666">
            Aa
          </text>
        </svg>
      );
    case 5:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {tailSquare}
          {pathElbow}
          {headOpen}
          <text x="8" y="14" fontSize="7" fill="#666">
            Aa
          </text>
        </svg>
      );
    case 6:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathElbow}
          {headSquare}
          <text x="8" y="14" fontSize="7" fill="#666">
            Aa
          </text>
        </svg>
      );
    case 7:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathElbow}
          {headOpen}
          <text x="8" y="14" fontSize="7" fill="#666">
            Aa
          </text>
        </svg>
      );
    default:
      return (
        <svg width="64" height="40" viewBox="0 0 64 40" aria-hidden>
          {pathElbow}
          {headFilled}
        </svg>
      );
  }
}

function NewRelationshipPickerInner({ draft, onPick, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const left = Math.max(8, draft.cx - NEW_REL_POPOVER_W / 2);
  const top = Math.max(8, draft.cy - NEW_REL_POPOVER_H / 2);

  return (
    <>
      <div className="newRelBackdrop" role="presentation" onMouseDown={onClose} />
      <div
        className="newRelPopover"
        role="dialog"
        aria-labelledby="new-rel-title"
        style={{ left, top, width: NEW_REL_POPOVER_W }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="newRelCaret" aria-hidden />
        <header className="newRelHeader">
          <h2 id="new-rel-title" className="newRelTitle">
            Add New Relationship
          </h2>
          <button type="button" className="newRelHelp" aria-label="Help" disabled title="Coming soon">
            ?
          </button>
        </header>
        <div className="newRelGrid">
          {relationshipPresets.map((presetId, idx) => (
            <button
              key={presetId}
              type="button"
              className="newRelCell"
              title={presetId}
              onClick={() => onPick(idx)}
            >
              <PresetThumb index={idx} />
            </button>
          ))}
        </div>
        <footer className="newRelFooter">
          <button type="button" className="newRelFooterBtn" disabled title="Coming soon">
            Customize
          </button>
          <button type="button" className="newRelFooterBtn" disabled title="Coming soon">
            + New
          </button>
        </footer>
      </div>
    </>
  );
}

export const NewRelationshipPicker = memo(NewRelationshipPickerInner);
