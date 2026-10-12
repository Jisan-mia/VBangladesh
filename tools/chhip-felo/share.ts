import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one trip (rebuilt from seed and level) with the friend's own basket weight.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ছিপ ফেলো: পুকুরে ছিপ ফেলে মাছ ধরার গেম",
      description: "বাঁশের ছিপে মাছ ধরো। ফাতনা পুরো ডুবলে টান দাও, সুতো সবুজে রেখে গোটাও। একই ঘাট, দেখো তুমি কত কেজি তোলো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
