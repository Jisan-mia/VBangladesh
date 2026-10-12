// The game's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";

/** The signature: a pen circling the difference on the magazine page, a quick scratch and a bright little note that climbs with each find in a row. */
export function circled(streak: number) {
  hiss(0.09, 0.08, 3200, "bandpass");
  hiss(0.07, 0.06, 4200, "bandpass", 0.07);
  sfx.combo(streak);
  buzz(10);
}

/** A tap where nothing differs: a soft low buzz, never harsh. */
export function nothingHere() {
  tone(150, 0.12, 0.06, "square", 0, 120);
  buzz(25);
}

/** The last difference found: a little run up, before the stars. */
export const allFound = () => sfx.win();
