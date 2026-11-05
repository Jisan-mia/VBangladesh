// পাকা-কাঁচা's sounds, all synthesized through shared/game-sound.ts. Later notes go on the audio clock with tone(…, delay),
// never setTimeout, so the player's pause (silenceScheduled) cuts them. There is no loop. Every sound has a visible twin: the
// mango that lands, the key that dips, the pin that lifts, the edge that glows.
import { buzz, hiss, sfx, tone } from '../../../shared/game-sound';
import type { Mark } from '../lib/rules';

/** The signature ধপ: each mango of a new row falls on the courtyard, 120 ms apart, in step with its CSS pop. */
export function dhop(marks: readonly Mark[]) {
  marks.forEach((mark, index) => {
    const at = 0.06 + index * 0.12;
    if (mark === 'p') { tone(150, 0.17, 0.22, 'sine', at, 52); hiss(0.06, 0.07, 450, 'lowpass', at); }
    else if (mark === 'a') tone(260, 0.11, 0.1, 'sine', at, 140);
    else tone(1500, 0.025, 0.03, 'triangle', at);
  });
  if (marks.includes('p')) buzz(12);
}

/** দেখো: a wooden knock before the mangoes fall. */
export function knock() {
  tone(210, 0.05, 0.12, 'triangle', 0, 140);
  tone(90, 0.06, 0.09, 'sine', 0.004, 60);
}

/** মুছো: a short dry tick going down. */
export const rub = () => tone(700, 0.04, 0.05, 'triangle', 0, 500);

/** A pin of the boss lock lifting: a small bright brass click, higher for each pin already open. */
export function pin(open: number, delay = 0) {
  tone(1700 + open * 260, 0.05, 0.07, 'square', delay);
  tone(420, 0.06, 0.06, 'triangle', delay + 0.003, 300);
}

/** The last try begins: two slow low beats, so the red edge isn't the only sign. */
export function heartbeat() {
  tone(70, 0.14, 0.2, 'sine', 0, 48);
  tone(66, 0.16, 0.16, 'sine', 0.2, 46);
  buzz([18, 90, 18]);
}

/** The boss lock opens: the bolt, then a warm chord. */
export function unlock() {
  tone(130, 0.12, 0.2, 'triangle', 0, 70);
  tone(2300, 0.014, 0.07, 'square', 0.1);
  [392, 494, 587, 784].forEach((frequency, index) => tone(frequency, 0.5, 0.06, 'triangle', 0.22 + index * 0.07));
  buzz([20, 40, 20]);
}

/** A level cleared: the shared fanfare. Three stars or a world's end gets the bigger one. */
export const cleared = (big: boolean) => (big ? sfx.levelUp() : sfx.good());
export const missed = sfx.lose;
export const refused = sfx.wrong;
export const typed = sfx.tap;
