import type { SiteContent } from "../../shared/site-types";

// Placeholder until the tool is built; keeps the registry, routes and SEO checks whole.
export const site: SiteContent = {
  slug: "konta-nei",
  name: "কোনটা নেই?",
  title: "কোনটা নেই? — একটুখানি",
  description: "কোনটা নেই?: খুলে দেখো, খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
  lead: "কোনটা নেই?: খুলে দেখো, খেলে দেখো।",
  cta: "শুরু করো",
  guideTitle: "কোনটা নেই? যেভাবে ব্যবহার করবে",
  guideIntro: "কোনটা নেই?: শুরু করো, ফল দেখো, চাইলে শেয়ার করো।",
  steps: ["শুরু করো।", "ফলাফল দেখো।", "চাইলে শেয়ার করো।"],
  privacy: ["তুমি যা লেখো, তোমার ফোনেই থাকে।"],
  faq: [
    { question: "কোনটা নেই? কি ফ্রি?", answer: "হ্যাঁ, পুরোটাই ফ্রি। অ্যাকাউন্ট লাগে না।" },
    { question: "কোনটা নেই? কি মোবাইলে চলবে?", answer: "হ্যাঁ, মোবাইলের কথা ভেবেই বানানো।" },
    { question: "কোনটা নেই?-এর ফল কি শেয়ার করা যায়?", answer: "হ্যাঁ, ছবি বা লিংক হিসেবে শেয়ার করতে পারবে।" },
    { question: "কোনটা নেই?-এ আমার তথ্য কোথায় যায়?", answer: "তুমি শেয়ার না করা পর্যন্ত তোমার ফোনেই থাকে।" },
  ],
  accent: "#2f6fd1",
};
