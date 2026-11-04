// ক্যারম's sounds, all through shared/game-sound. টুপ (the pocket) is the signature; every one has a visible twin on the board.
import { hiss, loop, sfx, soundOn, tone } from "../../../shared/game-sound";

/** The striker leaves the finger: a sharp wooden click. */
export const click = () => { tone(1800, 0.025, 0.08, "square"); tone(420, 0.06, 0.1, "triangle", 0, 260); };
/** Disc on disc: a short clack, louder for a harder hit (k 0–1). */
export const clack = (k: number) => { tone(1250, 0.035, 0.03 + 0.08 * k, "square", 0, 700); hiss(0.025, 0.04 + 0.08 * k, 3800, "highpass"); };
/** Into a pocket: টুপ, a hollow drop into the net. A second or third coin in one strike drops a step higher. */
export const toop = (nth = 0) => { const lift = 1 + Math.min(nth, 3) * 0.12; tone(560 * lift, 0.13, 0.14, "sine", 0, 190 * lift); tone(150, 0.12, 0.1, "sine", 0.05, 70); };
/** Off the cushion: a soft thump. */
export const cushion = (k: number) => tone(120, 0.08, 0.04 + 0.09 * k, "sine", 0, 70);
/** The queen drops, and the brighter chime when she's covered. */
export const queen = () => sfx.coin();
export const covered = () => { tone(1319, 0.12, 0.08, "triangle"); tone(1760, 0.22, 0.07, "triangle", 0.08); };
/** A foul: the striker in the net. */
export const foul = () => sfx.wrong();
/** The start card's striker set down on the board. */
export const setDown = () => { tone(320, 0.07, 0.12, "sine", 0, 180); hiss(0.05, 0.05, 2600, "bandpass"); };

type Hum = ReturnType<typeof loop>;
/**
 * The pull's hum: its pitch follows power. `want` comes from the session (live play, something held, the strike not yet gone).
 * Turning sound off stops every loop in the kit, and a hum made while sound is off is a silent stub, so whenever the switch has
 * flipped since the hum was made, it is replaced, never reused.
 */
export function makeHum() {
  let hum: Hum | null = null, madeWith = false;
  return {
    update(want: boolean, power: number) {
      if (!want) { this.stop(); return; }
      if (hum && madeWith !== soundOn()) this.stop();
      if (!hum) { madeWith = soundOn(); hum = loop("hum", 110); }
      hum.set(0.3);
      hum.pitch(110 + 330 * power);
    },
    stop() { hum?.stop(); hum = null; },
    /** A real, sounding hum (not a muted stub). */
    get on() { return hum !== null && madeWith; },
  };
}
