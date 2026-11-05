// The quilt's sounds, all synthesized through shared/game-sound.ts. Later notes go on the audio clock with tone(…, delay),
// never setTimeout, so the player's pause and a fresh cloth (silenceScheduled) cut them. No loops: nothing here needs stopping.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";

/** A stitch pulled through the cloth: a short thread hiss and the needle's tick. The bot's needle ticks a little lower. */
export function stitch(bot: boolean) {
  hiss(0.07, 0.07, bot ? 2000 : 2700, "bandpass");
  tone(bot ? 1150 : 1500, 0.02, 0.035, "square", 0.05);
}
/** A box closed: a click, then a bloom chime that climbs with each box in the same turn. A জরির ঘর adds a shimmer. */
export function bloom(chain: number, gold: boolean) {
  tone(2200, 0.015, 0.05, "square");
  sfx.combo(chain);
  if (gold) { tone(2637, 0.12, 0.035, "sine", 0.06); tone(3136, 0.16, 0.03, "sine", 0.12); }
  buzz(10);
}
/** An armed stitch, one that gives flowers away: a soft low knock. */
export function warn() { tone(180, 0.09, 0.08, "triangle", 0, 150); }
/** The phone changes hands: two quick notes. */
export function handOff() { tone(660, 0.07, 0.05, "triangle"); tone(880, 0.09, 0.05, "triangle", 0.08); }
/** The signature, কাঁথার সুর: four lullaby notes when sewing starts. */
export function lullaby() {
  [[523, 0], [587, 0.18], [659, 0.36], [784, 0.58]].forEach(([frequency, at], index) => {
    tone(frequency, index === 3 ? 0.45 : 0.2, 0.06, "triangle", at);
    tone(frequency * 2, 0.1, 0.012, "sine", at);
  });
}
/** The end: a rising fanfare for a win, a soft chime for a draw, a gentle fall for a loss, a beat after the last bloom. */
export function cheer(kind: "win" | "big" | "draw" | "loss") {
  const at = 0.32;
  if (kind === "loss") { [392, 330, 262].forEach((f, i) => tone(f, 0.24, 0.08, "triangle", at + i * 0.14)); return; }
  if (kind === "draw") { tone(988, 0.12, 0.08, "triangle", at); tone(1319, 0.16, 0.07, "triangle", at + 0.08); return; }
  const notes = kind === "big" ? [784, 988, 1175, 1568] : [523, 659, 784, 1047];
  notes.forEach((f, i) => tone(f, 0.22, 0.1, "triangle", at + i * 0.09));
  if (kind === "big") tone(2093, 0.3, 0.05, "sine", at + 0.36);
  buzz([20, 40, 20]);
}
export const tap = sfx.tap;
export const undoSound = sfx.whoosh;
