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
  { slug: "kagojer-mela", name: "কাগজের মেলা", description: "রং বেছে কাগজের পাখি সাজাও। তারপর প্রিন্ট করে কেটে-ভাঁজ করে বানিয়ে ফেলো।", category: "আঁকো আর সাজাও", action: "পাখি বানাও" },
  { slug: "bhashar-chhobi", name: "আমাদের ভাষার ছবিখাতা", description: "তোমার এলাকায় জিনিসটাকে যে নামে ডাকে, সেই নামেই ছবিকার্ড বানাও।", category: "স্মৃতি আর গল্প", action: "কার্ড বানাও" },
  { slug: "sobuj-kon", name: "আমার সবুজ কোণ", description: "টবে গাছ বসিয়ে বারান্দাটা সাজাও, সাথে নিজের গাছের তালিকাও রাখো।", category: "আঁকো আর সাজাও", action: "বারান্দা সাজাও" },
  { slug: "amar-chhotobela", name: "আমার ছোটবেলা", description: "৩৬টা চেনা স্মৃতির কয়টা তোমার ছোটবেলায় ছিল? মিলিয়ে দেখো, বন্ধুদের পাঠাও।", category: "স্মৃতি আর গল্প", action: "মেলাও" },
  { slug: "rannakhata", name: "আমাদের রান্নাখাতা", description: "মা-নানির হাতের রান্নাটা হারিয়ে যেতে দিয়ো না। উপকরণ, ধাপ আর গল্পসহ লিখে রাখো।", category: "স্মৃতি আর গল্প", action: "রেসিপি লেখো" },
  { slug: "bazar-note", name: "বাজার নোট", description: "বাজারের লিস্ট বানাও, নিজের দামে মোট খরচটা মিলিয়ে নাও।", category: "রোজকার কাজে", action: "লিস্ট বানাও" },
  { slug: "deadline", name: "শেষ তারিখ", description: "চাকরি বা ভর্তির আবেদনের শেষ তারিখ আর বাকি কাজ এক জায়গায় গুছিয়ে রাখো।", category: "রোজকার কাজে", action: "তারিখ যোগ করো" },
  { slug: "bhara", name: "ভাড়া কত?", description: "মেট্রোরেলে কোন স্টেশন থেকে কোথায় গেলে কত টাকা লাগবে, দেখে নাও।", category: "রোজকার কাজে", action: "ভাড়া দেখো" },
  { slug: "cholo-kheli", name: "চলো খেলি", description: "কয়জন আছ, কোথায় আছ, হাতে কী আছে বলো। খেলা খুঁজে দেব।", category: "সবাই মিলে", action: "খেলা খুঁজি" },
  { slug: "free-afternoon", name: "এই সপ্তাহে ফ্রি", description: "হাতে একটা বিকেল আর অল্প বাজেট? কোথায় যাবে, কী করবে, ঠিক করে ফেলো।", category: "সবাই মিলে", action: "প্ল্যান করো" },
  { slug: "ek-ghonta", name: "এক ঘণ্টা ভালো কাজ", description: "হাতে এক ঘণ্টা থাকলে আশপাশের মানুষের জন্য কী করা যায়, ছোট একটা প্ল্যান বানাও।", category: "সবাই মিলে", action: "কাজ বাছো" },
  { slug: "riksharong", name: "রিকশার রং", description: "রিকশার পেছনের বোর্ডে পাখি, ফুল আর নিজের কথা লিখে রাঙাও।", category: "আঁকো আর সাজাও", action: "বোর্ড রাঙাও" },
  { slug: "nokshar-khata", name: "নকশার খাতা", description: "একটা ঘরে রং দাও, আয়নার মতো মিলে গিয়ে পুরো নকশা তৈরি হবে।", category: "আঁকো আর সাজাও", action: "নকশা আঁকো" },
  { slug: "lekhar-poster", name: "কথার পোস্টার", description: "মনের কথাটা লেখো, রং আর মাপ বেছে পোস্টার বানিয়ে ফেলো।", category: "আঁকো আর সাজাও", action: "পোস্টার বানাও" },
  { slug: "chhobi-jora", name: "ছবি জোড়া", description: "দুই থেকে চারটা ছবি জুড়ে কোলাজ বানাও। ছবি তোমার ফোন থেকে কোথাও যায় না।", category: "স্মৃতি আর গল্প", action: "ছবি জুড়ে দাও" },
  { slug: "shobdo-khela", name: "শব্দ সাজাই", description: "সূত্র পড়ে টুকরো জুড়ে বাংলা শব্দ বানাও। দেখি কয়টা পারো!", category: "সবাই মিলে", action: "খেলা শুরু করো" },
  { slug: "soptaher-chhok", name: "সপ্তাহের ছক", description: "পড়া, কাজ আর বিশ্রাম। পুরো সপ্তাহের রুটিন এক ছবিতে সাজাও।", category: "রোজকার কাজে", action: "রুটিন সাজাও" },
  { slug: "bhagabhagi", name: "ভাগাভাগি", description: "ট্যুর বা আড্ডার খরচ লিখে দাও, কে কাকে কত দেবে বের হয়ে যাবে।", category: "রোজকার কাজে", action: "হিসাব মেলাও" },
] as const satisfies readonly ToolListing[];

// The homepage leads with this one tool; everything else is listed below it.
export const flagship = "amar-chhotobela";
