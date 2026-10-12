// The orchard's own sounds, built from the shared kit's blocks (silent when sound is off or audio is missing).
import { buzz, hiss, loop, sfx, tone } from "../../../shared/game-sound";

/** Clearing a bush: a short leaf rustle. A bigger opening rustles longer and climbs a few notes. */
export function rustle(opened: number) {
  hiss(opened > 1 ? 0.16 : 0.07, opened > 1 ? 0.13 : 0.09, 3200, "bandpass");
  hiss(0.05, 0.05, 6000, "highpass", 0.03);
  if (opened >= 8) [784, 988, 1175, 1568].slice(0, Math.min(4, Math.floor(opened / 8) + 1)).forEach((frequency, step) => tone(frequency, 0.1, 0.07, "triangle", 0.07 + step * 0.07));
  buzz(5);
}

/** Tying a গামছা: one soft buzz from inside the bush, and the cloth's flap. */
export function tie() {
  tone(190, 0.14, 0.06, "sawtooth", 0, 210);
  hiss(0.05, 0.06, 1800, "bandpass", 0.02);
  buzz(8);
}

export const untie = () => hiss(0.05, 0.05, 1400, "bandpass");

/** The signature: a cartoon swarm. A sawtooth hum that wobbles up, then fades as everyone runs. Returns a stop(). */
export function swarm(slow: boolean) {
  const hum = loop("hum", 210);
  hum.set(0.7);
  let step = 0;
  const wobble = setInterval(() => { step++; hum.pitch(210 + (step % 2 ? 60 : 0) + step * 14); hum.set(Math.max(0, 0.7 - step * 0.05)); }, slow ? 160 : 90);
  const end = setTimeout(stop, 1300);
  sfx.lose();
  buzz([40, 30, 40]);
  function stop() { clearInterval(wobble); clearTimeout(end); hum.stop(); }
  return stop;
}
