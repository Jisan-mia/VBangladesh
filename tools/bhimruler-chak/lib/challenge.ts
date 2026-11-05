// Challenge links and every line of result text. Server-safe: share.ts loads this, so it reaches only game-core and lib/.
import { possessive } from "../../../shared/bangla";
import { challengeHash, cleanName, readChallenge } from "../../../shared/game-core";
import { legacySpec } from "./legacy";
import { WORLDS, isFinale, isLevel, levelName, levelOf, worldOf } from "./levels";
import { starsEarned, type Hint } from "./play";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

export const MAX_SECONDS = 5999;
/**
 * A cleared orchard as the player reports it. The orchard is rebuilt from the level and the seed (an old link also names the
 * first bush tapped). The time is their phone's; hints and stings are their own word.
 */
export type Shared = { level: number; legacy: boolean; seed: number; first: number; seconds: number; hints: number; stings: number; name: string };

/**
 * New: `#s=<seed>&t=<seconds>&l=<level>&h=<hints>&x=<stings>&v=2&n=<name>` (h and x only when not 0).
 * Old (no `v`, from before the rewrite): `#s=&t=&l=&f=<first bush>&h=&n=`, which names one of the old 30 orchards.
 * Anything else is refused.
 */
export function parseShared(hash: string): Shared | null {
  const read = readChallenge(hash, { maxTarget: MAX_SECONDS, extraKeys: ["l", "f", "h", "x", "v"] });
  if (!read || read.target < 1) return null;
  const { l = "", f, h = "0", x, v } = read.extra;
  if (!/^[1-9]\d?$/.test(l) || !/^\d$/.test(h)) return null;
  const level = Number(l);
  if (v === undefined) {
    // The old format, exactly as the old parser read it.
    const spec = legacySpec(level);
    if (!spec || x !== undefined || f === undefined || !/^(0|[1-9]\d{0,2})$/.test(f) || Number(f) >= spec.cols * spec.rows) return null;
    return { level, legacy: true, seed: read.seed, first: Number(f), seconds: read.target, hints: Number(h), stings: 0, name: read.name };
  }
  if (v !== "2" || f !== undefined || !isLevel(level)) return null;
  if (x !== undefined && !/^[0-2]$/.test(x)) return null;
  const stings = Number(x ?? 0);
  if (stings > levelOf(level)!.forgive) return null;
  return { level, legacy: false, seed: read.seed, first: -1, seconds: read.target, hints: Number(h), stings, name: read.name };
}

export function sharedHash({ level, legacy, seed, first, seconds, hints, stings, name }: Shared) {
  const time = Math.min(MAX_SECONDS, Math.max(1, Math.round(seconds))), h = Math.min(9, hints);
  if (legacy) return challengeHash({ seed, target: time, name, extra: { l: level, f: first, ...(h ? { h } : {}) } });
  return challengeHash({ seed, target: time, name, extra: { l: level, ...(h ? { h } : {}), ...(stings ? { x: stings } : {}), v: 2 } });
}

export const parOf = (level: number, legacy: boolean) => (legacy ? legacySpec(level)?.par : levelOf(level)?.par) ?? 60;
export const sharedStars = (shared: Shared) => starsEarned(shared.seconds, shared.hints, shared.stings, parOf(shared.level, shared.legacy));

// ---- times and names ----

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

export const worldName = (level: number) => WORLDS[worldOf(level) - 1].name;
export const levelLabel = (level: number, legacy = false) => legacy ? `পুরোনো লেভেল ${bn(level)}` : `লেভেল ${bn(level)} · ${worldName(level)}`;
/** The HUD badge: the level and its orchard (a finale's name has its own boss row), or "বন্ধুর বাগান" on an old link's orchard. */
export const badge = (level: number, legacy: boolean) => legacy
  ? { main: "বন্ধুর বাগান", sub: `পুরোনো লেভেল ${bn(level)}` }
  : { main: `লেভেল ${bn(level)}`, sub: worldName(level) };
export function sizeLabel(level: number, legacy = false) {
  const spec = legacy ? legacySpec(level) : levelOf(level);
  return spec ? `${bn(spec.cols)}×${bn(spec.rows)} বাগান, ${bn(spec.nests)}টা চাক` : "";
}

// ---- during play ----

/** What the hint proved, in one line, with the numbers it used drawn on the board. */
export function hintLine(hint: Hint) {
  if (hint.via === "pair") return "দাগ দেওয়া দুটো সংখ্যা মিলিয়ে দেখো: এই ঝোপে চাক থাকতে পারে না।";
  if (hint.via === "total") return "যত চাক, সব খুঁজে পাওয়া গেছে। তাই বাকি ঝোপ নিরাপদ।";
  if (!hint.clues.length) return "এই ঝোপটা নিরাপদ।";
  return hint.nests.length ? "দাগ দেওয়া সংখ্যার চাক সব খুঁজে পাওয়া গেছে, তাই এই ঝোপ নিরাপদ।" : "দাগ দেওয়া সংখ্যার পাশে আর চাক নেই, তাই এই ঝোপ নিরাপদ।";
}

/** After a sting the hornets forgave: how many more they will. */
export const stingLine = (left: number) => left > 0 ? `ভিমরুল জেগে গেছে! আর ${bn(left)}বার ভুল হলে সবাই দৌড়।` : "ভিমরুল জেগে গেছে! আর একটা ভুল হলেই সবাই দৌড়।";

