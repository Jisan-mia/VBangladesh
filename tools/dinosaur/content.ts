import type { SiteContent } from "../../shared/site-types";

// Placeholder until the tool is built; keeps the registry, routes and SEO checks whole.
export const site: SiteContent = {
  slug: "dinosaur",
  name: "ডাইনোসর খুঁজি",
  title: "ডাইনোসর খুঁজি — একটুখানি",
  description: "ডাইনোসর খুঁজি: খুলে দেখো, খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
  lead: "ডাইনোসর খুঁজি: খুলে দেখো, খেলে দেখো।",
  cta: "শুরু করো",
  guideTitle: "ডাইনোসর খুঁজি যেভাবে ব্যবহার করবে",
  guideIntro: "ডাইনোসর খুঁজি: শুরু করো, ফল দেখো, চাইলে শেয়ার করো।",
  steps: ["শুরু করো।", "ফলাফল দেখো।", "চাইলে শেয়ার করো।"],
  privacy: ["তুমি যা লেখো, তোমার ফোনেই থাকে।"],
  faq: [
    { question: "ডাইনোসর খুঁজি কি ফ্রি?", answer: "হ্যাঁ, পুরোটাই ফ্রি। অ্যাকাউন্ট লাগে না।" },
    { question: "ডাইনোসর খুঁজি কি মোবাইলে চলবে?", answer: "হ্যাঁ, মোবাইলের কথা ভেবেই বানানো।" },
    { question: "ডাইনোসর খুঁজি-এর ফল কি শেয়ার করা যায়?", answer: "হ্যাঁ, ছবি বা লিংক হিসেবে শেয়ার করতে পারবে।" },
    { question: "ডাইনোসর খুঁজি-এ আমার তথ্য কোথায় যায়?", answer: "তুমি শেয়ার না করা পর্যন্ত তোমার ফোনেই থাকে।" },
  ],
  accent: "#24607a",
};
