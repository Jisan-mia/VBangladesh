// Synthesized game sounds, haptics and confetti: no audio files, no dependencies. Safe to import anywhere (touches the browser only when called).
// One switch for every game: sound and vibration are ON by default, and turning them off is remembered ('ektukhani-sound' = '0').
// Browsers start audio only after a tap, so the first sound plays from inside the tap that starts a game.

const KEY = 'ektukhani-sound';
let audio: AudioContext | null = null;
let enabled: boolean | null = null;
let noiseBuffer: AudioBuffer | null = null;

export function soundOn() {
  if (enabled === null) { try { enabled = localStorage.getItem(KEY) !== '0'; } catch { enabled = true; } }
  return enabled;
}

export function setSoundOn(next: boolean) {
  enabled = next;
  try { localStorage.setItem(KEY, next ? '1' : '0'); } catch { /* private mode: fine */ }
  if (next) { context(); return; }
  // Off means silent now: loops, notes already scheduled, and a word being read aloud.
  stopLoops(); silenceScheduled();
  try { if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel(); } catch { /* no speech */ }
}

// On the dev server every sound still runs (so tests can count loops and notes) but nothing plays out loud,
// because many test tabs run at once. Set localStorage 'ektukhani-dev-sound' = '1' to hear it. Production is unaffected.
function devSilent() {
  if (process.env.NODE_ENV !== 'development') return false;
  try { return localStorage.getItem('ektukhani-dev-sound') !== '1'; } catch { return true; }
}

function context() {
  if (typeof window === 'undefined' || !soundOn()) return null;
  try {
    audio ??= new AudioContext();
    if (devSilent()) { if (audio.state === 'running') void audio.suspend(); }
    else if (audio.state === 'suspended') void audio.resume();
    return audio;
  } catch { return null; }
}

type Wave = OscillatorType;

/** One note: a quick attack and a soft fade. `slide` glides the pitch to that frequency. */
export function tone(frequency: number, length = 0.12, volume = 0.12, wave: Wave = 'sine', delay = 0, slide?: number) {
  const a = context();
  if (!a) return;
  const start = a.currentTime + delay, oscillator = a.createOscillator(), gain = a.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slide) oscillator.frequency.exponentialRampToValueAtTime(slide, start + length);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  oscillator.connect(gain).connect(a.destination);
  oscillator.start(start);
  oscillator.stop(start + length + 0.03);
  track(oscillator, gain);
}

// Notes already handed to the audio clock (a drumroll's later beats, a fanfare's tail), so a pause can cut them.
const scheduled = new Set<{ source: AudioScheduledSourceNode; gain: GainNode }>();
function track(source: AudioScheduledSourceNode, gain: GainNode) {
  const entry = { source, gain };
  scheduled.add(entry);
  source.onended = () => { scheduled.delete(entry); };
}

/**
 * Cuts every tone() and hiss() still sounding or waiting to start, with a 20 ms fade so nothing clicks. Loops are left to
 * their owners. The game player calls this when it pauses; a game can call it too (for example when a round is abandoned).
 */
export function silenceScheduled() {
  if (!audio) return;
  const now = audio.currentTime;
  for (const entry of scheduled) {
    try {
      entry.gain.gain.cancelScheduledValues(now);
      entry.gain.gain.setTargetAtTime(0, now, 0.006);
      entry.source.stop(now + 0.03);
    } catch { /* already stopped */ }
  }
  scheduled.clear();
}

function noise(a: AudioContext) {
  if (!noiseBuffer) {
    noiseBuffer = a.createBuffer(1, a.sampleRate, a.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let index = 0; index < data.length; index++) data[index] = Math.random() * 2 - 1;
  }
  const source = a.createBufferSource();
  source.buffer = noiseBuffer;
  return source;
}

