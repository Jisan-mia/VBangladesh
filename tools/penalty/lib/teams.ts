// The tournament: eight made-up পাড়ার দল in plain colours, পাড়া → থানা → জেলা → জাতীয়. Each match is one level.
// Skill rises one small step per match: the keeper guesses right more often and reaches further,
// the shooter misses less, hides the side longer and now and then finds an unsaveable corner.

export type Keeper = {
  /** Chance the keeper dives to the side you actually shot at (otherwise a free guess among three). */
  read: number;
  /** How far the dive reaches, in goal units (the goal is 2 wide and 1 high). */
  reach: number;
};
export type Shooter = {
  /** Chance a kick misses the goal on its own. */
  miss: number;
  /** Chance a kick goes in the top corner: a goal even when you dive the right way. */
  corner: number;
  /** Chance the run-up lean points where the ball really goes. */
  honest: number;
  /** When the lean shows, as a fraction of the run-up (later is harder to read). */
  tellAt: number;
};
export type Opponent = { name: string; kit: string; shorts: string; keeperKit: string; keeper: Keeper; shooter: Shooter };

export const STAGES = ["পাড়া", "থানা", "জেলা", "জাতীয়"] as const;

export const OPPONENTS: readonly Opponent[] = [
  { name: "কলপাড় একাদশ", kit: "#3a86c8", shorts: "#1f2a44", keeperKit: "#5b6470", keeper: { read: 0.1, reach: 0.25 }, shooter: { miss: 0.45, corner: 0, honest: 1, tellAt: 0.25 } },
  { name: "বটতলা কিশোর সংঘ", kit: "#2f9e44", shorts: "#1b5e2b", keeperKit: "#6a4c93", keeper: { read: 0.18, reach: 0.28 }, shooter: { miss: 0.38, corner: 0, honest: 1, tellAt: 0.3 } },
  { name: "রেলগেট একাদশ", kit: "#e9b824", shorts: "#4a3b1c", keeperKit: "#3d5a80", keeper: { read: 0.25, reach: 0.31 }, shooter: { miss: 0.3, corner: 0.05, honest: 0.9, tellAt: 0.38 } },
  { name: "হাটখোলা ক্লাব", kit: "#8d4fb5", shorts: "#3b2150", keeperKit: "#5f6b3a", keeper: { read: 0.3, reach: 0.34 }, shooter: { miss: 0.25, corner: 0.08, honest: 0.85, tellAt: 0.45 } },
  { name: "নদীপাড় ক্রীড়াচক্র", kit: "#1aa39a", shorts: "#0f4f4b", keeperKit: "#7a3e48", keeper: { read: 0.36, reach: 0.37 }, shooter: { miss: 0.2, corner: 0.1, honest: 0.8, tellAt: 0.5 } },
  { name: "ইটভাটা সংঘ", kit: "#a33a2b", shorts: "#4a1a12", keeperKit: "#3f4a5a", keeper: { read: 0.42, reach: 0.4 }, shooter: { miss: 0.15, corner: 0.14, honest: 0.75, tellAt: 0.56 } },
  { name: "চরপাড়া একাদশ", kit: "#ececec", shorts: "#22313f", keeperKit: "#8a5a2b", keeper: { read: 0.45, reach: 0.42 }, shooter: { miss: 0.12, corner: 0.18, honest: 0.7, tellAt: 0.62 } },
  { name: "সাগরপাড় একাদশ", kit: "#1e3a8a", shorts: "#c9d6ff", keeperKit: "#4a4a4a", keeper: { read: 0.5, reach: 0.44 }, shooter: { miss: 0.08, corner: 0.22, honest: 0.65, tellAt: 0.68 } },
];

export const LEVEL_COUNT = OPPONENTS.length;
/** Our পাড়ার দল: a plain orange shirt; our keeper in charcoal. */
export const US = { name: "আমরা", kit: "#e8682a", shorts: "#1d1d1d", keeperKit: "#2f3640" } as const;

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const opponentOf = (level: number) => OPPONENTS[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];
/** Two matches per stage: 1–2 পাড়া, 3–4 থানা, 5–6 জেলা, 7–8 জাতীয়. */
export const stageOf = (level: number) => STAGES[Math.min(3, Math.floor((level - 1) / 2))];
export const roundName = (level: number) => level === LEVEL_COUNT ? "জাতীয় ফাইনাল" : level === LEVEL_COUNT - 1 ? "জাতীয় সেমিফাইনাল" : `${stageOf(level)}র ম্যাচ`;
