export const categories = ["স্মৃতি আর গল্প", "খেলাধুলা", "উৎসব আর বিশ্বাস", "মজা আর কুইজ", "নিজেকে জানো", "আঁকো আর সাজাও", "খাবারদাবার", "পরিবার আর প্রবাস", "ভাষা আর পড়াশোনা", "হিসাব-নিকাশ"] as const;
export type ToolCategory = (typeof categories)[number];

export type ToolListing = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  action: string;
};

export const catalog = [
  { slug: "chhotto-para", name: "ছোট্ট পাড়া", description: "টিনের চাল, উঠোন আর ঘুড়ি সাজিয়ে নিজের পাড়ার পোস্টকার্ড বানাও।", category: "আঁকো আর সাজাও", action: "পোস্টকার্ড বানাও" },
  { slug: "alpana", name: "আলপনা আঁকি", description: "তৈরি ডিজাইন বেছে নাও, নয়তো আঙুলে আঁকো। পাবে উঠোনে আঁকা আলপনার ছবি।", category: "আঁকো আর সাজাও", action: "আলপনা আঁকো" },
  { slug: "bhashar-chhobi", name: "আমাদের ভাষার ছবিখাতা", description: "তোমার জেলায় জিনিসটাকে কী বলে? নিজের শব্দে কার্ড বানাও, বন্ধুরটার সাথে মেলাও।", category: "স্মৃতি আর গল্প", action: "কার্ড বানাও" },
  { slug: "amar-chhotobela", name: "আমার ছোটবেলা", description: "৩৬টা চেনা স্মৃতির কয়টা তোমার ছোটবেলায় ছিল? মিলিয়ে দেখো, বন্ধুদের পাঠাও।", category: "স্মৃতি আর গল্প", action: "মেলাও" },
  { slug: "rannakhata", name: "আমাদের রান্নাখাতা", description: "মা-নানির হাতের রান্নাটা হারিয়ে যেতে দিয়ো না। গল্পসহ খাতায় লিখে রাখো।", category: "খাবারদাবার", action: "রেসিপি লেখো" },
  { slug: "bazar-note", name: "বাজার নোট", description: "বাজারের ফর্দ লিখে পাঠাও। যে বাজারে যাবে, সে টিক দিতে দিতে কিনবে।", category: "হিসাব-নিকাশ", action: "ফর্দ লেখো" },
  { slug: "bhara", name: "ভাড়া কত?", description: "মেট্রোরেলের যেকোনো দুই স্টেশনের ভাড়া, সাথে পুরো ভাড়ার তালিকা।", category: "হিসাব-নিকাশ", action: "ভাড়া দেখো" },
  { slug: "cholo-kheli", name: "চলো খেলি", description: "দেশি খেলা বেছে নাও, নিয়ম দেখো, তারপর বন্ধুদের দাওয়াত পাঠাও।", category: "খেলাধুলা", action: "দাওয়াত বানাও" },
  { slug: "shubhechha", name: "শুভেচ্ছা কার্ড", description: "শুভ বিজয়া, বিজয় দিবস, ঈদ কিংবা নববর্ষ। নাম আর ছবি দিয়ে নিজের শুভেচ্ছা কার্ড বানাও।", category: "উৎসব আর বিশ্বাস", action: "কার্ড বানাও" },
  { slug: "riksharong", name: "রিকশার রং", description: "রিকশার পেছনের বোর্ডে ময়ূর, ফুল আর নিজের কথা লিখে রাঙাও।", category: "আঁকো আর সাজাও", action: "বোর্ড রাঙাও" },
  { slug: "shobdo-khela", name: "শব্দ সাজাই", description: "আজকের শব্দজট: রোজ ৫টা নতুন বাংলা শব্দের ধাঁধা। দেখি কয়টা পারো!", category: "ভাষা আর পড়াশোনা", action: "খেলা শুরু করো" },
  { slug: "bhagabhagi", name: "ভাগাভাগি", description: "ট্যুর বা আড্ডার খরচ লিখে দাও, কে কাকে কত দেবে, এক স্লিপে।", category: "হিসাব-নিকাশ", action: "হিসাব মেলাও" },
  { slug: "gpa", name: "জিপিএ কত?", description: "এসএসসি-এইচএসসির বিষয়ভিত্তিক গ্রেড দাও, জিপিএ দেখো।", category: "ভাষা আর পড়াশোনা", action: "জিপিএ দেখো" },
  { slug: "komon-porlo", name: "কয়টা কমন পড়ল?", description: "বিয়ে কবে? রেজাল্ট কত? চেনা প্রশ্নের কয়টা কমন পড়ল, দাগাও। এক লাইনে বিঙ্গো!", category: "মজা আর কুইজ", action: "প্রশ্নপত্র দাগাও" },
  { slug: "argentina-na-brazil", name: "আর্জেন্টিনা না ব্রাজিল?", description: "এক চাপে ছাদে দলের পতাকা তোলো, পাশের বাসার বন্ধুকে ডাকো", category: "খেলাধুলা", action: "পতাকা তোলো" },
  { slug: "koto-din-baki", name: "কত দিন বাকি?", description: "ঈদ, পূজা, বড়দিন, বৈশাখ — সব উৎসবের দিন গোনো।", category: "উৎসব আর বিশ্বাস", action: "দিন গোনো" },
  { slug: "mishtir-baksho", name: "মিষ্টির বাক্স", description: "দেশের নামকরা মিষ্টির কয়টা খেয়েছ? বাক্সে তোলো, গুনে দেখো।", category: "খাবারদাবার", action: "বাক্স সাজাও" },
  { slug: "taka-kothay", name: "টাকা কথায় লিখি", description: "যেকোনো টাকার অঙ্ক বাংলা আর ইংরেজি কথায় লিখে নাও।", category: "ভাষা আর পড়াশোনা", action: "কথায় লেখো" },
  { slug: "amar-jersey", name: "আমার জার্সি", description: "আমার জার্সি: খুলে দেখো, খেলে দেখো।", category: "খেলাধুলা", action: "শুরু করো" },
] as const satisfies readonly ToolListing[];

// The homepage leads with this one tool; everything else is listed below it.
export const flagship = "amar-chhotobela";
