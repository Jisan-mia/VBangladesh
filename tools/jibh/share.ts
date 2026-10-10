import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, placeOf, previewTitle, shareHash, tallyIds } from "./lib/jibh";

export const share: ToolShare = {
  normalize(state) {
    const ticket = parseShareHash(state);
    return ticket ? shareHash(ticket).slice(1) : null;
  },
  preview(state) {
    const ticket = parseShareHash(state);
    const place = ticket ? placeOf(ticket.answers) : null;
    return {
      title: previewTitle(ticket),
      description: place
        ? `${place.name}: ${place.foods} যেখানকার বলে পরিচিত। ৬টা খাবার বেছে দেখো তোমার জিভের টিকিট কোন জেলায় কাটা হয়। ফ্রি।`
        : "সাতকরা, মেজবানি, চুইঝাল না আমড়া? ৬টা খাবার বেছে দেখো তোমার জিভের টিকিট কোন জেলায় কাটা হয়। ফ্রি।",
    };
  },
  tally: tallyIds,
};
