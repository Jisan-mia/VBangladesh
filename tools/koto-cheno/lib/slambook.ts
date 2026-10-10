import { possessive } from "../../../shared/bangla";

export const MAX_NAME_LENGTH = 20;

type Option = { label: string; drawing: string; color?: string };
type Question = { id: string; mine: string; about: string; missed: string; common: number; options: readonly [Option, Option, Option, Option] };

// Links store one answer per question by position: once links are public, never reorder questions or options.
// Safe for teenagers on purpose: everyday likes and habits only. No crush, relationship, body, religion or politics questions.
// `about` takes {r} (রাফির) or {n} (রাফি). `common` is the pick most friends would guess first; it only drives the playful difficulty line.
export const questions = [
  { id: "ritu", mine: "প্রিয় ঋতু", about: "{r} প্রিয় ঋতু কোনটা?", missed: "প্রিয় ঋতুটা", common: 1, options: [
    { label: "গ্রীষ্ম", drawing: "M16 24a8 8 0 1 0 16 0 8 8 0 1 0-16 0M24 5v6m0 26v6M5 24h6m26 0h6M11 11l4 4m18 18 4 4m0-26-4 4M15 33l-4 4" },
    { label: "বর্ষা", drawing: "M6 23C6 13 14 7 24 7s18 6 18 16c-3-3-6-3-9 0-3-3-6-3-9 0-3-3-6-3-9 0-3-3-6-3-9 0ZM24 23v15a4 4 0 0 1-8 0M24 7V4M8 31l-2 5m33-5-2 5M12 40l-1 3m26-3-1 3" },
    { label: "শীত", drawing: "M14 20a10 10 0 0 1 20 0M6 26h36M10 32h28M6 38h36M14 44h20M24 5v3m-12 2 2 2m22-2-2 2" },
    { label: "বসন্ত", drawing: "M21 22a3 3 0 1 0 6 0 3 3 0 1 0-6 0M24 19c-5-4-3-12 0-12s5 8 0 12M27 22c4-5 12-3 12 0s-8 5-12 0M24 25c5 4 3 12 0 12s-5-8 0-12M21 22c-4 5-12 3-12 0s8-5 12 0M24 37v8m0-3c4-4 8-4 10-3" },
  ] },
  { id: "khabar", mine: "প্রিয় খাবার", about: "{r} প্রিয় খাবার কোনটা?", missed: "প্রিয় খাবারটা", common: 0, options: [
    { label: "বিরিয়ানি", drawing: "M8 22h32M10 22c0 12 6 18 14 18s14-6 14-18M14 22c0-4 4-6 10-6s10 2 10 6M5 22h3m32 0h3M18 12c-2-2 2-4 0-6m6 6c-2-2 2-4 0-6m6 6c-2-2 2-4 0-6" },
    { label: "ফুচকা", drawing: "M11 27a13 13 0 1 0 26 0 13 13 0 1 0-26 0M18 20a6 3 0 1 0 12 0 6 3 0 1 0-12 0M5 42h38M17 31c3 2 11 2 14 0" },
    { label: "খিচুড়ি", drawing: "M6 24h36c0 10-8 17-18 17S6 34 6 24ZM18 44h12M31 10l10 13M17 18c-2-2 2-4 0-6m7 6c-2-2 2-4 0-6" },
    { label: "ইলিশ ভাজা", drawing: "M5 24c8-10 22-10 30 0-8 10-22 10-30 0ZM35 24l8-7v14ZM12 22h.5M19 18v12m6-12v12" },
  ] },
  { id: "rong", mine: "প্রিয় রং", about: "{r} প্রিয় রং কোনটা?", missed: "প্রিয় রংটা", common: 1, options: [
    { label: "লাল", color: "#d6336c", drawing: "M30 8l10 10-20 20-12 2 2-12ZM26 12l10 10M10 30l8 8M6 44c5-3 9 1 14-1s8-3 12-1" },
    { label: "নীল", color: "#1d5c8a", drawing: "M30 8l10 10-20 20-12 2 2-12ZM26 12l10 10M10 30l8 8M6 44c5-3 9 1 14-1s8-3 12-1" },
    { label: "সবুজ", color: "#2b8a3e", drawing: "M30 8l10 10-20 20-12 2 2-12ZM26 12l10 10M10 30l8 8M6 44c5-3 9 1 14-1s8-3 12-1" },
    { label: "কালো", color: "#1d2b53", drawing: "M30 8l10 10-20 20-12 2 2-12ZM26 12l10 10M10 30l8 8M6 44c5-3 9 1 14-1s8-3 12-1" },
  ] },
  { id: "khela", mine: "প্রিয় খেলা", about: "{r} প্রিয় খেলা কোনটা?", missed: "প্রিয় খেলাটা", common: 0, options: [
    { label: "ক্রিকেট", drawing: "m8 38 16-18 5 4-16 18Zm18-20 9-11 4 3-9 11M35 36a4 4 0 1 0 8 0 4 4 0 1 0-8 0" },
    { label: "ফুটবল", drawing: "M8 24a16 16 0 1 0 32 0 16 16 0 1 0-32 0M24 17l6 4-2 7h-8l-2-7ZM24 8v9m6 4 9-3m-11 10 5 8m-13-8-5 8m5-15-9-3" },
    { label: "লুডু", drawing: "M9 9h30v30H9ZM17 17h.5M31 17h.5M24 24h.5M17 31h.5M31 31h.5" },
    { label: "ক্যারম", drawing: "M6 6h36v36H6ZM9 12a3 3 0 1 0 6 0 3 3 0 1 0-6 0m24 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M9 36a3 3 0 1 0 6 0 3 3 0 1 0-6 0m24 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0M18 24a6 6 0 1 0 12 0 6 6 0 1 0-12 0m4 0a2 2 0 1 0 4 0 2 2 0 1 0-4 0" },
  ] },
  { id: "rag", mine: "রাগ হলে কী করি", about: "রাগ হলে {n} কী করে?", missed: "রাগের খবরটা", common: 0, options: [
    { label: "চুপ হয়ে যাই", drawing: "M8 24a16 16 0 1 0 32 0 16 16 0 1 0-32 0M16 19l5 2m11-2-5 2M16 31h16M20 29v4m4-4v4m4-4v4" },
    { label: "ঘুমিয়ে পড়ি", drawing: "M5 32c0-5 4-7 9-7h20c5 0 9 2 9 7s-4 7-9 7H14c-5 0-9-2-9-7ZM27 6h8l-8 8h8M37 15h5l-5 5h5" },
    { label: "খেতে বসি", drawing: "M15 26a10 10 0 1 0 20 0 10 10 0 1 0-20 0M5 10v9a3 3 0 0 0 6 0v-9M8 19v22M42 10c-3 0-4 4-4 8s1 6 4 6v17" },
    { label: "গান শুনি", drawing: "M9 30v-6a15 15 0 0 1 30 0v6M9 30h6v11H9ZM33 30h6v11h-6ZM22 12v-5l7-2v5" },
  ] },
  { id: "chhuti", mine: "ছুটির দিনে কী করি", about: "ছুটির দিনে {n} কী করে?", missed: "ছুটির দিনের খবরটা", common: 0, options: [
    { label: "বেলা করে ঘুম", drawing: "M4 40V20M4 32h40v8M9 32v-6h11v6M20 26h16a8 8 0 0 1 8 6M34 11a5 5 0 1 0 10 0 5 5 0 1 0-10 0M39 2v2m0 14v2m-9-9h2m14 0h2" },
    { label: "আড্ডা-ঘোরা", drawing: "M5 9h21v13H14l-6 5v-5H5ZM22 26h21v13h-3v5l-6-5H22ZM10 15h11m6 17h11" },
    { label: "নাটক-সিনেমা", drawing: "M6 15h36v24H6ZM18 44h12M24 39v5M16 5l8 10 8-10M21 22v10l8-5Z" },
    { label: "গল্পের বই", drawing: "M6 12c6-2 12-2 18 2v28c-6-4-12-4-18-2ZM42 12c-6-2-12-2-18 2v28c6-4 12-4 18-2ZM10 20h9m-9 6h9m10-6h9m-9 6h9" },
  ] },
  { id: "bhoy", mine: "সবচেয়ে ভয় পাই", about: "{n} সবচেয়ে ভয় পায় কিসে?", missed: "ভয়ের ব্যাপারটা", common: 0, options: [
    { label: "তেলাপোকা", drawing: "M18 19c0-6 12-6 12 0v14c0 6-12 6-12 0ZM18 23h12M21 14c-2-4-6-7-10-8m16 8c2-4 6-7 10-8M18 25l-7-3m7 7-8 2m8 4-6 5m18-15 7-3m-7 7 8 2m-8 4 6 5" },
    { label: "অন্ধকার", drawing: "M30 7a14 14 0 1 0 12 21A12 12 0 0 1 30 7ZM10 9l1 3 3 1-3 1-1 3-1-3-3-1 3-1ZM14 40h.5M20 40h.5" },
    { label: "ইনজেকশন", drawing: "M29 6l13 13M35 12 17 30l-5-5 18-18M12 25l-4 4 5 5 4-4M8 37l-4 4M23 16l3 3m-7 1 3 3" },
    { label: "রেজাল্ট", drawing: "M12 4h24v40H12ZM18 11h12M18 17h12M18 23h8M20 37l4-9 4 9m-6-3h4" },
  ] },
  { id: "ghora", mine: "বেড়াতে যেতে চাই", about: "{n} কোথায় বেড়াতে যেতে চায়?", missed: "বেড়ানোর স্বপ্নটা", common: 0, options: [
    { label: "সমুদ্র", drawing: "M4 30c4-3 8 3 12 0s8 3 12 0 8 3 12 0M4 38c4-3 8 3 12 0s8 3 12 0 8 3 12 0M17 23a7 7 0 0 1 14 0M24 9v4m-11 2 3 3m19-3-3 3" },
    { label: "পাহাড়", drawing: "M3 41 17 17l8 13 6-9 14 20ZM13 24l4 3 4-3M31 10c0-3 5-4 7-1 3 0 4 3 2 5h-9c-2 0-2-4 0-4Z" },
    { label: "সুন্দরবন", drawing: "M14 40V25m0 0c-6 0-8-8-2-10 0-6 8-6 8 0 6 2 4 10-2 10M34 40V29m0 0c-5 0-6-6-2-8 0-4 6-4 6 0 4 2 3 8-2 8M10 40l4-4 4 4m12 0 4-4 4 4M4 43h40" },
    { label: "চা-বাগান", drawing: "M4 37c4-6 10-6 14 0 4-6 10-6 14 0 4-6 10-6 14 0M4 45c4-6 10-6 14 0 4-6 10-6 14 0 4-6 10-6 14 0M24 27c-8 0-10-10-2-17 8 7 6 17 2 17Zm0 0V15" },
  ] },
] as const satisfies readonly Question[];

