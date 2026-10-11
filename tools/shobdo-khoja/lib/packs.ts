// Theme packs: lists written by hand for this game, common words only (no dictionary list was copied).
// Spellings checked October 2026 against the Bangla Academy dictionary as served by the government's Accessible Dictionary
// (https://accessibledictionary.gov.bd/bengali-to-bengali.php?q=<word>): each word, or for a compound each part
// (রজনী-গন্ধা, কৃষ্ণ-চূড়া, সূর্য-মুখী), is a headword or appears in an entry.
// Not in that dictionary, so checked against Bangla Wikipedia/Banglapedia titles instead: the river names and গোল্লাছুট.
// Left out because the spelling is argued over or has rival forms: টাকি, কাচকি, চাপিলা, লটকন, কাঠঠোকরা, ক্যারম,
// বৌচি/বউচি, এক্কাদোক্কা, মধুমতী/মধুমতি, ইছামতী/ইছামতি. Also left out: নদ (ব্রহ্মপুত্র, তুরাগ) from a pack called নদী,
// and any word that sits inside another word of its pack (আমলকী holds আম), so a grid never hides a word twice.
// Grids are rebuilt from (seed, pack, level) when a link opens: never reorder, edit or remove words, or rename pack ids.

export type PackId = "phul" | "mach" | "pitha" | "phol" | "pakhi" | "khela" | "ritu" | "nodi";

export type Pack = {
  id: PackId;
  name: string;
  /** Said when all six are found. */
  done: string;
  /** Paper colour of this pack's puzzle page, live and on the card. */
  paper: string;
  words: readonly string[];
};

export const PACKS: readonly Pack[] = [
  {
    id: "phul", name: "ফুল", done: "ছয়টা ফুলই তোলা হলো!", paper: "#fbe7ec",
    words: ["শাপলা", "গোলাপ", "জবা", "বেলি", "কদম", "শিউলি", "রজনীগন্ধা", "কৃষ্ণচূড়া", "গাঁদা", "টগর", "জুঁই", "শিমুল", "সূর্যমুখী", "বকুল", "পদ্ম", "কামিনী", "হাসনাহেনা", "পলাশ", "হিজল", "চামেলি"],
  },
  {
    id: "mach", name: "মাছ", done: "জালে ছয়টা মাছই উঠল!", paper: "#e3eff6",
    words: ["ইলিশ", "রুই", "কাতলা", "পাবদা", "পুঁটি", "মাগুর", "কই", "বোয়াল", "চিংড়ি", "চিতল", "শোল", "টেংরা", "পাঙাশ", "ভেটকি", "খলিশা", "বাইম", "আইড়", "বাটা"],
  },
  {
    id: "pitha", name: "পিঠা", done: "ছয়টা পিঠাই থালায় উঠল!", paper: "#f9ecd6",
    words: ["ভাপা", "চিতই", "পাটিসাপটা", "পুলি", "নকশি", "মালপোয়া", "গোকুল", "ঝিনুক", "ছিটা", "মুঠি", "পাকান", "ফুলঝুরি", "চুটকি"],
  },
  {
    id: "phol", name: "ফল", done: "ছয়টা ফলই ঝুড়িতে উঠল!", paper: "#eef3d8",
    words: ["আম", "জাম", "কাঁঠাল", "লিচু", "কলা", "পেয়ারা", "আনারস", "পেঁপে", "তরমুজ", "কামরাঙা", "আতা", "বরই", "ডালিম", "নারকেল", "জলপাই", "জাম্বুরা", "বেল"],
  },
  {
    id: "pakhi", name: "পাখি", done: "ছয়টা পাখিই চিনে ফেললে!", paper: "#e4f1e4",
    words: ["দোয়েল", "শালিক", "ময়না", "টিয়া", "কোকিল", "চড়ুই", "মাছরাঙা", "বাবুই", "ঘুঘু", "ময়ূর", "কবুতর", "টুনটুনি", "পেঁচা", "বুলবুলি", "ফিঙে", "বক", "কাক"],
  },
  {
    id: "khela", name: "খেলা", done: "ছয়টা খেলাই মনে পড়ল!", paper: "#fbe8d6",
    words: ["হাডুডু", "গোল্লাছুট", "কানামাছি", "ডাংগুলি", "লাটিম", "মার্বেল", "লুডু", "ঘুড়ি", "দাবা", "ফুটবল", "ক্রিকেট", "সাঁতার", "দৌড়", "ব্যাডমিন্টন"],
  },
  {
    id: "ritu", name: "ঋতু", done: "ঋতু আর মাসের ছয়টাই পেলে!", paper: "#eee8f6",
    words: ["গ্রীষ্ম", "বর্ষা", "শরৎ", "হেমন্ত", "শীত", "বসন্ত", "বৈশাখ", "জ্যৈষ্ঠ", "আষাঢ়", "শ্রাবণ", "ভাদ্র", "আশ্বিন", "কার্তিক", "অগ্রহায়ণ", "পৌষ", "মাঘ", "ফাল্গুন", "চৈত্র"],
  },
  {
    id: "nodi", name: "নদী", done: "ছয়টা নদীই খুঁজে পেলে!", paper: "#e0f0ee",
    words: ["পদ্মা", "মেঘনা", "যমুনা", "তিস্তা", "কর্ণফুলী", "সুরমা", "বুড়িগঙ্গা", "কুশিয়ারা", "শীতলক্ষ্যা", "ধলেশ্বরী", "গড়াই", "করতোয়া", "রূপসা", "কপোতাক্ষ", "ধরলা", "আত্রাই"],
  },
];

export const packById = (id: string) => PACKS.find(pack => pack.id === id) ?? null;
