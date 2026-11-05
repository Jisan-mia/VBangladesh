// The name book's drawings as React: a picture by id, the child figure (or a close-up of it), the open book on the title,
// the small pictures for each kind of clue in the level list, and the end screen's two button pictures. All inline SVG.
import type { PointerEvent as ReactPointerEvent } from "react";
import { BODY, PEEK, VIEWS, artMarkup, bushMarkup, type View } from "../lib/art";
import type { Kind } from "../lib/levels";
import { packOf, type PackId } from "../lib/packs";

export function Pic({ id, className = "ns-pic" }: { id: string; className?: string }) {
  if (id === "body") return <svg className={className} viewBox={VIEWS.face} aria-hidden="true" dangerouslySetInnerHTML={{ __html: BODY }} />;
  return <svg className={className} viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: artMarkup(id) }} />;
}

/** উঁকি: the picture with a bush over its lower part. The bush drops away once the right sticker is found. */
export function PeekPic({ id, open }: { id: string; open: boolean }) {
  return <svg className="ns-pic ns-peek" viewBox="0 0 100 100" aria-hidden="true">
    <g className="ns-peek-art" dangerouslySetInnerHTML={{ __html: artMarkup(id) }} />
    <g className={`ns-bush${open ? " away" : ""}`} dangerouslySetInnerHTML={{ __html: bushMarkup(PEEK[id] ?? 52) }} />
  </svg>;
}

export type Ring = { at: [number, number]; kind: "right" | "wrong" | "hint" | "show" };

/** The child figure (face or whole), with rings on parts. A tap reports the figure point under the finger. */
export function Figure({ view, rings, onTap, className = "ns-figure", focus, side = 30 }: {
  view: View; rings: Ring[]; onTap?: (x: number, y: number) => void; className?: string; focus?: [number, number]; side?: number;
}) {
  const box = focus ? `${focus[0] - side / 2} ${focus[1] - side / 2} ${side} ${side}` : VIEWS[view];
  const tap = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!onTap || !event.isPrimary || event.button > 0) return;
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    onTap(point.x, point.y);
  };
  return <svg className={className} viewBox={box} onPointerDown={onTap ? tap : undefined} aria-hidden="true">
    <g dangerouslySetInnerHTML={{ __html: BODY }} />
    {rings.map(({ at, kind }, index) => <circle key={`${kind}${index}`} className={`ns-ring ${kind}`} cx={at[0]} cy={at[1]} r={view === "face" && !focus ? 6.5 : 10} />)}
  </svg>;
}

/** A sticker's picture on the page strip or the end page: a picture, or a close-up of the figure around a spot. */
export function CellPic({ art, spot, className = "ns-pic" }: { art: string; spot: [number, number] | null; className?: string }) {
  return spot ? <Figure view="body" focus={spot} rings={[]} className={className} /> : <Pic id={art} className={className} />;
}

/** The finger that shows the first tap: its tip at the centre of whatever it sits in. */
export const FINGER = <svg className="ns-ghost" viewBox="0 0 40 52" aria-hidden="true"><path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#3d2f28" strokeWidth="2.6" strokeLinejoin="round" /></svg>;

/** Three stickers each world shows on its book. */
const COVER: Record<PackId, [string, string, string]> = {
  pashu: ["cat", "cow", "duck"], fol: ["mango", "banana", "watermelon"], sobji: ["carrot", "tomato", "brinjal"],
  shorir: ["body", "body", "body"], rong: ["lal", "holud", "nil"], protik: ["flag", "shapla", "doyel"],
};

