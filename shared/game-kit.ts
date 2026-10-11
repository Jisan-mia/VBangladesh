// Shared building blocks for the গেম category: seeded randomness, challenge links, a pausing game loop,
// a sharp canvas, the "ধীরে খেলো" toggle and a best score. Each game draws and plays in its own way on top of this.
import { useCallback, useEffect, useRef, useState } from 'react';

/** Same seed → same sequence on every phone (integer math only; mulberry32). Returns numbers in [0, 1). */
export function makeRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A whole number in [0, below) from a makeRng() generator. */
export const pick = (rng: () => number, below: number) => Math.floor(rng() * below);

export const MAX_SEED = 999_999_999;
export const newSeed = () => 1 + (crypto.getRandomValues(new Uint32Array(1))[0] % MAX_SEED);

export const MAX_NAME = 20;
/** A first name for cards and links: NFC, no control or text-direction characters, single spaces, at most 20 characters. */
export function cleanName(name: string) {
  return [...name.normalize('NFC').replace(/[\u0000-\u001f\u007f‎‏‪-‮⁦-⁩]/g, '').replace(/\s+/g, ' ').trim()].slice(0, MAX_NAME).join('').trim();
}

export type Challenge = { seed: number; target: number; name: string; extra: Record<string, string> };

/**
 * Reads `s` (seed), `t` (score, time or moves to beat), `n` (name) and any game-specific keys from a #hash.
 * Returns null unless the seed and target are sane whole numbers. A real-time score can't be verified: show it as the friend's claim.
 */
export function readChallenge(hash: string, { maxTarget, extraKeys = [] }: { maxTarget: number; extraKeys?: readonly string[] }): Challenge | null {
  if (hash.length > 600) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const seed = Number(params.get('s')), target = Number(params.get('t'));
  if (!Number.isInteger(seed) || seed < 1 || seed > MAX_SEED || !Number.isInteger(target) || target < 0 || target > maxTarget) return null;
  const extra: Record<string, string> = {};
  for (const key of extraKeys) { const value = params.get(key); if (value !== null) extra[key] = value.slice(0, 120); }
  return { seed, target, name: cleanName(params.get('n') ?? ''), extra };
}

/** The #hash for a challenge link (without the "#"), in a fixed key order so the same card gives the same short link. */
export function challengeHash({ seed, target, name, extra = {} }: { seed: number; target: number; name?: string; extra?: Record<string, string | number> }) {
  const params = new URLSearchParams({ s: String(seed), t: String(Math.max(0, Math.round(target))) });
  for (const [key, value] of Object.entries(extra)) params.set(key, String(value));
  const clean = cleanName(name ?? '');
  if (clean) params.set('n', clean);
  return params.toString();
}

/**
 * Runs `step(dtSeconds)` at a fixed 60 steps a second while `running` is true, and `draw()` once per animation frame.
 * Stops when the tab is hidden (no catch-up burst on return), so a phone in a pocket never plays on its own.
 */
export function useGameLoop(step: (dt: number) => void, draw: () => void, running: boolean) {
  const stepRef = useRef(step), drawRef = useRef(draw);
  stepRef.current = step; drawRef.current = draw;
  useEffect(() => {
    if (!running) { drawRef.current(); return; }
    const STEP = 1 / 60;
    let frame = 0, last = performance.now(), carry = 0;
    const tick = (now: number) => {
      carry += Math.min(0.1, (now - last) / 1000);
      last = now;
      while (carry >= STEP) { stepRef.current(STEP); carry -= STEP; }
      drawRef.current();
      frame = requestAnimationFrame(tick);
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) { last = performance.now(); carry = 0; frame = requestAnimationFrame(tick); }
    };
    frame = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', visibility);
    return () => { cancelAnimationFrame(frame); document.removeEventListener('visibilitychange', visibility); };
  }, [running]);
}

/** Sizes a canvas for crisp drawing (device pixel ratio capped at 2 for cheap phones) and returns a context in CSS pixels. */
export function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const ratio = Math.min(2, window.devicePixelRatio || 1);
  if (canvas.width !== Math.round(width * ratio) || canvas.height !== Math.round(height * ratio)) {
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  }
  const context = canvas.getContext('2d')!;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  return context;
}

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };

/** The visible "ধীরে খেলো" toggle: on by default when the phone asks for reduced motion; remembered across games. */
export function useSlowMode() {
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const saved = read('ektukhani-slow');
    setSlow(saved === null ? matchMedia('(prefers-reduced-motion: reduce)').matches : saved === '1');
  }, []);
  const change = useCallback((next: boolean) => { setSlow(next); write('ektukhani-slow', next ? '1' : '0'); }, []);
  return [slow, change] as const;
}

/** This phone's best score for a game. `submit` returns true when the new score beats it. */
export function useBest(slug: string, higherIsBetter = true) {
  const key = `ektukhani-best-${slug}`;
  const [best, setBest] = useState<number | null>(null);
  useEffect(() => { const saved = Number(read(key)); setBest(read(key) !== null && Number.isFinite(saved) ? saved : null); }, [key]);
  const submit = useCallback((score: number) => {
    const current = Number(read(key));
    const beaten = read(key) === null || !Number.isFinite(current) || (higherIsBetter ? score > current : score < current);
    if (beaten) { write(key, String(score)); setBest(score); }
    return beaten;
  }, [key, higherIsBetter]);
  return [best, submit] as const;
}
