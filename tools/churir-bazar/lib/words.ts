// Every line of result text and every goal sentence. Server-safe: share.ts loads link text through here.
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { COLOUR_NAMES } from "./art-names";
import { DUST_GOAL, FREE_GOAL, RAINBOW, SPARKLE } from "./board";
import { DEFS, MODE_INFO, WORLDS, finaleName, isFinale, worldOf, type Goal } from "./ladder";
import { dropDue, movesLeft, shortBy, specOf, starsOf, type Game, type Run } from "./rules";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

const thing = ([target]: Goal) =>
  target === SPARKLE ? "ঝিকমিক" : target === RAINBOW ? "রংধনু" : target === DUST_GOAL ? "ধুলো" : target === FREE_GOAL ? "তালা" : COLOUR_NAMES[target];
/** "২০টা লাল চুড়ি তোলো", "২টা ঝিকমিক চুড়ি বানাও", "৩টা তালা খোলো", "১০ বার ধুলো মোছো" */
export function goalText(goal: Goal, count = goal[1]) {
  const [target] = goal;
  if (target === DUST_GOAL) return `${bn(count)} বার ধুলো মোছো`;
  if (target === FREE_GOAL) return `${bn(count)}টা তালা খোলো`;
  return `${bn(count)}টা ${thing(goal)} চুড়ি ${target >= SPARKLE ? "বানাও" : "তোলো"}`;
}
/** "২০টা লাল, ১টা রংধনু" */
export const goalsShort = (run: Run) => specOf(run).goals.map(goal => `${bn(goal[1])}${goal[0] === DUST_GOAL ? " বার " : "টা "}${thing(goal)}`).join(", ");
/** "২০টা লাল চুড়ি তোলো, ২৫ চালে" */
export const goalLine = (run: Run, limit: number) => `${specOf(run).goals.map(goal => goalText(goal)).join(", ")}, ${bn(limit)} চালে`;
/** What a goal chip says out loud. */
export const goalLabel = (goal: Goal, left: number) => (left ? `${thing(goal)}, আর ${bn(left)} বাকি` : `${thing(goal)}, হয়ে গেছে`);

export const runLabel = (run: Run) => (run.v === 2 ? `লেভেল ${bn(run.level)}: ${DEFS[run.level - 1].name}` : `লেভেল ${bn(run.level)} (পুরোনো)`);

/** The moves ran out: the goal that came closest. "আর ৩টা নীল চুড়ি হলেই হতো।" */
export function missLine(game: Game) {
  const goals = game.spec.goals, open = game.left.map((count, index) => ({ count, goal: goals[index] })).filter(item => item.count > 0);
  if (!open.length) return "";
  const close = open.reduce((best, item) => (item.count < best.count ? item : best));
  const what = close.goal[0] === DUST_GOAL ? `${bn(close.count)} বার ধুলো মোছা` : close.goal[0] === FREE_GOAL ? `${bn(close.count)}টা তালা খোলা` : `${bn(close.count)}টা ${thing(close.goal)} চুড়ি`;
  return open.length === 1 ? `আর ${what} হলেই হতো।` : `আর ${what} বাকি ছিল, সঙ্গে আরও ${bn(open.length - 1)}টা লক্ষ্য।`;
}

const CLEAR_LINES = [
  ["মেলার মাঠে সন্ধ্যা নামছে, হাতে নতুন চুড়ি।", "চুড়িওয়ালা খালা আরেক গোছা নামিয়ে দিলেন।", "নাগরদোলার পাশের দোকানটা প্রায় খালি।"],
  ["বৈশাখের ভিড়ে এই দোকানেই লাইন।", "লাল-সাদা শাড়ির সঙ্গে লাল চুড়ি, মিলে গেল।", "ঢোলের শব্দের ভেতর রিনিঝিনি।"],
  ["চুড়িপট্টির গলিতে এক দোকান পার, সামনে আরও আছে।", "একটা কাচের চুড়িও ভাঙেনি।", "দোকানি বললেন, কাল নতুন মাল আসবে।"],
  ["হারিকেনের আলোয় চুড়িগুলো ঝিকমিক করছে।", "রাত বাড়ছে, তোমার দোকান এখনো খোলা।", "মেলা ভাঙার আগে শেষ গোছাটাও বিক্রি।"],
] as const;
export const clearLine = (level: number) => CLEAR_LINES[worldOf(level)][(level - 1) % 3];
/** The first clear of a finale. */
export const finaleLine = (level: number) => `${finaleName(level)} পার। ${level < 40 ? "পরের মেলার পথ খুলে গেল।" : "মেলা শেষ, দোকান তোমার।"}`;

