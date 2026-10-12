import { possessive } from "../../../shared/bangla";

export { possessive };
export const MAX_NAME = 20;
export const MAX_TEXT = 200;
/** A sealed letter may wait at most this many years. */
const MAX_AHEAD_YEARS = 5;
const DAY = 86_400_000;

export const sections = ["শুরুর কথা", "মাঝের কথা", "শেষের কথা"] as const;

// Ids and line positions travel in links: never rename, reorder or remove, only append.
export const recipients = [
  {
    id: "amma", label: "আম্মু", dear: "আম্মু", sign: "তোমার আদরের", fallback: "সন্তান",
    human: "কিছু কথা ফোনে বলা যায় না, লিখতে হয়।",
    lines: [
      ["কেমন আছ? অনেক দিন পর তোমাকে চিঠি লিখতে বসলাম।", "আশা করি ভালো আছ। পর সমাচার এই যে, আমিও ভালো আছি।", "আজ হঠাৎ তোমার হাতের রান্নার গন্ধটা খুব মনে পড়ছে।"],
      ["এখানে সব ঠিকঠাক চলছে, শুধু তোমার ডাকটা শুনি না।", "ঠিকমতো ওষুধ খাচ্ছ তো? আমার জন্য রাত জেগে চিন্তা কোরো না।", "ফোনে সব কথা বলা হয় না, তাই আজ লিখে রাখলাম।"],
      ["অনেক অনেক ভালোবাসা নিও। নিজের যত্ন নিও।", "খুব তাড়াতাড়ি বাড়ি আসব। ততদিন ভালো থেকো।", "আমার জন্য মন খারাপ কোরো না, আমি ভালো আছি।"],
    ],
  },
  {
    id: "abba", label: "আব্বু", dear: "আব্বু", sign: "তোমার আদরের", fallback: "সন্তান",
    human: "মুখে যা বলা হয়নি, কাগজে বলা হলো।",
    lines: [
      ["অনেক দিন তোমাকে কিছু লেখা হয়নি। কেমন আছ?", "আশা করি ভালো আছ। পর সমাচার এই যে, এদিকে সব ভালো।", "তোমার সাইকেলের সামনে বসে স্কুলে যাওয়ার কথা আজ মনে পড়ল।"],
      ["তুমি কখনো মুখে বলো না, কিন্তু জানি আমাদের জন্য কত কষ্ট করেছ।", "শরীরের যত্ন নিচ্ছ তো? সকালের হাঁটাটা বাদ দিয়ো না।", "তোমার কথাগুলো এখন বুঝি, যখন নিজেকেই সব সামলাতে হয়।"],
      ["মুখে বলা হয় না, তাই লিখে দিলাম: তোমাকে অনেক ভালোবাসি।", "ছুটিতে এসে বারান্দায় বসে একসাথে চা খাব।", "আমাদের নিয়ে চিন্তা কোরো না। ভালো থেকো।"],
    ],
  },
  {
    id: "bhaibon", label: "ভাই-বোন", dear: "ভাইয়া", sign: "তোমার", fallback: "আপনজন",
    human: "দূরত্ব যতই হোক, খামটা ঠিকই পৌঁছায়।",
    lines: [
      ["কেমন আছ? অনেক দিন তোমার সাথে খুনসুটি করা হয় না।", "আশা করি ভালো আছ। পর সমাচার এই যে, বাসার সবাই ভালো আছে।", "তুমি দূরে বলে বাসাটা কেমন অর্ধেক ফাঁকা লাগে।"],
      ["রিমোট নিয়ে মারামারির কথা মনে আছে? এখন রিমোট আছে, তুমি নেই।", "ঠিকমতো খাওয়াদাওয়া করছ তো? শীতে গরম কাপড় পোরো।", "আম্মু রোজ তোমার কথা বলে, আমিও মনে মনে বলি।"],
      ["অনেক ভালোবাসা রইল। নিজের যত্ন নিও।", "এবারের ছুটিতে আসবে তো? সবাই অপেক্ষায় আছি।", "যেখানেই থাকো, ভালো থেকো। আমরা আছি।"],
    ],
  },
  {
    id: "bondhu", label: "বন্ধু", dear: "দোস্ত", sign: "তোর", fallback: "বন্ধু",
    human: "মেসেজের যুগে একটা আস্ত চিঠি, শুধু তোর জন্য।",
    lines: [
      ["কী রে, কেমন আছিস? অনেক দিন আড্ডা হয় না।", "আশা করি ভালো আছিস। পর সমাচার এই যে, আমিও আছি কোনোমতে।", "হঠাৎ মনে হলো, তোকে একটা চিঠি লিখি। মেসেজ না, চিঠি।"],
      ["স্কুলের পাশের টংয়ের চা আর তোর বাজে জোকস, দুটোই মিস করি।", "সবাই ব্যস্ত হয়ে গেছি, কিন্তু তোর কথা ঠিকই মনে পড়ে।", "ছাদের সিঁড়িতে বসে রাত জেগে গল্প করার দিনগুলো মনে আছে?"],
      ["ভালো থাকিস। দেখা হলে চা আমার তরফ থেকে।", "উত্তর দিস কিন্তু। না দিলে খবর আছে।", "যেখানেই থাকিস, ঠিকানাটা পাঠাস।"],
    ],
  },
  {
    id: "future", label: "ভবিষ্যতের আমি", dear: "ভবিষ্যতের আমি", sign: "আজকের", fallback: "আমি",
    human: "আজকের আমি থেকে ভবিষ্যতের আমাকে।",
    lines: [
      ["যখন এটা পড়বে, জানি না তুমি কোথায়, কেমন আছ।", "আজকের আমি তোমাকে লিখছি, এক কাপ চা হাতে নিয়ে।", "আশা করি ভালো আছ। পর সমাচার এই যে, আজকের দিনটা ভালোই গেল।"],
      ["আজ যে চিন্তাগুলো বড় মনে হচ্ছে, আশা করি সেগুলো এখন ছোট হয়ে গেছে।", "যে স্বপ্নটা নিয়ে আজ ভাবছি, তার কতটুকু হলো, জানতে ইচ্ছে করছে।", "যারা পাশে ছিল, তাদের সাথে যোগাযোগটা রেখো।"],
      ["নিজের ওপর একটু দয়া রেখো। তুমি যথেষ্ট করছ।", "যা-ই হোক, আজকের আমি তোমাকে নিয়ে গর্বিত।", "খুলে একটু হেসো। ভালো থেকো।"],
    ],
  },
] as const;

