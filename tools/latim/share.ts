import type { ToolShare } from "../../shared/share-types";
import { parseShared, sharedHash } from "./lib/challenge";
import { previewTitle } from "./lib/lines";

// The share id stays "latim": a link re-opens one floor (its seed lays out the leaves, the pebbles and the gusts) with the friend's own time.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "লাটিম: তোমার লাটিম কতক্ষণ ঘুরবে?",
      description: "সুতা পেঁচিয়ে লাটিম ছোড়ো, টলতে দেখলে টোকা দাও। একই উঠানে খেলে দেখো কারটা বেশিক্ষণ ঘোরে। ফ্রি।",
    };
  },
};
