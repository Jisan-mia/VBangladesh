import { possessive } from "../../../shared/bangla";
export const MAX_NAME_LENGTH = 30;

export const chapters = [
  { id: "khela", label: "খেলাধুলা" },
  { id: "porda", label: "টিভি আর গেমের দিন" },
  { id: "khabar", label: "খাবারদাবার" },
  { id: "school", label: "স্কুলের দিন" },
  { id: "bari", label: "বাড়ির কথা" },
  { id: "utsob", label: "উৎসব আর ছুটি" },
] as const;

// Share links store picks as bit positions: once links are public, only append new memories; never reorder or delete.
export const memories = [
  { id: "gollachhut", chapter: "khela", label: "গোল্লাছুট", drawing: "M7 40h34M14 10a4 4 0 1 0 8 0 4 4 0 1 0-8 0M18 16l2 12-9 10m9-10 7 10M9 24l9-8 12 8m0-12 5-5m-1 18 7 3M34 9a3 3 0 1 0 6 0 3 3 0 1 0-6 0m3 4-3 11 6 11m-6-11-6 12" },
  { id: "kanamachhi", chapter: "khela", label: "কানামাছি", drawing: "M18 10a6 6 0 1 0 12 0 6 6 0 1 0-12 0M17 9h14m0 0 5-3m-5 3 5 3M24 16v14M24 21 11 16m13 5 13-5M24 30l-7 12m7-12 7 12" },
  { id: "latim", chapter: "khela", label: "লাটিম", drawing: "M21 4h6v5h-6zM24 9c-9 0-15 5-15 11 0 6 8 13 15 20 7-7 15-14 15-20 0-6-6-11-15-11ZM10 18h28M12 25h24M24 40v5M6 44h9m18 0h9" },
  { id: "kite", chapter: "khela", label: "ঘুড়ি ওড়ানো", drawing: "m24 4 13 14-13 15L11 18 24 4Zm0 0v29M11 18h26M24 33c-9 3 9 4 0 8-4 2-6 0-8 3M11 8l-5-3m32 8 5-2" },
  { id: "cricket", chapter: "khela", label: "গলির ক্রিকেট", drawing: "m9 33 14-17 7 6-15 17-6-6Zm17-19 6-8 4 3-6 8M36 26v15m5-15v15m-8-18h11M7 8a3 3 0 1 0 6 0 3 3 0 1 0-6 0" },
  { id: "alif-laila", chapter: "porda", label: "আলিফ লায়লা", drawing: "M10 30h26c0-5-6-8-13-8s-13 3-13 8ZM36 30c4 0 8-4 10-8-4 1-7 3-10 4M10 28c-5 0-6-6-1-7 2 0 3 2 3 3M21 22c0-3 4-3 4 0M15 30l-2 5h20l-2-5M24 18c-3-3 3-5 0-8s3-5 1-7" },
  { id: "meena", chapter: "porda", label: "মীনা কার্টুন", drawing: "M16 38c-6-6-4-20 8-22 8-1 12 5 11 11-1 8-10 13-19 11ZM30 16c2-4 7-4 9 0-2 0-4 1-5 3M31 20h.5M16 38l-6 7m8-6-2 7M20 27c4 4 9 5 12 3" },
  { id: "antenna", chapter: "porda", label: "ছাদে অ্যান্টেনা ঘোরানো", drawing: "M24 46V12M10 8l14 8 14-8M12 14h24M15 20h18M18 26h12M14 37c0 4 20 4 20 0m0 0-3-2m3 2-1 3M40 2l3 3-3 3 3 3" },
  { id: "doraemon", chapter: "porda", label: "ডোরেমন", drawing: "M12 26a12 12 0 1 0 24 0 12 12 0 1 0-24 0M13 23h22M24 28v8M22 30a2 2 0 1 0 4 0 2 2 0 1 0-4 0M6 12c10 6 26 6 36 0" },
  { id: "brick-game", chapter: "porda", label: "ব্রিক গেম", drawing: "M12 4h24a3 3 0 0 1 3 3v34a3 3 0 0 1-3 3H12a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3ZM14 9h20v16H14ZM18 21h4v-4h4v4h4M17 31v6m-3-3h6M30 34a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0m3-4a1.5 1.5 0 1 0 3 0 1.5 1.5 0 1 0-3 0" },
  { id: "hawai-mithai", chapter: "khabar", label: "হাওয়াই মিঠাই", drawing: "M24 31v15M17 30c-6 0-9-6-5-10-2-6 5-10 9-7 2-5 10-5 12 0 5-1 8 5 4 9 2 5-3 9-8 7-3 3-9 3-12 1ZM18 21c2-2 5-2 7 0m3-4c2-1 4 0 5 2" },
  { id: "ice-cream", chapter: "khabar", label: "কাঠি আইসক্রিম", drawing: "M17 6h14a3 3 0 0 1 3 3v20H14V9a3 3 0 0 1 3-3ZM22 29v13a2 2 0 0 0 4 0V29M14 21h20M18 29v4m11-4v5M20 11v6" },
  { id: "achar", chapter: "khabar", label: "তেঁতুলের আচার", drawing: "M14 8h20v6H14ZM15 14h18v4c3 2 4 5 4 9v13a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V27c0-4 1-7 4-9v-4ZM15 27h18v8H15ZM18 22c4 2 8 2 12 0" },
  { id: "pitha", chapter: "khabar", label: "শীতের পিঠা", drawing: "M6 34c0 4 8 7 18 7s18-3 18-7M10 33c0-6 5-9 9-9s8 3 8 9m-3 0c0-5 4-8 7-8s7 3 7 8M6 34h36M18 19c-2-2 2-4 0-6m10 6c-2-2 2-4 0-6" },
  { id: "jhalmuri", chapter: "khabar", label: "ঠোঙায় ঝালমুড়ি", drawing: "M11 15h26L24 45ZM15 23h18M18 31h12M14 13c2-3 4-3 6 0m2-1c2-3 4-3 6 0m2 1c2-3 4-3 6 0M36 4c3 1 5 4 4 8" },
  { id: "new-books", chapter: "school", label: "নতুন বইয়ের গন্ধ", drawing: "M8 36h32v6H8Zm2-8h28v8H10Zm4-8h24v8H14ZM20 15c-2-2 2-4 0-6m8 6c-2-2 2-4 0-6" },
  { id: "molat", chapter: "school", label: "বইয়ে মলাট লাগানো", drawing: "M11 6h26v36H11ZM11 6 7 9v36l4-3M37 6l4 3v36l-4-3M16 15h16v9H16ZM18 18h12m-12 3h8" },
  { id: "feather", chapter: "school", label: "বইয়ের ভাঁজে পালক", drawing: "M6 40h14l4 3 4-3h14M13 37 37 6M37 6c-2 9-9 16-18 20M37 6c-9 2-16 9-20 18M24 22l-5-2m9-3-4-2" },
  { id: "tiffin", chapter: "school", label: "টিফিন ভাগ", drawing: "M9 16h30v22H9zM7 12h34v5H7zM19 8h10v4M9 26h30M22 20v12m4-12v12" },
  { id: "slate", chapter: "school", label: "স্লেট আর চক", drawing: "M5 9h34v27H5ZM9 13h26v19H9ZM15 26c0-6 8-6 8 0s-6 4-4 0m8-4h4M33 42l9-5 2 3-9 5Z" },
  { id: "hurricane", chapter: "bari", label: "লোডশেডিং আর হারিকেন", drawing: "M15 10c0-8 18-8 18 0M15 10h18l-2 5H17ZM17 15c-5 6-5 15 0 20h14c5-5 5-14 0-20M24 30c-3-3 0-7 0-9 0 2 3 6 0 9ZM14 35h20v6H14ZM19 15v20m10-20v20" },
  { id: "landphone", chapter: "bari", label: "ল্যান্ডফোনের ক্রিং ক্রিং", drawing: "M8 40c0-10 6-16 16-16s16 6 16 16ZM18 32a6 6 0 1 0 12 0 6 6 0 1 0-12 0M6 17c0-6 36-6 36 0l-2 5h-7l-1-4H16l-1 4H8ZM3 8l3 3m39-3-3 3" },
  { id: "stories", chapter: "bari", label: "দাদি-নানির গল্প", drawing: "M7 12h15l2 4 2-4h15v24H27l-3 4-3-4H7V12Zm17 4v24M12 19h6m-6 6h6m-6 6h6m12-12h6m-6 6h6m-6 6h6M9 6l3 2m25-2-3 2" },
  { id: "letter", chapter: "bari", label: "চিঠি লেখা", drawing: "M6 15h36v26H6V15Zm0 0 18 15 18-15M6 41l13-15m23 15L29 26M13 8h23m-23-4h15" },
  { id: "paper-boat", chapter: "bari", label: "বৃষ্টিতে কাগজের নৌকা", drawing: "M5 28 16 38h17l10-10H5Zm11 0 8-16 9 16M24 12v16M7 43c5-4 10 4 15 0s10 4 17 0M12 4l-2 4m12-6-2 4m12-2-2 4" },
  { id: "salami", chapter: "utsob", label: "ঈদের সালামি", drawing: "M11 12h32v18M5 18h32v18H5ZM17 27a4 4 0 1 0 8 0 4 4 0 1 0-8 0M9 22h4m16 10h4" },
  { id: "dhak", chapter: "utsob", label: "পূজার ঢাক", drawing: "M8 20c0-4 32-4 32 0v14c0 4-32 4-32 0ZM8 20c0 4 32 4 32 0M15 23v14m9-13v14m9-14v14M24 15c-4-5-2-10 0-12 2 2 4 7 0 12ZM19 16c-5-3-5-8-4-10m14 10c5-3 5-8 4-10M3 44l9-8m33 8-9-8" },
  { id: "fair", chapter: "utsob", label: "মেলার নাগরদোলা", drawing: "M24 5v31M9 20h30M13 9l22 22m0-22L13 31M24 5a15 15 0 1 0 0 30 15 15 0 1 0 0-30ZM24 25 14 44h20L24 25M3 20h7v7H3zm35 0h7v7h-7zM20 2h8v7h-8z" },
  { id: "nanabari", chapter: "utsob", label: "নানাবাড়ির ছুটি", drawing: "M4 40h40M6 24 18 12l12 12M9 22v18h18V22M15 40v-9h6v9M38 40V27m0 0c-6 0-7-8-2-10 0-5 7-5 7 0 5 2 4 10-2 10M11 19l-2 3m6-7-2 3" },
  { id: "pond", chapter: "utsob", label: "পুকুরে সাঁতার", drawing: "M4 32c4-3 8 3 12 0s8 3 12 0 8 3 12 0M4 40c4-3 8 3 12 0s8 3 12 0 8 3 12 0M20 24a4 4 0 1 0 8 0 4 4 0 1 0-8 0M28 25c4-6 10-6 12-2M12 22c2-4 6-5 8-3" },
  { id: "rannabati", chapter: "khela", label: "রান্নাবাটি", drawing: "M9 26h22l-2 12a5 5 0 0 1-5 4h-8a5 5 0 0 1-5-4ZM7 26h26M17 22h6M38 8v24M35 6a3 3 0 0 0 6 0M16 18c-2-2 2-4 0-6m8 6c-2-2 2-4 0-6" },
  { id: "ittadi", chapter: "porda", label: "ইত্যাদি দেখা", drawing: "M6 14h36v26H6ZM10 18h22v18H10ZM36 21h2m-2 6h2m-2 6h2M18 14l-6-10m18 10 6-10M12 40l-2 4m28-4 2 4" },
  { id: "chips-toy", chapter: "khabar", label: "চিপসের ভেতরের খেলনা", drawing: "M12 6h24l-2 6 2 6-2 6 2 6-2 6 2 6H12l2-6-2-6 2-6-2-6 2-6-2-6ZM24 17l2 5h5l-4 3 2 5-5-3-5 3 2-5-4-3h5Z" },
  { id: "assembly", chapter: "school", label: "অ্যাসেম্বলিতে জাতীয় সংগীত", drawing: "M10 44V4M5 44h10M10 6h28v18H10ZM17 15a5 5 0 1 0 10 0 5 5 0 1 0-10 0M22 32v8m8-8v8m8-8v8" },
  { id: "nokia-snake", chapter: "bari", label: "নোকিয়ায় সাপ খেলা", drawing: "M16 4h16a3 3 0 0 1 3 3v34a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3ZM17 9h14v13H17ZM19 19h5v-4h4v4h2M18 28h2m4 0h2m4 0h2M18 33h2m4 0h2m4 0h2M18 38h2m4 0h2m4 0h2" },
  { id: "eid-moon", chapter: "utsob", label: "ঈদের চাঁদ দেখা", drawing: "M30 4a12 12 0 1 0 10 18 10 10 0 0 1-10-18ZM13 8l1.5 3 3 .5-2.2 2 .5 3-2.8-1.5-2.8 1.5.5-3-2.2-2 3-.5ZM4 42h40M8 42v-8h12v8m6 0V30h14v12" },
] as const;

