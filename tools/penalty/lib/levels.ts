// The tournament ladder: four cups (worlds) of three rounds, পাড়া → থানা → জেলা → জাতীয়. Each match teaches exactly one
// new thing, each cup ends in a named final. Server-safe (the link code reads it), so a match's team never changes:
// old links name the same team. Tests prove each match is cleared by the bots at its target rate (tests/levels.test.ts).

/** you take every kick (a drill), they take every kick (a drill), or a real shoot-out that alternates. */
export type Format = "shots" | "saves" | "shootout";

export type Team = { name: string; kit: string; shorts: string; keeperKit: string };
export type Keeper = {
  /** Chance he reads a soft shot (power under 0.6 only) and dives to its side. A hard shot can't be read. */
  read: number;
  /** How far the dive reaches, in goal units (the goal is 2 wide and 1 high). */
  reach: number;
  /** 0: he shows nothing before your kick. Otherwise he leans towards his dive, and this is the chance the lean is true. */
  tell: number;
  /** The tall keeper of the জেলার ফাইনাল (drawn bigger; his reach is already in `reach`). */
  tall?: boolean;
};
export type Shooter = {
  /** Chance a kick misses the goal on its own. */
  miss: number;
  /** Chance a kick goes in the top corner: a goal even when you dive the right way. */
  corner: number;
  /** Chance the shoulder lean points where the ball really goes. The planted foot is always true. */
  honest: number;
  /** When the lean shows, as a share of the run-up (later is harder). */
  tellAt: number;
  /** He watches you: dive before his lean shows and he shoots the other way. */
  watch?: boolean;
};
export type Level = {
  name: string;
  /** The one new thing, in one line, for the title and the match list. */
  teach: string;
  team: Team;
  format: Format;
  /** Kicks each (a drill: kicks in all). */
  kicks: 3 | 5;
  keeper: Keeper;
  shooter: Shooter;
  /** Strongest wind, in goal units of drift for a soft kick (0: none). */
  wind: number;
  /** Seconds to kick before the referee hurries you (0: no clock). */
  clock: number;
  finale?: boolean;
};

export type World = { name: string; place: string; palette: "school" | "dusk" | "lights" | "national" };
export const WORLDS: readonly World[] = [
  { name: "পাড়ার কাপ", place: "স্কুলমাঠ", palette: "school" },
  { name: "থানা কাপ", place: "থানার মাঠ", palette: "dusk" },
  { name: "জেলা কাপ", place: "জেলা স্টেডিয়াম", palette: "lights" },
  { name: "জাতীয় কাপ", place: "জাতীয় স্টেডিয়াম", palette: "national" },
];
export const PER_WORLD = 3;
export const ROUNDS = ["প্রথম রাউন্ড", "সেমিফাইনাল", "ফাইনাল"] as const;

const team = (name: string, kit: string, shorts: string, keeperKit: string): Team => ({ name, kit, shorts, keeperKit });
const sleepy: Keeper = { read: 0, reach: 0.2, tell: 0 };
const plain: Shooter = { miss: 0.3, corner: 0, honest: 1, tellAt: 0.25 };

