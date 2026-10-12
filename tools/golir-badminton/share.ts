import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only re-opens one game (its seed replays the same opponent's shots) with the friend's own score.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "গলির ব্যাডমিন্টন: বাল্বের নিচে পাড়ার চ্যাম্পিয়নকে হারাতে পারবে?",
      description: "শীতের রাতে গলিতে বাল্বের নিচে ব্যাডমিন্টন। রিং সোনালি হলেই চাপো। একই রাত, একই খেলোয়াড়, দেখো তুমি কয় পয়েন্টে জেতো। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
