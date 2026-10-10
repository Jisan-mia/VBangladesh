import type { SiteContent } from "../../shared/site-types";

// Placeholder until the tool is built; keeps the registry, routes and SEO checks whole.
export const site: SiteContent = {
  slug: "boyos",
  name: "বয়স কত?",
  title: "বয়স কত? — একটুখানি",
  description: "বয়স কত?: খুলে দেখো, খেলে দেখো। ফ্রি, অ্যাকাউন্ট লাগে না।",
  lead: "বয়স কত?: খুলে দেখো, খেলে দেখো।",
  cta: "শুরু করো",
  guideTitle: "বয়স কত? যেভাবে ব্যবহার করবে",
  guideIntro: "বয়স কত?: শুরু করো, ফল দেখো, চাইলে শেয়ার করো।",
  steps: ["শুরু করো।", "ফলাফল দেখো।", "চাইলে শেয়ার করো।"],
  privacy: ["তুমি যা লেখো, তোমার ফোনেই থাকে।"],
  faq: [
    { question: "বয়স কত? কি ফ্রি?", answer: "হ্যাঁ, পুরোটাই ফ্রি। অ্যাকাউন্ট লাগে না।" },
    { question: "বয়স কত? কি মোবাইলে চলবে?", answer: "হ্যাঁ, মোবাইলের কথা ভেবেই বানানো।" },
    { question: "বয়স কত?-এর ফল কি শেয়ার করা যায়?", answer: "হ্যাঁ, ছবি বা লিংক হিসেবে শেয়ার করতে পারবে।" },
    { question: "বয়স কত?-এ আমার তথ্য কোথায় যায়?", answer: "তুমি শেয়ার না করা পর্যন্ত তোমার ফোনেই থাকে।" },
  ],
  accent: "#a8326a",
};
