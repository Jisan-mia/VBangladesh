// The water's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
// Every one has a visible twin, named beside it. Celebrations are scheduled tones, so the player's pause cuts them.
import { buzz, hiss, loop, sfx, tone } from "../../../shared/game-sound";

/** The rod swishing through the air, longer for a longer cast (the rod whips). */
export const swish = (power: number) => hiss(0.16 + power * 0.14, 0.1, 1800 + power * 1600, "bandpass");
/** The float landing: a small "টুপ" and the splash under it (the ripple). */
export function plop() { tone(420, 0.12, 0.12, "sine", 0, 150); hiss(0.12, 0.07, 1100, "lowpass", 0.01); }
/** A nibble: a faint tick, so the ear also learns it's not the real one (the float twitches). */
export const nibble = () => tone(880, 0.05, 0.05, "sine", 0, 700);
/** The real bite: a deep "গুপ" as the float goes under (the float vanishes, a big ring). */
export function dip() { tone(300, 0.18, 0.16, "sine", 0, 90); hiss(0.18, 0.08, 700, "lowpass", 0.02); buzz(12); }
/** The strike: a quick yank of the line (the rod bends, লেগেছে! pops). */
export function strike() { hiss(0.08, 0.1, 3600, "highpass"); tone(180, 0.1, 0.1, "sine", 0, 90); buzz(18); }
/** A tell: the water swirls (the boiling ring, the edge glow). */
export const tell = () => { hiss(0.32, 0.07, 500, "lowpass"); tone(240, 0.22, 0.05, "triangle", 0, 330); };
/** A surge or a rush: the fish thrashes (the rod bends hard, the shadow darts). */
export function thrash() { hiss(0.18, 0.1, 900, "lowpass"); buzz(10); }
/** A leap: a splash high and then low (the fish arcs out of the water). */
export function leap() { hiss(0.12, 0.09, 2400, "bandpass"); hiss(0.26, 0.14, 800, "lowpass", 0.5); }
/** A boss notch of দম breaks (the notch cracks, দম ভাঙল! pops). */
export function notch() { tone(523, 0.1, 0.08, "triangle"); tone(784, 0.18, 0.08, "triangle", 0.08); hiss(0.08, 0.08, 5000, "highpass"); buzz(14); }
/** A boss arrives under the bubbles (its huge shadow, its name). */
export function boss() { tone(110, 0.6, 0.12, "sine", 0, 80); tone(165, 0.5, 0.06, "triangle", 0.25); }
/** The reel's whirr: a hum whose pitch climbs with the tension (the needle). A fresh loop each time sound comes back. */
export const hum = () => { const h = loop("hum", 90); h.set(0.3); return h; };
export const steerHum = (h: ReturnType<typeof loop>, tension: number) => { h.set(0.22 + 0.45 * tension); h.pitch(80 + tension * 260); };
/** The signature, "ধরা পড়ল!": the fish breaks the surface with a splash, then a bright open chord (the fish lifts out). */
export function caught(rare: boolean) {
  sfx.splash();
  [523, 659, 784].forEach(frequency => tone(frequency, 0.5, 0.07, "triangle", 0.16));
  tone(rare ? 1568 : 1047, 0.45, 0.06, "triangle", 0.3);
  buzz([15, 30, 15]);
}
/** The line snaps: a thin twang falling away (the line whips, the red edge flashes). */
export function snap() { tone(1500, 0.22, 0.08, "square", 0, 260); buzz([30, 40, 30]); }
/** A fish slips off or spits the bait: a soft splash and a low note (the shadow fades). */
export function slip() { hiss(0.25, 0.1, 800, "lowpass"); tone(220, 0.22, 0.07, "triangle", 0.05, 160); }
/** Each water's four-note motif at a level's start, pitched per water. */
const MOTIF = [392, 523, 587, 784], PITCH = [1, 0.94, 0.84, 0.75];
export const motif = (world: number) => MOTIF.forEach((note, at) => tone(note * PITCH[world], 0.16, 0.06, "triangle", 0.05 + at * 0.13));
/** The end: stars chime one by one; a cleared world or a record gets the fanfare; a lost trip falls away. */
export function finale(won: boolean, stars: number, party: boolean) {
  if (!won) { [392, 330, 262].forEach((note, at) => tone(note, 0.24, 0.08, "triangle", 0.25 + at * 0.14)); return; }
  for (let star = 0; star < stars; star++) tone([1047, 1319, 1568][star], 0.18, 0.09, "triangle", 0.3 + star * 0.28);
  if (party) [784, 988, 1175, 1568, 2093].forEach((note, at) => tone(note, 0.16, 0.08, "triangle", 1.2 + at * 0.06));
}
