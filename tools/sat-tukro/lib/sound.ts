// The game's few sounds, all from shared/game-sound.ts (soft, no loops, no music). Anything that lands later is scheduled on
// the audio clock (tone's delay), so the player's pause cuts it. Each has a picture twin on screen: the lift, the turn, the
// shake, the settle with its dust, the stars, the sweep of light.
import { buzz, hiss, sfx, tone } from '../../../shared/game-sound';
import { WORLDS, type WorldId } from './levels';

/** One note per piece that goes in, climbing as the picture fills. */
const CLIMB = [523, 587, 659, 784, 880, 988, 1047];

export const sound = {
  /** A piece comes off the tray: a papery lift. */
  lift: () => { hiss(0.05, 0.05, 3200, 'bandpass'); sfx.pick(); },
  /** A quarter-eighth turn: a small dry click. */
  turn: () => { tone(900, 0.03, 0.05, 'triangle'); hiss(0.03, 0.06, 2600, 'bandpass'); },
  /** The mirror: a softer, lower click. */
  flip: () => { tone(620, 0.05, 0.05, 'triangle'); hiss(0.04, 0.06, 1800, 'bandpass'); },
  /** The signature: a wooden thock as the piece lands (timed with the slide), then the note for the nth piece in. */
  thock: (count: number, delay = 0.08) => {
    hiss(0.05, 0.2, 1100, 'lowpass', delay);
    tone(180, 0.09, 0.2, 'sine', delay, 90);
    tone(1500, 0.025, 0.035, 'square', delay + 0.01);
    tone(CLIMB[Math.min(CLIMB.length - 1, Math.max(0, count - 1))], 0.2, 0.08, 'triangle', delay + 0.03);
    buzz(10);
  },
  /** A wrong drop: the piece glides back, soft and low. Never a buzzer. */
  glide: () => { hiss(0.22, 0.08, 650, 'lowpass'); tone(260, 0.16, 0.04, 'sine', 0, 190); buzz(20); },
  /** Put down loose on the board, or back in the tray: a pat. */
  pat: () => { tone(300, 0.06, 0.06, 'sine', 0, 220); },
  /** Right place, still turned: a tiny two-note question. */
  ask: () => { tone(660, 0.07, 0.05, 'triangle'); tone(740, 0.09, 0.05, 'triangle', 0.08); },
  /** A tap that does nothing. */
  tap: () => sfx.tap(),
  /** The picture is whole. */
  whole: () => { [523, 659, 784, 1047].forEach((frequency, at) => tone(frequency, 0.22, 0.09, 'triangle', 0.1 + at * 0.09)); buzz([20, 40, 20]); },
  /** The stars, one chime each, scheduled so the player's pause cuts them. */
  stars: (count: number, delay = 0.7) => { for (let star = 0; star < count; star++) tone([1047, 1319, 1568][star], 0.18, 0.08, 'triangle', delay + star * 0.3); },
  /** A world's four-note tune when its finale is done. */
  tune: (world: WorldId) => {
    WORLDS[world].tune.forEach((frequency, at) => { tone(frequency, 0.3, 0.1, 'triangle', 0.9 + at * 0.15); tone(frequency / 2, 0.34, 0.05, 'sine', 0.9 + at * 0.15); });
    buzz([20, 40, 20, 40, 30]);
  },
};
