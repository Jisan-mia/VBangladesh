// The rover's few soft sounds, synthesized with shared/game-sound.ts (no loops, no music). Each has a picture twin on screen:
// the wheels and the lit block for a step, the rock lifting for the chime, the nudge back for a bump, the first block lighting for the chirp.
import { buzz, sfx, tone } from "../../../shared/game-sound";

// Each world's own key, so the motor hum sounds a little higher the further the rover has come.
const ROOT = [196, 220, 247, 262] as const;

/** A finger on an arrow, ⌫ or a button. */
export const tap = () => sfx.tap();
/** Signature, "রোভারের সুর": a two-note motor hum per step, pitched by world. */
export const motor = (n: number, world = 0) => { const root = ROOT[world] ?? ROOT[0]; tone(n % 2 ? root : root * 1.125, 0.09, 0.05, "triangle", 0, n % 2 ? root * 1.19 : root * 1.33); };
export const gotSample = () => { tone(1047, 0.1, 0.06, "triangle"); tone(1568, 0.18, 0.05, "triangle", 0.08); buzz(10); };
/** A soft low thud as the rover nudges back, never a buzzer. */
export const bump = () => tone(180, 0.16, 0.07, "sine", 0, 120);
export const startChirp = () => { tone(659, 0.08, 0.06, "triangle"); tone(880, 0.12, 0.05, "triangle", 0.07); };
/** Stars at the end, one chime each, as scheduled tones so the player's pause cuts them. */
export const stars = (count: number, delay = 0.35) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, "triangle", delay + star * 0.3); };
/** A world's four-note tune when its finale is done. */
export const tune = (world: number) => { const root = (ROOT[world] ?? ROOT[0]) * 2.5; [1, 1.25, 1.5, 2].forEach((step, at) => tone(root * step, 0.2, 0.08, "triangle", 0.1 + at * 0.14)); };
