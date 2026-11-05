// The yard's sounds, all synthesized through shared/game-sound.ts. Later notes go on the audio clock with tone(…, delay),
// never setTimeout, so the player's pause (silenceScheduled) cuts them. No loops: nothing here needs stopping.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";

/** A tamarind seed set down on the clay: a bright tick. */
export function seedTick(soft = false) { const v = soft ? 0.05 : 0.08; tone(1700, 0.03, v, "square"); tone(820, 0.05, v * 0.8, "triangle"); }
/** A tiger pebble set down: a deeper knock. */
export function stoneKnock(soft = false) { const v = soft ? 0.05 : 0.08; tone(900, 0.03, v, "square"); tone(330, 0.07, v, "triangle", 0, 260); }
/** The leap and the take: a swish through the air, the landing thud, then a short cartoon growl. */
export function leap() {
  hiss(0.16, 0.1, 2200, "bandpass");
  tone(150, 0.16, 0.2, "sine", 0.14, 55);
  tone(210, 0.3, 0.07, "sawtooth", 0.2, 120);
  tone(150, 0.26, 0.05, "square", 0.24, 95);
  hiss(0.24, 0.06, 480, "lowpass", 0.2);
  buzz([10, 30, 18]);
}
/** One tiger with nowhere to go: a rope pulled tight. */
export function rope() { hiss(0.12, 0.07, 1600, "bandpass"); tone(260, 0.12, 0.06, "triangle", 0.05, 330); }
/** Both tigers pinned: three drum knocks and a rising call. */
export function trapped() {
  for (let beat = 0; beat < 3; beat++) tone(110 + beat * 8, 0.12, 0.16, "triangle", beat * 0.13);
  [523, 659, 784].forEach((frequency, index) => tone(frequency, 0.24, 0.08, "triangle", 0.42 + index * 0.1));
  buzz([20, 40, 20]);
}
/** The signature: a shepherd's flute, four notes, when a game starts. */
export function flute() {
  [[587, 0], [659, 0.16], [784, 0.32], [880, 0.5]].forEach(([frequency, at], index) => {
    tone(frequency, index === 3 ? 0.5 : 0.2, 0.06, "sine", at, index === 3 ? frequency * 1.012 : undefined);
    tone(frequency * 2, 0.12, 0.012, "sine", at);
  });
}
export const pick = sfx.pick;
export const tap = sfx.tap;
export const drop = sfx.drop;
