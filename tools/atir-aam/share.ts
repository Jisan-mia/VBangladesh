import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one run, after replaying its moves.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "আঁটি থেকে আম: জোড়া মেলাও, বাগান বানাও",
      description: "একই রকম দুটো মিলে পরের ধাপ: আঁটি থেকে চারা, গাছ, মুকুল, পাকা আম, শেষে বাগান। একই শুরু, চালগুলো মিলিয়ে দেখা হিসাব। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
