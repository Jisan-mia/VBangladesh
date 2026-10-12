import type { ToolShare } from "../../shared/share-types";
import { countOf, itemById, items, parseShareHash, phrase, possessive, shareHash, type ItemId } from "./lib/van";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShareHash(state);
    return shared ? shareHash(shared).slice(1) : null;
  },
  preview(state) {
    const shared = parseShareHash(state);
    const who = shared?.name ? possessive(shared.name) : "এক বন্ধুর";
    const cart = shared?.cart ?? {};
    const top = (Object.keys(cart) as ItemId[])
      .sort((a, b) => itemById(b).price * countOf(cart, b) - itemById(a).price * countOf(cart, a))
      .slice(0, 2).map(id => phrase(id, countOf(cart, id)));
    return {
      title: top.length ? `${who} এক কোটির ভ্যানে ${top.join(", ")}… তুমি কী কিনতে?` : `${who} এক কোটির ভ্যান। তুমি কী কিনতে?`,
      description: "এক কাপ চা থেকে আম্মুর জন্য বাড়ি, স্কুলে লাইব্রেরি… হাতে এক কোটি টাকা থাকলে কী কিনতে? + চেপে খরচ করে দেখো। দাম আনুমানিক।",
    };
  },
  tally: items.map(item => item.id),
};
