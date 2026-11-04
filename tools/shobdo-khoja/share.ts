import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only carries one finished grid and its time.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "শব্দ খোঁজা: অক্ষরের ভিড়ে লুকানো বাংলা শব্দ",
      description: "ফুল, মাছ, পিঠা, পাখি, নদী: আটটা প্যাকে ৩২টা লেভেল। একই গ্রিডে লুকানো শব্দ খুঁজে কাটো, দেখো কত সময়ে পারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
