import type { CSSProperties } from "react";
import { bn, describe, samePick, shelfLooks, type CatId, type Choice } from "../lib/shelf";

const emblems: Record<CatId, string> = {
  natok: "M3 8h18v11H3zM8 3l4 5 4-5",
  cinema: "M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18m0 3.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 1 0 0-3.6m0 7.4a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 1 0 0-3.6m-3.7-3.7a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 1 0 0-3.6m7.4 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 1 0 0-3.6",
  boi: "M12 6 3 4v13l9 2 9-2V4l-9 2v13",
  gaan: "M3 6h18v12H3zM8 10a2 2 0 1 0 0 .1M16 10a2 2 0 1 0 0 .1M7 18l2-3h6l2 3",
};

// Longer titles get a smaller hand, so most fit on one line down the spine.
const titleSize = (title: string) => { const length = Array.from(title).length; return length <= 7 ? 20 : length <= 12 ? 18 : length <= 18 ? 16 : length <= 24 ? 14.5 : 13; };

type ShelfProps = {
  cat: CatId;
  picks: readonly Choice[];
  /** Interactive shelf: which slot is pulled out, and what tapping a spine does. */
  active?: number;
  onPick?: (slot: number) => void;
  /** Friend's shelf: spines that are on both shelves get a ribbon. */
  shared?: readonly Choice[];
  small?: boolean;
};

/** Nilkhet bookshelf: four cloth or photocopy-bound spines on a wooden shelf, with a few old books lying flat at the end. */
export function Shelf({ cat, picks, active, onPick, shared, small }: ShelfProps) {
  const looks = shelfLooks(cat, picks);
  return (
    <div className="cp-shelf" data-small={small || undefined}>
      <div className="cp-spines">
        {picks.map((pick, slot) => {
          const look = looks[slot];
          const { title, by } = describe(cat, pick);
          const style = { "--w": look.width, "--h": look.height, "--bg": look.bg, "--ink": look.ink, "--trim": look.trim, "--fs": `${titleSize(title)}px` } as CSSProperties;
          const inner = <>
            <span className="cp-spine-title">{title}</span>
            {!look.typed && <svg className="cp-emblem" viewBox="0 0 24 24" aria-hidden="true"><path d={emblems[cat]} /></svg>}
            {shared?.some(item => samePick(item, pick)) && <i className="cp-ribbon" aria-hidden="true" />}
          </>;
          const key = `${slot}-${typeof pick === "number" ? pick : `t${pick}`}`;
          return onPick
            ? <button type="button" key={key} className="cp-spine" data-style={look.style} data-typed={look.typed || undefined} style={style} aria-pressed={active === slot} aria-label={`${bn(slot + 1)} নম্বর: ${title}${by ? `, ${by}` : ""}। বদলাতে চাপো`} onClick={() => onPick(slot)}>{inner}</button>
            : <span key={key} className="cp-spine" data-style={look.style} data-typed={look.typed || undefined} style={style}>{inner}</span>;
        })}
        <span className="cp-stack" aria-hidden="true"><i /><i /><i /><i /></span>
      </div>
      <div className="cp-board" aria-hidden="true" />
    </div>
  );
}
