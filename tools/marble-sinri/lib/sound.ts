// The marble's own sounds, built from the shared kit (silent when sound is off or there is no audio).
import { loop, sfx, tone } from "../../../shared/game-sound";

/** Glass on a ledge: a short dry টক. */
export function landClick() {
  tone(1800, 0.025, 0.07, "square");
  tone(700, 0.05, 0.07, "triangle", 0.005, 420);
}

const TING = [2093, 2349, 2637, 3136, 3520, 4186];
/** The signature: glass touching glass. It climbs with each marble picked up in a row. */
export function ting(streak: number) {
  const f = TING[Math.max(0, Math.min(TING.length - 1, Math.floor(streak)))];
  tone(f, 0.22, 0.07, "sine");
  tone(f * 1.5, 0.3, 0.035, "sine", 0.012);
  tone(f * 2.76, 0.12, 0.02, "sine");
}

/** A cactus prick: a little "উফ" and a thud. */
export function oof() {
  tone(330, 0.09, 0.11, "triangle", 0, 210);
  tone(250, 0.16, 0.08, "sawtooth", 0.05, 150);
  sfx.thud();
}

/** The roll: a soft rumble while the marble rolls on a ledge; its pitch follows the stairs' speed. */
export function rollHum() {
  const hum = loop("hum", 60);
  return {
    update(speed: number, onLedge: boolean, rolling: boolean) {
      hum.set(onLedge ? (rolling ? 0.34 : 0.14) : 0);
      hum.pitch(44 + speed * 0.45 + (rolling ? 16 : 0));
    },
    stop: hum.stop,
  };
}
