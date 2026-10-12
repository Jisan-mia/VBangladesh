// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and the rules.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { starsEarned } from "./game";
import { isLevel, specOf, worldOf, LEVEL_COUNT } from "./levels";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const MAX_SECONDS = 5999;
/** A cleared orchard as the player reports it. The board is rebuilt from seed, level and first cell; the time is their phone's. */
export type Shared = { level: number; seed: number; first: number; seconds: number; hints: number; name: string };

/** `#s=<seed>&t=<seconds>&l=<level>&f=<first cell>&h=<hints, if any>&n=<name>`. Anything else is refused. */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_SECONDS, extraKeys: ["l", "f", "h"] });
  if (!read || read.target < 1) return null;
  const { l = "", f = "", h = "0" } = read.extra;
  if (!/^[1-9]\d?$/.test(l) || !/^(0|[1-9]\d{0,2})$/.test(f) || !/^\d$/.test(h)) return null;
  const level = Number(l), first = Number(f);
  if (!isLevel(level)) return null;
  const { cols, rows } = specOf(level);
  if (first >= cols * rows) return null;
  return { level, seed: read.seed, first, seconds: read.target, hints: Number(h), name: read.name };
}

export function sharedHash({ level, seed, first, seconds, hints, name }: Shared) {
  return challengeHash({ seed, target: Math.min(MAX_SECONDS, Math.max(1, Math.round(seconds))), name, extra: { l: level, f: first, ...(hints ? { h: Math.min(9, hints) } : {}) } });
}

/** "২ মিনিট ১০ সেকেন্ড", "৪৫ সেকেন্ড", "৩ মিনিট" */
export function timeText(seconds: number) {
  const s = Math.max(0, Math.round(seconds)), minutes = Math.floor(s / 60), rest = s % 60;
  if (!minutes) return `${bn(rest)} সেকেন্ড`;
  return rest ? `${bn(minutes)} মিনিট ${bn(rest)} সেকেন্ড` : `${bn(minutes)} মিনিট`;
}

/** "০১:০৫" for the running clock. */
export const clock = (seconds: number) => {
  const s = Math.min(MAX_SECONDS, Math.floor(seconds));
  return `${bn(Math.floor(s / 60)).padStart(2, "০")}:${bn(s % 60).padStart(2, "০")}`;
};

export const levelLabel = (level: number) => `লেভেল ${bn(level)} · ${worldOf(level).name}`;
export const sizeLabel = (level: number) => { const { cols, rows, nests } = specOf(level); return `${bn(cols)}×${bn(rows)} বাগান, ${bn(nests)}টা চাক`; };

const CLEAR_LINES = [
  "ঝোপ সাফ। গাছতলায় দুটো পাকা আম পড়ে আছে।",
  "গামছা যেখানে বাঁধা, সেদিকে আজ কেউ যাবে না।",
  "ভিমরুলেরা ঘুমাচ্ছে, ঝুড়িতে আম উঠছে।",
  "একটা হুলও খাওনি। পকেটে লবণ-মরিচের পুরিয়া তৈরি।",
  "ঝোপের ভেতর থেকে একটা কাঠবিড়ালি দৌড়ে পালাল।",
  "দুপুরের রোদ। এবার গাছের ছায়ায় একটু বসো।",
  "ঝুড়ি ভরছে, গামছাগুলো বাতাসে দুলছে।",
  "চাকের পাশ দিয়ে পা টিপে টিপে পার হয়ে গেলে।",
  "মালি চাচা দূর থেকে হাত নাড়লেন।",
];

/** The level-clear line: one small orchard scene. A world's last level and the very last one get their own. */
export function clearLine(level: number) {
  if (level === LEVEL_COUNT) return "চাঁপাইনবাবগঞ্জের বড় বাগানও সাফ। ৩০টা বাগানের আম এবার নিশ্চিন্তে পাড়া যাবে।";
  if (level % 10 === 0) return `${worldOf(level).long} পুরো সাফ। পরের বাগান আরও বড়।`;
  return CLEAR_LINES[(level - 1) % CLEAR_LINES.length];
}

/** When a nest goes off: funny, nobody hurt, and the exact distance to the finish. */
export function lossLine(left: number) {
  return left <= 3 ? `আর মাত্র ${bn(left)}টা ঝোপ বাকি ছিল!` : `সবাই দৌড়ে পুকুরপাড়ে, কেউ হুল খায়নি। আর ${bn(left)}টা ঝোপ বাকি ছিল।`;
}

/** The line on the card, seen by friends: first person, one image. */
export function humanLine(stars: number, hints: number) {
  if (hints) return `${bn(hints)}বার হিন্ট নিয়েছি, বাকিটা নিজে।`;
  if (stars >= 3) return "ভিমরুলেরা টেরই পায়নি।";
  if (stars === 2) return "গামছা ঠিক জায়গায়, আম ঝুড়িতে।";
  return "সময় লেগেছে, তবে একটা হুলও খাইনি।";
}

export const sharedStars = (shared: Shared) => starsEarned(shared.seconds, shared.hints, specOf(shared.level).par);

/** "রাফি লেভেল ১২-এর বাগান ১ মিনিট ১০ সেকেন্ডে সাফ করেছে" */
export function feat({ level, seconds, name }: Pick<Shared, "level" | "seconds" | "name">) {
  return `${cleanName(name) || "এক বন্ধু"} লেভেল ${bn(level)}-এর বাগান ${timeText(seconds)}ে সাফ করেছে`;
}

export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote({ name, hints }: Pick<Shared, "name" | "hints">) {
  const who = cleanName(name) || "বন্ধু";
  return `${hints ? `${bn(hints)}বার হিন্ট নিয়ে। ` : ""}সময়টা ${possessive(who)} নিজের ফোনের হিসাব। একই বাগান, শুরুর জায়গাও খোলা। এবার তোমার পালা।`;
}

/** After a friend's orchard: less time is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${timeText(theirs - mine)} আগে!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${timeText(theirs)} নিয়েছিল।`;
  if (mine - theirs <= 15) return `আর একটু হলেই! মাত্র ${timeText(mine - theirs)} পিছিয়ে।`;
  return `${who} এখনো ${timeText(mine - theirs)} এগিয়ে। আরেকবার?`;
}

/** "আর ১২ সেকেন্ড আগে হলে ৩ তারা।" Exact numbers, from game.ts's nextStar. Empty at three stars. */
export function nearMissLine(next: { goal: number; seconds: number; hints: number } | null) {
  if (!next) return "";
  const time = next.seconds ? `আর ${timeText(next.seconds)} আগে` : "", help = next.hints ? `${bn(next.hints)}টা হিন্ট কম` : "";
  if (time && help) return `${time} আর ${help} হলে ${bn(next.goal)} তারা।`;
  return time ? `${time} হলে ${bn(next.goal)} তারা।` : `${help} নিলে ${bn(next.goal)} তারা।`;
}

export function caption({ level, seconds }: Pick<Shared, "level" | "seconds">) {
  return `ভিমরুলের চাকের লেভেল ${bn(level)}: ${bn(specOf(level).nests)}টা চাক এড়িয়ে পুরো বাগান সাফ করলাম ${timeText(seconds)}ে। তুমি কত সময়ে পারো?`;
}
