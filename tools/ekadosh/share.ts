import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewDescription, previewTitle, shareHash, tallyIds } from "./lib/ekadosh";

export const share: ToolShare = {
  normalize(state) {
    const team = parseShareHash(state);
    return team ? shareHash(team).slice(1) : null;
  },
  preview(state) {
    const team = parseShareHash(state);
    return team
      ? { title: previewTitle(team), description: previewDescription(team) }
      : { title: "স্বপ্নের একাদশ — তোমার একাদশে কে কে?", description: "পেলে, ম্যারাডোনা, জিদান, মেসি… সর্বকালের সেরাদের নিয়ে কোচের বোর্ডে নিজের একাদশ সাজাও, বন্ধুর দলের সাথে মিলিয়ে দেখো।" };
  },
  // Listed player ids only; the name on the board is never counted.
  tally: tallyIds,
};
