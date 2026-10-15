import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no challenge links, no tally. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "কী হবে বলো তো? আগে আন্দাজ, তারপর দেখা",
    description: "নারকেল ভাসে কেন, আকাশ নীল কেন, চাঁদ কেন ছোট-বড় হয়। ১৩টা ছোট পরীক্ষা, ৫–১০ বছরের জন্য, ফ্রি।",
  }),
};
