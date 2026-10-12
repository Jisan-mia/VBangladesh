// The sports-day ladder: ten made-up teams from ক্লাস থ্রি to the হেডস্যার's own. Each one is a level.
// Each step adds one small thing: a quicker drum, a team that hits the beat more often, a slightly heavier team.

export type Team = {
  /** As it reads on its own: "ক্লাস ফাইভ". */
  name: string;
  /** As the object of a sentence: "ক্লাস ফাইভকে". */
  obj: string;
  shirt: string;
  /** Drum beats a minute. */
  bpm: number;
  /** Chance per beat that the team pulls right on the beat, and that it pulls a little off it (a weaker pull). */
  perfect: number;
  good: number;
  /** How heavy the team pulls: their pull is multiplied by this. */
  weight: number;
  /** A win in at most this many beats earns 3 stars, then 2. */
  three: number;
  two: number;
};

export const TEAMS: readonly Team[] = [
  { name: "ক্লাস থ্রি", obj: "ক্লাস থ্রিকে", shirt: "#3b82c4", bpm: 80, perfect: 0.05, good: 0.15, weight: 0.6, three: 13, two: 20 },
  { name: "ক্লাস ফোর", obj: "ক্লাস ফোরকে", shirt: "#7b4fb0", bpm: 82, perfect: 0.14, good: 0.22, weight: 0.75, three: 14, two: 22 },
  { name: "ক্লাস ফাইভ", obj: "ক্লাস ফাইভকে", shirt: "#1d9a8f", bpm: 85, perfect: 0.22, good: 0.24, weight: 0.82, three: 16, two: 25 },
  { name: "ক্লাস সিক্স", obj: "ক্লাস সিক্সকে", shirt: "#8a3a52", bpm: 88, perfect: 0.28, good: 0.26, weight: 0.88, three: 17, two: 28 },
  { name: "ক্লাস এইট", obj: "ক্লাস এইটকে", shirt: "#4a5a70", bpm: 92, perfect: 0.33, good: 0.26, weight: 0.9, three: 18, two: 31 },
  { name: "ক্লাস টেন", obj: "ক্লাস টেনকে", shirt: "#2f6fa0", bpm: 96, perfect: 0.38, good: 0.26, weight: 0.92, three: 19, two: 34 },
  { name: "কলেজের ভাইয়ারা", obj: "কলেজের ভাইয়াদের", shirt: "#e9e6dc", bpm: 100, perfect: 0.42, good: 0.25, weight: 0.94, three: 21, two: 38 },
  { name: "অভিভাবক দল", obj: "অভিভাবক দলকে", shirt: "#a0522d", bpm: 104, perfect: 0.46, good: 0.25, weight: 0.96, three: 23, two: 42 },
  { name: "শিক্ষকদের দল", obj: "শিক্ষকদের দলকে", shirt: "#33415c", bpm: 108, perfect: 0.5, good: 0.24, weight: 0.98, three: 25, two: 48 },
  { name: "হেডস্যারের দল", obj: "হেডস্যারের দলকে", shirt: "#5b2a86", bpm: 112, perfect: 0.55, good: 0.22, weight: 1.0, three: 28, two: 55 },
];

export const LEVEL_COUNT = TEAMS.length;
/** Our team in solo, and the bottom player in a two-player match. */
export const US = { name: "হলুদ দল", shirt: "#f2b705" } as const;
/** The top player in a two-player match. */
export const THEM = { name: "নীল দল", shirt: "#2f6fd0" } as const;

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const teamOf = (level: number) => TEAMS[Math.min(LEVEL_COUNT, Math.max(1, Math.round(level) || 1)) - 1];
/** The friendly tempo for two players: the same drum as level 3. */
export const DUO_BPM = 85;
