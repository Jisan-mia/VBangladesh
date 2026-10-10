import type { SiteContent } from "../../shared/site-types";

// Placeholder until the tool is built; keeps the registry, routes and SEO checks whole.
export const site: SiteContent = {
  slug: "attiyo",
  name: "কে কী হয়?",
  title: "কে কী হয়? — একটুখানি",
  description: "কে কী হয়?: খুলে দেখো, খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
  lead: "কে কী হয়?: খুলে দেখো, খেলে দেখো।",
  cta: "শুরু করো",
  guideTitle: "কে কী হয়? যেভাবে ব্যবহার করবে",
  guideIntro: "কে কী হয়?: শুরু করো, ফল দেখো, চাইলে শেয়ার করো।",
  steps: ["শুরু করো।", "ফলাফল দেখো।", "চাইলে শেয়ার করো।"],
  privacy: ["তুমি যা লেখো, তোমার ফোনেই থাকে।"],
  faq: [
    { question: "কে কী হয়? কি ফ্রি?", answer: "হ্যাঁ, পুরোটাই ফ্রি। অ্যাকাউন্ট লাগে না।" },
    { question: "কে কী হয়? কি মোবাইলে চলবে?", answer: "হ্যাঁ, মোবাইলের কথা ভেবেই বানানো।" },
    { question: "কে কী হয়?-এর ফল কি শেয়ার করা যায়?", answer: "হ্যাঁ, ছবি বা লিংক হিসেবে শেয়ার করতে পারবে।" },
    { question: "কে কী হয়?-এ আমার তথ্য কোথায় যায়?", answer: "তুমি শেয়ার না করা পর্যন্ত তোমার ফোনেই থাকে।" },
  ],
  accent: "#a8326a",
};
