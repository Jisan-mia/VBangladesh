import type { ToolShare } from "../../shared/share-types";
import { dhakaToday, parseState, previewTitle, stateOf } from "./lib/dhoyahin";

export const share: ToolShare = {
  normalize(state) {
    const quit = parseState(state, dhakaToday(new Date()));
    return quit ? stateOf(quit) : null;
  },
  preview(state) {
    const today = dhakaToday(new Date());
    const quit = parseState(state, today);
    return {
      title: quit ? previewTitle(quit, today) : "কত দিন ধোঁয়াহীন, কত টাকা বাঁচল?",
      description: "টবের চারায় রোজ একটা পাতা গজায়, প্রতি মাসে একটা ফুল। খুললেই আজকের হিসাব, চাইলে চিরকুটে উৎসাহ পাঠাও।",
    };
  },
  // No tally: nothing here is a fixed pick worth counting.
};