export const LEVELS: readonly Level[] = [
  { name: "প্রথম শট", teach: "বল থেকে গোলের দিকে আঙুল টেনে ছাড়ো। ৩ শটে ১ গোল হলেই পার।", team: team("আমতলা একাদশ", "#d9534f", "#3a1d1d", "#6b7a3a"),
    format: "shots", kicks: 3, keeper: sleepy, shooter: plain, wind: 0, clock: 0 },
  { name: "এবার তুমি কিপার", teach: "শুটার যেদিকে ঝোঁকে, সেদিকে ঝাঁপ দাও। ৩টার ১টা ঠেকালেই পার।", team: team("পুকুরপাড় সংঘ", "#2f7fbf", "#14304a", "#5b6470"),
    format: "saves", kicks: 3, keeper: sleepy, shooter: { miss: 0.12, corner: 0, honest: 1, tellAt: 0.2 }, wind: 0, clock: 0 },
  { name: "পাড়ার ফাইনাল", teach: "এবার পালা করে: একবার তুমি মারো, একবার ঠেকাও। তিনটা করে শট।", team: team("কলপাড় একাদশ", "#3a86c8", "#1f2a44", "#5b6470"),
    format: "shootout", kicks: 3, keeper: { read: 0.1, reach: 0.25, tell: 0 }, shooter: { miss: 0.3, corner: 0, honest: 1, tellAt: 0.25 }, wind: 0, clock: 0, finale: true },

  { name: "পাঁচ শটের টাইব্রেকার", teach: "আসল নিয়ম: পাঁচটা করে শট, সমান থাকলে সাডেন ডেথ।", team: team("বটতলা কিশোর সংঘ", "#2f9e44", "#1b5e2b", "#6a4c93"),
    format: "shootout", kicks: 5, keeper: { read: 0.18, reach: 0.28, tell: 0 }, shooter: { miss: 0.27, corner: 0, honest: 1, tellAt: 0.3 }, wind: 0, clock: 0 },
  { name: "কিপারের ঝোঁক", teach: "ওদের কিপার যেদিকে ঝাঁপাবে, আগে সেদিকে হেলে। উল্টো দিকে মারো।", team: team("হাটখোলা ক্লাব", "#8d4fb5", "#3b2150", "#5f6b3a"),
    format: "shootout", kicks: 5, keeper: { read: 0.2, reach: 0.31, tell: 1 }, shooter: { miss: 0.24, corner: 0.03, honest: 1, tellAt: 0.32 }, wind: 0, clock: 0 },
  { name: "থানার ফাইনাল", teach: "শুটারের ঝোঁক আসে একদম শেষে। তাড়াহুড়ো নয়, চোখ রাখো।", team: team("রেলগেট একাদশ", "#e9b824", "#4a3b1c", "#3d5a80"),
    format: "shootout", kicks: 5, keeper: { read: 0.3, reach: 0.38, tell: 1 }, shooter: { miss: 0.16, corner: 0.05, honest: 1, tellAt: 0.62 }, wind: 0, clock: 0, finale: true },

  { name: "ধোঁকা", teach: "কাঁধের ঝোঁক মিথ্যা হতে পারে, পায়ের পাতা নয়। মারার আগে পা দেখো।", team: team("ইটভাটা সংঘ", "#a33a2b", "#4a1a12", "#3f4a5a"),
    format: "shootout", kicks: 5, keeper: { read: 0.24, reach: 0.34, tell: 0.95 }, shooter: { miss: 0.2, corner: 0.05, honest: 0.6, tellAt: 0.4 }, wind: 0, clock: 0 },
  { name: "নদীর বাতাস", teach: "কোণার পতাকা দেখো: বাতাস আস্তে মারা বল বেশি সরায়।", team: team("নদীপাড় ক্রীড়াচক্র", "#1aa39a", "#0f4f4b", "#7a3e48"),
    format: "shootout", kicks: 5, keeper: { read: 0.26, reach: 0.35, tell: 0.9 }, shooter: { miss: 0.18, corner: 0.06, honest: 0.7, tellAt: 0.42 }, wind: 0.32, clock: 0 },
  { name: "জেলার ফাইনাল", teach: "লম্বা কিপার, প্রায় সব ধরে। শুধু একদম কোণগুলো ফাঁকা।", team: team("জেলা স্কুল একাদশ", "#f2f2f2", "#2b3a55", "#8a5a2b"),
    format: "shootout", kicks: 5, keeper: { read: 0.28, reach: 0.47, tell: 0.9, tall: true }, shooter: { miss: 0.17, corner: 0.07, honest: 0.7, tellAt: 0.46 }, wind: 0, clock: 0, finale: true },

  { name: "রেফারির তাড়া", teach: "৫ সেকেন্ডে মারো। সময় ফুরোলে বল আলগা গড়িয়ে যায়।", team: team("বন্দর একাদশ", "#f07f2e", "#3d2310", "#2e5266"),
    format: "shootout", kicks: 5, keeper: { read: 0.3, reach: 0.37, tell: 0.85 }, shooter: { miss: 0.15, corner: 0.08, honest: 0.65, tellAt: 0.48 }, wind: 0, clock: 5 },
  { name: "জাতীয় সেমিফাইনাল", teach: "শুটার তোমাকে দেখছে। ঝোঁকের আগে নড়লে উল্টো দিকে মারবে।", team: team("চরপাড়া একাদশ", "#c9c9c9", "#22313f", "#8a5a2b"),
    format: "shootout", kicks: 5, keeper: { read: 0.32, reach: 0.39, tell: 0.85 }, shooter: { miss: 0.14, corner: 0.08, honest: 0.65, tellAt: 0.48, watch: true }, wind: 0, clock: 0 },
  { name: "জাতীয় ফাইনাল", teach: "সব একসাথে: কিপারের ঝোঁক, ধোঁকা, বাতাস, ঘড়ি আর নজর।", team: team("সাগরপাড় একাদশ", "#1e3a8a", "#c9d6ff", "#4a4a4a"),
    format: "shootout", kicks: 5, keeper: { read: 0.34, reach: 0.41, tell: 0.8 }, shooter: { miss: 0.12, corner: 0.1, honest: 0.6, tellAt: 0.56, watch: true }, wind: 0.32, clock: 5, finale: true },
];
export const LEVEL_COUNT = LEVELS.length;

/** The old eight-match ladder (links with `l=`, and old saved stars) mapped to the match with the same team. */
export const OLD_LEVELS: Readonly<Record<number, number>> = { 1: 3, 2: 4, 3: 6, 4: 5, 5: 8, 6: 7, 7: 11, 8: 12 };

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const levelOf = (level: number) => LEVELS[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];
/** 0-based cup. */
export const worldOf = (level: number) => Math.floor((Math.min(LEVEL_COUNT, Math.max(1, level)) - 1) / PER_WORLD);
export const roundOfLevel = (level: number) => ROUNDS[(Math.min(LEVEL_COUNT, Math.max(1, level)) - 1) % PER_WORLD];
/** "থানা কাপ ফাইনাল" */
export const cupRound = (level: number) => `${WORLDS[worldOf(level)].name} ${roundOfLevel(level)}`;
/** Your own team: an orange পাড়ার দল, our keeper in charcoal. */
export const US = { name: "আমরা", kit: "#e8682a", shorts: "#1d1d1d", keeperKit: "#2f3640" } as const;
