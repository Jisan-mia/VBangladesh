import type { ToolShare } from "../../shared/share-types";
import { parseShared, sharedHash } from "./lib/challenge";
import { previewTitle } from "./lib/lines";

// The share id stays "danguli": a link re-opens one field (its seed lays out the pond, the wind and the fielders) with the friend's own score.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "ডাংগুলি: দুই চাপে কত ডাং পারো?",
      description: "ছোটবেলার ডাংগুলি, ফোনে। একবার চাপলে কাঠি লাফায়, আবার চাপলে মার। একই মাঠে খেলে দেখো কে বেশি ডাং পারে। ফ্রি।",
    };
  },
};
