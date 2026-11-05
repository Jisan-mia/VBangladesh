import { ICONS } from "../lib/art";

/** One of the 64 × 64 pictures (moments, tabs, tips). */
export function Icon({ id, className = "hd-icon" }: { id: string; className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[id] ?? "" }} />;
}

/** A scene or mouth picture in the 200 × 200 box. */
export function Picture({ svg, box = 200, className }: { svg: string; box?: number; className: string }) {
  return <svg className={className} viewBox={`0 0 ${box} ${box}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}
