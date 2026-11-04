// A tiny drawing of each kind of difference (and each new twist), so the start card and the hint show it, not only say it.
import type { ReactNode } from "react";
import type { Fresh } from "../lib/levels";

const PATHS: Readonly<Record<Fresh, ReactNode>> = {
  missing: <><rect x="3" y="7" width="7" height="10" rx="1.5" /><rect x="14" y="7" width="7" height="10" rx="1.5" strokeDasharray="2 2" /></>,
  color: <><circle cx="7.5" cy="12" r="4.5" className="fill-a" /><circle cx="16.5" cy="12" r="4.5" className="fill-b" /></>,
  count: <><circle cx="4" cy="9" r="1.8" className="fill-a" /><circle cx="8" cy="9" r="1.8" className="fill-a" /><circle cx="6" cy="15" r="1.8" className="fill-a" /><circle cx="16" cy="9" r="1.8" className="fill-a" /><circle cx="20" cy="9" r="1.8" className="fill-a" /><path d="M11.5 6v12" /></>,
  flip: <><path d="M12 4v16" strokeDasharray="2 2" /><path d="M9 7 4 12l5 5z" className="fill-a" /><path d="M15 7l5 5-5 5z" /></>,
  size: <><rect x="2.5" y="6" width="10" height="12" rx="1.5" /><rect x="15.5" y="11" width="6" height="7" rx="1" /></>,
  shift: <><rect x="3" y="8" width="7" height="8" rx="1.5" strokeDasharray="2 2" /><rect x="13" y="8" width="7" height="8" rx="1.5" /><path d="M7 20h9m-2-2 2 2-2 2" /></>,
  turn: <><rect x="4" y="7" width="7" height="10" rx="1.5" /><rect x="13" y="7" width="7" height="10" rx="1.5" transform="rotate(18 16.5 17)" /></>,
  text: <><path d="M3 17 6.5 7 10 17M4.3 13.5h4.4" /><path d="M14 17l3.5-10 3.5 10M15.3 13.5h4.4" /><path d="M17.5 4.5v1.5" /></>,
  shade: <><circle cx="7.5" cy="12" r="4.5" className="fill-a" /><circle cx="16.5" cy="12" r="4.5" className="fill-a light" /></>,
  still: <><path d="M3 9c2-3 4 3 6 0" /><path d="M3 15c2-3 4 3 6 0" /><path d="M14 9h7M14 15h7" /></>,
  more: <><circle cx="6" cy="12" r="2.4" className="fill-a" /><circle cx="12" cy="12" r="2.4" className="fill-a" /><circle cx="18" cy="12" r="2.4" className="fill-a" /></>,
  small: <><circle cx="11" cy="11" r="6" /><path d="m15.5 15.5 5 5" /><circle cx="11" cy="11" r="1.6" className="fill-a" /></>,
  moving: <><path d="M3 15c3 0 3-4 6-4s3 4 6 4 3-4 6-4" /><path d="M8 8l2-3 2 3" /></>,
  dark: <><path d="M9 6h6M10 6v2M14 6v2" /><path d="M8.5 9c-2 3-2 7 0 9h7c2-2 2-6 0-9z" /><path d="M12 15.5c-1-1.2-.6-2.6 0-3.6.6 1 1 2.4 0 3.6z" className="fill-a" /></>,
  finale: <><path d="M12 3l2.6 5.6 6.1.6-4.6 4.1 1.3 6L12 16.3 6.6 19.3l1.3-6L3.3 9.2l6.1-.6z" className="fill-a" /></>,
};

export function KindIcon({ kind, className = "" }: { kind: Fresh; className?: string }) {
  return <svg className={`bk-kind ${className}`} viewBox="0 0 24 24" aria-hidden="true">{PATHS[kind]}</svg>;
}