export const decades = [
  { id: "80", label: "আশির দশক", short: "আশি" },
  { id: "90", label: "নব্বইয়ের দশক", short: "নব্বই" },
  { id: "00", label: "দুই হাজারের দশক", short: "দুই হাজার" },
  { id: "10", label: "২০১০-এর দশক", short: "দুই হাজার দশ" },
] as const;

export type Memory = (typeof memories)[number];
export type MemoryId = Memory["id"];
export type DecadeId = (typeof decades)[number]["id"];
export type Shared = { selected: MemoryId[]; name: string; decade: DecadeId | "" };

export type CardContent = {
  name: string;
  decade: string;
  count: number;
  total: number;
  headline: string;
  line: string;
  match: string;
  selected: ReadonlySet<MemoryId>;
};

const numbers = new Intl.NumberFormat("bn-BD");
export const bn = (value: number) => numbers.format(value);

const memoryIds = new Set<string>(memories.map(memory => memory.id));
const isMemoryId = (id: string): id is MemoryId => memoryIds.has(id);
const isDecadeId = (id: string): id is DecadeId => decades.some(decade => decade.id === id);

export function toggleMemory(selected: readonly MemoryId[], id: string): MemoryId[] {
  if (!isMemoryId(id)) throw new RangeError("এই স্মৃতিটা তালিকায় নেই।");
  return selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id];
}

