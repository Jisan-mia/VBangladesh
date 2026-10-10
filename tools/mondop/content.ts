import type { SiteContent } from "../../shared/site-types";

// Placeholder until the tool is built; keeps the registry, routes and SEO checks whole.
export const site: SiteContent = {
  slug: "mondop",
  name: "মণ্ডপ ঘুরি",
  title: "মণ্ডপ ঘুরি — একটুখানি",
  description: "মণ্ডপ ঘুরি: খুলে দেখো, খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
  lead: "মণ্ডপ ঘুরি: খুলে দেখো, খেলে দেখো।",
  cta: "শুরু করো",
  guideTitle: "মণ্ডপ ঘুরি যেভাবে ব্যবহার করবে",
  guideIntro: "মণ্ডপ ঘুরি: শুরু করো, ফল দেখো, চাইলে শেয়ার করো।",
  steps: ["শুরু করো।", "ফলাফল দেখো।", "চাইলে শেয়ার করো।"],
  privacy: ["তুমি যা লেখো, তোমার ফোনেই থাকে।"],
  faq: [
    { question: "মণ্ডপ ঘুরি কি ফ্রি?", answer: "হ্যাঁ, পুরোটাই ফ্রি। অ্যাকাউন্ট লাগে না।" },
    { question: "মণ্ডপ ঘুরি কি মোবাইলে চলবে?", answer: "হ্যাঁ, মোবাইলের কথা ভেবেই বানানো।" },
    { question: "মণ্ডপ ঘুরি-এর ফল কি শেয়ার করা যায়?", answer: "হ্যাঁ, ছবি বা লিংক হিসেবে শেয়ার করতে পারবে।" },
    { question: "মণ্ডপ ঘুরি-এ আমার তথ্য কোথায় যায়?", answer: "তুমি শেয়ার না করা পর্যন্ত তোমার ফোনেই থাকে।" },
  ],
  accent: "#b5651d",
};
