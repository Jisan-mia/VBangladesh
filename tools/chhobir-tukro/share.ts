import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only names one level and the friend's own time.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ছবির টুকরো: গ্রামের ছবির জিগস পাজল",
      description: "নদী, নৌকা আর তালগাছের আঁকা ছবি, টুকরো করে কাটা। একই ছবি, একই টুকরো, দেখো তুমি কত সময়ে জোড়া লাগাও। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