export function cleanName(name: string) {
  // Strip control and bidi-override characters so a shared link can't scramble the card text.
  return name.replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]/g, "").trim().replace(/\s+/g, " ").slice(0, MAX_NAME_LENGTH);
}

export function encodeSelection(selected: readonly MemoryId[]) {
  let bits = 0n;
  memories.forEach((memory, index) => { if (selected.includes(memory.id)) bits |= 1n << BigInt(index); });
  return bits.toString(36);
}

export function decodeSelection(code: string): MemoryId[] {
  if (!/^[0-9a-z]{1,12}$/.test(code)) return [];
  const bits = [...code].reduce((total, char) => total * 36n + BigInt(parseInt(char, 36)), 0n);
  return memories.filter((_, index) => (bits >> BigInt(index)) & 1n).map(memory => memory.id);
}

export function shareHash({ selected, name, decade }: Shared) {
  const params = new URLSearchParams({ m: encodeSelection(selected) });
  const shownName = cleanName(name);
  if (shownName) params.set("n", shownName);
  if (decade) params.set("d", decade);
  return "#" + params.toString();
}

export function parseShareHash(hash: string): Shared | null {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const selected = decodeSelection(params.get("m") ?? "");
  if (!selected.length) return null;
  const decade = params.get("d") ?? "";
  return { selected, name: cleanName(params.get("n") ?? ""), decade: isDecadeId(decade) ? decade : "" };
}


