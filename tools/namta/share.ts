import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/namta";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    return {
      title: shared ? previewTitle(shared) : "নামতা পারো? স্লেটে দেখাও",
      description: "২ থেকে ২০-এর নামতা, বড় বাংলা অঙ্কের বোতাম। ভুল হলে স্লেট আলতো করে ঠিকটা দেখায়। একই ১০টা অঙ্ক খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
  // Only fixed table ids are counted, never names or answers.
  tally: tallyIds,
};
