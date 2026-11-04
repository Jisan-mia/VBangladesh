// Everything the game says during and after a class: what the pass button reads right now, the line for a clear or a loss,
// the near miss, the post caption, and the one-time move of an old phone's progress. Pure, so tests read every line.
import { possessive } from "../../../shared/bangla";
import { readLevels } from "../../../shared/game-core";
import { AWAY, BACK, BLIND, BY_WATCHER, COUGH, DARK, DROP, FLICK, LENS, LOOK, PEEK, TELL, TITLE, W_LOOK, W_TELL, WIPE, type Game, type Teacher } from "./class";
import { bn, seconds } from "./challenge";
import { CLASSIC } from "./legacy";
import { LEVEL_COUNT, levelDef, MODE_INFO, toNextStar, type Mode } from "./levels";

/** What the player should know right now, from what the class shows. */
export type Status =
  | "ready" | "write" | "warn" | "look" | "cough" | "peek" | "blind" | "lens" | "wipe" | "back" | "dark" | "flick"
  | "captain-warn" | "captain-look" | "door-warn" | "door-look" | "scold" | "lift" | "throw" | "sleeper" | "done" | "lost";

export function statusOf(game: Game, held: boolean, atThrow: boolean): Status {
  const k = game.klass;
  if (game.phase === "ready") return "ready";
  if (game.phase === "over") return game.won ? "done" : "lost";
  if (game.scold > 0) return "scold";
  if (game.throwing) return "throw";
  if (game.needRelease && held) return "lift";
  if (k.wKinds.length > 0) {
    const w = k.wKinds[game.wSeg], monitor = k.watcher === "monitor";
    if (w === W_LOOK) return monitor ? "captain-look" : "door-look";
    if (w === W_TELL) return monitor ? "captain-warn" : "door-warn";
  }
  const kind = k.kinds[game.seg], light = k.dKinds.length > 0 ? k.dKinds[game.dSeg] : AWAY;
  if (light === DARK) return "dark";
  if (light === FLICK && (kind === LOOK || kind === TELL || kind === LENS || kind === BACK)) return "flick";
  switch (kind) {
    case LOOK: return "look";
    case TELL: return "warn";
    case LENS: return "lens";
    case BACK: return "back";
    case COUGH: return "cough";
    case DROP: return "cough";
    case PEEK: return "peek";
    case BLIND: return "blind";
    case WIPE: return "wipe";
  }
  return atThrow && !game.moving ? "sleeper" : "write";
}

/** The pass button's two lines for a status: what to do, and why. `who` is the teacher's title. */
export function coach(status: Status, held: boolean, tapMode: boolean, who: string, reply: string): [string, string] {
  switch (status) {
    case "ready": return tapMode ? ["একবার চাপো", "চিরকুট চলবে, আবার চাপলে থামবে"] : ["ধরে রাখো", `চক চললে চালাও, ${who} ঘুরলে ছাড়ো`];
    case "write": return held ? (tapMode ? ["চাপো, থামবে", "চক চলছে, চিরকুট যাচ্ছে"] : ["যাচ্ছে…", "চক চলছে"]) : (tapMode ? ["চাপো, চলবে", "চক চলছে"] : ["ধরে রাখো", "চক চলছে, চালাও"]);
    case "warn": return ["ছাড়ো!", "হাত নামছে, এখনই ঘুরবেন"];
    case "look": return ["নড়বে না", `${who} তাকিয়ে আছেন`];
    case "cough": return ["চালাও", "শুধু কাশি, পিঠ এদিকে"];
    case "peek": return ["চালাও", "হাত বোর্ডেই, শুধু মাথা ঘুরল"];
    case "blind": return ["চালাও", "চশমা মুছছেন, কিছু দেখছেন না"];
    case "lens": return ["ছাড়ো!", "চশমা চোখে উঠছে"];
    case "wipe": return ["চালাও", "মোছা শেষ হলেই ঘুরবেন"];
    case "back": return ["থেমে থাকো", "চকের হাত ওঠেনি, আবার তাকাবেন"];
    case "dark": return ["চালাও", "অন্ধকারে কেউ দেখছে না"];
    case "flick": return ["ছাড়ো!", "বাতি ফিরছে"];
    case "captain-warn": return ["ছাড়ো!", "মিলি সোজা হয়ে বসছে"];
    case "captain-look": return ["নড়বে না", "মিলি পেছনে তাকিয়ে"];
    case "door-warn": return ["ছাড়ো!", "দরজার কাচে ছায়া"];
    case "door-look": return ["নড়বে না", "হেডস্যার উঁকি দিচ্ছেন"];
    case "scold": return ["“এইদিকে তাকাও!”", "চিরকুট পিছিয়ে গেল"];
    case "lift": return ["আঙুল তোলো", "তারপর আবার চেপে ধরো"];
    case "throw": return ["ছুড়েছ!", "চিরকুট উড়ছে, আর থামবে না"];
    case "sleeper": return [tapMode ? "চাপো, ছুড়বে" : "চেপে ধরো, ছুড়বে", "পরের বন্ধু ঘুমায়। হাত নামার সময় ছুড়ো না"];
    case "done": return ["পৌঁছে গেছে", reply ? `উত্তর এল: “${reply}”` : "শেষ বেঞ্চে"];
    case "lost": return ["এবার হলো না", "চিরকুট টেবিলে জমা পড়েছে"];
  }
}

