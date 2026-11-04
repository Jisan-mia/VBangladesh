// The storm's sounds, all made in code by the shared kit. Anything longer than a blip is scheduled with tone()/hiss()'s
// delay, so the player's pause (silenceScheduled) cuts it.
import { hiss, sfx, tone } from "../../../shared/game-kit";
import { WORLDS } from "../lib/levels";

export const sound = {
  /** The signature: a low roll of thunder under a rising wind, then the world's three-note call. */
  storm(world: number) {
    hiss(1.8, 0.2, 170, "lowpass"); tone(52, 1.3, 0.14, "sine", 0, 38);
    hiss(0.9, 0.06, 900, "bandpass", 0.2);
    WORLDS[Math.max(0, Math.min(WORLDS.length - 1, world))].call.forEach((frequency, index) => tone(frequency, 0.22, 0.06, "triangle", 0.7 + index * 0.16));
  },
  thunder: (delay = 0) => { hiss(1.6, 0.18, 170, "lowpass", delay); tone(52, 1.2, 0.12, "sine", delay, 38); },
  green: () => tone(170, 0.1, 0.18, "sine", 0, 85),
  ripe: () => { tone(150, 0.1, 0.16, "sine", 0, 70); hiss(0.14, 0.12, 900, "lowpass", 0.02); tone(320, 0.09, 0.05, "sine", 0.03, 140); },
  gold: () => { tone(150, 0.1, 0.14, "sine", 0, 70); tone(1568, 0.12, 0.07, "triangle", 0.03); tone(2093, 0.22, 0.06, "triangle", 0.09); },
  ground: () => tone(105, 0.09, 0.05, "sine", 0.22, 60),
  twig: () => { hiss(0.12, 0.2, 2600, "highpass"); sfx.wrong(); },
  /** The big branch: a creak while it falls (played as it breaks off), then a heavy thud on a hit. */
  creak: () => { tone(120, 0.5, 0.05, "sawtooth", 0, 90); hiss(0.25, 0.06, 1800, "bandpass", 0.1); },
  bigHit: () => { tone(80, 0.3, 0.22, "sine", 0, 40); hiss(0.2, 0.18, 1200, "lowpass"); sfx.wrong(); },
  /** Hail: an icy clink on the ডালা (a knock-out), a tick in the dirt. */
  clink: () => { tone(2637, 0.06, 0.06, "triangle"); tone(3520, 0.1, 0.04, "triangle", 0.03); tone(180, 0.12, 0.08, "sine", 0.02, 90); },
  tick: () => tone(3100, 0.025, 0.018, "triangle"),
  /** The tree's shake in a finale: a rush of leaves. */
  rustle: () => { hiss(0.9, 0.12, 2200, "bandpass"); hiss(0.6, 0.08, 4200, "highpass", 0.25); },
  /** A hail sweep starting, from one side. */
  sweep: () => { for (let index = 0; index < 6; index++) tone(2400 + index * 120, 0.03, 0.02, "triangle", index * 0.11); },
  combo: (step: number) => sfx.combo(step),
};
