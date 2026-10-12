// Challenge links and every line of result text. Server-safe: share.ts loads this.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { LEVELS } from "./levels";
import { dailyPuzzle, levelPuzzle, tierOf, type Puzzle } from "./game";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const MAX_SECONDS = 99 * 60 + 59;
const MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

/** A solved puzzle someone shares: which one, the time on their phone, hints taken, an optional first name. */
export type Shared = { level: number; day: number; seconds: number; hints: number; name: string };

/** The puzzle a shared result points at (built fresh, so a link can't bring its own grid). */
export const puzzleOf = (shared: Pick<Shared, "level" | "day">) => shared.level ? levelPuzzle(shared.level) : dailyPuzzle(shared.day);

/**
 * `#s=<seed>&t=<seconds>&l=<level>&h=<hints>&n=<name>`. A level link must carry that level's seed; without `l`, the seed
 * is a date (20261012) and means that day's puzzle. The puzzle is rebuilt and re-checked. The time can't be proven,
 * so it's shown as the friend's own.
 */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_SECONDS, extraKeys: ["l", "h"] });
  if (!read) return null;
  const { l = "", h = "0" } = read.extra;
  if (l && !/^[1-9]\d?$/.test(l)) return null;
  if (!/^\d$/.test(h)) return null;
  const level = Number(l), hints = Number(h);
  if (level && LEVELS[level - 1]?.[2] !== read.seed) return null;
  const puzzle = puzzleOf({ level, day: level ? 0 : read.seed });
  if (!puzzle || hints > puzzle.empty || read.target < 1) return null;
  return { level, day: level ? 0 : read.seed, seconds: read.target, hints, name: read.name };
}

export function sharedHash({ level, day, seconds, hints, name }: Shared) {
  const seed = level ? LEVELS[level - 1][2] : day;
  return challengeHash({ seed, target: seconds, name, extra: { ...(level ? { l: level } : {}), ...(hints ? { h: hints } : {}) } });
}

export const fromPuzzle = (puzzle: Puzzle, seconds: number, hints: number, name: string): Shared =>
  ({ level: "level" in puzzle ? puzzle.level : 0, day: "day" in puzzle ? puzzle.day : 0, seconds: Math.min(MAX_SECONDS, Math.round(seconds)), hints, name: cleanName(name) });

/** "০৪:১২" for the running clock. */
export const clock = (seconds: number) => {
  const s = Math.min(MAX_SECONDS, Math.floor(seconds));
  return `${bn(Math.floor(s / 60)).padStart(2, "০")}:${bn(s % 60).padStart(2, "০")}`;
};

/** "৪ মিনিট ১২ সেকেন্ড", "৪৫ সেকেন্ড", "৩ মিনিট". */
export function duration(seconds: number) {
  const s = Math.max(0, Math.round(seconds)), m = Math.floor(s / 60), rest = s % 60;
  if (!m) return `${bn(rest)} সেকেন্ড`;
  return rest ? `${bn(m)} মিনিট ${bn(rest)} সেকেন্ড` : `${bn(m)} মিনিট`;
}

/** "১২ অক্টোবর" from 20261012. */
export const dayLabel = (day: number) => `${bn(day % 100)} ${MONTHS[Math.floor(day / 100) % 100 - 1]}`;

/** "১২ অক্টোবরের", "৩ জুলাইয়ের". */
const dayOf = (day: number) => { const label = dayLabel(day); return label.endsWith("ই") ? `${label}য়ের` : possessive(label); };

/** "লেভেল ১২ · মাঝারি" or "১২ অক্টোবরের ধাঁধা". */
export const puzzleLabel = ({ level, day }: Pick<Shared, "level" | "day">) =>
  level ? `লেভেল ${bn(level)} · ${tierOf(level).name}` : `${dayOf(day)} ধাঁধা`;

/** "রাফি লেভেল ১২ মিলিয়েছে ৪ মিনিট ১২ সেকেন্ডে" */
export function feat(shared: Shared) {
  const who = cleanName(shared.name) || "এক বন্ধু";
  const what = shared.level ? `সুডোকুর লেভেল ${bn(shared.level)}` : `${dayOf(shared.day)} সুডোকু`;
  return `${who} ${what} মিলিয়েছে ${duration(shared.seconds)}ে${shared.hints ? `, ${bn(shared.hints)}টা ঘর সাহায্য নিয়ে` : ""}`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

/** The line under a result, by stars. Concrete, and kind at one star. */
export function humanLine(stars: number, hints: number, empty: number) {
  if (hints) return `${bn(hints)}টা ঘর বলে দিয়েছি, বাকি ${bn(empty - hints)}টা তোমার নিজের।`;
  if (stars >= 3) return "চা ঠান্ডা হওয়ার আগেই পুরো ছক ভরা।";
  if (stars === 2) return `${bn(empty)}টা ফাঁকা ঘর, একটাও ভুল রয়ে যায়নি।`;
  return "সময় নিয়েছ, কিন্তু ছক পুরো মিলেছে। কাল আরেকটা?";
}

/** After a friend's puzzle: less time wins, and it stays kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${duration(theirs - mine)} আগে!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${duration(theirs)} নিয়েছিল।`;
  if (mine - theirs <= 30) return `আর একটু হলেই! মাত্র ${duration(mine - theirs)} পিছিয়ে।`;
  return `${who} এখনো ${duration(mine - theirs)} এগিয়ে। আরেকবার?`;
}

export function caption(shared: Shared) {
  const what = shared.level ? `লেভেল ${bn(shared.level)} (${tierOf(shared.level).name})` : `${dayOf(shared.day)} ধাঁধা`;
  return `বাংলা সুডোকুর ${what} মেলালাম ${duration(shared.seconds)}ে${shared.hints ? `, ${bn(shared.hints)}টা ঘর সাহায্য নিয়ে` : ""}। তুমি কত মিনিটে পারবে?`;
}

/** "আর ২৪ সেকেন্ড আগে হলে ৩ তারা।" Exact numbers, from game.ts's nextStar. Empty at three stars. */
export function nearMissLine(next: { goal: number; seconds: number; hints: number } | null) {
  if (!next) return "";
  const time = next.seconds ? `আর ${duration(next.seconds)} আগে` : "", help = next.hints ? `${bn(next.hints)}টা সাহায্য কম` : "";
  if (time && help) return `${time} আর ${help} হলে ${bn(next.goal)} তারা।`;
  return time ? `${time} হলে ${bn(next.goal)} তারা।` : `${help} নিলে ${bn(next.goal)} তারা।`;
}
