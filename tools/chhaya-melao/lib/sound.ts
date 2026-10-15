// The tool's two soft sounds of its own: the lamp switch, and a calm low note for a wrong pick (no buzzer).
import { tone } from "../../../shared/game-sound";

export const lampClick = () => { tone(2200, 0.015, 0.05, "square"); tone(140, 0.08, 0.06, "sine", 0.02); };
export const softMiss = () => tone(330, 0.14, 0.06, "sine", 0, 262);
