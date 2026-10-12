import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one solved plate, after replaying its moves.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "১৫ ঘরের ধাঁধা: ঘুঁটি ঠেলে ১ থেকে সাজাও",
      description: "মেলার টিনের সেই ধাঁধা, বাংলা অঙ্কে। একই এলোমেলো প্লেট, চালগুলো মিলিয়ে দেখা হিসাব। দেখো তুমি কত কম চালে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
