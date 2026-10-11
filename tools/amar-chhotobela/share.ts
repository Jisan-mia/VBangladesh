import type { ToolShare } from "../../shared/share-types";
import { bn, memories, parseShareHash, possessive, shareHash } from "./lib/postcard";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    const count = shared?.selected.length ?? 0;
    const who = shared?.name ? possessive(shared.name) : "এক বন্ধুর";
    return {
      title: `${who} ছোটবেলার ${bn(count)}টা মিলেছে, তোমার কয়টা?`,
      description: "আলিফ লায়লা, হারিকেন, ঈদের সালামি… ৩৬টা চেনা স্মৃতির কয়টা তোমার ছোটবেলায় ছিল? মিলিয়ে দেখো, নিজের খাতা বানাও।",
    };
  },
  tally: memories.map(memory => memory.id),
};
