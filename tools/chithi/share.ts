import type { ToolShare } from "../../shared/share-types";
import { dhakaToday, isSealed, parseShared, previewTitle, sharedState } from "./lib/chithi";

export const share: ToolShare = {
  normalize(state) {
    const shared = parseShared(state);
    return shared ? sharedState(shared) : null;
  },
  preview(state) {
    const today = dhakaToday(new Date());
    const shared = parseShared(state);
    const sealed = shared?.kind === "letter" && isSealed(shared.letter, today);
    return {
      title: shared ? previewTitle(shared, today) : "অনেক দিন চিঠি লেখা হয় না",
      // Generic on purpose: a preview is public in chat apps, so the letter's own words never appear here.
      description: sealed
        ? "খামটা আটকানো, খোলার দিনের আগে খোলা যাবে না। ততদিন তুমিও কাউকে একটা চিঠি লেখো, হলুদ খামে।"
        : shared?.kind === "reply" ? "হলুদ খামে চিঠির উত্তর এসেছে। খাম খুলে পড়ো, আর তুমিও কাউকে একটা চিঠি লেখো।"
        : "হলুদ খামে একটা চিঠি এসেছে। খাম খুলে পড়ো, চাইলে উত্তর দাও, আর নিজেও কাউকে একটা চিঠি লেখো।",
    };
  },
  // No tally: letters are free text and names, never something to count.
};