/** A burst of filtered noise: splashes, swishes, paper, rain. */
export function hiss(length = 0.2, volume = 0.18, filterHz = 1200, type: BiquadFilterType = 'lowpass', delay = 0) {
  const a = context();
  if (!a) return;
  const start = a.currentTime + delay, source = noise(a), filter = a.createBiquadFilter(), gain = a.createGain();
  filter.type = type; filter.frequency.value = filterHz;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  source.connect(filter).connect(gain).connect(a.destination);
  source.start(start);
  source.stop(start + length + 0.03);
  track(source, gain);
}

const loops = new Set<() => void>();
function stopLoops() { for (const stop of [...loops]) stop(); }

/**
 * A continuous sound you steer while it plays, e.g. TV static that gets louder the further the antenna is off.
 * `set(level)` takes 0..1 (0 is silent), `pitch(hz)` retunes it, `stop()` ends it. Returns a silent stub when sound is off.
 */
export function loop(kind: 'static' | 'hum' | 'whine' | 'wind' = 'static', frequency = 120) {
  const a = context();
  const stub = { set: (_level: number) => {}, pitch: (_hz: number) => {}, stop: () => {} };
  if (!a) return stub;
  const gain = a.createGain();
  gain.gain.value = 0;
  let source: AudioScheduledSourceNode;
  let tune: AudioParam;
  if (kind === 'hum' || kind === 'whine') {
    const oscillator = a.createOscillator();
    oscillator.type = 'sawtooth'; oscillator.frequency.value = frequency;
    // 'whine' keeps the bright overtones (a mosquito, a wire); 'hum' is a soft motor or filament.
    const filter = a.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = kind === 'whine' ? 3200 : 500;
    oscillator.connect(filter).connect(gain);
    source = oscillator; tune = oscillator.frequency;
  } else {
    const buffer = noise(a) as AudioBufferSourceNode;
    buffer.loop = true;
    const filter = a.createBiquadFilter();
    filter.type = kind === 'static' ? 'bandpass' : 'lowpass';
    filter.frequency.value = kind === 'static' ? 3200 : 600;
    buffer.connect(filter).connect(gain);
    source = buffer; tune = filter.frequency;
  }
  gain.connect(a.destination);
  source.start();
  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true; loops.delete(stop);
    gain.gain.setTargetAtTime(0, a.currentTime, 0.03);
    source.stop(a.currentTime + 0.2);
  };
  loops.add(stop);
  return {
    set: (level: number) => { if (!stopped) gain.gain.setTargetAtTime(Math.max(0, Math.min(1, level)) * 0.22, a.currentTime, 0.05); },
    /** 'hum'/'whine': the tone's pitch in Hz; 'static'/'wind': the filter's centre in Hz (higher sounds thinner). */
    pitch: (hz: number) => { if (!stopped) tune.setTargetAtTime(Math.max(20, hz), a.currentTime, 0.05); },
    stop,
  };
}

/** A short vibration (ignored where phones don't support it, and when sound is off). */
export function buzz(pattern: number | number[] = 12) {
  if (!soundOn()) return;
  try { navigator.vibrate?.(pattern); } catch { /* not supported */ }
}

// A pentatonic scale, so any sequence of pads sounds musical (C D E G A, two octaves).
const SCALE = [523, 587, 659, 784, 880, 1047, 1175, 1319, 1568, 1760];

