// The flight's sounds, all made in code by the shared kit. Anything longer than a blip is scheduled with tone()/hiss()'s
// delay, so the player's pause (silenceScheduled) cuts it. Every sound has a visible twin on screen.
import { buzz, hiss, sfx, tone } from "../../../shared/game-kit";
import { WORLDS } from "../lib/levels";

export const sound = {
  /** The signature: a paper flick and the throw's whoosh, then the world's three-note call. */
  throw(world: number) {
    hiss(0.05, 0.08, 4200, "highpass"); hiss(0.32, 0.12, 2600, "bandpass", 0.04); tone(420, 0.22, 0.05, "sine", 0.04, 900);
    WORLDS[Math.max(0, Math.min(WORLDS.length - 1, world))].call.forEach((frequency, index) => tone(frequency, 0.2, 0.055, "triangle", 0.45 + index * 0.14));
  },
  /** A new page thrown after a fall: a quick fold and a smaller whoosh. */
  rethrow: () => { hiss(0.06, 0.08, 5200, "highpass"); hiss(0.05, 0.07, 4200, "highpass", 0.09); hiss(0.25, 0.09, 2400, "bandpass", 0.16); },
  candy: (streak: number) => { sfx.combo(Math.min(9, Math.max(0, streak - 1))); tone(2637, 0.05, 0.025, "triangle", 0.02); },
  /** Into warm air: a soft rising breath. Into a fan's or a bell's push: a low whir. A gust: a rush. Rain: a patter. */
  warm: () => { hiss(0.5, 0.06, 700, "lowpass"); tone(220, 0.45, 0.03, "sine", 0, 440); },
  fan: () => { tone(90, 0.35, 0.05, "sawtooth", 0, 70); hiss(0.3, 0.05, 1200, "bandpass"); },
  gust: () => hiss(0.6, 0.08, 1800, "bandpass"),
  rain: () => { for (let index = 0; index < 6; index++) tone(3200 + (index % 3) * 400, 0.02, 0.02, "triangle", index * 0.07); },
  /** A crash: paper crumpling, a thud (a splash on the river). */
  crash(water: boolean) {
    if (water) { sfx.splash(); tone(300, 0.2, 0.06, "sine", 0, 120); }
    else { hiss(0.05, 0.12, 3800, "highpass"); hiss(0.05, 0.1, 3000, "highpass", 0.06); hiss(0.07, 0.09, 2400, "highpass", 0.13); tone(130, 0.14, 0.12, "sine", 0.02, 60); }
    buzz(40);
  },
  /** Touchdown: a paper tap and a chime; on the bullseye, the school bell's bright টিং. */
  land(bull: boolean) {
    tone(900, 0.05, 0.05, "triangle"); hiss(0.08, 0.05, 2200, "bandpass");
    if (bull) { tone(1568, 0.5, 0.07, "triangle", 0.06); tone(2349, 0.6, 0.04, "sine", 0.06); buzz([15, 30, 15]); }
    else tone(1175, 0.25, 0.05, "triangle", 0.06);
  },
  /** The ceiling or the far wall: a wooden ঠক. */
  knock: () => tone(240, 0.06, 0.08, "triangle", 0, 160),
  /** A stall: the paper flutters. */
  stall: () => { for (let index = 0; index < 4; index++) tone(500 - index * 40, 0.03, 0.03, "square", index * 0.05); },
  /** A finale's beat, a second ahead: the school bell, the crowd's ভোকাট্টা whistle, the ferry's ভেঁপু. */
  warn(world: number) {
    if (world === 0) { for (let ring = 0; ring < 3; ring++) { tone(1320, 0.25, 0.05, "triangle", ring * 0.28); tone(1980, 0.18, 0.025, "sine", ring * 0.28); } }
    else if (world === 1) { tone(900, 0.18, 0.05, "sine", 0, 1700); tone(1700, 0.3, 0.04, "sine", 0.2, 1200); }
    else { tone(150, 0.7, 0.07, "sawtooth"); tone(225, 0.7, 0.03, "sawtooth"); }
  },
  checkpoint: () => tone(1760, 0.06, 0.025, "triangle"),
};
