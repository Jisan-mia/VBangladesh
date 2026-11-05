'use client';
// The pictures: an icon, and the scene with its "?" bubble, the ring that lights what matters, and the safe picture
// landing in the bubble. All drawn in code (lib/art.ts); nothing is fetched.
import { HEADS, ICONS, sceneMarkup } from '../lib/art';
import type { Item } from '../lib/levels';
import type { Ring } from '../lib/sets';

export function Icon({ id, className = 'nt-icon' }: { id: string; className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: ICONS[id] ?? '' }} />;
}

/** Where the bubble floats: above and a little right of the child's head, kept inside the 320×160 box. */
export const bubbleAt = (scene: string): [number, number] => {
  const [hx, hy] = HEADS[scene] ?? [160, 90];
  return [Math.min(296, hx + 20), Math.max(24, hy - 42)];
};

/**
 * The scene. `ring` lights the part that explains why: dashed amber after a miss (a hint), solid green on the right answer.
 * `answer` is the safe picture's icon once found; it lands in the bubble where the "?" was.
 */
export function SceneView({ item, ring, answer, index }: { item: Item; ring: 'none' | 'hint' | 'why'; answer: string | null; index: number }) {
  const look: Ring = item.question.look, [bx, by] = bubbleAt(item.scene);
  return <div className="nt-scene" key={`${item.set}-${index}`}>
    <svg viewBox="0 0 320 160" role="img" aria-label={item.question.ask}>
      <g dangerouslySetInnerHTML={{ __html: sceneMarkup(item.scene, item.question.prop) }} />
      <circle className={`nt-ring ${ring}`} cx={look.x} cy={look.y} r={look.r} />
      {answer
        ? <g className="nt-landed" style={{ transformOrigin: `${bx}px ${by}px` }}>
            <circle cx={bx} cy={by} r={25} fill="#fff" stroke="#2e9e44" strokeWidth={3.4} />
            <g transform={`translate(${bx - 19} ${by - 19}) scale(${38 / 64})`} dangerouslySetInnerHTML={{ __html: ICONS[answer] ?? '' }} />
            <circle cx={bx + 19} cy={by - 19} r={9} fill="#2e9e44" />
            <path d={`M${bx + 14.6} ${by - 19}l3.2 3.2 5.4-6.4`} fill="none" stroke="#fff" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        : <g className="nt-bubble">
            <circle cx={bx - 14} cy={by + 24} r={3.2} fill="#fff" stroke="#2f2a3a" strokeWidth={1.6} />
            <circle cx={bx - 7} cy={by + 15} r={4.8} fill="#fff" stroke="#2f2a3a" strokeWidth={1.6} />
            <circle cx={bx} cy={by} r={17} fill="#fff" stroke="#2f2a3a" strokeWidth={2.2} />
            <text x={bx} y={by + 8} textAnchor="middle" fontSize="23" fontWeight="800" fill="#2459a8" fontFamily="var(--font-display), sans-serif">?</text>
          </g>}
    </svg>
  </div>;
}

/** The finger that shows the first tap. */
export function Finger() {
  return <svg className="nt-finger" viewBox="0 0 48 64" aria-hidden="true">
    <circle className="nt-ripple" cx="20" cy="10" r="16" />
    <path d="M14 10a6 6 0 0 1 12 0v20l4-2a6 6 0 0 1 6 2l6 6a8 8 0 0 1 2 6v8c0 6-5 12-12 12H22c-5 0-9-3-11-7L4 40a5 5 0 0 1 8-6l2 3z" fill="#fff" stroke="#2f2a3a" strokeWidth="2.5" strokeLinejoin="round" />
  </svg>;
}
