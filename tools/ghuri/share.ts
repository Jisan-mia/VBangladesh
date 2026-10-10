import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, patterns, previewTitle, stateOf } from "./lib/ghuri";

export const share: ToolShare = {
  normalize(state) {
    const ghuri = parseShareHash(state);
    return ghuri ? stateOf(ghuri) : null;
  },
  preview(state) {
    const ghuri = parseShareHash(state);
    return {
      title: ghuri ? previewTitle(ghuri) : "সাকরাইনের আকাশে একটা ঘুড়ি উড়ছে — তোমারটা কই?",
      description: "নকশা আর রং বেছে নিজের ঘুড়ি বা ফানুস বানাও, নাম লেখো, পুরান ঢাকার সন্ধ্যার আকাশে ওড়াও। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
  // Only the fixed kite patterns are countable; the written words never are.
  tally: patterns.map(pattern => pattern.id),
};
