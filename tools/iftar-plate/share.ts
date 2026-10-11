import type { ToolShare } from "../../shared/share-types";
import { items, parseShareHash, places, possessive, shareHash, itemById } from "./lib/plate";

export const share: ToolShare = {
  normalize(state) {
    const plate = parseShareHash(state);
    return plate ? shareHash(plate).slice(1) : null;
  },
  preview(state) {
    const plate = parseShareHash(state);
    const who = plate?.name ? possessive(plate.name) : "এক বন্ধুর";
    const names = plate?.picks.map(id => itemById(id).label) ?? [];
    return {
      title: `${who} ইফতারির প্লেট। তোমার প্লেটে কী?`,
      description: names.length ? `${names.join(", ")}। তুমিও নিজের ইফতারির প্লেট সাজাও, তারপর দুজনেরটা মিলিয়ে দেখো।` : "খেজুর, ছোলা, পেঁয়াজু, বেগুনি… নিজের ইফতারির প্লেট সাজাও।",
    };
  },
  // Fixed food and place ids only; names never reach the tally.
  tally: [...items.map(item => item.id), ...places.map(place => place.id)],
};
