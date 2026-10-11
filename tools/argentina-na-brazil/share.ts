import type { ToolShare } from "../../shared/share-types";
import { fanPreviewTitle } from "./lib/fan";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/roof";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    // A fan-test link (sender's taps + seed) previews the recomputed score; every other link previews the roof as before.
    if (shared?.own.quiz) return {
      title: fanPreviewTitle(shared),
      description: "আর্জেন্টিনা আর ব্রাজিলের বিশ্বকাপ-কোপার ইতিহাস নিয়ে ৮টা প্রশ্ন। নিজের দলের পরীক্ষা দাও, তারপর দুজনের স্কোর এক কার্ডে।",
    };
    return {
      title: shared ? previewTitle(shared) : "আর্জেন্টিনা না ব্রাজিল? তোমার ছাদে কোন পতাকা?",
      description: "এক চাপে দল বাছো, ছাদে পতাকা তোলো, পাশের বাসায় বন্ধুর পতাকা দেখো। দেশের মানুষ কোন দিকে, সেটাও জেনে নাও।",
    };
  },
  // Only fixed team and division ids are ever counted; never names.
  tally: tallyIds,
};
