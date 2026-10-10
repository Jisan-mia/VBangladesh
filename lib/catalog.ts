export const categories = ["আঁকো আর সাজাও", "স্মৃতি আর গল্প", "সবাই মিলে", "রোজকার কাজে"] as const;
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
  { slug: "rannakhata", name: "আমাদের রান্নাখাতা", description: "মা-নানির হাতের রান্নাটা হারিয়ে যেতে দিয়ো না। গল্পসহ খাতায় লিখে রাখো।", category: "স্মৃতি আর গল্প", action: "রেসিপি লেখো" },
  { slug: "bazar-note", name: "বাজার নোট", description: "বাজারের ফর্দ লিখে পাঠাও। যে বাজারে যাবে, সে টিক দিতে দিতে কিনবে।", category: "রোজকার কাজে", action: "ফর্দ লেখো" },
  { slug: "bhara", name: "ভাড়া কত?", description: "মেট্রোরেলের যেকোনো দুই স্টেশনের ভাড়া, সাথে পুরো ভাড়ার তালিকা।", category: "রোজকার কাজে", action: "ভাড়া দেখো" },
  { slug: "cholo-kheli", name: "চলো খেলি", description: "দেশি খেলা বেছে নাও, নিয়ম দেখো, তারপর বন্ধুদের দাওয়াত পাঠাও।", category: "সবাই মিলে", action: "দাওয়াত বানাও" },
  { slug: "shubhechha", name: "শুভেচ্ছা কার্ড", description: "শুভ বিজয়া, বিজয় দিবস, ঈদ কিংবা নববর্ষ। নাম আর ছবি দিয়ে নিজের শুভেচ্ছা কার্ড বানাও।", category: "আঁকো আর সাজাও", action: "কার্ড বানাও" },
  { slug: "riksharong", name: "রিকশার রং", description: "রিকশার পেছনের বোর্ডে ময়ূর, ফুল আর নিজের কথা লিখে রাঙাও।", category: "আঁকো আর সাজাও", action: "বোর্ড রাঙাও" },
  { slug: "shobdo-khela", name: "শব্দ সাজাই", description: "আজকের শব্দজট: রোজ ৫টা নতুন বাংলা শব্দের ধাঁধা। দেখি কয়টা পারো!", category: "সবাই মিলে", action: "খেলা শুরু করো" },
  { slug: "bhagabhagi", name: "ভাগাভাগি", description: "ট্যুর বা আড্ডার খরচ লিখে দাও, কে কাকে কত দেবে, এক স্লিপে।", category: "রোজকার কাজে", action: "হিসাব মেলাও" },
] as const satisfies readonly ToolListing[];

// The homepage leads with this one tool; everything else is listed below it.
export const flagship = "amar-chhotobela";
