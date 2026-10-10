import { useId } from "react";
import { ART_HEIGHT, ART_WIDTH, fishArt } from "../lib/fish-art";
import type { FishId } from "../lib/fish";

export function FishIcon({ id, className }: { id: FishId; className?: string }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const shapes = fishArt(id);
  // The body outline is painted twice and clips the markings; define it once and <use> it.
  const bodies = [...new Set(shapes.flatMap(shape => shape.clip ? [shape.clip] : []))];
  return (
    <svg viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`} className={className} aria-hidden="true" focusable="false" strokeLinejoin="round" strokeLinecap="round">
      {bodies.length > 0 && <defs>{bodies.map((d, index) => <path key={`p${index}`} id={`${uid}p${index}`} d={d} />)}{bodies.map((_, index) => <clipPath key={`c${index}`} id={`${uid}c${index}`}><use href={`#${uid}p${index}`} /></clipPath>)}</defs>}
      {shapes.map((shape, index) => {
        const paint = { fill: shape.fill ?? "none", stroke: shape.stroke, strokeWidth: shape.width, opacity: shape.alpha, clipPath: shape.clip ? `url(#${uid}c${bodies.indexOf(shape.clip)})` : undefined };
        const body = bodies.indexOf(shape.d);
        return body >= 0 ? <use key={index} href={`#${uid}p${body}`} {...paint} /> : <path key={index} d={shape.d} {...paint} />;
      })}
    </svg>
  );
}
