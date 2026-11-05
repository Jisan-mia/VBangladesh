// The ride's sounds, all made in code by the shared kit. Anything longer than a blip is scheduled with tone()/hiss()'s
// delay, so the player's pause (silenceScheduled) cuts it. Every sound has a visible twin on screen.
import { buzz, hiss, sfx, tone } from "../../../shared/game-kit";
import { WORLDS } from "../lib/levels";

/** ক্রিং-ক্রিং: two strikes of a small metal dome (a few inharmonic partials that fade). */
const bell = (delay = 0) => { for (const strike of [0, 0.13]) for (const [frequency, volume] of [[2350, 0.09], [3720, 0.05], [5480, 0.025]] as const) tone(frequency, 0.45, volume, "sine", delay + strike); };

export const sound = {
  /** The signature: the bell, then the world's three-note call. */
  start(world: number) {
    bell();
    WORLDS[Math.max(0, Math.min(WORLDS.length - 1, world))].call.forEach((frequency, index) => tone(frequency, 0.2, 0.05, "triangle", 0.34 + index * 0.13));
  },
  /** A late dodge. */
  bell: () => bell(),
  /** A paper flick and a chime that climbs with the delivery streak. */
  deliver(streak: number) { hiss(0.05, 0.05, 3400, "highpass"); sfx.combo(Math.min(9, Math.max(0, streak - 1))); },
  /** A letter off the road into the bag: a short paper whisk. */
  pick() { hiss(0.07, 0.05, 2600, "bandpass"); tone(1760, 0.06, 0.03, "triangle", 0.02); },
  /** A gate's hand drops: a soft low note. */
  miss: () => tone(262, 0.18, 0.04, "sine", 0, 196),
  /** A splash for puddles and mud, a thud otherwise. */
  bump(kind: number, wreck: boolean, calm: boolean) {
    if (kind === 0) { sfx.splash(); tone(300, 0.2, 0.05, "sine", 0, 120); }
    else { sfx.thud(); }
    if (!calm) buzz(wreck ? [30, 40, 30] : 30);
  },
  /** A ভ্যান sets off: its two-tone horn. */
  van() { tone(392, 0.16, 0.07, "square"); tone(311, 0.22, 0.07, "square", 0.17); },
  /** A dog barks. */
  dog() { for (const at of [0, 0.15]) { tone(420, 0.09, 0.07, "sawtooth", at, 300); hiss(0.07, 0.05, 1500, "bandpass", at); } },
  /** A gust's rush. */
  gust: () => hiss(0.7, 0.09, 1700, "bandpass"),
  /** Mud: a wet squelch. */
  mud: () => { hiss(0.18, 0.06, 500, "lowpass"); tone(140, 0.12, 0.04, "sine", 0, 90); },
  /** A finale's notch. */
  notch: (good: boolean) => tone(good ? 1175 : 330, good ? 0.1 : 0.14, 0.04, "triangle"),
  /** Arrival: the bell twice and a rising run. */
  arrive() { bell(); bell(0.4); [523, 659, 784, 1047].forEach((frequency, index) => tone(frequency, 0.16, 0.05, "triangle", 0.75 + index * 0.1)); },
};
