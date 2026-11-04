"use client";
// The die: a real cube in CSS 3D. Each roll turns it forward by whole spins onto the rolled face while it is tossed up and
// lands with a squash; the wooden ঠক is scheduled to land with it (sound.ts). ধীরে খেলো shows the face at once.
import type { CSSProperties } from "react";
import { DICE_MS } from "../lib/motion.hot";

const PIPS: Record<number, [number, number][]> = {
  1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]],
  5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
};
/** The cube's turn (rotateX, rotateY) that brings each face to the front. Opposite faces add up to 7. */
const TURN: Record<number, [number, number]> = { 1: [0, 0], 6: [0, 180], 2: [0, -90], 5: [0, 90], 3: [-90, 0], 4: [90, 0] };
const FACES = [1, 6, 2, 5, 3, 4] as const;

function Face({ value }: { value: number }) {
  return (
    <span className="sl-face" data-face={value}>
      <svg viewBox="0 0 60 60" aria-hidden="true" focusable="false">
        {PIPS[value].map(([col, row], index) => <circle key={index} cx={col * 15} cy={row * 15} r={value === 1 ? 8 : 5.6} fill={value === 1 ? "#d6336c" : "#2b1a0e"} />)}
      </svg>
    </span>
  );
}

/** `spin` counts rolls: every change tumbles the cube forward and tosses it; `value` 0 shows the resting tilt on ৫. */
export function Die({ value, spin, slow, idle = false }: { value: number; spin: number; slow: boolean; idle?: boolean }) {
  const [rx, ry] = TURN[value] ?? [-24, 32];
  const style = {
    transform: `rotateX(${rx + 720 * spin}deg) rotateY(${ry + 360 * spin}deg)`,
    transitionDuration: slow || spin === 0 ? "0ms" : `${DICE_MS}ms`,
    "--toss": `${DICE_MS}ms`,
  } as CSSProperties;
  return (
    <span className="sl-die" data-idle={idle || undefined} data-toss={spin === 0 ? undefined : spin % 2 ? "a" : "b"} data-slow={slow || undefined} aria-hidden="true">
      <span className="sl-die-shadow" />
      <span className="sl-die-body">
        <span className="sl-die-cube" style={style}>{FACES.map(face => <Face key={face} value={face} />)}</span>
      </span>
    </span>
  );
}
