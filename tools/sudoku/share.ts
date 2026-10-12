import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one puzzle, rebuilt and re-checked, with the friend's time.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "সুডোকু বাংলায়: ১ থেকে ৯, বাংলা অঙ্কে",
      description: "একই ছক, বাংলা অঙ্কে। প্রতিটা ধাঁধার উত্তর একটাই, অনুমান ছাড়াই মেলে। দেখো তুমি কত মিনিটে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
