import { walker } from "../lib/spines";

/** The moonlit road. The more books read, the farther the walker has gone toward the horizon. */
export function NightRoad({ progress }: { progress: number }) {
  const scale = 0.5 - 0.36 * progress;
  const x = 98 + 8 * progress, y = 128 - 32 * progress;
  return (
    <svg className="hm-road" viewBox="0 0 160 130" aria-hidden="true">
      <circle className="hm-moon-glow" cx="118" cy="32" r="30" />
      <circle className="hm-moon" cx="118" cy="32" r="15" />
      <path className="hm-path" d="M104 92h6l46 38H48Z" />
      <g className="hm-walker" style={{ transform: `translate(${x - 50 * scale}px, ${y - 140 * scale}px) scale(${scale})` }}>
        <path d={walker.skin} fill="#0a0f26" />
        <path d={walker.panjabi} fill="#f4c430" />
      </g>
    </svg>
  );
}
