// Browser-side game helpers: a pausing game loop, a sharp canvas, the "ধীরে খেলো" toggle and a best score.
// The pure helpers live in game-core.ts (import those from share.ts and lib/ code); they're re-exported here for components.
import { useCallback, useEffect, useRef, useState } from 'react';
export * from './game-core';
export * from './game-sound';
import { readLevels, recordLevel, unlockedLevel, type LevelStars } from './game-core';
import { soundOn, setSoundOn } from './game-sound';

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

/** The site-wide sound switch (on by default). Every game's toggle shares it. */
export function useSound() {
  const [on, setOn] = useState(true);
  useEffect(() => { setOn(soundOn()); }, []);
  const change = useCallback((next: boolean) => { setSoundOn(next); setOn(next); }, []);
  return [on, change] as const;
}

/** Stars per level on this phone, the highest playable level, and `record(level, stars)`, which returns true for a better result. */
export function useLevels(slug: string, count: number) {
  const key = `ektukhani-levels-${slug}`;
  const [stars, setStars] = useState<LevelStars>({});
  useEffect(() => { setStars(readLevels(read(key), count)); }, [key, count]);
  const record = useCallback((level: number, earned: number) => {
    const before = readLevels(read(key), count), next = recordLevel(before, level, earned);
    write(key, JSON.stringify(next));
    setStars(next);
    return (next[level] ?? 0) > (before[level] ?? 0);
  }, [key, count]);
  return { stars, unlocked: unlockedLevel(stars, count), record };
}
