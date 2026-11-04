import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/challenge";

// No tally: a link only re-opens one orchard (rebuilt from its level and seed; an old link also names the first bush) with the friend's own time.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ভিমরুলের চাক: সংখ্যা দেখে লুকানো চাক খোঁজো",
      description: "আমবাগানের ঝোপে লুকানো ভিমরুলের চাক। সংখ্যা দেখে চাকে গামছা বাঁধো, বাকি ঝোপ সাফ করো। একই বাগান, দেখো তুমি কত সময়ে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
