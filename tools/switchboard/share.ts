import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only rebuilds one cleared board, after replaying its presses.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "সুইচবোর্ড: সব বাতি জ্বালাও, কারেন্ট থাকতে থাকতে",
      description: "কাঠের সুইচবোর্ডে একটা সুইচ চাপলে পাশের বাতিও উল্টে যায়। একই বোর্ড, চালগুলো মিলিয়ে দেখা ফল। দেখো তুমি কয় চালে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
