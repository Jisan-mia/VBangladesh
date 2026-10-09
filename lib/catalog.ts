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
  { slug: "chhotto-para", name: "ছোট্ট পাড়া", description: "টিনের চাল, নারকেল গাছ, উঠোনে ঘুড়ি। নিজের মতো একটা পাড়া সাজাও।", category: "আঁকো আর সাজাও", action: "পাড়া সাজাও" },
  { slug: "alpana", name: "আলপনা আঁকি", description: "আঙুল টানলেই চারপাশে ফুটে উঠবে আলপনা। ছবি নামাও, চাইলে কাগজেও এঁকে নাও।", category: "আঁকো আর সাজাও", action: "আলপনা আঁকো" },
  { slug: "bhashar-chhobi", name: "আমাদের ভাষার ছবিখাতা", description: "তোমার এলাকায় জিনিসটাকে যে নামে ডাকে, সেই নামেই ছবিকার্ড বানাও।", category: "স্মৃতি আর গল্প", action: "কার্ড বানাও" },
  { slug: "amar-chhotobela", name: "আমার ছোটবেলা", description: "৩৬টা চেনা স্মৃতির কয়টা তোমার ছোটবেলায় ছিল? মিলিয়ে দেখো, বন্ধুদের পাঠাও।", category: "স্মৃতি আর গল্প", action: "মেলাও" },
  { slug: "rannakhata", name: "আমাদের রান্নাখাতা", description: "মা-নানির হাতের রান্নাটা হারিয়ে যেতে দিয়ো না। উপকরণ, ধাপ আর গল্পসহ লিখে রাখো।", category: "স্মৃতি আর গল্প", action: "রেসিপি লেখো" },
  { slug: "bazar-note", name: "বাজার নোট", description: "বাজারের লিস্ট বানাও, নিজের দামে মোট খরচটা মিলিয়ে নাও।", category: "রোজকার কাজে", action: "লিস্ট বানাও" },
  { slug: "bhara", name: "ভাড়া কত?", description: "মেট্রোরেলে কোন স্টেশন থেকে কোথায় গেলে কত টাকা লাগবে, দেখে নাও।", category: "রোজকার কাজে", action: "ভাড়া দেখো" },
  { slug: "cholo-kheli", name: "চলো খেলি", description: "কয়জন আছ, কোথায় আছ, হাতে কী আছে বলো। খেলা খুঁজে দেব।", category: "সবাই মিলে", action: "খেলা খুঁজি" },
  { slug: "shubhechha", name: "শুভেচ্ছা কার্ড", description: "শুভ বিজয়া, বিজয় দিবস, ঈদ কিংবা নববর্ষ। নাম আর ছবি দিয়ে নিজের শুভেচ্ছা কার্ড বানাও।", category: "আঁকো আর সাজাও", action: "কার্ড বানাও" },
  { slug: "riksharong", name: "রিকশার রং", description: "রিকশার পেছনের বোর্ডে পাখি, ফুল আর নিজের কথা লিখে রাঙাও।", category: "আঁকো আর সাজাও", action: "বোর্ড রাঙাও" },
  { slug: "shobdo-khela", name: "শব্দ সাজাই", description: "সূত্র পড়ে টুকরো জুড়ে বাংলা শব্দ বানাও। দেখি কয়টা পারো!", category: "সবাই মিলে", action: "খেলা শুরু করো" },
  { slug: "bhagabhagi", name: "ভাগাভাগি", description: "ট্যুর বা আড্ডার খরচ লিখে দাও, কে কাকে কত দেবে বের হয়ে যাবে।", category: "রোজকার কাজে", action: "হিসাব মেলাও" },
] as const satisfies readonly ToolListing[];

// The homepage leads with this one tool; everything else is listed below it.
export const flagship = "amar-chhotobela";
