import type { ToolShare } from "../../shared/share-types";
import { parseShareHash, previewTitle, shareHash } from "./lib/primer";

export const share: ToolShare = {
  normalize(state) {
    const primer = parseShareHash(state);
    return primer ? shareHash(primer).slice(1) : null;
  },
  preview(state) {
    const primer = parseShareHash(state);
    return {
      title: primer ? previewTitle(primer) : "যেকোনো টাকার অঙ্ক কথায় লেখো, বাংলা আর ইংরেজিতে",
      description: "অঙ্ক লিখলেই বাংলায় ‘টাকা মাত্র’ আর ইংরেজিতে ‘Taka … Only’। চেক আর ফর্মের জন্য, এক চাপে কপি।",
    };
  },
  // No tally: amounts are free input, nothing fixed to count.
};
