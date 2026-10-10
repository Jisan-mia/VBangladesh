import type { ToolShare } from "../../shared/share-types";
import { label, packById, parseShareHash, possessive, shareHash, tallyIds } from "./lib/pack";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    if (!shared) return { title: "দেশি স্টার্টার প্যাক — তোমার প্যাকেটে কী থাকত?", description: "ভার্সিটি, নতুন চাকরি, প্রবাসী, বৃষ্টির দিন… মেলার খেলনার প্যাকেটের মতো নিজের স্টার্টার প্যাক বানাও।" };
    const who = shared.name ? possessive(shared.name) : "এক বন্ধুর";
    return {
      title: `${who} স্টার্টার প্যাক: ${packById(shared.pack).label} — তোমারটায় কী থাকত?`,
      description: `${shared.items.map(label).join(", ")}… মেলার খেলনার প্যাকেটের মতো তুমিও বানাও নিজের দেশি স্টার্টার প্যাক।`,
    };
  },
  tally: tallyIds,
};
