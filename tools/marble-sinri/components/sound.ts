// The marble's sounds, all made in code by the shared kit. Anything longer than a blip is scheduled with tone()/hiss()'s
// delay, so the player's pause (silenceScheduled) cuts it. The roll hum is the only loop; the component owns its life.
import { hiss, loop, sfx, tone } from "../../../shared/game-kit";
import { WORLDS } from "../lib/levels";
import { VMAX } from "../lib/physics";

const TING = [2093, 2349, 2637, 3136, 3520, 4186];

export const sound = {
  /** Glass on a ledge: a dry টক, lower and louder the harder it lands. */
  land(impact: number) {
    const weight = Math.min(1, impact / VMAX);
    tone(1900 - 700 * weight, 0.025, 0.04 + 0.05 * weight, "square");
    tone(760 - 300 * weight, 0.05 + 0.04 * weight, 0.05 + 0.06 * weight, "triangle", 0.005, 380 - 120 * weight);
  },
  /** The signature: glass touching glass, climbing with each marble picked in a row. */
  ting(streak: number) {
    const f = TING[Math.max(0, Math.min(TING.length - 1, Math.floor(streak)))];
    tone(f, 0.22, 0.07, "sine"); tone(f * 1.5, 0.3, 0.035, "sine", 0.012); tone(f * 2.76, 0.12, 0.02, "sine");
  },
  /** A cactus prick: a little "উফ" and a thud. */
  oof() { tone(330, 0.09, 0.11, "triangle", 0, 210); tone(250, 0.16, 0.08, "sawtooth", 0.05, 150); sfx.thud(); },
  /** The awning: a flat buzz. */
  awning() { sfx.wrong(); },
  /** A chance back after five marbles. */
  bonus() { tone(988, 0.09, 0.08, "triangle", 0.12); tone(1319, 0.14, 0.07, "triangle", 0.19); },
  /** A gust taking the drop. */
  gust() { hiss(0.32, 0.08, 1600, "bandpass"); },
  /** A cracked step giving way. */
  crack() { hiss(0.08, 0.16, 2600, "highpass"); tone(140, 0.12, 0.08, "triangle", 0.02, 70); },
  /** The stairs about to rush: a builder's two-note whistle. */
  whistle() { tone(1568, 0.08, 0.05, "sine"); tone(2093, 0.12, 0.05, "sine", 0.1); },
  /** The landing reached: the floor's door bell, then the world's three-note call. */
  floor(world: number) {
    tone(1319, 0.3, 0.07, "sine"); tone(1047, 0.4, 0.06, "sine", 0.16);
    WORLDS[Math.max(0, Math.min(WORLDS.length - 1, world))].call.forEach((frequency, index) => tone(frequency, 0.2, 0.06, "triangle", 0.55 + index * 0.13));
  },
  /** A floor's first move: its world's call, quietly. */
  start(world: number) { WORLDS[Math.max(0, Math.min(WORLDS.length - 1, world))].call.forEach((frequency, index) => tone(frequency, 0.12, 0.035, "triangle", index * 0.09)); },
  /** The last floor: the marble drops into the friends' hole. */
  hole() { tone(523, 0.12, 0.06, "triangle", 1.4); tone(392, 0.2, 0.08, "sine", 1.55, 260); sfx.win(); },
  lose() { sfx.lose(); },
};

/** The roll: a soft rumble while the marble rolls on a ledge; its pitch and loudness follow the marble's speed. */
export function rollHum() {
  const hum = loop("hum", 60);
  return {
    update(speed: number, vx: number, onLedge: boolean) {
      const pace = Math.min(1, Math.abs(vx) / 190);
      hum.set(onLedge ? 0.08 + 0.3 * pace : 0);
      hum.pitch(42 + speed * 0.4 + 26 * pace);
    },
    stop: hum.stop,
  };
}
