// Tiny synthesized ঢোল sounds (no audio files): a low thump on every beat, a bright slap when you catch it, a soft splash in the কচুরিপানা.
// Only ever called after the person turns sound on, so the AudioContext starts from a tap as browsers require.
let audio: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function context() {
  try {
    audio ??= new AudioContext();
    if (audio.state === "suspended") void audio.resume();
    return audio;
  } catch { return null; }
}

/** A drum hit: a sine that drops in pitch and fades. */
function thump(a: AudioContext, from: number, to: number, length: number, volume: number) {
  const oscillator = a.createOscillator(), gain = a.createGain(), start = a.currentTime;
  oscillator.frequency.setValueAtTime(from, start);
  oscillator.frequency.exponentialRampToValueAtTime(to, start + length);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(gain).connect(a.destination);
  oscillator.start(start);
  oscillator.stop(start + length + 0.02);
}

/** ধিন: the beat. */
export function dhin() { const a = context(); if (a) thump(a, 140, 55, 0.22, 0.32); }

/** তা: you caught it. */
export function ta() { const a = context(); if (a) { thump(a, 420, 230, 0.09, 0.16); thump(a, 180, 90, 0.12, 0.18); } }

/** ছপ: into the কচুরিপানা (a short burst of filtered noise). */
export function splash() {
  const a = context();
  if (!a) return;
  if (!noise) {
    noise = a.createBuffer(1, Math.floor(a.sampleRate * 0.3), a.sampleRate);
    const data = noise.getChannelData(0);
    for (let index = 0; index < data.length; index++) data[index] = (Math.random() * 2 - 1) * (1 - index / data.length);
  }
  const source = a.createBufferSource(), filter = a.createBiquadFilter(), gain = a.createGain();
  source.buffer = noise; filter.type = "lowpass"; filter.frequency.value = 900; gain.gain.value = 0.25;
  source.connect(filter).connect(gain).connect(a.destination);
  source.start();
}

/** Wakes audio from inside the tap that turns sound on. */
export const unlock = () => { context(); };
