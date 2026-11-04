import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/challenge";

// No tally: a link only rebuilds one finished quilt, after replaying its moves.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ছক-জোড়া: কাঁথায় ফোঁড় দাও, ঘর জিতে ফুল ফোটাও",
      description: "খাতার পাতার সেই ডট-বক্স খেলা, এবার নকশিকাঁথায়। একই শুরু, একই প্রতিপক্ষ, চালগুলো মিলিয়ে দেখা ফল। দেখো তুমি কয়টা ফুল পাও। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
