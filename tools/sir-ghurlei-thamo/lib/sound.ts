// The classroom's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing). Every note is a
// scheduled tone() or hiss(), so the player's pause (silenceScheduled) cuts anything still waiting.
import { buzz, hiss, loop, tone } from "../../../shared/game-sound";

/** The signature: the school bell, a brass plate struck with a hammer. `strokes` clangs, `gap` seconds apart. */
export function bell(strokes = 2, gap = 0.42, delay = 0) {
  for (let i = 0; i < strokes; i++) {
    const at = delay + i * gap;
    tone(1180, 0.9, 0.07, "triangle", at, 1150);
    tone(2950, 0.5, 0.025, "sine", at, 2900);
    tone(590, 0.7, 0.04, "sine", at, 585);
    hiss(0.03, 0.06, 4200, "highpass", at);
  }
}

/** A clear: the tiffin bell's quick run, then a three-note tune pitched for the class. */
const TUNE = [659, 784, 988];
const WORLD_PITCH = [1, 9 / 8, 4 / 3];
export function cleared(world: number) {
  bell(4, 0.16);
  const pitch = WORLD_PITCH[Math.max(0, Math.min(2, world))];
  TUNE.forEach((note, i) => tone(note * pitch, 0.22, 0.09, "triangle", 0.75 + i * 0.13));
  buzz([20, 40, 20]);
}

/** Chalk on the board while the teacher writes: `stroke` varies the pitch. */
export const chalk = (stroke: number) => hiss(0.08, 0.05, 3000 + stroke * 900, "bandpass");
/** Two soft footsteps as the hand comes down and the teacher starts to turn. */
export function footsteps() { tone(95, 0.08, 0.16, "sine", 0, 60); tone(90, 0.08, 0.14, "sine", 0.2, 58); }
export function cough() { hiss(0.09, 0.12, 700, "bandpass"); hiss(0.09, 0.1, 650, "bandpass", 0.17); }
/** Glasses wiped on a handkerchief: a thin squeak, twice. */
export function squeak() { tone(2400, 0.07, 0.025, "sine", 0, 2900); tone(2500, 0.07, 0.02, "sine", 0.18, 3000); }
/** The duster's swish across the board, and the thump as it lands back on the tray. */
export function duster() { hiss(0.5, 0.07, 1800, "bandpass"); tone(140, 0.08, 0.1, "sine", 0.55, 90); }
/** A sleeper's snore. */
export function snore() { hiss(0.5, 0.05, 300, "lowpass"); tone(80, 0.45, 0.04, "sawtooth", 0, 70); }
/** The paper hand-off: a dry rustle. The rising note per bench is the kit's combo. */
export const rustle = () => hiss(0.06, 0.07, 5200, "highpass");
/** A throw: a quick swish through the air. */
export const toss = () => hiss(0.25, 0.08, 2600, "bandpass");
/** A catch: a ruler knocked twice on the table, and a low buzz. */
export function knock() { tone(620, 0.04, 0.12, "square", 0, 400); tone(600, 0.04, 0.1, "square", 0.12, 380); tone(196, 0.18, 0.07, "square", 0.22, 147); buzz([30, 40, 30]); }
/** "উফ!": a stop in the last moment, a soft falling whistle. */
export const phew = () => tone(900, 0.2, 0.05, "sine", 0, 520);
/** Footsteps in the corridor before the headmaster looks in. */
export function corridor() { for (let i = 0; i < 3; i++) tone(120, 0.07, 0.08, "sine", i * 0.26, 80); }
/** The power going: the fan winding down. The tube light coming back: its buzz. */
export const powerDown = () => tone(180, 0.6, 0.06, "sawtooth", 0, 60);
export function powerUp() { tone(100, 0.5, 0.03, "square", 0, 100); hiss(0.4, 0.03, 6000, "highpass"); }
/** A star popping in on the end screen, `delay` seconds from now. */
export const starChime = (index: number, delay: number) => tone([1047, 1319, 1568][Math.max(0, Math.min(2, index))], 0.18, 0.09, "triangle", delay);
/** A finale lost: the chit taken to the table. */
export function lost() { [392, 330, 262].forEach((f, i) => tone(f, 0.24, 0.1, "triangle", i * 0.14)); buzz(60); }

/** The chit's hum: a soft tone that climbs the longer it moves (0 silent .. 1 a long run). */
export function hum() {
  const voice = loop("hum", 150);
  return {
    set(moving: boolean, run: number) { voice.set(moving ? 0.28 : 0); if (moving) voice.pitch(150 + Math.min(1, run / 3) * 170); },
    stop: voice.stop,
  };
}
