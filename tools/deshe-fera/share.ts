import type { ToolShare } from "../../shared/share-types";
import { countries, createCard, parseShareHash, previewTitle, shareHash, todayInDhaka } from "./lib/deshe";

export const share: ToolShare = {
  normalize(state) {
    const trip = parseShareHash(state);
    return trip ? shareHash(trip).slice(1) : null;
  },
  preview(state) {
    const trip = parseShareHash(state);
    return {
      title: trip ? previewTitle(createCard(trip, todayInDhaka())) : "দেশে ফেরা — কত দিন প্রবাসে, ফিরতে আর কত দিন?",
      description: "কত বছর প্রবাসে, কয়টা ঈদ দূরে কাটল, দেশে ফিরতে আর কত দিন। লিংক খুললেই বাড়ির সবাই দেখবে দিন গোনা।",
    };
  },
  // Only the country is counted, never a date or a name.
  tally: countries.map(country => country.id),
};
