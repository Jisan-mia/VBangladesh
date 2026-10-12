// Five made-up পাড়ার players, each over three winter nights: শান্ত → বাতাস → কুয়াশা. Fifteen levels in all.
// Each opponent returns more of your good shots, hits a little faster and spreads its shots wider.

export type Night = "calm" | "wind" | "fog";

export type Opponent = {
  name: string;
  /** Possessive/object form used in lines: "ভাইয়াকে হারালে". */
  object: string;
  /** Short name for the scoreboard and calls. */
  short: string;
  shirt: string;
  /** Chance to return your best shot; weaker shots get returned more often (see returnChance). */
  skill: number;
  /** Flight time of a normal shot to you, in game seconds (shorter is faster). */
  pace: number;
  /** How far left or right of your usual spot a shot may land, in board units. */
  spread: number;
  /** Chance a shot is a flat, fast drive instead of a high clear. */
  drive: number;
  /** Half-width of the timing window around the perfect moment, in game seconds. */
  window: number;
};

export const OPPONENTS: readonly Opponent[] = [
  { name: "পাশের বাসার ভাইয়া", object: "পাশের বাসার ভাইয়াকে", short: "ভাইয়া", shirt: "#4f86c6", skill: 0.35, pace: 1.4, spread: 8, drive: 0, window: 0.3 },
  { name: "তিনতলার আপু", object: "তিনতলার আপুকে", short: "আপু", shirt: "#c4577a", skill: 0.5, pace: 1.26, spread: 16, drive: 0.1, window: 0.26 },
  { name: "মোড়ের দোকানের মামা", object: "মোড়ের দোকানের মামাকে", short: "মামা", shirt: "#6b8f3a", skill: 0.62, pace: 1.14, spread: 24, drive: 0.18, window: 0.23 },
  { name: "কলেজের বড় ভাই", object: "কলেজের বড় ভাইকে", short: "বড় ভাই", shirt: "#8a5cc2", skill: 0.72, pace: 1.04, spread: 30, drive: 0.26, window: 0.21 },
  { name: "পাড়ার চ্যাম্পিয়ন", object: "পাড়ার চ্যাম্পিয়নকে", short: "চ্যাম্পিয়ন", shirt: "#c23b2a", skill: 0.8, pace: 0.96, spread: 36, drive: 0.32, window: 0.19 },
];

export const NIGHTS: readonly Night[] = ["calm", "wind", "fog"];
export const NIGHT_NAME: Record<Night, string> = { calm: "শান্ত রাত", wind: "বাতাসের রাত", fog: "কুয়াশার রাত" };
export const LEVEL_COUNT = OPPONENTS.length * NIGHTS.length;

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
const clampLevel = (level: number) => Math.min(LEVEL_COUNT, Math.max(1, Math.round(level) || 1));
export const opponentIndex = (level: number) => Math.floor((clampLevel(level) - 1) / NIGHTS.length);
export const opponentOf = (level: number) => OPPONENTS[opponentIndex(level)];
export const nightOf = (level: number): Night => NIGHTS[(clampLevel(level) - 1) % NIGHTS.length];
