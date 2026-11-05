// Every line of result text. Server-safe (share.ts reaches it): only Bangla helpers and the level data.
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { levelOf, LEVEL_COUNT, MODES, WORLDS } from "./levels";
import type { Shared } from "./challenge";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const levelLabel = (level: number) => `ক্ষেত ${bn(level)}`;
export const levelTitle = (level: number) => `ক্ষেত ${bn(level)} · ${levelOf(level).name}`;
export const worldName = (level: number) => WORLDS[levelOf(level).world].name;
export const bossName = (level: number) => WORLDS[levelOf(level).world].boss;
const who = (name: string) => cleanName(name) || "বন্ধু";

/** One small evening scene per ক্ষেত, true however much grain was left. */
const CLEAR_LINES = [
  "সন্ধ্যা নামল। প্রথম ক্ষেত পার।",
  "দুই দিকের চড়ুই বাঁশঝাড়ে ফিরল।",
  "জোড়ায় জোড়ায় এসেছিল, জোড়ায় জোড়ায় গেল।",
  "পালের গোদা পালাল, পালও গেল।",
  "শালিকগুলো আলের ওপর বসে ঝগড়া করছে।",
  "কুয়াশা কাটছে। ধান ঠিক আছে।",
  "দল বেঁধে এসেও ফিরল খালি ঠোঁটে।",
  "ঝুঁটি শালিক কাকতাড়ুয়ার মাথা ছেড়ে গাছে ফিরল।",
  "মুনিয়ার ঝাঁক উড়ে গেল বিলের দিকে।",
  "পাঁচটার ঝাঁকও পারল না।",
  "সব রকম পাখি এসেছিল। ধান রইল।",
  "ডাকাত টিয়া খালি ঠোঁটে ফিরল। নানা হাট থেকে ফিরছেন।",
] as const;
export const clearLine = (level: number) => CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];

/** The end screen's heading. `lost`: all the grain went. */
export function heading({ level, stars, lost, firstClear }: { level: number; stars: number; lost: boolean; firstClear: boolean }) {
  if (lost) return "সব ধান খেয়ে ফেলল";
  if (!stars) return "ধান কম পড়ল";
  if (levelOf(level).boss) return firstClear ? `${bossName(level)} পালাল!` : `${bossName(level)} পালাল, সন্ধ্যাও নামল`;
  return `${levelLabel(level)} পার`;
}

/** Under the stars of a ক্ষেত short of three: exactly how much more grain the next star needs. Empty at three. */
export function nearMissLine(level: number, grain: number, stars: number) {
  const { pass, two, three } = levelOf(level);
  if (!stars) return `আর ${bn(pass - grain)}% ধান বাঁচলেই ক্ষেত পার।`;
  const mark = stars === 1 ? two : stars === 2 ? three : 0;
  return mark ? `আর ${bn(mark - grain)}% ধান বাঁচলেই ${bn(stars + 1)} তারা।` : "";
}

/** After a ক্ষেত not passed: how close dusk was, and one thing to try. */
export function lossLine(level: number, secondsLeft: number, bossLeft: boolean) {
  const row = levelOf(level);
  const tip = row.boss ? `${bossName(level)} যেখানে নামছে, ছায়াটা দেখে সেখানে চাপো।`
    : row.munia > 0 ? "ঝাঁকের মাঝখানে চাপো, এক তালিতে কয়েকটা পালায়।"
    : row.fog ? "কুয়াশায় ধানের ওপর ছায়াটা দেখো, ছায়ার ওপর চাপো।"
    : row.shalik > 0 ? "শালিক লাফ দিলেই আবার চাপো।"
    : "যেটা আগে নেমেছে, সেটা আগে তাড়াও।";
  const dusk = bossLeft ? `সন্ধ্যা হয়-হয়, শুধু ${bossName(level)} বাকি ছিল। ` : secondsLeft > 0 ? `সন্ধ্যা নামতে আর ${bn(secondsLeft)} সেকেন্ড বাকি ছিল। ` : "";
  return `${dusk}${tip}`;
}

const BANDS = [
  { min: 0, line: "হাত চলছে! পরের বিকেলে আরও বেশি বাঁচবে।" },
  { min: 70, line: "ভালো পাহারা! গোলায় ধান উঠবে ভালোই।" },
  { min: 85, line: "এমন পাহারাদার থাকলে কাকতাড়ুয়ার ছুটি!" },
  { min: 95, line: "পাখিরা প্রায় খালি পেটে ফিরল!" },
  { min: 100, line: "একটা দানাও নিতে পারেনি! পুরো ধান গোলায় উঠবে।" },
] as const;