/** Danger the edge shows: "" (go), "warn" (a look is coming), "watch" (someone is looking). */
export const edgeOf = (status: Status) =>
  status === "look" || status === "captain-look" || status === "door-look" || status === "scold" ? "watch"
    : status === "warn" || status === "lens" || status === "back" || status === "flick" || status === "captain-warn" || status === "door-warn" ? "warn" : "";

const CLEAR_LINES = [
  "চিরকুট পৌঁছে গেছে। বোর্ডে চক এখনো চলছে।",
  "কাশি থামার আগেই চিরকুট দুই বেঞ্চ পার।",
  "মাথা ঘুরেছিল, হাত ঘোরেনি। চিরকুট জায়গামতো।",
  "ক্যাপ্টেন মিলির খাতায় আজ কারও নাম ওঠেনি।",
  "চশমা চোখে ওঠার আগেই চিরকুট শেষ বেঞ্চে।",
  "বোর্ড পরিষ্কার, চিরকুটও পার।",
  "ঘুমন্ত বন্ধু টেরই পায়নি। চিরকুট তার মাথার ওপর দিয়ে গেছে।",
  "হেডস্যার দরজা থেকে চলে গেলেন। কিছুই দেখেননি।",
  "বাতি ফেরার আগেই খবর পৌঁছে গেছে।",
  "দুবার তাকিয়েও কিছু পাননি।",
  "যত তাড়াতাড়ি ঘোরেন, চিরকুট তার আগেই পার।",
  "হেডস্যারের ক্লাসেও চিরকুট পার। ছুটির ঘণ্টা বাজল।",
] as const;
export function clearLine(level: number, old = false) {
  if (old) return level === 10 ? "শেষ পিরিয়ডও পার।" : "চিরকুট শেষ বেঞ্চে পৌঁছে গেছে।";
  return CLEAR_LINES[Math.min(LEVEL_COUNT, Math.max(1, level)) - 1];
}
export const clearKicker = (level: number, old = false) => old ? `ক্লাস ${bn(level)} পার` : `লেভেল ${bn(level)} পার · ${levelDef(level).name}`;

/** A finale ended on its last catch: where the chit went, and the one thing to watch next time. */
export function lossLine(level: number, teacher: Teacher, byWatcher: number) {
  const L = levelDef(level), table = `চিরকুট এখন ${possessive(TITLE[teacher])} টেবিলে।`;
  if (L.finale?.watcher?.kind === "monitor") return byWatcher ? `মিলি দেখে ফেলেছে। ${table} মিলি সোজা হয়ে বসলেই থামো।` : `${bn(3)}বার ধরা পড়েছ। ${table} হাত নামলেই থামো।`;
  if (L.finale?.watcher?.kind === "door") return byWatcher ? `হেডস্যার কাচ দিয়ে দেখে ফেলেছেন। ${table} পায়ের শব্দ শুনলেই থামো।` : `${bn(3)}বার ধরা পড়েছ। ${table} ছোড়ার আগে হাত দেখো।`;
  return `${bn(3)}বার ধরা পড়েছ। চিরকুট এখন হেডস্যারের টেবিলে। চকের হাত না উঠলে থেমে থাকো।`;
}
export const lostBy = (game: Game) => game.scoldBy === BY_WATCHER ? 1 : 0;

/** What one more try would change, in seconds; "" when nothing is close. */
export function nearMiss({ tenths, stars, targets, mode, best }: { tenths: number; stars: number; targets: { three: number; two: number }; mode: Mode; best: number | null }) {
  const gap = toNextStar(tenths, targets, mode);
  if (gap > 0 && gap <= 80) return `আর ${seconds(gap)} সেকেন্ড আগে পৌঁছালেই ${bn(stars + 1)} তারা।`;
  if (stars === MODE_INFO[mode].maxStars && stars < 3) return "সহজে বড়জোর ২ তারা। ৩ তারা পেতে সাধারণে খেলো।";
  if (best !== null && tenths > best && tenths - best <= 30) return `আর ${seconds(tenths - best)} সেকেন্ড আগে হলেই নতুন সেরা।`;
  return "";
}

export const caption = (tenths: number, teacher: Teacher, benches: number) =>
  `${TITLE[teacher]} বোর্ডে লিখছিলেন, আমি ${seconds(tenths)} সেকেন্ডে চিরকুট ${bn(benches)} বেঞ্চ পার করেছি। একই ক্লাস, তুমি কত সেকেন্ডে পারবে?`;
export const caughtFact = (catches: number) => catches === 0 ? "একবারও ধরা পড়েনি" : `${bn(catches)} বার “এইদিকে তাকাও”`;

/** The card's own line, seen by friends: what the teacher never noticed. */
export function cardLine(stars: number, teacher: Teacher) {
  if (stars === 3) return `${TITLE[teacher]} টেরই পেলেন না।`;
  if (stars === 2) return "ঘণ্টা পড়ার আগেই পেছনের বেঞ্চে খবর পৌঁছে গেছে।";
  return "থেমে থেমে, ঠিক সময়ে। চিরকুট জায়গামতো।";
}

/**
 * Old phones kept only a best time from the original routine (class 5). Run once, before the level store is first read:
 * that class counts as cleared with 1 star, which opens levels 1–6. Returns the new store, or null for nothing to do.
 */
export function migrateLevels(levelsRaw: string | null, bestRaw: string | null) {
  if (levelsRaw !== null || bestRaw === null) return null;
  const best = Number(bestRaw);
  if (!Number.isFinite(best) || best <= 0) return null;
  return JSON.stringify(readLevels(JSON.stringify({ [CLASSIC]: 1 }), LEVEL_COUNT));
}
