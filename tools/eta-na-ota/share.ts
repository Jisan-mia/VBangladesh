import type { ToolShare } from "../../shared/share-types";
import { packOf, parseShareHash, previewTitle, question, shareHash, tallyIds } from "./lib/picks";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    const pack = packOf(shared?.pack ?? "food")!;
    return {
      title: shared ? previewTitle(shared) : "এটা না ওটা? তুমি কোন দিকে?",
      description: `${pack.label}: ${question(pack.pairs[0])} ${question(pack.pairs[1])} ১২টা দেশি তর্কে তুমি কোন দিকে? খেলো, দেখো কার সাথে মেলে।`,
    };
  },
  tally: tallyIds,
};
