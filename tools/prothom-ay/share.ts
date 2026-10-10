import type { ToolShare } from "../../shared/share-types";
import { bnYear, parseShareHash, previewTitle, shareHash, sourceById, tallyIds } from "./lib/first-pay";

export const share: ToolShare = {
  normalize(state) {
    const pay = parseShareHash(state);
    return pay ? shareHash(pay).slice(1) : null;
  },
  preview(state) {
    const pay = parseShareHash(state);
    return {
      title: pay ? previewTitle(pay) : "প্রথম আয়ের টাকায় কী করেছিলে? — বাদামি খামে বানাও নিজের কার্ড",
      description: `${pay ? `${sourceById(pay.source).label}${pay.year ? `, ${bnYear(pay.year)}` : ""}। ` : ""}আম্মুর শাড়ি, আব্বুর পাঞ্জাবি, নাকি সবার মুখে মিষ্টি? তিন ছোঁয়ায় নিজের প্রথম আয়ের খাম বানাও। টাকার অংক লাগবে না।`,
    };
  },
  // Fixed source and gift ids only; names, years and amounts are never counted.
  tally: tallyIds,
};