// ---- the result ----

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
const FINALE_LINES = [
  "বুড়ো গাছটার তলা সাফ। নানা বলতেন, এই গাছের আম সবচেয়ে মিষ্টি।",
  "ফজলির বাগান সাফ। ঝরা আমগুলো এবার ঝুড়িতে।",
  "কানসাটের বড় বাগানও সাফ। ৩০টা বাগানের আম এবার নিশ্চিন্তে পাড়া যাবে।",
];

/** The level-clear line: one small orchard scene. A finale gets its own. */
export function clearLine(level: number, legacy = false) {
  if (legacy) return "বন্ধুর পুরোনো বাগান সাফ। একই ঝোপ, একই চাক।";
  if (isFinale(level)) return FINALE_LINES[worldOf(level) - 1];
  return CLEAR_LINES[(level - 1) % CLEAR_LINES.length];
}

export const finishTitle = (level: number, legacy: boolean, won: boolean) => !won ? "ভোঁওও… সবাই দৌড়!"
  : legacy ? "বন্ধুর বাগান সাফ" : isFinale(level) ? `${levelName(level)} সাফ` : `লেভেল ${bn(level)} সাফ`;

/** When the swarm comes: funny, nobody hurt, and the exact distance to the finish. */
export function lossLine(left: number) {
  return left <= 3 ? `আর মাত্র ${bn(left)}টা ঝোপ বাকি ছিল!` : `সবাই দৌড়ে পুকুরপাড়ে, কেউ হুল খায়নি। আর ${bn(left)}টা ঝোপ বাকি ছিল।`;
}

/** The line on the card, seen by friends: first person, one image. */
export function humanLine(stars: number, hints: number, stings: number) {
  if (stings) return stings === 1 ? "ভিমরুল একবার জেগেছিল, তবু বাগান সাফ।" : "ভিমরুল দুবার জেগেছিল, তবু বাগান সাফ।";
  if (hints) return `${bn(hints)}বার হিন্ট নিয়েছি, বাকিটা নিজে।`;
  if (stars >= 3) return "ভিমরুলেরা টেরই পায়নি।";
  if (stars === 2) return "গামছা ঠিক জায়গায়, আম ঝুড়িতে।";
  return "সময় লেগেছে, তবে একটা হুলও খাইনি।";
}

/** "আর ১২ সেকেন্ড আগে হলে ৩ তারা।" Exact numbers, from play.ts's nextStar. Empty at three stars. */
export function nearMissLine(next: { goal: number; seconds: number; help: number } | null) {
  if (!next) return "";
  const time = next.seconds ? `আর ${timeText(next.seconds)} আগে` : "", help = next.help ? `${bn(next.help)}টা হিন্ট বা ভুল কম` : "";
  if (time && help) return `${time} আর ${help} হলে ${bn(next.goal)} তারা।`;
  return time ? `${time} হলে ${bn(next.goal)} তারা।` : `${help} হলে ${bn(next.goal)} তারা।`;
}

/** "রাফি লেভেল ১২-এর বাগান ১ মিনিট ১০ সেকেন্ডে সাফ করেছে" */
export function feat({ level, legacy, seconds, name }: Pick<Shared, "level" | "legacy" | "seconds" | "name">) {
  const where = legacy ? `পুরোনো লেভেল ${bn(level)}-এর বাগান` : isFinale(level) ? levelName(level) : `লেভেল ${bn(level)}-এর বাগান`;
  return `${cleanName(name) || "এক বন্ধু"} ${where} ${timeText(seconds)}ে সাফ করেছে`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;

export function bannerNote({ name, hints, stings }: Pick<Shared, "name" | "hints" | "stings">) {
  const who = cleanName(name) || "বন্ধু";
  const help = [hints ? `${bn(hints)}বার হিন্ট` : "", stings ? `${bn(stings)}বার ভুল` : ""].filter(Boolean).join(", ");
  return `${help ? `${help} নিয়ে। ` : ""}সময়টা ${possessive(who)} নিজের ফোনের হিসাব। একই বাগান, একই চাক। এবার তোমার পালা।`;
}

/** After a friend's orchard: less time is better. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু";
  if (mine < theirs) return `${possessive(who)} চেয়ে ${timeText(theirs - mine)} আগে!`;
  if (mine === theirs) return `একদম সমান! ${who}ও ${timeText(theirs)} নিয়েছিল।`;
  if (mine - theirs <= 15) return `আর একটু হলেই! মাত্র ${timeText(mine - theirs)} পিছিয়ে।`;
  return `${who} এখনো ${timeText(mine - theirs)} এগিয়ে। আরেকবার?`;
}

/** On a finale's result: the orchard's total ("বাড়ির পেছনের ১০টা বাগান: ★ ২৪/৩০"). */
export function worldTotal(level: number, stars: Record<number, number>) {
  const world = worldOf(level), from = (world - 1) * 10 + 1;
  let got = 0;
  for (let at = from; at < from + 10; at++) got += stars[at] ?? 0;
  return `${WORLDS[world - 1].of} ১০টা বাগান: ★ ${bn(got)}/৩০`;
}

export function caption({ level, legacy, seconds }: Pick<Shared, "level" | "legacy" | "seconds">) {
  const nests = (legacy ? legacySpec(level)?.nests : levelOf(level)?.nests) ?? 0;
  return `ভিমরুলের চাকের ${legacy ? "পুরোনো " : ""}লেভেল ${bn(level)}: ${bn(nests)}টা চাক এড়িয়ে পুরো বাগান সাফ করলাম ${timeText(seconds)}ে। তুমি কত সময়ে পারো?`;
}
