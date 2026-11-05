// The plate's sounds, all synthesized through shared/game-sound.ts and scheduled on the audio clock (tone's delay), so the
// player's pause cuts anything still waiting. Each has a visible twin on screen.
import { buzz, hiss, tone } from "../../../shared/game-kit";

export const sound = {
  /** The signature: a pressed-tin ঘুঁটি clinking into place, one per ঘুঁটি in the line, timed to land with the slide. */
  clink(count: number, delay: number) {
    for (let i = 0; i < Math.min(count, 4); i++) {
      const at = delay + i * 0.03;
      tone(2350 - i * 70, 0.05, 0.05, "triangle", at);
      tone(3650, 0.03, 0.022, "sine", at + 0.004);
    }
    tone(180, 0.05, 0.05, "sine", delay, 120);
  },
  /** A line lifting under the finger: a short tin scrape. */
  scrape: () => hiss(0.07, 0.045, 1900, "bandpass"),
  /** The dull টং of a ঘুঁটি that can't move. */
  tonk() { tone(190, 0.1, 0.07, "square", 0, 150); buzz(12); },
  /** A rising chord each time another row falls into place; higher with every row. */
  chord(rows: number, delay = 0.1) {
    [0, 4, 7].forEach((semi, i) => tone(440 * 2 ** ((semi + rows * 2) / 12), 0.24, 0.07, "triangle", delay + i * 0.06));
  },
  /** খেলো: the plate rattles as the ঘুঁটি fly to the level's start. */
  rattle() {
    for (let i = 0; i < 7; i++) tone(2100 + ((i * 397) % 900), 0.035, 0.035, "triangle", i * 0.055);
    hiss(0.4, 0.05, 2600, "bandpass");
  },
  /** A world's finale solved: its four-note motif. */
  motif(world: number) {
    const notes = [[523, 659, 784, 1047], [587, 740, 880, 1175], [659, 784, 988, 1319], [440, 554, 659, 880]][world] ?? [523, 659, 784, 1047];
    notes.forEach((f, i) => { tone(f, 0.26, 0.09, "triangle", 0.15 + i * 0.13); tone(f / 2, 0.3, 0.04, "sine", 0.15 + i * 0.13); });
  },
};
