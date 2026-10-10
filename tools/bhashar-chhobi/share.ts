import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash } from "./lib/cards";
import { districts } from "./lib/districts";

export const share: ToolShare = {
  normalize(state) {
    const card = parseShareHash(state);
    return card ? shareHash(card).slice(1) : null;
  },
  preview(state) {
    const card = parseShareHash(state);
    return {
      title: card ? previewTitle(card) : "তোমাদের এলাকায় এটাকে কী বলে?",
      description: "পেয়ারা, ঘুড়ি, লাটিমকে তোমাদের জেলায় কী বলে? নিজের এলাকার শব্দে কার্ড বানাও, বন্ধুদের সাথে মেলাও। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
  // Only fixed district ids are ever counted, never the free-text word.
  tally: districts.map(district => district.id),
};
