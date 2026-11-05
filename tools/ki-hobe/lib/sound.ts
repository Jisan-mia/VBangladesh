// The experiments' own sounds, built from the shared kit (silent when sound is off or audio is missing). Every cue is a
// tone() or hiss() (so the player's pause and the mute switch cut what is still ringing) and every cue plays at the moment its
// picture moves: the scene fires them from the animation's own start event, never from a timer. No loops, no music.
// Everything a sound says is also on screen: mute-first.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";

export type Cue = "splash" | "drip" | "whoosh" | "thud" | "click" | "grow" | "shimmer" | "rumble" | "patter" | "hum" | "tap" | "hop" | "chime0" | "chime1" | "chime2" | "chime3" | "chime4";

const CHIME = [523, 587, 659, 784, 880];

export function cue(name: string) {
  switch (name) {
    case "splash": hiss(0.28, 0.1, 900, "lowpass"); tone(220, 0.14, 0.05, "sine", 0, 150); break;
    case "drip": tone(880, 0.1, 0.05, "sine", 0, 660); break;
    case "whoosh": sfx.whoosh(); break;
    case "thud": tone(110, 0.14, 0.12, "triangle", 0, 70); break;
    case "click": tone(1320, 0.05, 0.08, "triangle"); buzz(8); break;
    case "grow": tone(392, 0.16, 0.05, "triangle"); tone(523, 0.2, 0.05, "triangle", 0.1); break;
    case "shimmer": tone(988, 0.3, 0.04, "sine"); tone(1319, 0.34, 0.03, "sine", 0.08); break;
    case "rumble": hiss(0.5, 0.05, 300, "lowpass"); break;
    case "patter": hiss(0.1, 0.05, 3200, "highpass"); break;
    case "hum": tone(260, 0.3, 0.05, "sine"); break;
    case "tap": tone(180, 0.1, 0.1, "triangle", 0, 120); break;
    case "hop": tone(700, 0.05, 0.04, "triangle"); break;
    default: if (name.startsWith("chime")) tone(CHIME[Number(name.slice(5))] ?? 523, 0.3, 0.06, "triangle");
  }
}

/** A guess is made: a wooden tick, the sound of "I think this one". */
export const guessed = () => tone(660, 0.07, 0.09, "triangle");

/**
 * The signature, "ঠিক ভেবেছি": the answer you guessed shows. Three notes up, like a lamp lit one by one.
 */
export function matched() {
  [523, 659, 784].forEach((hz, index) => tone(hz, 0.2, 0.08, "triangle", index * 0.09));
  buzz(10);
}

/** The answer was a surprise: two soft notes, down then a little up, "ও, তাই?". Never a buzzer. */
export function surprise() {
  tone(494, 0.16, 0.07, "sine");
  tone(587, 0.24, 0.07, "sine", 0.14);
}

/** The next experiment slides in: a paper swish. */
export const swish = () => hiss(0.14, 0.05, 2600, "bandpass");

/** A world's last experiment is done (a finale): four notes up from the world's root, then a soft high bell. */
export function worldTune(root: number) {
  [1, 1.25, 1.5, 2].forEach((ratio, index) => tone(root * ratio, 0.22, 0.09, "triangle", 0.1 + index * 0.13));
  tone(root * 3, 0.5, 0.04, "sine", 0.66);
}
