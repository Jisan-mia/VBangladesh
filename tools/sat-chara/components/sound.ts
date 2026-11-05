// The lane's own sounds, built from the shared kit (silent when sound is off or audio is missing). Each has a picture too.
import { buzz, hiss, loop, sfx, tone } from "../../../shared/game-sound";

/** The signature: clay pieces clattering, a dry খট that shifts pitch per piece. You see the dust. */
export function clatter(n: number) {
  tone(1500 + (n % 5) * 170, 0.03, 0.06, "square");
  hiss(0.045, 0.07, 3400 + (n % 3) * 500, "bandpass");
}
/** A heavy piece landing: a low thud. */
export function thud() { tone(120, 0.12, 0.16, "sine", 0, 70); hiss(0.06, 0.08, 900); }
/** The ball meeting clay: a dull rubber thwack. You see the counter pop. */
export function thwack() { tone(190, 0.09, 0.2, "triangle", 0, 95); hiss(0.05, 0.12, 2200, "bandpass"); buzz(12); }
/** The ball on the ground. */
export const bounce = () => tone(115, 0.07, 0.08, "sine", 0, 70);
/** The ball dropping into mud: ধপ. You see it stop dead. */
export function splat() { tone(90, 0.12, 0.14, "sine", 0, 55); hiss(0.1, 0.1, 500); }
/** The clothesline catching the ball: a soft twang. You see the গামছা flutter. */
export const twang = () => tone(330, 0.18, 0.06, "triangle", 0, 220);
/** মিঠু's palms closing on the ball. You see him hold it up. */
export function catchSlap() { hiss(0.05, 0.16, 1600, "bandpass"); tone(240, 0.05, 0.08, "square"); }
/** টুনি setting a piece back: টুক. You see it lift onto the pile. */
export const tuk = () => tone(880, 0.04, 0.05, "triangle");
/** A miss: a dog barks twice, very soft and far away. The line under the lane says so too. */
export function farDog() {
  for (const delay of [0, 0.2]) { tone(560, 0.08, 0.03, "sawtooth", delay, 360); hiss(0.06, 0.02, 900, "bandpass", delay); }
}
/** Letting go. You see the arm follow through. */
export const release = () => sfx.whoosh();
/** A finale won with ★★★: a four-note horn line, scheduled so the player's pause cuts it. */
export function fanfare(pitch: number) { [392, 523, 659, 784].forEach((note, at) => tone(note * pitch, 0.2, 0.08, "triangle", 0.2 + at * 0.12)); }

/** The pull while aiming: a low hum that rises with the power (the ring round the ball shows the same). */
export function stretch() {
  const hum = loop("hum", 90);
  return { set(power: number) { hum.set(0.08 + power * 0.22); hum.pitch(90 + power * 170); }, stop: hum.stop };
}
