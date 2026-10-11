// Tiny synthesized sounds (no audio files): the bicycle bell's double ring and a soft pick-up blip.
// Only ever called after the person turns sound on, so the AudioContext starts from a tap as browsers require.
let audio: AudioContext | null = null;

function context() {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    return audio;
  } catch { return null; }
}

function tone(a: AudioContext, frequency: number, start: number, length: number, volume: number) {
  const oscillator = a.createOscillator(), gain = a.createGain();
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.004);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(gain).connect(a.destination);
  oscillator.start(start);
  oscillator.stop(start + length + 0.02);
}

/** ক্রিং-ক্রিং: two strikes of a small metal dome (a few inharmonic partials that fade). */
export function bell() {
  const a = context();
  if (!a) return;
  for (const strike of [0, 0.13]) for (const [frequency, volume] of [[2350, 0.09], [3720, 0.05], [5480, 0.025]] as const) tone(a, frequency, a.currentTime + strike, 0.45, volume);
}

export function blip() {
  const a = context();
  if (!a) return;
  tone(a, 880, a.currentTime, 0.12, 0.06);
  tone(a, 1320, a.currentTime + 0.06, 0.14, 0.05);
}

/** Wakes audio from inside the tap that turns sound on. */
export const unlock = () => { context(); };
