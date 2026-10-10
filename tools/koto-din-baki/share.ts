import type { ToolShare } from "../../shared/share-types";
import { dhakaToday, parseShareHash, previewTitle, shareHash } from "./lib/countdown";

export const share: ToolShare = {
  normalize(state) {
    const pick = parseShareHash(state, dhakaToday(new Date()));
    return pick ? shareHash(pick).slice(1) : null;
  },
  preview(state) {
    const today = dhakaToday(new Date());
    const pick = parseShareHash(state, today);
    return {
      title: pick ? previewTitle(pick, today) : "পরের উৎসব আর কত দিন? — তুমি কোন দিনের অপেক্ষায়?",
      description: "ঈদ, পূজা, বড়দিন, বুদ্ধ পূর্ণিমা, বৈশাখ আর জাতীয় দিবস, কিংবা নিজের কোনো দিন। ক্যালেন্ডারের পাতায় দিন গোনো, ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
};
