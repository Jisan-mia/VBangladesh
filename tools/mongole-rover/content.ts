import type { SiteContent } from "../../shared/site-types";

// Placeholder until the tool is built; keeps the registry, routes and SEO checks whole.
export const site: SiteContent = {
  slug: "mongole-rover",
  name: "মঙ্গলে রোভার",
  title: "মঙ্গলে রোভার — একটুখানি",
  description: "মঙ্গলে রোভার: খুলে দেখো, খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
  lead: "মঙ্গলে রোভার: খুলে দেখো, খেলে দেখো।",
  cta: "শুরু করো",
  guideTitle: "মঙ্গলে রোভার যেভাবে ব্যবহার করবে",
  guideIntro: "মঙ্গলে রোভার: শুরু করো, ফল দেখো, চাইলে শেয়ার করো।",
  steps: ["শুরু করো।", "ফলাফল দেখো।", "চাইলে শেয়ার করো।"],
  privacy: ["তুমি যা লেখো, তোমার ফোনেই থাকে।"],
  faq: [
    { question: "মঙ্গলে রোভার কি ফ্রি?", answer: "হ্যাঁ, পুরোটাই ফ্রি। অ্যাকাউন্ট লাগে না।" },
    { question: "মঙ্গলে রোভার কি মোবাইলে চলবে?", answer: "হ্যাঁ, মোবাইলের কথা ভেবেই বানানো।" },
    { question: "মঙ্গলে রোভার-এর ফল কি শেয়ার করা যায়?", answer: "হ্যাঁ, ছবি বা লিংক হিসেবে শেয়ার করতে পারবে।" },
    { question: "মঙ্গলে রোভার-এ আমার তথ্য কোথায় যায়?", answer: "তুমি শেয়ার না করা পর্যন্ত তোমার ফোনেই থাকে।" },
  ],
  accent: "#a8326a",
};
