export const categories = ["ছবি ও নকশা", "স্মৃতি ও গল্প", "রোজকার কাজ", "একসঙ্গে সময়"] as const;
export type ToolCategory = (typeof categories)[number];

export type ToolListing = {
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  action: string;
};

export const catalog = [
  { slug: "chhotto-para", name: "ছোট্ট পাড়া", description: "টিনের ঘর, গাছ আর ঘুড়ি দিয়ে নিজের ছোট্ট জগৎ সাজান।", category: "ছবি ও নকশা", action: "দৃশ্য সাজান" },
  { slug: "alpana", name: "আলপনা আঁকি", description: "ফুল, পাতা আর রেখায় আলপনা বানান। আঁকার গাইডও রাখুন।", category: "ছবি ও নকশা", action: "আলপনা সাজান" },
  { slug: "kagojer-mela", name: "কাগজের মেলা", description: "পাখির রং বেছে নিন। ছক প্রিন্ট করে কেটে, ভাঁজ করে বানান।", category: "ছবি ও নকশা", action: "পাখি সাজান" },
  { slug: "bhashar-chhobi", name: "আমাদের ভাষার ছবিখাতা", description: "আপনার এলাকায় যে নামে ডাকেন, সেই নাম দিয়ে ছবিকার্ড বানান।", category: "স্মৃতি ও গল্প", action: "ছবিখাতা বানান" },
  { slug: "sobuj-kon", name: "আমার সবুজ কোণ", description: "গাছ আর টব বসিয়ে বারান্দার ছবি সাজান, গাছের তালিকা রাখুন।", category: "ছবি ও নকশা", action: "বারান্দা সাজান" },
  { slug: "amar-chhotobela", name: "আমার ছোটবেলা", description: "কাগজের নৌকা, টিফিন ভাগ, বিকেলের খেলা—স্মৃতি দিয়ে কার্ড বানান।", category: "স্মৃতি ও গল্প", action: "কার্ড বানান" },
  { slug: "rannakhata", name: "আমাদের রান্নাখাতা", description: "রান্নার উপকরণ, ধাপ আর সঙ্গে জড়ানো গল্প লিখে রাখুন।", category: "স্মৃতি ও গল্প", action: "রেসিপি লিখুন" },
  { slug: "bazar-note", name: "বাজার নোট", description: "বাজারের তালিকা বানান। নিজের দেওয়া দাম দিয়ে খরচ মেলান।", category: "রোজকার কাজ", action: "তালিকা তৈরি করুন" },
  { slug: "deadline", name: "শেষ তারিখ", description: "আবেদনের শেষ সময়, বিজ্ঞপ্তির লিংক ও বাকি কাজ গুছিয়ে রাখুন।", category: "রোজকার কাজ", action: "তারিখ যোগ করুন" },
  { slug: "bhara", name: "ভাড়া কত?", description: "ঢাকা মেট্রোরেলের যাত্রায় কত খরচ হবে, তা হিসাব করুন।", category: "রোজকার কাজ", action: "ভাড়া দেখুন" },
  { slug: "cholo-kheli", name: "চলো খেলি", description: "লোকসংখ্যা, জায়গা আর সরঞ্জাম মিলিয়ে একসঙ্গে খেলা বাছুন।", category: "একসঙ্গে সময়", action: "খেলা বেছে নিন" },
  { slug: "free-afternoon", name: "এই সপ্তাহে ফ্রি", description: "সময়, জায়গা আর নিজের বাজেট মিলিয়ে অবসরের পরিকল্পনা করুন।", category: "একসঙ্গে সময়", action: "পরিকল্পনা করুন" },
  { slug: "ek-ghonta", name: "এক ঘণ্টা ভালো কাজ", description: "হাতে থাকা সময়ে ছোট একটি ভালো কাজের পরিকল্পনা করুন।", category: "একসঙ্গে সময়", action: "কাজ বেছে নিন" },
  { slug: "riksharong", name: "রিকশার রং", description: "পাখি, ফুল আর নিজের কথায় রিকশাচিত্রের বোর্ড রাঙান।", category: "ছবি ও নকশা", action: "বোর্ডে রং দিন" },
  { slug: "nokshar-khata", name: "নকশার খাতা", description: "একটি ঘরে রং দিন। ডানে-বাঁয়ে মিলিয়ে পুরো নকশা গড়ুন।", category: "ছবি ও নকশা", action: "নকশা আঁকুন" },
  { slug: "lekhar-poster", name: "কথার পোস্টার", description: "নিজের লেখা সাজান। রং, মাপ আর জায়গা মিলিয়ে পোস্টার বানান।", category: "ছবি ও নকশা", action: "পোস্টার বানান" },
  { slug: "chhobi-jora", name: "ছবি জোড়া", description: "দুই থেকে চারটি ফ্রেমে ছবি সাজিয়ে স্মৃতির কোলাজ বানান।", category: "স্মৃতি ও গল্প", action: "ছবি জুড়ে দিন" },
  { slug: "shobdo-khela", name: "শব্দ সাজাই", description: "সূত্র পড়ে শব্দের টুকরো সাজান। কতগুলো মেলাতে পারেন দেখুন।", category: "একসঙ্গে সময়", action: "শব্দ সাজান" },
  { slug: "soptaher-chhok", name: "সপ্তাহের ছক", description: "পড়া, কাজ আর অবসর—সাত দিনের পরিকল্পনা এক ছবিতে রাখুন।", category: "রোজকার কাজ", action: "ছক সাজান" },
  { slug: "bhagabhagi", name: "ভাগাভাগি", description: "একসঙ্গে খরচের হিসাব দিন। কে কাকে কত দেবেন দেখুন।", category: "রোজকার কাজ", action: "হিসাব মেলান" },
] as const satisfies readonly ToolListing[];
