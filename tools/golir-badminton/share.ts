import type { ToolShare } from "../../shared/share-types";
import { parseShared, sharedHash } from "./lib/challenge";
import { previewTitle } from "./lib/lines";

// No tally: a link only re-opens one match (its seed sets the rival's shots) with the friend's own score.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "গলির ব্যাডমিন্টন: বাল্বের নিচে পাড়ার চ্যাম্পিয়নকে হারাতে পারবে?",
      description: "শীতের রাতে গলিতে বাল্বের নিচে ব্যাডমিন্টন। রিং সোনালি হলেই চাপো, টেনে মারো স্ম্যাশ বা ড্রপ। একই প্রতিপক্ষ, দেখো তুমি কয় পয়েন্টে জেতো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