export const TOTAL = questions.length;

export type Pick = 0 | 1 | 2 | 3;
export type Picks = readonly (Pick | null)[];
export type Shared = { answers: Pick[]; name: string; guesses: Pick[] | null; guessName: string };

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

export function cleanName(name: string) {
  // NFC so the same name typed on two keyboards is one string; strip control and bidi-override characters so a link can't scramble the card.
  const clean = name.normalize("NFC").replace(/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/g, "").trim().replace(/\s+/g, " ");
  return [...clean].slice(0, MAX_NAME_LENGTH).join("").trim();
}

/** রাফি → রাফিকে, জাহিদ → জাহিদকে, Nadia → Nadia-কে. */
export const accusative = (name: string) => /[\u0980-\u09ff]$/.test(name) ? `${name}কে` : `${name}-কে`;
export const ownerOf = (name: string) => name ? possessive(name) : "বন্ধুর";
export const askAbout = (question: Question, owner: string) => question.about.replace("{r}", ownerOf(owner)).replace("{n}", owner || "বন্ধু");

// shortcut: a fixed XOR only keeps answers from being read off the URL at a glance; anyone who reads this code can decode them. Nothing here is secret.
const SCRAMBLE = 0xb6d3;

/** Eight answers of 0–3 → one 16-bit number → at most 4 base-36 characters. */
export function encodePicks(picks: readonly Pick[]) {
  const bits = picks.reduce<number>((total, pick, index) => total | (pick << (index * 2)), 0);
  return (bits ^ SCRAMBLE).toString(36);
}

