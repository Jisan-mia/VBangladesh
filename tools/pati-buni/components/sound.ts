// The frame's sounds, all made in code by the shared kit. Anything longer than a blip is scheduled with tone()/hiss()'s delay,
// so the player's pause (silenceScheduled) cuts it. No loops: the danger heartbeat is a tone the step schedules.
import { hiss, sfx, tone } from "../../../shared/game-kit";
import { WORLDS } from "../lib/levels";

export const sound = {
  /** The signature: a bamboo knock and a dry সরসর, then the world's three-note call. */
  begin(world: number) {
    tone(220, 0.07, 0.12, "triangle", 0, 140); hiss(0.4, 0.09, 1800, "bandpass", 0.06);
    WORLDS[Math.max(0, Math.min(WORLDS.length - 1, world))].call.forEach((frequency, index) => tone(frequency, 0.2, 0.06, "triangle", 0.42 + index * 0.14));
  },
  /** Sliding a strip one cell: a light tap of cane; against a wall or the stack, a dull knock. */
  nudge: () => tone(1500, 0.02, 0.035, "triangle"),
  knock: () => tone(260, 0.04, 0.04, "triangle"),
  /** Turning a strip: a short cane creak. A wet strip that won't turn: a damp thud. */
  creak: () => { tone(700, 0.05, 0.05, "triangle", 0, 950); hiss(0.03, 0.03, 4000, "highpass"); },
  stuck: () => { tone(150, 0.08, 0.08, "sine", 0, 110); hiss(0.06, 0.05, 600, "lowpass"); },
  /** A strip settles into the weave: a dry rustle. Straight down: a soft thump first. */
  rustle: () => hiss(0.09, 0.08, 2600, "bandpass"),
  plonk: () => tone(170, 0.1, 0.12, "sine", 0, 90),
  /** Rows weave and roll away: সরসর, one swish per row and one more; a gold row adds a chime. */
  weave(rows: number, gold: boolean) {
    for (let k = 0; k <= rows; k++) hiss(0.13, 0.09, 1600 + k * 600, "bandpass", k * 0.1);
    if (gold) { tone(1568, 0.12, 0.06, "triangle", 0.05); tone(2093, 0.22, 0.05, "triangle", 0.12); }
  },
  combo: (step: number) => sfx.combo(step),
  /** An old row pushing up from below: a low rumble. */
  rise: () => { tone(90, 0.28, 0.12, "sine", 0, 60); hiss(0.25, 0.08, 400, "lowpass"); },
  /** The সুই slipping into its hole: a high টিং. */
  ting: () => { tone(2637, 0.08, 0.05, "triangle"); tone(3520, 0.16, 0.035, "triangle", 0.05); },
  /** গোটানো: the bottom rows roll away, a long whoosh. */
  roll: () => { hiss(0.6, 0.12, 900, "bandpass"); tone(330, 0.3, 0.06, "triangle", 0.1, 196); },
  /** Danger: a soft heartbeat. */
  beat: () => { tone(70, 0.09, 0.1, "sine", 0, 55); tone(64, 0.08, 0.07, "sine", 0.16, 50); },
  win: () => sfx.win(),
  levelUp: () => sfx.levelUp(),
  lose: () => sfx.lose(),
  tap: () => sfx.tap(),
};
