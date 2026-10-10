export const MAX_NAME = 20;
export const MAX_TRIES = 99;
export const MAX_SEED = 9999;
export const OVER_BALLS = 6;

export const modes = [
  { id: "last5", label: "শেষ বলে ৫", need: 5, balls: 1, ask: "শেষ বল, দরকার ৫", won: "শেষ বলে ছক্কা!", placard: ["শেষ বলে", "ছক্কা!"] },
  { id: "over12", label: "শেষ ওভারে ১২", need: 12, balls: OVER_BALLS, ask: "শেষ ওভার, দরকার ১২", won: "শেষ ওভারে ১২ তুলেছি!", placard: ["শেষ ওভারে", "১২ তুলেছি!"] },
] as const;
export type ModeId = (typeof modes)[number]["id"];
export const modeOf = (id: ModeId) => modes.find(mode => mode.id === id)!;

/** A ball's result: runs, or "W" for bowled. */
export type Outcome = 0 | 1 | 2 | 4 | 6 | "W";
export type Delivery = { speed: number; centre: number };
export type Shared = { mode: ModeId; seed: number; tries: number; name: string; runs: Outcome[] };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

// Same seed, same balls: a challenge link gives the friend exactly the deliveries you faced.
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function delivery(seed: number, mode: ModeId, ball: number): Delivery {
  const next = random(seed * 131 + ball * 7 + (mode === "over12" ? 50021 : 0));
  // One sweep of the bar takes 0.95–1.3 s; the sweet spot sits somewhere in the middle 30%.
  return { speed: Math.round(950 + next() * 350), centre: 0.35 + next() * 0.3 };
}

/** Where the marker is (0 = left edge, 1 = right) `ms` after the ball starts; it sweeps there and back. */
export function positionAt(ms: number, speed: number) {
  const phase = (Math.max(0, ms) / speed) % 2;
  return phase <= 1 ? phase : 2 - phase;
}

// Distance from the sweet spot, as a share of the bar. The red ends of the bar are always "bowled".
export const zones = { six: 0.05, four: 0.1, two: 0.16, one: 0.23, edge: 0.06 } as const;

export function outcomeAt(position: number, centre: number): Outcome {
  if (position < zones.edge || position > 1 - zones.edge) return "W";
  const distance = Math.abs(position - centre);
  if (distance <= zones.six) return 6;
  if (distance <= zones.four) return 4;
  if (distance <= zones.two) return 2;
  if (distance <= zones.one) return 1;
  return 0;
}

export const outcomeWord: Record<string, string> = { 6: "ছক্কা!", 4: "চার!", 2: "দুই রান", 1: "এক রান", 0: "ডট বল", W: "বোল্ড!" };

export type Innings = { runs: number; state: "playing" | "won" | "lost" };

export function innings(mode: ModeId, balls: readonly Outcome[]): Innings {
  const { need, balls: limit } = modeOf(mode);
  let runs = 0;
  for (const ball of balls) {
    if (ball === "W") return { runs, state: "lost" };
    runs += ball;
    if (runs >= need) return { runs, state: "won" };
  }
  return { runs, state: balls.length >= limit ? "lost" : "playing" };
}

export function cleanName(name: string) {
  // NFC so the same name typed on two keyboards matches; strip control and bidi-override characters so a link can't scramble the card.
  return name.normalize("NFC").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME);
}

export function shareHash({ mode, seed, tries, name, runs }: Shared) {
  const params = new URLSearchParams({ m: mode, s: String(seed), t: String(Math.min(tries, MAX_TRIES)) });
  const shown = cleanName(name);
  if (shown) params.set("n", shown);
  if (mode === "over12") params.set("b", runs.join(""));
  return "#" + params.toString();
}

const whole = (value: string | null, min: number, max: number) => value && /^\d{1,4}$/.test(value) && +value >= min && +value <= max ? +value : null;

export function parseShareHash(hash: string): Shared | null {
  if (hash.length > 400) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const mode = params.get("m");
  if (mode !== "last5" && mode !== "over12") return null;
  const seed = whole(params.get("s"), 1, MAX_SEED);
  const triesText = params.get("t");
  const tries = triesText && /^\d{1,4}$/.test(triesText) && +triesText >= 1 ? Math.min(+triesText, MAX_TRIES) : null;
  if (seed === null || tries === null) return null;
  let runs: Outcome[] = [6];
  if (mode === "over12") {
    const code = params.get("b") ?? "";
    if (!/^[01246]{1,6}$/.test(code)) return null;
    runs = [...code].map(Number) as Outcome[];
    // Only an innings that wins on its very last ball is a real result.
    const played = innings(mode, runs);
    if (played.state !== "won" || innings(mode, runs.slice(0, -1)).state !== "playing") return null;
  }
  return { mode, seed, tries, name: cleanName(params.get("n") ?? ""), runs };
}

export function triesText(tries: number) {
  return tries === 1 ? "প্রথম চেষ্টাতেই" : `${bn(tries)} বারের চেষ্টায়`;
}

export function humanLine(tries: number) {
  if (tries === 1) return "এক চেষ্টায়! গ্যালারি পাগল।";
  if (tries <= 3) return "একটু সময় নিল, কিন্তু বল গেল সোজা গ্যালারিতে।";
  if (tries <= 9) return "হাল ছাড়েনি। শেষমেশ বল মাঠের বাইরে!";
  return "যত বারই লাগুক, ম্যাচ জেতানো তো জেতানোই।";
}

export function bucket(tries: number) {
  return tries === 1 ? "1" : tries <= 3 ? "2-3" : tries <= 9 ? "4-9" : "10+";
}
export const buckets = [
  { id: "1", label: "প্রথম চেষ্টায়" },
  { id: "2-3", label: "২-৩ বারে" },
  { id: "4-9", label: "৪-৯ বারে" },
  { id: "10+", label: "১০ বা তার বেশি" },
] as const;
export const tallyIds = modes.flatMap(mode => buckets.map(item => `${mode.id}:${item.id}`));

export function caption(shared: Shared) {
  const { won } = modeOf(shared.mode);
  return `${won} ${triesText(shared.tries)}। তুমি কয় চেষ্টায় পারবে? একই বল, খেলে দেখো:`;
}

export function previewTitle(shared: Shared) {
  const who = shared.name || "এক বন্ধু";
  const what = shared.mode === "last5" ? "শেষ বলে ছক্কা মেরেছে" : "শেষ ওভারে ১২ তুলেছে";
  return `${who} ${triesText(shared.tries)} ${what} — তুমি পারবে?`;
}
