// Tool search that understands Bangla, Banglish (Bangla in English letters, any spelling) and English keywords.
// Everything is reduced to one rough phonetic key, so "ছোটবেলা", "chotobela" and "chhotobela" all become "catabela".

const consonants: Record<string, string> = {
  "ক": "k", "খ": "k", "গ": "g", "ঘ": "g", "ঙ": "ng", "চ": "ch", "ছ": "ch", "জ": "j", "ঝ": "j", "ঞ": "n",
  "ট": "t", "ঠ": "t", "ড": "d", "ঢ": "d", "ণ": "n", "ত": "t", "থ": "t", "দ": "d", "ধ": "d", "ন": "n",
  "প": "p", "ফ": "f", "ব": "b", "ভ": "b", "ম": "m", "য": "j", "র": "r", "ল": "l", "শ": "s", "ষ": "s",
  "স": "s", "হ": "h", "ড়": "r", "ঢ়": "r", "য়": "i", "ৎ": "t",
};
const vowels: Record<string, string> = {
  "অ": "a", "আ": "a", "ই": "i", "ঈ": "i", "উ": "u", "ঊ": "u", "ঋ": "ri", "এ": "e", "ঐ": "ai", "ও": "a", "ঔ": "u",
  "া": "a", "ি": "i", "ী": "i", "ু": "u", "ূ": "u", "ৃ": "ri", "ে": "e", "ৈ": "ai", "ো": "a", "ৌ": "u",
  "ং": "ng", "ঃ": "", "ঁ": "",
};
const digits = "০১২৩৪৫৬৭৮৯";
const HASANTA = "্", NUKTA = "়";

/** Bangla script → rough Latin, the way people type Banglish (inherent vowel added except at word end and before ্). */
export function transliterate(text: string): string {
  // Precompose ড় ঢ় য় first: NFC stores them as base letter + nukta.
  const chars = [...text.normalize("NFC").replace(/[ডঢয]়/g, pair => ({ "ড": "ড়", "ঢ": "ঢ়", "য": "য়" })[pair[0]]!)];
  let out = "";
  chars.forEach((char, index) => {
    const next = chars[index + 1];
    if ((char === "য" || char === "ব") && chars[index - 1] === HASANTA) return; // য-ফলা, ব-ফলা: mostly silent in speech
    if (consonants[char] !== undefined) {
      out += consonants[char];
      const endsWord = next === undefined || !/[ঀ-৿]/.test(next);
      if (!endsWord && next !== HASANTA && vowels[next] === undefined && char !== "ৎ") out += "a";
    } else if (vowels[char] !== undefined) out += vowels[char];
    else if (digits.includes(char)) out += String(digits.indexOf(char));
    else if (char !== HASANTA && char !== NUKTA) out += char;
  });
  return out;
}

/** Latin text (Banglish or English) → the shared phonetic key: digraphs folded, o→a, repeats collapsed, only letters and digits. */
export function phoneticKey(text: string): string {
  return transliterate(text).toLowerCase()
    .replace(/c(?!h)/g, "k").replace(/([bcdfghjklmnpqrstvxz])y/g, "$1").replace(/chh|ch/g, "c").replace(/sh|ss/g, "s").replace(/kh|q/g, "k").replace(/gh/g, "g").replace(/jh|z/g, "j")
    .replace(/th/g, "t").replace(/dh/g, "d").replace(/ph/g, "f").replace(/bh|v/g, "b").replace(/rh/g, "r")
    .replace(/ee|y/g, "i").replace(/oo|ou|ow/g, "u").replace(/w/g, "a").replace(/o/g, "a")
    .replace(/[^a-z0-9]/g, "").replace(/(.)\1+/g, "$1");
}

/** The key without vowels, a looser fallback for spellings that disagree only on vowels ("shorkar" vs "sorokar"). */
const skeleton = (key: string) => key.replace(/[aeiu]/g, "");
const foldBangla = (text: string) => text.normalize("NFC").toLowerCase().replace(/\s+/g, "");

export type Searchable = { slug: string; name: string; description: string; category: string };
type Field = { raw: string; key: string; bones: string; words: string[]; weight: number };

/** Precomputes keys for every tool once; returns a function that ranks tools for a query (all words must match). */
export function makeSearch<T extends Searchable>(tools: readonly T[], keywords: Record<string, readonly string[]> = {}) {
  const field = (text: string, weight: number): Field => {
    const key = phoneticKey(text);
    return { raw: foldBangla(text), key, bones: skeleton(key), words: text.split(/[\s,।:;!?…()‘’“”-]+/).map(phoneticKey).filter(Boolean), weight };
  };
  const indexed = tools.map((tool, order) => ({
    tool, order,
    fields: [field(tool.name, 4), ...(keywords[tool.slug] ?? []).map(word => field(word, 3)), field(tool.category, 2), field(tool.description, 1)],
  }));
  return (query: string): T[] => {
    const terms = query.trim().split(/\s+/).filter(Boolean).map(term => ({ raw: foldBangla(term), key: phoneticKey(term), bones: skeleton(phoneticKey(term)) })).filter(term => term.key || term.raw);
    if (!terms.length) return [...tools];
    const scored = indexed.map(entry => {
      let total = 0;
      for (const term of terms) {
        let best = 0;
        for (const f of entry.fields) {
          // Whole word > exact Bangla text > word start > anywhere > same consonants.
          const hit = f.words.includes(term.key) ? 5 : term.raw && f.raw.includes(term.raw) ? 4 : term.key.length >= 2 && f.words.some(word => word.startsWith(term.key)) ? 3
            : term.key.length >= 2 && f.key.includes(term.key) ? 2 : term.bones.length >= 3 && f.bones.includes(term.bones) ? 1 : 0;
          best = Math.max(best, hit * f.weight);
        }
        if (!best) return { entry, total: 0 };
        total += best;
      }
      return { entry, total };
    });
    // Drop weak, accidental matches (e.g. same consonants only) when much better ones exist.
    const top = Math.max(0, ...scored.map(item => item.total));
    return scored.filter(item => item.total > 0 && item.total * 4 >= top).sort((a, b) => b.total - a.total || a.entry.order - b.entry.order).map(item => item.entry.tool);
  };
}
