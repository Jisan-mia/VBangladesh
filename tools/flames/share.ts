import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash } from "./lib/flames";

// No tally: the only inputs are two names, and names are never counted.
export const share: ToolShare = {
  normalize(state) {
    const pair = parseShareHash(state);
    return pair ? shareHash(pair).slice(1) : null;
  },
  preview(state) {
    return {
      title: previewTitle(parseShareHash(state)),
      description: "খাতার শেষ পাতার সেই খেলা: দুটো নাম লেখো, মিলে যাওয়া অক্ষর কাটো, তারপর F-L-A-M-E-S গুনে দেখো কী আসে। শুধু মজা, ফ্রি।",
    };
  },
};
