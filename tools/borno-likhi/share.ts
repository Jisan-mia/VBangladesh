import type { ToolShare } from "../../shared/share-types";

// A children's tool: no result links, no challenge links, no tally. Only the plain page link, shared from behind the parent gate.
export const share: ToolShare = {
  normalize: () => null,
  preview: () => ({
    title: "বর্ণ লিখি: আঙুলে অ আ ক খ লেখা",
    description: "কোন দাগ আগে, কোন দিকে টান, মাত্রা কখন। ১১টা স্বরবর্ণ, ৩৯টা ব্যঞ্জনবর্ণ আর ০–৯, ৪–৭ বছরের জন্য, ফ্রি।",
  }),
};
