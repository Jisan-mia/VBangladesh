import type { ToolShare } from "../../shared/share-types";

// No short links on purpose: blood group and donation dates are health data. normalize() refuses every state, so
// /api/share stores nothing and shareLink() falls back to the plain /rokto#… link, whose part after # browsers never
// send to a server. No tally either.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "রক্তদাতা কার্ড — আবার কবে রক্ত দিতে পারবে?",
    description: "শেষ কবে রক্ত দিয়েছ? তারিখ দাও, দেখো আবার কবে থেকে পারবে, আর বানাও নিজের রক্তদাতা কার্ড।",
  }),
};
