export const MAX_MEMORIES = 8;
export const MAX_NAME_LENGTH = 40;

export const memories = [
  { id: "paper-boat", label: "কাগজের নৌকা", drawing: "M5 24 16 34h17l10-10H5Zm11 0 8-16 9 16M24 8v16M7 39c5-4 10 4 15 0s10 4 17 0" },
  { id: "rain", label: "বৃষ্টিতে ভেজা", drawing: "M10 19a7 7 0 0 1 2-13 10 10 0 0 1 19 0 7 7 0 0 1 5 13H10ZM13 25l-3 7m14-7-3 7m14-7-3 7M17 36l-2 6m13-6-2 6" },
  { id: "tiffin", label: "টিফিন ভাগ করা", drawing: "M9 16h30v22H9zM7 12h34v5H7zM19 8h10v4M9 26h30M22 20v12m4-12v12" },
  { id: "cricket", label: "গলির ক্রিকেট", drawing: "m9 33 14-17 7 6-15 17-6-6Zm17-19 6-8 4 3-6 8M36 26v15m5-15v15m-8-18h11M7 8a3 3 0 1 0 6 0 3 3 0 1 0-6 0" },
  { id: "kite", label: "ঘুড়ি ওড়ানো", drawing: "m24 4 13 14-13 15L11 18 24 4Zm0 0v29M11 18h26M24 33c-9 3 9 4 0 8-4 2-6 0-8 3M11 8l-5-3m32 8 5-2" },
  { id: "book-flower", label: "বইয়ের পাতায় ফুল", drawing: "M6 13h14l4 3 4-3h14v28H28l-4 3-4-3H6V13Zm18 3v28M24 8v22m0-10-6-4m6 10 6-5M24 7c-9-9-12 6 0 5 12 1 9-14 0-5" },
  { id: "gollachhut", label: "বিকেলের গোল্লাছুট", drawing: "M7 40h34M14 10a4 4 0 1 0 8 0 4 4 0 1 0-8 0M18 16l2 12-9 10m9-10 7 10M9 24l9-8 12 8m0-12 5-5m-1 18 7 3M34 9a3 3 0 1 0 6 0 3 3 0 1 0-6 0m3 4-3 11 6 11m-6-11-6 12" },
  { id: "stories", label: "বড়দের গল্প শোনা", drawing: "M7 12h15l2 4 2-4h15v24H27l-3 4-3-4H7V12Zm17 4v24M12 19h6m-6 6h6m-6 6h6m12-12h6m-6 6h6m-6 6h6M9 6l3 2m25-2-3 2" },
  { id: "letter", label: "চিঠি লেখা", drawing: "M6 15h36v26H6V15Zm0 0 18 15 18-15M6 41l13-15m23 15L29 26M13 8h23m-23-4h15" },
  { id: "fair", label: "মেলার নাগরদোলা", drawing: "M24 5v31M9 20h30M13 9l22 22m0-22L13 31M24 5a15 15 0 1 0 0 30 15 15 0 1 0 0-30ZM24 25 14 44h20L24 25M3 20h7v7H3zm35 0h7v7h-7zM20 2h8v7h-8z" },
  { id: "radio", label: "রেডিওতে গান শোনা", drawing: "M6 16h36v25H6V16Zm9-9 21-4M14 16V7M11 24h14m-14 5h14m-14 5h14M31 26a4 4 0 1 0 8 0 4 4 0 1 0-8 0M30 36h9" },
  { id: "roof", label: "ছাদের বিকেল", drawing: "M4 35h40M8 35V24h32v11M12 29h3m5 0h3m5 0h3m5 0h2M9 41h31M17 14a7 7 0 1 1 14 0M24 3V1m-12 9-4-2m28 2 4-2M9 17h30" },
] as const;

export type Memory = (typeof memories)[number];
export type PostcardContent = {
  name: string;
  title: string;
  caption: string;
  invitation: string;
  memories: Memory[];
};

export function toggleMemory(selected: string[], memoryId: string): string[] {
  if (!memories.some((memory) => memory.id === memoryId)) {
    throw new RangeError("স্মৃতিটি তালিকায় নেই।");
  }
  if (selected.includes(memoryId)) return selected.filter((id) => id !== memoryId);
  if (selected.length === MAX_MEMORIES) return selected;
  return [...selected, memoryId];
}

export function createPostcard(name: string, selected: string[]): PostcardContent {
  const cleanName = name.trim().replace(/\s+/g, " ");
  if (cleanName.length > MAX_NAME_LENGTH) throw new RangeError("নামটি ৪০ অক্ষরের মধ্যে লিখুন।");
  if (selected.length > MAX_MEMORIES || new Set(selected).size !== selected.length) {
    throw new RangeError("একই স্মৃতি একবারই বেছে নিন। সর্বোচ্চ আটটি রাখা যাবে।");
  }
  const chosenMemories = selected.map((id) => {
    const memory = memories.find((entry) => entry.id === id);
    if (!memory) throw new RangeError("স্মৃতিটি তালিকায় নেই।");
    return memory;
  });
  return {
    name: cleanName,
    title: "আমার ছোটবেলা",
    caption: chosenMemories.length ? "ছোটবেলার কিছু স্মৃতি।" : "আপনার বেছে নেওয়া স্মৃতি এখানে থাকবে।",
    invitation: "আপনার ছোটবেলা কেমন ছিল?",
    memories: chosenMemories,
  };
}

export function moveMemory(selected: string[], memoryId: string, direction: -1 | 1): string[] {
  const index = selected.indexOf(memoryId);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= selected.length) return selected;
  const reordered = [...selected];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
  return reordered;
}
