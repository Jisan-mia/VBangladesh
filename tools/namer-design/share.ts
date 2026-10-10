import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/namer";

export const share: ToolShare = {
  normalize(state) {
    const design = parseShareHash(state);
    return design ? shareHash(design).slice(1) : null;
  },
  preview(state) {
    return {
      title: previewTitle(parseShareHash(state)),
      description: "নিজের নাম লেখো আলপনায়, বিয়ের কার্ডের সোনালি অক্ষরে, স্লেটে চক দিয়ে বা নিয়ন সাইনে। পোস্ট, স্টোরি আর প্রোফাইল ছবি বানাও। ফ্রি।",
    };
  },
  // Only the style is counted, never the name.
  tally: tallyIds,
};