/** The card's human line, by stars. */
export const STAR_LINES = ["", "পার হয়েছে। পরের বার আরও পয়েন্ট তোলা যায়।", "সব লক্ষ্য পূরণ। আর একটু পয়েন্ট হলে ৩ তারা।", "৩ তারা। খালা আরেক গোছা চুড়ি আনতে গেলেন।"] as const;

/** "রাফি ১২ নম্বর লেভেলে ৩২৪০ পয়েন্ট পেয়েছে" */
export function feat({ level, score, name }: { level: number; score: number; name: string }) {
  return `${cleanName(name) || "এক বন্ধু"} ${bn(level)} নম্বর লেভেলে ${bn(score)} পয়েন্ট পেয়েছে`;
}
export const previewTitle = (shared: { level: number; score: number; name: string }) => `${feat(shared)}। তুমি পারবে?`;
/** Under the friend's card: what is proven. */
export const friendClaim = (shared: { count: number; stars: number; mode: Run["mode"]; v: Run["v"] }) =>
  `${bn(shared.count)} চালে পার, ${bn(shared.stars)} তারা${shared.mode !== "n" ? `, ${MODE_INFO[shared.mode].name} খেলায়` : ""}। চালগুলো আবার খেলে মিলিয়ে দেখা হয়েছে।${shared.v === 1 ? " লেভেলটা পুরোনো নিয়মের।" : ""}`;

/** After playing a friend's level: more points win. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string) {
  const who = cleanName(name) || "বন্ধু", ahead = mine - theirs;
  if (ahead > 0) return `${possessive(who)} চেয়ে ${bn(ahead)} পয়েন্ট বেশি!`;
  if (ahead === 0) return `একদম সমান! ${who}ও ${bn(theirs)} পয়েন্ট।`;
  if (-ahead <= Math.max(150, theirs * 0.1)) return `আর একটু হলেই! মাত্র ${bn(-ahead)} পয়েন্ট কম।`;
  return `${who} এখনো ${bn(-ahead)} পয়েন্ট এগিয়ে। আরেকবার?`;
}

export const caption = ({ level, score, stars }: { level: number; score: number; stars: number }) =>
  `চুড়ির বাজারের ${bn(level)} নম্বর লেভেলে ${bn(score)} পয়েন্ট পেলাম, ${bn(stars)} তারা। তুমি কত পাবে?`;

/** The one line under the tray. */
export function hintLine(game: Game) {
  const { spec, run } = game, left = movesLeft(game);
  if (!game.moves.length) return run.level === 1 && run.v === 2 ? "দুলছে যে দুটো চুড়ি, টেনে বদলে দাও।" : run.v === 2 ? DEFS[run.level - 1].teach : "পাশাপাশি দুটো বদলাও, এক রঙের তিনটা মেলাও।";
  if (dropDue(game) >= 0) return "এই চালের পর লাল বৃত্তে তালা পড়বে।";
  if (left <= 3) return `আর ${bn(left)} চাল বাকি।`;
  return spec.drop ? `প্রতি ${bn(spec.drop)} চালে একটা তালা পড়ে।` : "চারটা একসঙ্গে তুললে ঝিকমিক চুড়ি, পাঁচটায় রংধনু।";
}

export function endKicker(game: Game) {
  const { run } = game;
  if (game.won) return isFinale(run.level) && run.v === 2 ? `${finaleName(run.level)}: পার` : `লেভেল ${bn(run.level)} পার`;
  return "চাল শেষ";
}
export const endWhy = (game: Game) => (game.won ? (game.run.v === 2 ? `${WORLDS[worldOf(game.run.level)].name} · ${DEFS[game.run.level - 1].name}` : "বন্ধুর পুরোনো লেভেল") : missLine(game));
/** What would have earned the next star. */
export function nearLine(game: Game) {
  if (!game.won) return "";
  const short = shortBy(game), max = MODE_INFO[game.run.mode].maxStars, stars = starsOf(game);
  if (short > 0) return `আর ${bn(short)} পয়েন্ট হলে ${bn(stars + 1)} তারা।`;
  return stars === max && max < 3 ? "সহজে বড়জোর ২ তারা। ৩ তারা পেতে স্বাভাবিকে খেলো।" : "";
}
/** The run's biggest single move. "১২ নম্বর চালে এক চালেই ৯টা চুড়ি" */
export const bestMoveLine = (game: Game) => (game.bestLift >= 5 ? `${bn(game.bestLiftAt)} নম্বর চালে এক চালেই ${bn(game.bestLift)}টা চুড়ি উঠেছে।` : "");
