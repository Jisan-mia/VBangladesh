import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/worm";

export const share: ToolShare = {
  normalize(state) {
    const match = parseShareHash(state);
    return match ? shareHash(match).slice(1) : null;
  },
  preview(state) {
    const match = parseShareHash(state);
    return {
      title: match ? previewTitle(match) : "ম্যাচের মন — খেলা দেখতে দেখতে মনের গ্রাফ",
      description: "প্রতি ওভার বা গোলে মন যেমন, সেই মুখে চাপো। টিভির ওয়ার্মের মতো মনের গ্রাফ বানাও, বন্ধুর ওয়ার্মের সাথে মিলিয়ে দেখো।",
    };
  },
  // Only the five fixed final-mood ids are counted; names, labels and worms never are.
  tally: tallyIds,
};
