import type { ToolShare } from "../../shared/share-types";
import { bn, parseShareHash, possessive, shareHash, sweets, total } from "./lib/box";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    const count = shared?.selected.length ?? 0;
    const who = shared?.name ? possessive(shared.name) : "এক বন্ধুর";
    return {
      title: `${who} মিষ্টির বাক্সে ${bn(count)}টা — তোমার কয়টা?`,
      description: `পোড়াবাড়ির চমচম, নাটোরের কাঁচাগোল্লা, বগুড়ার দই… দেশের ${bn(total)}টা নামকরা মিষ্টির কয়টা খেয়েছ? বাক্সে তোলো, মিলিয়ে দেখো।`,
    };
  },
  tally: sweets.map(sweet => sweet.id),
};
