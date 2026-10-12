import type { ToolShare } from "../../shared/share-types";
import { colors, items, parseShareHash, previewTitle, shareHash } from "./lib/eid";

export const share: ToolShare = {
  normalize(state) {
    const eid = parseShareHash(state);
    return eid ? shareHash(eid).slice(1) : null;
  },
  preview(state) {
    const eid = parseShareHash(state);
    return {
      title: eid ? previewTitle(eid) : "ঈদের দিন কয়টা কাজ হলো? মেহেদির হাতে মিলিয়ে দেখো",
      description: "নতুন জামা, সেমাই, সালামি, কোলাকুলি… ঈদের দিনের ২৫টা কাজের কয়টা তোমার হলো? টিক দাও, মেহেদি রাঙা হাত বানাও, বন্ধুর সাথে মেলাও।",
    };
  },
  // Fixed colour and item ids only; names are never counted.
  tally: [...colors.map(color => color.id), ...items.map(item => item.id)],
};
