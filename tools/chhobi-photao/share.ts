import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only names one picture and the friend's own time.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ছবি ফোটাও: সংখ্যা মিলিয়ে ঘর ভরো, ছবি ফুটবে",
      description: "সারি আর কলামের সংখ্যা মিলিয়ে ঘর ভরলে ফোটে ইলিশ, রিকশা, শাপলা। একই ছবির ধাঁধা, দেখো তুমি কত সময়ে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
