import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one night (its seed replays the same mosquitoes) with the friend's own count.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "মশার রাত: ভোর পর্যন্ত বালিশটা বাঁচাতে পারবে?",
      description: "বাতি নেভানো ঘর, কানের কাছে পিন-পিন। মশার ওপর চাপো, ইলেকট্রিক ব্যাটে চট! একই রাত, একই মশা, দেখো তুমি কয়টা মারো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
