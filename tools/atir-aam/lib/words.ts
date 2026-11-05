// Every line of result and game text, in one place. Server-safe (share.ts loads it through the link preview).
import { possessive } from "../../../shared/bangla";
import { cleanName } from "../../../shared/game-core";
import { stageName, TOP } from "./board";
import type { Shared } from "./challenge";
import { finaleName, GARDEN, levelAt, MODE_INFO, WORLDS, worldOf, type Mode } from "./levels";
import type { Game, Offer, Run } from "./rules";

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);

/** What each stage looks like when you reach it: the HUD's new-stage line, the level-clear line and the card's line. */
export const STAGE_LINES = [
  "আঁটিটা মাটিতে পড়েছে। এবার জোড়া মেলাও।",
  "চারা গজিয়েছে, দুটো কচি পাতা।",
  "চারা এখন গাছ। ছায়াটা এখনো ছোট।",
  "গাছ ভরে মুকুল, মৌমাছি ঘুরছে।",
  "ডালে ডালে গুটি আম। ঝড় না এলেই হয়।",
  "কাঁচা আম। লবণ-মরিচ নিয়ে বসা যায়।",
  "পাকা আম নামল। জ্যৈষ্ঠের দুপুর জমে গেল।",
  "এক ঝুড়ি আম। পাড়ার সবাইকে দুটো করে।",
  "আঁটি থেকে পুরো বাগান। এবার ছায়ায় বসো।",
] as const;
export const stageLine = (stage: number) => STAGE_LINES[Math.max(1, Math.min(TOP, stage)) - 1];

const GOALS = ["", "একটা চারা গজাও", "চারা থেকে গাছ বানাও", "গাছে মুকুল আনো", "গুটি আম ধরাও", "কাঁচা আম বানাও", "পাকা আম বানাও", "এক ঝুড়ি আম বানাও", "পুরো বাগান বানাও"];
/** "পাকা আম বানাও", or "দুটো পাকা আম বানাও" for a count goal. */
export function goalText(target: number, count = 1) {
  if (count > 1) return `${count === 2 ? "দুটো" : `${bn(count)}টা`} ${stageName(target)} বানাও`;
  return GOALS[Math.max(1, Math.min(TOP, target)) - 1];
}

/** "লেভেল ৮ · শিলাবৃষ্টি", "খোলা বাগান", "বন্ধুর পুরোনো লেভেল ৫" */
export function runLabel(run: Run) {
  if (run.kind === "garden") return GARDEN.name;
  if (run.v === 1) return `পুরোনো লেভেল ${bn(run.level)}`;
  return `লেভেল ${bn(run.level)} · ${levelAt(run.level).name}`;
}
export const modeTag = (mode: Mode) => mode === "n" ? "" : MODE_INFO[mode].name;

/** "রাফি পাকা আম পর্যন্ত গেছে, ১২৪০ পয়েন্ট" or "রাফি ৭ নম্বর লেভেল ৬২ চালে পার করেছে" */
export function feat({ kind, level, count, score, top, name }: Pick<Shared, "kind" | "level" | "count" | "score" | "top" | "name">) {
  const who = cleanName(name) || "এক বন্ধু";
  return kind === "level" ? `${who} ${bn(level)} নম্বর লেভেল ${bn(count)} চালে পার করেছে` : `${who} ${stageName(top)} পর্যন্ত গেছে, ${bn(score)} পয়েন্ট`;
}
export const previewTitle = (shared: Shared) => `${feat(shared)}। তুমি পারবে?`;
/** Under a friend's challenge on the title. */
export function friendClaim(shared: Shared) {
  const old = shared.v === 1 ? " পুরোনো নিয়মের খেলা।" : "";
  return shared.kind === "level"
    ? `একই লেভেল, একই আঁটি। কম চালে পারো কি না দেখো।${old}`
    : `একই শুরু, আঁটি পড়ার নিয়মও একই। চালগুলো মিলিয়ে দেখেছি, হিসাব সত্যি।${old}`;
}

/** After playing a friend's run. The garden: more points win. A level: fewer moves win. Kind either way. */
export function compareLine(mine: number, theirs: number, name: string, level: boolean) {
  const who = cleanName(name) || "বন্ধু", unit = level ? "চাল" : "পয়েন্ট";
  const ahead = level ? theirs - mine : mine - theirs;
  if (ahead > 0) return `${possessive(who)} চেয়ে ${bn(ahead)} ${unit} ${level ? "কম" : "বেশি"}!`;
  if (ahead === 0) return `একদম সমান! ${who}ও ${bn(theirs)} ${unit}।`;
  const gap = -ahead;
  if (gap <= Math.max(5, theirs * 0.15)) return `আর একটু হলেই! মাত্র ${bn(gap)} ${unit} ${level ? "বেশি" : "কম"}।`;
  return `${who} এখনো ${bn(gap)} ${unit} এগিয়ে। আরেকবার?`;
}

