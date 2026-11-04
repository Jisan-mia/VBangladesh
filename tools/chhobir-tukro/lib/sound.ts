// The game's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing). Anything that
// lands later is scheduled on the audio clock (tone's delay), so the player's pause cuts it. Each has a visible twin.
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";

/** The signature: a cardboard piece clicking into its place, a dull thock with a papery edge, timed to land with the slide. In a run, a little note climbs on top. */
export function snap(streak: number, delay = 0) {
  hiss(0.05, 0.22, 1100, "lowpass", delay);
  tone(190, 0.08, 0.18, "sine", delay, 95);
  tone(1500, 0.025, 0.035, "square", delay + 0.01);
  if (streak >= 2) tone([523, 587, 659, 784, 880, 1047, 1175, 1319][Math.min(7, streak - 2)], 0.1, 0.08, "triangle", delay + 0.02);
  buzz(10);
}

/** A wrong drop: the piece slides back over the table, soft and low. */
export function slide() {
  hiss(0.26, 0.09, 650, "lowpass");
  tone(240, 0.16, 0.04, "sine", 0, 180);
  buzz(20);
}

/** A quarter turn: a small dry click. */
export function turn() {
  tone(900, 0.03, 0.05, "triangle");
  hiss(0.03, 0.06, 2600, "bandpass");
}

/** Picking a piece up off the tray: a papery lift. */
export function lift() {
  hiss(0.05, 0.05, 3200, "bandpass");
  sfx.pick();
}

/** খেলো: the picture breaks and its pieces tumble into the tray. */
export function scatter(count: number) {
  for (let i = 0; i < Math.min(10, count); i++) {
    hiss(0.04, 0.07, 1400 + ((i * 523) % 1200), "bandpass", 0.05 + i * 0.045);
    tone(260 + ((i * 97) % 180), 0.03, 0.04, "sine", 0.05 + i * 0.045);
  }
}

/** The last edge piece: the frame is whole. */
export function frame() {
  [784, 1175].forEach((f, i) => tone(f, 0.22, 0.07, "triangle", 0.16 + i * 0.08));
}

/** The picture is whole: a short fanfare, or a world's 4-note motif on a finale. */
export function whole(world: number, finale: boolean) {
  if (!finale) { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 0.1, "triangle", 0.2 + i * 0.09)); buzz([20, 40, 20]); return; }
  const notes = [[523, 659, 784, 1047], [587, 740, 880, 1175], [440, 554, 659, 880]][world] ?? [523, 659, 784, 1047];
  notes.forEach((f, i) => { tone(f, 0.3, 0.1, "triangle", 0.2 + i * 0.15); tone(f / 2, 0.34, 0.05, "sine", 0.2 + i * 0.15); });
  buzz([20, 40, 20, 40, 30]);
}

/** A tap that does nothing (a placed piece, the board with nothing picked). */
export const tap = () => sfx.tap();

