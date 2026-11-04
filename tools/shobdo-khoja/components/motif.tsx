// Each world's little drawing for its badge, start card and sheet: drawn in code, one per pack, in the world's ink.
import type { ReactNode } from "react";
import { type PackId } from "../lib/packs";

const PATHS: Record<PackId, ReactNode> = {
  phul: <>
    {[0, 72, 144, 216, 288].map(turn => <ellipse key={turn} cx="12" cy="6.6" rx="3.4" ry="4.6" transform={`rotate(${turn} 12 12)`} />)}
    <circle cx="12" cy="12" r="2.6" className="sk-motif-eye" />
  </>,
  mach: <>
    <path d="M3 12c3.5-5 10-6 14-1l4-3v8l-4-3c-4 5-10.5 4-14-1z" />
    <circle cx="7.4" cy="11.2" r="1.1" className="sk-motif-eye" />
  </>,
  pitha: <>
    <path d="M3 15a9 9 0 0 1 18 0z" />
    <path d="M6 13.5l1.2-2M9.4 12l.6-2.4M14 12l-.6-2.4M18 13.5l-1.2-2" className="sk-motif-line" />
  </>,
  phol: <>
    <path d="M12 21c-5 0-7.5-4-7.5-8.2C4.5 8 8 5.4 12 6.8c4-1.4 7.5 1.2 7.5 6C19.5 17 17 21 12 21z" />
    <path d="M12 7c.2-2 1.2-3.6 3.6-4.2-.2 2.2-1.4 3.6-3.6 4.2z" className="sk-motif-eye" />
  </>,
  pakhi: <>
    <path d="M3 14c3-1 5-4 9-4 2.2 0 3.4-2.6 5.4-2.6 1.4 0 2.6.8 3.6 2l-2.4.8c-.6 4.6-4.6 7.8-9.6 7.8l-2.6 3-.2-3.6C4.6 17 3.4 15.8 3 14z" />
    <circle cx="17.6" cy="9.6" r=".9" className="sk-motif-eye" />
  </>,
  khela: <>
    <path d="M12 2l7 8-7 8-7-8z" />
    <path d="M12 2v16M5 10h14" className="sk-motif-line" />
    <path d="M12 18c-1 1.6 1 2.2 0 4" className="sk-motif-line" />
  </>,
  ritu: <>
    <circle cx="12" cy="12" r="4.6" />
    {[0, 45, 90, 135, 180, 225, 270, 315].map(turn => <path key={turn} d="M12 2.4v3" className="sk-motif-line" transform={`rotate(${turn} 12 12)`} />)}
  </>,
  nodi: <>
    <path d="M3 13h18l-3 4.4H6z" />
    <path d="M11 13V4l6 7.4z" />
    <path d="M2 20.4c2 0 2-1.2 4-1.2s2 1.2 4 1.2 2-1.2 4-1.2 2 1.2 4 1.2 2-1.2 4-1.2" className="sk-motif-line" />
  </>,
};

export function Motif({ pack, className = "sk-motif" }: { pack: PackId; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true">{PATHS[pack]}</svg>;
}
