// Everything the game says: the status line, the result lines by time band, the post caption and the kind comparison with a friend.
import { possessive } from "../../../shared/bangla";
import { readLevels } from "../../../shared/game-core";
import { TITLE, type Status, type Teacher } from "./game";
import { bn, BENCHES, CLASSIC, LEVEL_COUNT, seconds, type Shared } from "./link";

export function statusLine(status: Status, teacher: Teacher, tapMode: boolean, reply = "") {
  const who = TITLE[teacher];
  switch (status) {
    case "ready": return tapMode ? `${who} বোর্ডে লিখছেন। একবার চাপো, চিরকুট চলবে।` : `${who} বোর্ডে লিখছেন। চেপে ধরো, চিরকুট চলবে।`;
    case "write": return `${who} লিখছেন… চালাও!`;
    case "tell": return "চক থেমে গেল… সাবধান!";
    case "look": return `${who} তাকিয়ে আছেন। নড়বে না!`;
    case "cough": return "খুক খুক… শুধু কাশি!";
    case "drop": return "চক পড়ে গেল! তুলতে নিচু হয়েছেন…";
    case "scold": return "“এইদিকে তাকাও!” চিরকুট এক বেঞ্চ পিছিয়ে।";
    case "lift": return "আঙুল তুলে আবার চেপে ধরো।";
    case "done": return reply ? `শেষ বেঞ্চ থেকে উত্তর এল: “${reply}”` : "চিরকুট শেষ বেঞ্চে পৌঁছে গেছে!";
  }
}

/** Kind lines by total time (tenths of a second); the first speaks of the teacher who never noticed. */
export const BANDS = [
  { below: 160, line: (who: string) => `${who} টেরই পেলেন না!` },
  { below: 230, line: () => "ঘণ্টা পড়ার আগেই পেছনের বেঞ্চে খবর পৌঁছে গেছে।" },
  { below: 330, line: () => "থেমে থেমে, ঠিক সময়ে। চিরকুট জায়গামতো।" },
  { below: Infinity, line: () => "দেরি হলো, তবু চিরকুট পৌঁছেছে।" },
] as const;
export const humanLine = (tenths: number, teacher: Teacher) => BANDS.find(band => tenths < band.below)!.line(TITLE[teacher]);

export const caughtLine = (catches: number) => catches === 0 ? "একবারও চোখে পড়োনি!" : `${bn(catches)} বার শুনেছ “এইদিকে তাকাও”`;
/** The same fact for a card that might be someone else's. */
export const caughtFact = (catches: number) => catches === 0 ? "একবারও ধরা পড়েনি" : `${bn(catches)} বার “এইদিকে তাকাও”`;

export const caption = (tenths: number, teacher: Teacher) => `${TITLE[teacher]} বোর্ডে লিখছিলেন, আমি ${seconds(tenths)} সেকেন্ডে চিরকুট ${bn(BENCHES)} বেঞ্চ পার করেছি! একই ক্লাস, তুমি কত সেকেন্ডে পারবে?`;
export const friendLine = ({ tenths, name }: Shared) => `${name || "তোমার বন্ধু"} ${seconds(tenths)} সেকেন্ডে চিরকুট শেষ বেঞ্চে পৌঁছে দিয়েছে। একই ক্লাস, এবার তোমার পালা।`;
/** Honest label: a real-time score can't be checked. */
export const friendClaim = ({ name }: Shared) => `${possessive(name || "বন্ধু")} নিজের ফোনের সময়`;

export function compareLine(mine: number, friend: Shared) {
  const who = friend.name || "বন্ধু";
  const gap = Math.abs(mine - friend.tenths);
  if (gap === 0) return `${possessive(who)} সাথে একদম সমান সমান!`;
  if (mine < friend.tenths) return `${possessive(who)} চেয়ে ${seconds(gap)} সেকেন্ড আগে!`;
  if (gap <= 30) return `আর একটু হলেই! ${who} মাত্র ${seconds(gap)} সেকেন্ড এগিয়ে।`;
  return `${who} এবার ${seconds(gap)} সেকেন্ড এগিয়ে। আরেকবার?`;
}

/**
 * What one more try would change, in real seconds; "" when nothing is close. Slow mode counts its time at `rate`,
 * so the seconds to save are scaled back to the clock the player sees.
 */
export function nearMiss({ tenths, stars, three, two, rate, best }: { tenths: number; stars: number; three: number; two: number; rate: number; best: number | null }) {
  const scaled = Math.round(tenths * rate), back = (need: number) => seconds(Math.max(1, Math.ceil(need / rate)));
  if (stars === 2) return `আর ${back(scaled - three)} সেকেন্ড আগে পৌঁছালেই ৩ তারা।`;
  if (stars === 1) return `আর ${back(scaled - two)} সেকেন্ড আগে পৌঁছালেই ২ তারা।`;
  if (best !== null && tenths > best && tenths - best <= 30) return `আর ${seconds(tenths - best)} সেকেন্ড আগে হলেই নতুন সেরা।`;
  return "";
}

/** The line over a finished class's stars (the reply itself is already in the status strip). */
export const clearLine = (level: number) => level === LEVEL_COUNT ? "শেষ পিরিয়ডও পার!" : `ক্লাস ${bn(level)} পার!`;

/**
 * Old phones kept only a best time from the original routine, which is class 5 now. Run once, before the level store is first read:
 * that class counts as cleared with 1 star, which opens classes 1–6. Returns the new store, or null for nothing to do.
 */
export function migrateLevels(levelsRaw: string | null, bestRaw: string | null) {
  if (levelsRaw !== null || bestRaw === null) return null;
  const best = Number(bestRaw);
  if (!Number.isFinite(best) || best <= 0) return null;
  return JSON.stringify(readLevels(JSON.stringify({ [CLASSIC]: 1 }), LEVEL_COUNT));
}