export function memoryLine(count: number) {
  if (count === 0) return "এখনো কিছু মেলানো হয়নি।";
  if (count <= 6) return "অল্প কয়টা, কিন্তু প্রত্যেকটা একদম নিজের।";
  if (count <= 14) return "মেলাতে মেলাতেই মনটা কেমন যেন করে উঠল।";
  if (count <= 22) return "চোখ বন্ধ করলে এখনো সেই বিকেলগুলো দেখতে পাই।";
  return "এতগুলো মনে আছে মানে ছোটবেলাটা ভরাই ছিল।";
}

export function createCard(own: Shared, friend?: Shared | null): CardContent {
  const selected = new Set(own.selected.filter(isMemoryId));
  const count = selected.size;
  const decade = decades.find(item => item.id === own.decade);
  const common = friend ? friend.selected.filter(id => selected.has(id)).length : 0;
  return {
    name: cleanName(own.name),
    decade: decade?.short ?? "",
    count,
    total: memories.length,
    headline: `${bn(memories.length)}টার মধ্যে ${bn(count)}টা আমার ছোটবেলায় ছিল`,
    line: memoryLine(count),
    match: friend && count ? `${friend.name ? possessive(friend.name) : "বন্ধুর"} সাথে ${bn(common)}টা মিলে গেছে` : "",
    selected,
  };
}

export { possessive };