export const replies = [
  { id: "bhore", label: "পড়ে বুকটা ভরে গেল।" },
  { id: "pani", label: "পড়তে পড়তে চোখে পানি চলে এল।" },
  { id: "esho", label: "তাড়াতাড়ি এসো, অপেক্ষায় আছি।" },
  { id: "bhalo", label: "আমরা সবাই ভালো আছি, চিন্তা কোরো না।" },
  { id: "ami", label: "এবার থেকে আমিও চিঠি লিখব।" },
] as const;

export const relations = [
  { id: "ammu", label: "আম্মু" },
  { id: "abbu", label: "আব্বু" },
  { id: "bhai", label: "ভাই" },
  { id: "bon", label: "বোন" },
  { id: "bondhu", label: "বন্ধু" },
] as const;

export type RecipientId = (typeof recipients)[number]["id"];
export type ReplyId = (typeof replies)[number]["id"];
export type RelationId = (typeof relations)[number]["id"];
export type Lines = [number, number, number];
/** dear: the name after "প্রিয়"; open: a future-self letter stays sealed until this date; written: the date at the top. */
export type Letter = { to: RecipientId; dear: string; lines: Lines; text: string; from: string; open: string; written: string };
export type Reply = { re: ReplyId; by: RelationId; to: string };
export type Shared = { kind: "letter"; letter: Letter } | { kind: "reply"; reply: Reply };
export type Sheet = { greeting: string; body: string[]; signoff: string; signer: string; date: string };
export type CardView = { header: string; to: string; from: string; human: string; sheet: Sheet; seal: { label: string; days: number; written: string } | null };

export const recipient = (id: RecipientId) => recipients.find(item => item.id === id)!;
export const replyLabel = (id: ReplyId) => replies.find(item => item.id === id)!.label;
export const relationLabel = (id: RelationId) => relations.find(item => item.id === id)!.label;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => digits.format(value);
const months = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];