export function caption({ kind, level, count, score, top }: Pick<Shared, "kind" | "level" | "count" | "score" | "top">) {
  return kind === "level"
    ? `আঁটি থেকে আমের ${bn(level)} নম্বর লেভেল ${bn(count)} চালে পার করলাম। তুমি কত চালে পারবে?`
    : `আঁটি থেকে আম খেলায় ${stageName(top)} পর্যন্ত গেলাম, ${bn(score)} পয়েন্ট। তুমি কতদূর যাবে?`;
}

// ---- in play ----
/** The line under the bed: what the next pair grows into, or what the weather is about to do. */
export function hintLine(game: Game) {
  const n = game.moves.length;
  if (!n) return game.run.kind === "level" && game.run.v === 2 ? levelAt(game.run.level).teach : "আঙুল টেনে সরাও। একই ছবির দুটো ছুঁলে মিলে বড় হয়।";
  if (game.gustAt) return game.gustAt - n === 1 ? "পরের চালের পরেই হাওয়া আসছে।" : "হাওয়া আসছে, দুই চাল পরে।";
  if (game.hailAt && game.hailCell >= 0) return "লাল দাগের ঘরে শিল পড়বে। বড়টা সরিয়ে নাও।";
  if (game.shadow >= 0) return "কাকের ছায়া পড়েছে। ঘরটা ভরে দাও।";
  if (game.crowCell >= 0) return `কাক বসে আছে, আর ${bn(game.crowLeft)} চাল।`;
  if (game.top >= TOP) return "পুরো বাগান হয়ে গেছে। এবার যত পয়েন্ট পারো।";
  return `দুটো ${stageName(game.top)} মেলালে ${stageName(game.top + 1)}।`;
}

// ---- মালির থলে ----
export const OFFER_WORDS: Record<Offer, { name: string; line: string; unit: string }> = {
  undo: { name: "ফেরত", line: "আরও দুবার চাল ফেরত নিতে পারবে।", unit: "ফেরত" },
  manure: { name: "গোবর সার", line: "পরের ৬টা আঁটি চারা হয়ে পড়বে।", unit: "চারা পড়বে" },
  spade: { name: "কোদাল", line: "সবচেয়ে ছোট তিনটা ঘুঁটি তুলে ফেলো, আগাছা আগে।", unit: "খালি ঘর" },
  rain: { name: "এক পশলা বৃষ্টি", line: "এখনই বোর্ডের সব আঁটি চারা হয়ে যাবে।", unit: "আঁটি" },
};

// ---- the end ----
export function endKicker(game: Game) {
  const { run } = game;
  if (run.kind === "garden") return game.end === "stop" ? "এখানেই থামলে" : "জায়গা শেষ";
  const finale = run.v === 2 ? finaleName(run.level) : "";
  if (game.won) return finale ? `${finale} পার` : `লেভেল ${bn(run.level)} পার`;
  return game.end === "moves" ? "চাল শেষ" : "জায়গা শেষ";
}
export function endWhy(game: Game) {
  const { run, spec } = game;
  if (run.kind === "garden") return `সবচেয়ে বড়: ${stageName(game.top)}`;
  if (game.won) return `${runLabel(run)}${modeTag(run.mode) ? ` · ${modeTag(run.mode)}` : ""}`;
  return `সবচেয়ে বড় হয়েছিল ${stageName(game.top)}। লক্ষ্য ছিল ${goalText(spec.target, spec.count)}।`;
}
/** A finale's first clear names what opens next. */
export function seasonLine(level: number) {
  const world = worldOf(level), next = WORLDS[world + 1];
  return next ? `${WORLDS[world].name} শেষ। এবার ${next.name}।` : "তিন মৌসুমই শেষ। আঁটি থেকে পুরো বাগান।";
}
/** "৪২ নম্বর চালে এক টানে ৩ জোড়া, +৬৪" */
export function bestSwipeLine(game: Game) {
  const { at, pairs, points } = game.bestSwipe;
  if (!at || pairs < 1) return "";
  return `সেরা চাল: ${bn(at)} নম্বরে এক টানে ${bn(pairs)} জোড়া, +${bn(points)}`;
}
