import type { ToolShare } from "../../shared/share-types";
import { packOf, parseShareHash, previewTitle, shareHash, tallyIds } from "./lib/grades";

export const share: ToolShare = {
  normalize(state) {
    const sheet = parseShareHash(state);
    return sheet ? shareHash(sheet).slice(1) : null;
  },
  preview(state) {
    const sheet = parseShareHash(state);
    const pack = packOf(sheet?.pack ?? "street")!;
    return {
      title: sheet ? previewTitle(sheet) : "ফুচকাকে কত নম্বর দেবে? দেশি রেজাল্ট শিট",
      description: `${pack.label} পরীক্ষা: ${pack.items.slice(0, 3).map(item => item.name).join(", ")}… ৮টা জিনিসকে A+ থেকে F দাও, দেখো কয়টা মেলে।`,
    };
  },
  // Only pack.item.grade ids are ever counted: never names or free text.
  tally: tallyIds,
};