const pad = (value: number) => String(value).padStart(2, "0");
export const localToday = (now: Date) => `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
/** Dhaka's day, for server-side link previews where there is no phone clock. */
export const dhakaToday = (now: Date) => new Date(now.getTime() + 6 * 3_600_000).toISOString().slice(0, 10);
export const isDate = (text: string) => /^\d{4}-\d{2}-\d{2}$/.test(text) && text >= "2020-01-01" && text <= "2100-12-31" && new Date(text + "T00:00:00Z").toISOString().slice(0, 10) === text;
export const addDays = (date: string, days: number) => new Date(Date.parse(date) + days * DAY).toISOString().slice(0, 10);
export const daysBetween = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY);
const addYears = (date: string, years: number) => { const moved = new Date(date + "T00:00:00Z"); moved.setUTCFullYear(moved.getUTCFullYear() + years); return moved.toISOString().slice(0, 10); };
export const latestOpen = (today: string) => addYears(today, MAX_AHEAD_YEARS);

export const dateLabel = (date: string) => { const [year, month, day] = date.split("-").map(Number); return `${bn(day)} ${months[month - 1]} ${bn(year)}`; };
/*
 * Pohela Boishakh is fixed at 14 April in Bangladesh's revised Bangla calendar (Bangla Academy, in use since 1987, revised 2019),
 * and the Bangla year is the Gregorian year minus 593 from that day. https://en.wikipedia.org/wiki/Bengali_calendars#Revised_version
 */
export const openLabel = (date: string) => date.slice(5) === "04-14" ? `১ বৈশাখ ${bn(Number(date.slice(0, 4)) - 593)}` : dateLabel(date);

/** Ready-made open dates for a future-self letter: the next New Year's Day, the next Pohela Boishakh, a year from today. */
export function openChoices(today: string) {
  const year = Number(today.slice(0, 4));
  const boishakh = `${today < `${year}-04-14` ? year : year + 1}-04-14`;
  return [
    { date: `${year + 1}-01-01`, label: `১ জানুয়ারি ${bn(year + 1)}` },
    { date: boishakh, label: openLabel(boishakh) },
    { date: addYears(today, 1), label: "এক বছর পর" },
  ];
}

export const isSealed = (letter: Letter, today: string) => letter.to === "future" && Boolean(letter.open) && letter.open > today;

// Control, C1 and direction-override characters could scramble a card or hide text; ZWJ/ZWNJ stay because Bangla needs them.
const UNSAFE = /[\u0000-\u001f\u007f-\u009f؜​‎‏‪-‮⁠-⁯﻿￹-￻]/g;
/** NFC, unsafe characters out, one line, capped by code points so an emoji is never cut in half. */
export function cleanText(text: string, max: number) {
  const flat = text.normalize("NFC").replace(UNSAFE, " ").replace(/\s+/g, " ").trim();
  return [...flat].slice(0, max).join("").trim();
}

/** "আম্মুকে", "রিমুকে", "Nadia-কে"; the future self is "ভবিষ্যতের আমাকে". */
export function objective(name: string) {
  if (name === "ভবিষ্যতের আমি") return "ভবিষ্যতের আমাকে";
  return /[ঀ-৿]$/.test(name) ? name + "কে" : name + "-কে";
}

export const defaultLetter = (to: RecipientId = "amma"): Letter => ({ to, dear: recipient(to).dear, lines: [0, 0, 0], text: "", from: "", open: "", written: "" });

/** Applies every cap and rule, so the page, the card and the link all show the same letter. */
export function cleanLetter(letter: Letter): Letter {
  const future = letter.to === "future";
  return {
    to: letter.to,
    dear: future ? recipient("future").dear : cleanText(letter.dear, MAX_NAME) || recipient(letter.to).dear,
    lines: letter.lines.map(index => (Number.isInteger(index) && index >= 0 && index <= 2 ? index : 0)) as Lines,
    text: cleanText(letter.text, MAX_TEXT),
    from: cleanText(letter.from, MAX_NAME),
    open: future && isDate(letter.open) ? letter.open : "",
    written: isDate(letter.written) ? letter.written : "",
  };
}

export function letterState(raw: Letter) {
  const letter = cleanLetter(raw);
  const params = new URLSearchParams({ to: letter.to });
  if (letter.dear !== recipient(letter.to).dear) params.set("n", letter.dear);
  params.set("l", letter.lines.join(","));
  if (letter.text) params.set("t", letter.text);
  if (letter.from) params.set("from", letter.from);
  if (letter.open) params.set("open", letter.open);
  if (letter.written) params.set("w", letter.written);
  return params.toString();
}

export function replyState(reply: Reply) {
  const params = new URLSearchParams({ re: reply.re, by: reply.by });
  const to = cleanText(reply.to, MAX_NAME);
  if (to) params.set("to", to);
  return params.toString();
}

/** A shared letter or reply from a link, or null. Unknown ids reject the link; bad optional parts fall back to defaults. */
export function parseShared(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, "").slice(0, 2000));
  const re = replies.find(item => item.id === params.get("re"))?.id;
  if (re) {
    const by = relations.find(item => item.id === params.get("by"))?.id;
    return by ? { kind: "reply", reply: { re, by, to: cleanText(params.get("to") ?? "", MAX_NAME) } } : null;
  }
  const to = recipients.find(item => item.id === params.get("to"))?.id;
  if (!to) return null;
  const lines = /^[0-2],[0-2],[0-2]$/.test(params.get("l") ?? "") ? params.get("l")!.split(",").map(Number) as Lines : [0, 0, 0] as Lines;
  const letter = cleanLetter({ to, dear: params.get("n") ?? "", lines, text: params.get("t") ?? "", from: params.get("from") ?? "", open: params.get("open") ?? "", written: params.get("w") ?? "" });
  return { kind: "letter", letter };
}

export const sharedState = (shared: Shared) => shared.kind === "letter" ? letterState(shared.letter) : replyState(shared.reply);

export function sheetOf(raw: Letter): Sheet {
  const letter = cleanLetter(raw);
  const who = recipient(letter.to);
  const body: string[] = who.lines.map((options, index) => options[letter.lines[index]]);
  if (letter.text) body.splice(2, 0, letter.text);
  return { greeting: `প্রিয় ${letter.dear},`, body, signoff: "ইতি,", signer: `${who.sign} ${letter.from || who.fallback}`, date: letter.written ? dateLabel(letter.written) : "" };
}

export function replySheet(reply: Reply): Sheet {
  const to = cleanText(reply.to, MAX_NAME);
  return { greeting: to ? `প্রিয় ${to},` : "প্রিয়,", body: ["তোমার চিঠি পেয়েছি।", replyLabel(reply.re)], signoff: "ইতি,", signer: relationLabel(reply.by), date: "" };
}

export function letterHeader(raw: Letter) {
  const letter = cleanLetter(raw);
  if (letter.to === "future") return letter.from ? `${letter.from} থেকে ভবিষ্যতের ${objective(letter.from)}` : "ভবিষ্যতের আমাকে লেখা চিঠি";
  return letter.from ? `${letter.from} থেকে ${objective(letter.dear)}` : `${objective(letter.dear)} লেখা চিঠি`;
}

export const replyHeader = (reply: Reply) => { const to = cleanText(reply.to, MAX_NAME); return `${to ? objective(to) + " " : ""}${possessive(relationLabel(reply.by))} উত্তর`; };

export function letterCard(raw: Letter, today: string): CardView {
  const letter = cleanLetter(raw);
  return {
    header: letterHeader(letter),
    to: `প্রাপক: ${letter.dear}`,
    from: letter.from ? `প্রেরক: ${letter.from}` : "",
    human: recipient(letter.to).human,
    sheet: sheetOf(letter),
    seal: isSealed(letter, today) ? { label: openLabel(letter.open), days: daysBetween(today, letter.open), written: letter.written ? `লেখা হয়েছে ${dateLabel(letter.written)}` : "" } : null,
  };
}

export const replyCard = (reply: Reply): CardView => ({ header: replyHeader(reply), to: reply.to ? `প্রাপক: ${cleanText(reply.to, MAX_NAME)}` : "চিঠির উত্তর", from: `প্রেরক: ${relationLabel(reply.by)}`, human: "চিঠির উত্তর এসেছে, খামে ভরে।", sheet: replySheet(reply), seal: null });

export const countdown = (days: number) => days === 1 ? "কাল খোলা যাবে" : `আর ${bn(days)} দিন`;

export function letterCaption(raw: Letter, today: string) {
  const letter = cleanLetter(raw);
  if (isSealed(letter, today)) return `ভবিষ্যতের আমাকে একটা চিঠি লিখে খামে আটকে দিলাম। খুলবে ${openLabel(letter.open)}। তুমি শেষ কবে চিঠি লিখেছ?`;
  return `অনেক দিন পর ${objective(letter.dear)} একটা চিঠি লিখলাম, পুরোনো দিনের মতো। তুমি শেষ কবে চিঠি লিখেছ?`;
}

export const replyCaption = (reply: Reply) => { const to = cleanText(reply.to, MAX_NAME); return `${to ? objective(to) + " " : ""}চিঠির উত্তর পাঠালাম, খামে ভরে।`; };

/** Link-preview title. Never shows the letter's words: a preview is public in chat apps, and a sealed letter is a surprise. */
export function previewTitle(shared: Shared, today: string) {
  if (shared.kind === "reply") return `${replyHeader(shared.reply)}: চিঠি পেয়েছি`;
  const { letter } = shared;
  return isSealed(letter, today) ? `${letterHeader(letter)} — খুলবে ${openLabel(letter.open)}` : `${letterHeader(letter)} — খামে একটা চিঠি`;
}
