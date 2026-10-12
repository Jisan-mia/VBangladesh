// Pure game helpers (no React): seeded randomness, names and challenge links. Safe to import from share.ts on the server.

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


/** Stars earned per level on this phone: { level: 1..3 }. A level counts as cleared with at least one star. */
export type LevelStars = Record<number, number>;

export function readLevels(raw: string | null, count: number): LevelStars {
  const stars: LevelStars = {};
  try {
    const parsed = JSON.parse(raw ?? '{}');
    for (const [key, value] of Object.entries(parsed ?? {})) {
      const level = Number(key), earned = Number(value);
      if (Number.isInteger(level) && level >= 1 && level <= count && Number.isInteger(earned) && earned >= 1 && earned <= 3) stars[level] = earned;
    }
  } catch { /* broken JSON: start fresh */ }
  return stars;
}

/** Keeps the better result for a level. */
export const recordLevel = (stars: LevelStars, level: number, earned: number): LevelStars =>
  ({ ...stars, [level]: Math.max(stars[level] ?? 0, Math.max(1, Math.min(3, Math.round(earned)))) });

/** The highest level you may play: one past the highest cleared, never above `count`. */
export const unlockedLevel = (stars: LevelStars, count: number) => Math.min(count, 1 + Math.max(0, ...Object.keys(stars).map(Number)));

export const totalStars = (stars: LevelStars) => Object.values(stars).reduce((sum, earned) => sum + earned, 0);

/**
 * Stars from a result against two thresholds. `lowerIsBetter` for moves or seconds (3 stars at or under `three`).
 * e.g. starsFor(moves, 12, 18, true) → 3 for ≤12 moves, 2 for ≤18, else 1.
 */
export function starsFor(value: number, three: number, two: number, lowerIsBetter = false) {
  if (lowerIsBetter) return value <= three ? 3 : value <= two ? 2 : 1;
  return value >= three ? 3 : value >= two ? 2 : 1;
}
