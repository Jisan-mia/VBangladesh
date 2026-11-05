// The words as data: 34 picture words, each with one যুক্তবর্ণ, in four sets from easy doubles to রেফ and ফলা, plus the helpers
// that cut a word at its letters. Levels are lib/levels.ts, a round is lib/round.ts. Pure, so tests check every word.
// Spellings follow the Bangla Academy প্রমিত বানান (ঘণ্টা with ণ as তৎসম, ঠান্ডা with ন as দেশি, অঙ্ক, বাক্স).
export const HASANTA = "্";

/** A picture word, the base letters of its one যুক্তবর্ণ in written order, and three wrong letters, the likeliest mix-up first. */
export type Word = { word: string; pic: string; parts: readonly string[]; decoys: readonly string[] };
const w = (word: string, pic: string, parts: string, decoys: string): Word => ({ word, pic, parts: [...parts], decoys: [...decoys] });

/** The যুক্তবর্ণ itself: base letters joined with হসন্ত (ক + ্ + ষ = ক্ষ), NFC. */
export const conjunct = (parts: readonly string[]) => parts.join(HASANTA).normalize("NFC");

export type SetId = "double" | "common" | "tricky" | "phala";
export const SETS: Record<SetId, { title: string; words: readonly Word[] }> = {
  double: {
    title: "জোড়া বর্ণ",
    words: [
      w("রসগোল্লা", "roshogolla", "লল", "নরব"), w("ছক্কা", "dice", "কক", "খগফ"), w("বাচ্চা", "chick", "চচ", "ছজস"),
      w("চৌদ্দ", "dots14", "দদ", "ধডত"), w("রান্না", "pot", "নন", "ণলম"), w("লাড্ডু", "laddu", "ডড", "টদঢ"),
      w("ভুট্টা", "corn", "টট", "ঠতড"), w("চপ্পল", "sandal", "পপ", "ফবস"),
    ],
  },
  common: {
    title: "চেনা যুক্তবর্ণ",
    words: [
      w("বৃষ্টি", "rain", "ষট", "সশঠ"), w("গল্প", "book", "লপ", "নফব"), w("স্কুল", "school", "সক", "শষখ"),
      w("রাস্তা", "road", "সত", "শথট"), w("বন্ধু", "friends", "নধ", "ণদব"), w("ঘণ্টা", "bell", "ণট", "নঠত"),
      w("জঙ্গল", "forest", "ঙগ", "ংনঘ"), w("খুন্তি", "khunti", "নত", "ণটথ"), w("ঠান্ডা", "ice", "নড", "ণটদ"),
      w("পদ্ম", "lotus", "দম", "ধনব"),
    ],
  },
  tricky: {
    title: "কঠিন যুক্তবর্ণ",
    words: [
      w("পক্ষী", "parrot", "কষ", "খসশ"), w("ক্ষীর", "kheer", "কষ", "খশস"), w("বিজ্ঞান", "science", "জঞ", "গনয"),
      w("ইঞ্জিন", "engine", "ঞজ", "নংয"), w("মুক্তা", "pearl", "কত", "খটথ"), w("অঙ্ক", "slate", "ঙক", "ংনখ"),
      w("পৃষ্ঠা", "page", "ষঠ", "সটথ"), w("বাক্স", "box", "কস", "খশষ"),
    ],
  },
  phala: {
    title: "ফলা আর রেফ",
    words: [
      w("ট্রেন", "train", "টর", "ঠলড"), w("প্রজাপতি", "butterfly", "পর", "ফবল"), w("চন্দ্র", "moon", "নদর", "ণধড"),
      w("ব্যাঙ", "frog", "বয", "রভল"), w("ব্যাগ", "bag", "বয", "ভরপ"), w("সূর্য", "sun", "রয", "বলজ"),
      w("শার্ট", "shirt", "রট", "ঠবড"), w("মার্বেল", "marbles", "রব", "ভলক"),
    ],
  },
};
export const ALL_WORDS: readonly Word[] = Object.values(SETS).flatMap(set => set.words);

export type Mode = "bhangi" | "juri";

const bnDigits = new Intl.NumberFormat("bn-BD", { useGrouping: false });
export const bn = (value: number) => bnDigits.format(value);

const segmenter = new Intl.Segmenter("bn", { granularity: "grapheme" });
/**
 * A word's user-perceived letters (প | ক্ষী), from Intl.Segmenter. Older engines without the Unicode 15.1 conjunct rule
 * split after a হসন্ত (প | ক্ | ষী), so a piece ending in হসন্ত is joined to the next one.
 */
export function graphemes(text: string) {
  const out: string[] = [];
  for (const { segment } of segmenter.segment(text)) {
    if (out.length && out[out.length - 1].endsWith(HASANTA)) out[out.length - 1] += segment;
    else out.push(segment);
  }
  return out;
}

/** The word around its যুক্তবর্ণ: `cluster` is the whole akshara that holds it, with any কার (ষ্টি, ক্ষী). */
export function splitWord(item: Word) {
  const pieces = graphemes(item.word), joint = conjunct(item.parts);
  const at = pieces.findIndex(piece => piece.includes(joint));
  return { before: pieces.slice(0, at).join(""), cluster: pieces[at] ?? "", after: pieces.slice(at + 1).join("") };
}

/** What a joined letter turns into, for the one-line note after a রেফ or ফলা: র first rises as রেফ, র or য after sits as a ফলা. */
export function shapeNote(parts: readonly string[]) {
  if (parts[0] === "র") return "র আগে বসলে মাথায় ওঠে। এর নাম রেফ।";
  const last = parts[parts.length - 1];
  if (last === "র") return "র পরে বসলে নিচে নামে। এর নাম র-ফলা।";
  if (last === "য") return "য পরে বসলে পাশে ছোট হয়ে বসে। এর নাম য-ফলা।";
  return "";
}

/** "ক্ষ = ক + ষ" */
export const equation = (parts: readonly string[]) => `${conjunct(parts)} = ${parts.join(" + ")}`;

/** The ten words on the ?print sheet "ভেঙে লেখো": easy to hard, one রেফ and one ফলা among them. */
export const PRINT_WORDS: readonly string[] = ["রসগোল্লা", "চৌদ্দ", "বৃষ্টি", "গল্প", "স্কুল", "বন্ধু", "পক্ষী", "বিজ্ঞান", "চন্দ্র", "সূর্য"];
export const printItems = () => PRINT_WORDS.map(word => ALL_WORDS.find(item => item.word === word)!);
