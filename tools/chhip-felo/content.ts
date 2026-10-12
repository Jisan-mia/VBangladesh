import type { SiteContent } from "../../shared/site-types";

// Placeholder until the tool is built; keeps the registry, routes and SEO checks whole.
export const site: SiteContent = {
  slug: "chhip-felo",
  name: "ছিপ ফেলো",
  title: "ছিপ ফেলো — একটুখানি",
  description: "ছিপ ফেলো: খুলে দেখো, খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
  lead: "ছিপ ফেলো: খুলে দেখো, খেলে দেখো।",
  cta: "শুরু করো",
  guideTitle: "ছিপ ফেলো যেভাবে ব্যবহার করবে",
  guideIntro: "ছিপ ফেলো: শুরু করো, ফল দেখো, চাইলে শেয়ার করো।",
  steps: ["শুরু করো।", "ফলাফল দেখো।", "চাইলে শেয়ার করো।"],
  privacy: ["তুমি যা লেখো, তোমার ফোনেই থাকে।"],
  faq: [
    { question: "ছিপ ফেলো কি ফ্রি?", answer: "হ্যাঁ, পুরোটাই ফ্রি। অ্যাকাউন্ট লাগে না।" },
    { question: "ছিপ ফেলো কি মোবাইলে চলবে?", answer: "হ্যাঁ, মোবাইলের কথা ভেবেই বানানো।" },
    { question: "ছিপ ফেলো-এর ফল কি শেয়ার করা যায়?", answer: "হ্যাঁ, ছবি বা লিংক হিসেবে শেয়ার করতে পারবে।" },
    { question: "ছিপ ফেলো-এ আমার তথ্য কোথায় যায়?", answer: "তুমি শেয়ার না করা পর্যন্ত তোমার ফোনেই থাকে।" },
  ],
  accent: "#1f6f5c",
};