export function decodePicks(code: string): Pick[] | null {
  if (!/^[0-9a-z]{1,4}$/.test(code)) return null;
  const value = parseInt(code, 36);
  if (value > 0xffff) return null;
  const bits = value ^ SCRAMBLE;
  return questions.map((_, index) => ((bits >> (index * 2)) & 3) as Pick);
}

export const isComplete = (picks: Picks): picks is Pick[] => picks.length === TOTAL && picks.every(pick => pick !== null);

export function shareHash({ answers, name, guesses, guessName }: Shared) {
  const params = new URLSearchParams({ a: encodePicks(answers) });
  const owner = cleanName(name);
  if (owner) params.set("n", owner);
  if (guesses) {
    params.set("g", encodePicks(guesses));
    const guesser = cleanName(guessName);
    if (guesser) params.set("gn", guesser);
  }
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Shared | null {
  if (hash.length > 600) return null;
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const answers = decodePicks(params.get("a") ?? "");
  if (!answers) return null;
  // A broken guess part still opens the quiz itself.
  const guesses = decodePicks(params.get("g") ?? "");
  return { answers, name: cleanName(params.get("n") ?? ""), guesses, guessName: guesses ? cleanName(params.get("gn") ?? "") : "" };
}

export const scoreOf = (answers: readonly Pick[], guesses: Picks) => guesses.filter((guess, index) => guess !== null && guess === answers[index]).length;

/** How many answers differ from the obvious guess: 1–5 stars. Says how tricky the page is without saying which answers. */
export function difficulty(answers: Picks) {
  const surprises = answers.filter((pick, index) => pick !== null && pick !== questions[index].common).length;
  return { surprises, stars: 1 + Math.round((surprises / TOTAL) * 4) };
}

export function difficultyLine(answers: Picks) {
  if (!isComplete(answers)) return "উত্তরগুলো লুকানো, আন্দাজ করতে হবে।";
  const { surprises } = difficulty(answers);
  if (surprises === 0) return "সব উত্তর সহজ। না পারলে বন্ধুত্ব নিয়ে প্রশ্ন উঠবে!";
  if (surprises <= 2) return "দু-একটায় একটু প্যাঁচ আছে, সাবধান!";
  if (surprises <= 5) return "কয়েকটা উত্তর শুনলে চমকে যাবে।";
  return "যতটা চেনো ভাবছ, ততটা না-ও হতে পারে!";
}

/** The warm line under a score: names the question that was missed, never the answer. */
export function scoreLine(answers: readonly Pick[], guesses: readonly Pick[], owner: string) {
  const score = scoreOf(answers, guesses);
  const missed = questions.find((_, index) => guesses[index] !== answers[index]);
  if (score === TOTAL) return `${ownerOf(owner)} স্লাম বুক পুরো মুখস্থ!`;
  if (score === TOTAL - 1) return `শুধু ${missed!.missed} মেলেনি, বাকি সব ঠিক!`;
  if (score >= 5) return `ভালোই চেনা, তবে ${missed!.missed} নিয়ে আড্ডা বাকি।`;
  if (score >= 3) return "অর্ধেক চেনা, বাকিটা এক কাপ চায়ে জেনে নাও।";
  return "নতুন করে পরিচয়টা হয়ে যাক!";
}

/** "মিম রাফিকে ৮-এ ৬ চেনে". `self` is the guesser's own voice on their card ("আমি রাফিকে ৮-এ ৬ চিনি"). */
export function knowsLine(owner: string, guesser: string, score: number, self: boolean) {
  const who = guesser || (self ? "আমি" : "এক বন্ধু");
  const verb = guesser || !self ? "চেনে" : "চিনি";
  return { who, whom: owner ? accusative(owner) : "বন্ধুকে", score: `${bn(TOTAL)}-এ ${bn(score)}`, verb };
}

export const sentence = (line: ReturnType<typeof knowsLine>) => `${line.who} ${line.whom} ${line.score} ${line.verb}`;

/** Link-preview text. Never includes an answer: the friend must guess first. */
export function previewText(shared: Shared) {
  const asks = `${questions[0].mine}, ${questions[1].mine}, ${questions[4].mine}…`;
  if (shared.guesses) {
    return {
      title: `${sentence(knowsLine(shared.name, shared.guessName, scoreOf(shared.answers, shared.guesses), true))} — তুমি কতটা চেনো?`,
      description: `${asks} ${bn(TOTAL)}টা প্রশ্নের স্লাম বুক। তুমিও আন্দাজ করো, তারপর নিজেরটা বানিয়ে দেখো কে তোমাকে বেশি চেনে।`,
    };
  }
  return {
    title: `তুমি ${shared.name ? accusative(shared.name) : "আমাকে"} কতটা চেনো? ${bn(TOTAL)}টা প্রশ্নে দেখো`,
    description: `${asks} উত্তরগুলো লুকানো। আন্দাজ করো, দেখো কয়টা মেলে, তারপর নিজের স্লাম বুক বানাও।`,
  };
}

export type Mark = "right" | "wrong" | null;

export type Card =
  | { kind: "challenge"; owner: string; stars: number; line: string }
  | { kind: "score"; owner: string; marks: Mark[]; done: boolean; line: string; knows: ReturnType<typeof knowsLine> };

export function challengeCard(answers: Picks, owner: string): Card {
  return { kind: "challenge", owner: cleanName(owner), stars: difficulty(answers).stars, line: difficultyLine(answers) };
}

export function scoreCard(answers: readonly Pick[], guesses: Picks, owner: string, guesser: string): Card {
  const marks = guesses.map((guess, index): Mark => guess === null ? null : guess === answers[index] ? "right" : "wrong");
  const done = isComplete(guesses);
  return {
    kind: "score",
    owner: cleanName(owner),
    marks,
    done,
    line: done ? scoreLine(answers, guesses, owner) : "আন্দাজ চলছে…",
    knows: knowsLine(cleanName(owner), cleanName(guesser), scoreOf(answers, guesses), true),
  };
}

export { possessive };