/** The title's start art: the open name book with three of the world's stickers and their name tags. */
export function BookArt({ world }: { world: PackId }) {
  const pack = packOf(world), [a, b, c] = COVER[world];
  const name = (id: string) => pack.items.find(item => item.art === id || item.id === id)?.bn ?? "";
  const body = world === "shorir";
  return <svg className="ns-book" viewBox="0 0 320 210" aria-hidden="true">
    <path d="M14 30q73-16 146 6v164q-73-20-146-6z" fill="#fffdf6" stroke="#3d2f28" strokeWidth="3" strokeLinejoin="round" />
    <path d="M306 30q-73-16-146 6v164q73-20 146-6z" fill="#fffdf6" stroke="#3d2f28" strokeWidth="3" strokeLinejoin="round" />
    <path d="M160 36v164" stroke="#3d2f28" strokeWidth="3" />
    <path d="M28 186q66-10 124 4M168 190q58-14 124-4" fill="none" stroke="var(--ns-edge)" strokeWidth="3" strokeLinecap="round" />
    {body
      ? <svg x="34" y="40" width="108" height="150" viewBox={VIEWS.body} dangerouslySetInnerHTML={{ __html: BODY }} />
      : <g className="ns-book-sticker"><rect x="34" y="48" width="108" height="108" rx="18" fill="#fff" stroke="var(--ns-edge)" strokeWidth="3" />
        <svg x="40" y="54" width="96" height="96" viewBox="0 0 100 100" dangerouslySetInnerHTML={{ __html: artMarkup(a) }} /></g>}
    {!body && <text x="88" y="180" textAnchor="middle" className="ns-book-name">{name(a)}</text>}
    {body
      ? <>
          <g className="ns-book-sticker"><circle cx="232" cy="84" r="44" fill="#fff" stroke="var(--ns-edge)" strokeWidth="3" />
            <svg x="190" y="42" width="84" height="84" viewBox="40 22 40 40" dangerouslySetInnerHTML={{ __html: BODY }} /></g>
          <text x="232" y="158" textAnchor="middle" className="ns-book-name">নাক · চোখ</text>
        </>
      : <>
          <rect x="178" y="50" width="56" height="56" rx="12" fill="#fff" stroke="var(--ns-edge)" strokeWidth="2.5" />
          <svg x="182" y="54" width="48" height="48" viewBox="0 0 100 100" dangerouslySetInnerHTML={{ __html: artMarkup(b) }} />
          <text x="268" y="86" textAnchor="middle" className="ns-book-small">{name(b)}</text>
          <rect x="178" y="118" width="56" height="56" rx="12" fill="#fff" stroke="var(--ns-edge)" strokeWidth="2.5" strokeDasharray="6 5" />
          <svg x="182" y="122" width="48" height="48" viewBox="0 0 100 100" className="ns-book-faint" dangerouslySetInnerHTML={{ __html: artMarkup(c) }} />
          <text x="268" y="154" textAnchor="middle" className="ns-book-small">{name(c)}</text>
        </>}
  </svg>;
}

/** A small picture of each kind of clue, for the level list. */
export function KindIcon({ kind, world }: { kind: Kind | "finale"; world: PackId }) {
  const pack = packOf(world), sample = pack.items[0];
  if (world === "shorir" && kind !== "bn" && kind !== "en") return <span className="ns-kind ns-kind-lens"><Figure view="face" focus={[60, 45]} rings={[]} className="ns-pic" /></span>;
  switch (kind) {
    case "match": return <span className="ns-kind ns-kind-faint"><Pic id={sample.art} /></span>;
    case "peek": return <span className="ns-kind"><PeekPic id={sample.art} open={false} /></span>;
    case "home": return <span className="ns-kind"><Pic id="river" /></span>;
    case "bn": return <span className="ns-kind ns-kind-word">অ</span>;
    case "en": return <span className="ns-kind ns-kind-word" lang="en">A</span>;
    case "role": return <span className="ns-kind"><Pic id="flag" /></span>;
    case "paint": return <span className="ns-kind ns-kind-faint"><Pic id="tomato" /></span>;
    case "splat": return <span className="ns-kind"><Pic id="lal" /></span>;
    case "lens": return <span className="ns-kind ns-kind-lens"><Figure view="face" focus={[60, 45]} rings={[]} className="ns-pic" /></span>;
    default: return <span className="ns-kind ns-kind-finale">★</span>;
  }
}

/** The end screen's two pictures: a circling arrow (আবার খেলো) and a closed book (শেষ). */
export const AgainIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M38 24a14 14 0 1 1-4.1-9.9" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /><path d="M36 6v10H26" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
export const DoneIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 8h24a4 4 0 0 1 4 4v28H14a4 4 0 0 1-4-4z" fill="currentColor" opacity=".9" /><path d="M10 36a4 4 0 0 1 4-4h24" fill="none" stroke="#fff" strokeWidth="3" /><path d="M18 16h12M18 22h8" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>;
/** → : the next card. */
export const NextIcon = () => <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 24h26M26 13l11 11-11 11" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
