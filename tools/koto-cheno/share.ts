import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewText, shareHash } from "./lib/slambook";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    if (!shared) return null;
    return shareHash(shared).slice(1);
  },
  preview(state) {
    const shared = parseShareHash(state);
    return shared ? previewText(shared) : { title: "তুমি আমাকে কতটা চেনো?", description: "৮টা প্রশ্নের স্লাম বুক। আন্দাজ করো, দেখো কয়টা মেলে, তারপর নিজেরটা বানাও।" };
  },
  // No tally: scores and names are never counted or stored.
};
