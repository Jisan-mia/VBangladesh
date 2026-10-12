import type { ToolShare } from "../../shared/share-types";
import { parseShared, previewTitle, sharedHash } from "./lib/link";

// No tally: a link only replays one level's sums, from its seed.
export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedHash(shared) : null;
  },
  preview(state) {
    const shared = parseShared(state);
    return {
      title: shared ? previewTitle(shared) : "মুখে মুখে হিসাব: অঙ্কের খেলা, বাজারের হিসাব",
      description: "যোগ, বিয়োগ, গুণ আর বাজারের ফর্দ। এক মিনিটে কয়টা হিসাব মেলাতে পারো? একই হিসাব, এবার তোমার পালা। ফ্রি।",
    };
  },
};
