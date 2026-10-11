import type { SiteContent } from "../../shared/site-types";

// Placeholder until the tool is built; keeps the registry, routes and SEO checks whole.
export const site: SiteContent = {
  slug: "peoner-cycle",
  name: "পিয়নের সাইকেল",
  title: "পিয়নের সাইকেল — একটুখানি",
  description: "পিয়নের সাইকেল: খুলে দেখো, খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
  lead: "পিয়নের সাইকেল: খুলে দেখো, খেলে দেখো।",
  cta: "শুরু করো",
  guideTitle: "পিয়নের সাইকেল যেভাবে ব্যবহার করবে",
  guideIntro: "পিয়নের সাইকেল: শুরু করো, ফল দেখো, চাইলে শেয়ার করো।",
  steps: ["শুরু করো।", "ফলাফল দেখো।", "চাইলে শেয়ার করো।"],
  privacy: ["তুমি যা লেখো, তোমার ফোনেই থাকে।"],
  faq: [
    { question: "পিয়নের সাইকেল কি ফ্রি?", answer: "হ্যাঁ, পুরোটাই ফ্রি। অ্যাকাউন্ট লাগে না।" },
    { question: "পিয়নের সাইকেল কি মোবাইলে চলবে?", answer: "হ্যাঁ, মোবাইলের কথা ভেবেই বানানো।" },
    { question: "পিয়নের সাইকেল-এর ফল কি শেয়ার করা যায়?", answer: "হ্যাঁ, ছবি বা লিংক হিসেবে শেয়ার করতে পারবে।" },
    { question: "পিয়নের সাইকেল-এ আমার তথ্য কোথায় যায়?", answer: "তুমি শেয়ার না করা পর্যন্ত তোমার ফোনেই থাকে।" },
  ],
  accent: "#2f6fd1",
};
