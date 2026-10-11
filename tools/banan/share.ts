import type { ToolShare } from "../../shared/share-types";
import { isLoan, parseResult, previewTitle, resultHash, tallyIds } from "./lib/game";

export const share: ToolShare = {
  normalize(state) {
    const result = parseResult(state);
    return result ? resultHash(result) : null;
  },
  preview(state) {
    const result = parseResult(state);
    return {
      title: result ? previewTitle(result) : "শুদ্ধ বানান কোনটি? — ১০টা শব্দের পরীক্ষা",
      description: result && isLoan(result.set)
        ? "রোজ বলা ১০টা ইংরেজি শব্দ, প্রতিটার খাঁটি বাংলা কোনটা? দুইটা থেকে ঠিকটা ছুঁয়ে দাও। বাংলা একাডেমির অভিধান মিলিয়ে। ফ্রি, অ্যাকাউন্ট লাগে না।"
        : "দোকানের সাইনবোর্ডে দুইটা বানান, ঠিকটা ছুঁয়ে দাও। ১০টা শব্দ, বাংলা একাডেমির প্রমিত বানান মিলিয়ে। ফ্রি, অ্যাকাউন্ট লাগে না।",
    };
  },
  tally: tallyIds,
};
