// The river's sounds, all made in code by the shared kit. Anything longer than a blip is scheduled with tone()/hiss()'s delay,
// so the player's pause (silenceScheduled) cuts it. The one loop (the water) is owned by the component.
import { buzz, hiss, loop, sfx, tone } from "../../../shared/game-sound";
import { WORLDS } from "../lib/levels";
import { PANA } from "../lib/river";

export const sound = {
  /** The world's three notes as the river starts. */
  start(world: number) {
    WORLDS[Math.max(0, Math.min(WORLDS.length - 1, world))].call.forEach((frequency, index) => tone(frequency, 0.18, 0.05, "triangle", 0.08 + index * 0.13));
  },
  /** A hop: a wooden টক on a boat or raft, a soft leafy swish on কচুরিপানা, a thud on land; a little higher with each quick hop. Plays in the pointer event itself. */
  hop(surface: number, chain: number) {
    const up = 1 + 0.05 * Math.min(8, chain);
    if (surface === PANA) { hiss(0.08, 0.06, 1500); tone(330 * up, 0.05, 0.05, "sine", 0, 250 * up); }
    else if (surface) { tone(430 * up, 0.05, 0.1, "triangle", 0, 300 * up); hiss(0.03, 0.04, 2600, "highpass"); }
    else tone(240 * up, 0.05, 0.08, "sine", 0, 180);
    if (chain >= 4) sfx.combo(chain - 4);
  },
  /** ছপাৎ: a splash and a low drop (no buzz in ধীরে খেলো). */
  splash(calm: boolean) { sfx.splash(); tone(170, 0.18, 0.1, "sine", 0, 80); if (!calm) buzz(25); },
  /** Back on the bank. */
  back() { tone(500, 0.09, 0.1, "sine", 0, 950); },
  mango() { sfx.coin(); },
  /** The signature: the ghat's brass bell, a few inharmonic partials that ring out. */
  bell() { for (const [frequency, length, volume] of [[880, 1.3, 0.1], [1760, 0.9, 0.05], [2430, 0.7, 0.035], [4750, 0.35, 0.015]] as const) tone(frequency, length, volume, "sine"); buzz([20, 30, 40]); },
  /** The ferry's horn: a low, slightly sagging ভোঁ. */
  horn() { tone(131, 0.9, 0.08, "sawtooth", 0, 124); tone(196, 0.9, 0.045, "sawtooth", 0, 186); },
  /** The current is carrying you to the edge: a soft low tick (the edge glows red as well). */
  danger() { tone(300, 0.06, 0.05, "square", 0, 240); },
  /** A hop that couldn't go (the edge of the screen). */
  blocked() { sfx.tick(); },
};

/** The water, following the current under the boy: louder and higher on fast water, quiet on land. */
export function makeWater() {
  const water = loop("wind", 420);
  return { set(volume: number, pitch: number) { water.set(volume); water.pitch(pitch); }, stop: water.stop };
}