/** The card's own line, seen by friends. */
export function humanLine({ level, grain }: Pick<Shared, "level" | "grain">) {
  if (level === LEVEL_COUNT) return "বারোটা ক্ষেত পাহারা শেষ। নানা খুশি।";
  if (levelOf(level).boss && grain < 100) return `${bossName(level)} পালাল, ধান রইল।`;
  for (let i = BANDS.length - 1; i >= 0; i--) if (grain >= BANDS[i].min) return BANDS[i].line;
  return BANDS[0].line;
}

export const tallyLine = ({ grain, shooed }: Pick<Shared, "grain" | "shooed">) => `${bn(shooed)}টা পাখি হুশ · ধান রইল ${bn(grain)}%`;

/** "রাফি ক্ষেত ৭-এ ৮৪% ধান বাঁচিয়েছে" */
export const feat = ({ level, grain, name }: Pick<Shared, "level" | "grain" | "name">) => `${cleanName(name) || "এক বন্ধু"} ক্ষেত ${bn(level)}-এ ${bn(grain)}% ধান বাঁচিয়েছে`;

export const previewTitle = ({ name, grain }: Pick<Shared, "name" | "grain">) => cleanName(name)
  ? `${cleanName(name)} চড়ুই তাড়িয়ে ${bn(grain)}% ধান বাঁচিয়েছে। তুমি পারবে?`
  : `চড়ুই তাড়িয়ে ${bn(grain)}% ধান বাঁচল। তুমি পারবে?`;

export function bannerNote(shared: Pick<Shared, "name" | "old" | "mode">) {
  if (shared.old) return `এটা আগের সংস্করণে ${possessive(who(shared.name))} নিজের ফোনের হিসাব। একই ক্ষেত নম্বর, এবার নতুন পাখি।`;
  return `এটা ${possessive(who(shared.name))} নিজের ফোনের হিসাব, ${MODES[shared.mode].name} খেলায়। একই ক্ষেত, একই পাখি, এবার তোমার পালা।`;
}

/** After a friend's link: grain first, birds shooed break a tie. Kind and exact, never a scold. */
export function compareLine(mine: Pick<Shared, "grain" | "shooed">, theirs: Pick<Shared, "grain" | "shooed">, name: string) {
  const friend = who(name), whose = cleanName(name) ? possessive(cleanName(name)) : "বন্ধুর";
  const gap = mine.grain - theirs.grain;
  if (gap > 0) return `${whose} চেয়ে ${bn(gap)}% বেশি ধান বাঁচালে!`;
  if (gap === 0) {
    const birds = mine.shooed - theirs.shooed;
    if (birds > 0) return `ধান সমান সমান, তবে ${whose} চেয়ে ${bn(birds)}টা পাখি বেশি তাড়ালে!`;
    if (birds < 0) return `ধান সমান সমান, ${friend} শুধু ${bn(-birds)}টা পাখি বেশি তাড়িয়েছে।`;
    return `${friend} আর তুমি একদম সমান সমান!`;
  }
  if (-gap <= 5) return `আর একটু হলেই! ${whose} চেয়ে মাত্র ${bn(-gap)}% কম।`;
  return `${friend} এবার ${bn(-gap)}% এগিয়ে। একই ক্ষেতে আরেকবার?`;
}

export const caption = ({ level, grain, shooed }: Pick<Shared, "level" | "grain" | "shooed">) =>
  `চড়ুই তাড়াও, ${levelTitle(level)}: ${bn(grain)}% ধান বাঁচালাম, ${bn(shooed)}টা পাখি হুশ! একই ক্ষেতে তুমি কত বাঁচাবে?`;

const SHOOS = ["হুশ!", "যাহ্!", "হুশ হুশ!"] as const;
/** The pop over a clap that reached something: the word, the count for a flock, the streak once it's going. */
export function hitWord(hits: number, combo: number, turn: number) {
  if (hits > 1) return `এক তালিতে ${bn(hits)}টা!`;
  if (combo >= 3) return `টানা ${bn(combo)}`;
  return SHOOS[turn % SHOOS.length];
}
