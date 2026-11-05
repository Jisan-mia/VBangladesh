// The street's sounds, all synthesized through shared/game-sound.ts and scheduled on the audio clock (tone's delay), so the
// player's pause cuts anything still waiting. There are no loops. Each sound has a visible twin on screen.
import { buzz, hiss, tone } from "../../../shared/game-kit";

export const sound = {
  /** The signature: the CNG's two-stroke ভটভট, `beats` pulses long. */
  putt(beats = 2, delay = 0) { for (let beat = 0; beat < beats; beat++) tone(beat % 2 ? 82 : 70, 0.06, 0.13, "square", delay + beat * 0.085); },
  /** Its squeaky horn on the way out: পিপ পিপ. */
  horn() { tone(640, 0.1, 0.06, "square"); tone(640, 0.15, 0.06, "square", 0.16); },
  /** A vehicle lifted under a finger: a rickshaw's bell, a bus's low honk, a truck's air horn, a CNG's putt. */
  lift(kind: string) {
    if (kind === "rickshaw") { tone(2300, 0.07, 0.05, "triangle"); tone(2300, 0.09, 0.05, "triangle", 0.09); }
    else if (kind === "van") { tone(1500, 0.05, 0.04, "triangle"); tone(1200, 0.06, 0.04, "triangle", 0.06); }
    else if (kind === "bus") { tone(196, 0.16, 0.07, "square"); tone(247, 0.16, 0.04, "square"); }
    else if (kind === "truck") { tone(131, 0.22, 0.07, "sawtooth"); tone(165, 0.22, 0.04, "sawtooth"); }
    else sound.putt(2);
  },
  /** A vehicle landing in its cell: a soft thunk, lower for heavier ones, timed to the spring's first touch. */
  settle(mass: number, delay = 0.1) { tone(210 / Math.sqrt(mass), 0.08, 0.09, "sine", delay, 110 / Math.sqrt(mass)); },
  /** Pushing against another vehicle: a dull clunk. */
  bump() { tone(120, 0.09, 0.1, "square", 0, 75); buzz(12); },
  /** Pushing against bricks or a barricade: a harder clank. */
  clank() { tone(310, 0.08, 0.08, "triangle", 0, 230); tone(155, 0.1, 0.07, "square", 0, 100); buzz(14); },
  /** খেলো: the jam builds, engines and hooting off the edges. */
  arrive() { hiss(0.45, 0.05, 700, "lowpass"); for (let i = 0; i < 4; i++) tone(70 + i * 9, 0.07, 0.08, "square", 0.06 + i * 0.09); },
  /** A street's finale cleared: its four-note motif. */
  motif(world: number) {
    const notes = [[523, 659, 784, 1047], [587, 740, 880, 1175], [494, 622, 740, 988], [440, 554, 659, 880]][world] ?? [523, 659, 784, 1047];
    notes.forEach((f, i) => { tone(f, 0.26, 0.09, "triangle", 0.45 + i * 0.13); tone(f / 2, 0.3, 0.04, "sine", 0.45 + i * 0.13); });
  },
};