/** The shared sound palette. Every game uses these first, so the whole site sounds like one place. */
export const sfx = {
  tap: () => tone(1100, 0.04, 0.06, 'triangle'),
  pick: () => tone(660, 0.07, 0.09, 'triangle', 0, 880),
  drop: () => tone(330, 0.09, 0.12, 'sine', 0, 220),
  pop: () => { tone(500, 0.09, 0.12, 'sine', 0, 950); buzz(8); },
  good: () => { tone(988, 0.09, 0.09, 'triangle'); tone(1319, 0.14, 0.08, 'triangle', 0.07); buzz(10); },
  coin: () => { tone(1568, 0.06, 0.07, 'square'); tone(2093, 0.16, 0.06, 'square', 0.05); },
  wrong: () => { tone(196, 0.18, 0.09, 'square', 0, 147); buzz([30, 40, 30]); },
  tick: () => tone(1900, 0.02, 0.04, 'square'),
  thud: () => { tone(140, 0.16, 0.22, 'sine', 0, 50); buzz(15); },
  splash: () => hiss(0.32, 0.22, 900),
  whoosh: () => hiss(0.22, 0.12, 2400, 'bandpass'),
  /** Pad n of a melodic set (Simon-style games, combo counters). */
  note: (n: number, length = 0.28) => tone(SCALE[((n % SCALE.length) + SCALE.length) % SCALE.length], length, 0.13, 'triangle'),
  /** Rising pitch for streaks and combos: call with 0, 1, 2… */
  combo: (step: number) => tone(SCALE[Math.max(0, Math.min(Math.floor(step), SCALE.length - 1))], 0.1, 0.09, 'triangle'),
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 0.11, 'triangle', i * 0.09)); buzz([20, 40, 20]); },
  levelUp: () => { [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.16, 0.1, 'triangle', i * 0.06)); tone(2093, 0.3, 0.05, 'sine', 0.26); buzz([15, 30, 15]); },
  lose: () => { [392, 330, 262].forEach((f, i) => tone(f, 0.24, 0.1, 'triangle', i * 0.14)); buzz(60); },
  star: (n: number) => tone([1047, 1319, 1568][Math.max(0, Math.min(2, n))], 0.18, 0.09, 'triangle'),
};

const COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#ffd166', '#118ab2', '#ef476f', '#06d6a0'];

/**
 * A short confetti burst over the page (about 1.6 s), for real wins only: a level cleared, a new best, three stars.
 * Skipped when the phone asks for reduced motion or the player chose "ধীরে খেলো".
 */
export function confetti({ count = 90, x = 0.5, y = 0.35, colors = COLORS }: { count?: number; x?: number; y?: number; colors?: string[] } = {}) {
  if (typeof window === 'undefined') return;
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || localStorage.getItem('ektukhani-slow') === '1') return;
  } catch { /* storage blocked: still celebrate */ }
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:9999';
  document.body.appendChild(canvas);
  const ratio = Math.min(2, devicePixelRatio || 1), width = innerWidth, height = innerHeight;
  canvas.width = width * ratio; canvas.height = height * ratio;
  const draw = canvas.getContext('2d');
  if (!draw) { canvas.remove(); return; }
  draw.scale(ratio, ratio);
  const bits = Array.from({ length: count }, () => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9, speed = 6 + Math.random() * 8;
    return { x: x * width, y: y * height, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, spin: Math.random() * 6, turn: (Math.random() - 0.5) * 0.4, size: 5 + Math.random() * 5, color: colors[Math.floor(Math.random() * colors.length)] };
  });
  const started = performance.now();
  const frame = (now: number) => {
    const t = now - started;
    draw.clearRect(0, 0, width, height);
    for (const bit of bits) {
      bit.vy += 0.32; bit.vx *= 0.985; bit.x += bit.vx; bit.y += bit.vy; bit.spin += bit.turn;
      draw.save();
      draw.globalAlpha = Math.max(0, 1 - t / 1600);
      draw.translate(bit.x, bit.y); draw.rotate(bit.spin);
      draw.fillStyle = bit.color;
      draw.fillRect(-bit.size / 2, -bit.size / 4, bit.size, bit.size / 2);
      draw.restore();
    }
    if (t < 1600) requestAnimationFrame(frame); else canvas.remove();
  };
  requestAnimationFrame(frame);
}

/** A gentle 200 ms shake for a mistake (re-triggers on repeat calls). Skipped in reduced motion via CSS. */
export function shake(element: Element | null | undefined) {
  if (!element) return;
  try { if (localStorage.getItem('ektukhani-slow') === '1') return; } catch { /* storage blocked */ }
  element.classList.remove('gx-shake');
  void (element as HTMLElement).offsetWidth;
  element.classList.add('gx-shake');
}
