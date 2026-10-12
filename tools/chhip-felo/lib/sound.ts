// The water's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
import { buzz, hiss, loop, sfx, tone } from "../../../shared/game-sound";

/** The rod swishing through the air: longer and higher for a longer cast. */
export const swish = (power: number) => hiss(0.16 + power * 0.14, 0.1, 1800 + power * 1600, "bandpass");

/** The float landing: a small "টুপ" and the splash under it. */
export function plop() { tone(420, 0.12, 0.12, "sine", 0, 150); hiss(0.12, 0.07, 1100, "lowpass", 0.01); }

/** A nibble: a faint ripple tick, so the ear also learns it's not the real one. */
export const nibble = () => tone(880, 0.05, 0.05, "sine", 0, 700);

/** The real bite: a deeper "গুপ" as the float goes under. */
export function dip() { tone(300, 0.18, 0.16, "sine", 0, 90); hiss(0.18, 0.08, 700, "lowpass", 0.02); buzz(12); }

/** The strike: a quick yank of the line. */
export const strike = () => hiss(0.08, 0.1, 3600, "highpass");

/** A fish thrashing on the line. */
export const thrash = () => hiss(0.14, 0.08, 900, "lowpass");

/** The reel's whirr: a hum whose pitch climbs with the line's tension. Returns a handle to steer or stop. */
export function reelHum() {
  const hum = loop("hum", 90);
  hum.set(0.3);
  return { follow(tension: number) { hum.set(0.25 + 0.45 * tension); hum.pitch(80 + tension * 260); }, stop: hum.stop };
}

/** The signature: "ধরা পড়ল!" — the fish breaks the surface with a splash, then a bright open chord. */
export function caught(rare: boolean) {
  sfx.splash();
  [523, 659, 784].forEach(frequency => tone(frequency, 0.5, 0.07, "triangle", 0.16));
  tone(rare ? 1568 : 1047, 0.45, 0.06, "triangle", 0.3);
  buzz([15, 30, 15]);
}

/** The line snaps: a thin twang falling away. */
export function snap() { tone(1500, 0.22, 0.08, "square", 0, 260); buzz([30, 40, 30]); }

/** The fish slips off a slack line: a soft splash and a low note. */
export function slip() { hiss(0.25, 0.1, 800, "lowpass"); tone(220, 0.22, 0.07, "triangle", 0.05, 160); }
