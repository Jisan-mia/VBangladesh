// Every "right" spelling follows Bangla Academy standard spelling. Checked October 2026 against:
// - বাংলা একাডেমি, প্রমিত বাংলা বানানের নিয়ম (পরিমার্জিত সংস্করণ ২০১২), rules summarised at
//   https://bn.wikipedia.org/wiki/প্রমিত_বাংলা_বানানের_নিয়ম (its own examples include পোশাক and সহযোগিতা)
// - the Bangla Academy-based dictionary at https://accessibledictionary.gov.bd/bengali-to-bengali.php?q=<word>
//   (each right form, or its base word for compounds, is a headword there; no wrong form is)
// Left out on purpose because the dictionary accepts both forms: দারিদ্র্য/দারিদ্র, মুহূর্ত/মুহুর্ত, নূপুর/নুপুর.
// Left out because the standard changed recently or is still argued over: শ্রেণি, শহিদ, ইদ, জরুরি, বাঙালি, সরকারি,
// সূচি, উদ্‌যাপন, ইতোমধ্যে, সংবর্ধনা, বিপণি, রং.
// Share links store picks by position: once links are public, never reorder words or options inside a set.

export type Word = {
  id: string;
  /** Both spellings, in the order they are shown. */
  options: readonly [string, string];
  /** Index of the standard spelling in options. */
  right: 0 | 1;
  /** Where you'd see this word painted; never gives the answer away. */
  where: string;
  /** One line on why, shown after the pick. */
  rule: string;
};

export type WordSet = { id: string; label: string; short: string; sober?: boolean; words: readonly Word[] };

export const wordSets = [
  {
    id: "dokan", label: "দোকানের সাইনবোর্ড", short: "দোকান",
    words: [
      { id: "poshak", options: ["পোষাক", "পোশাক"], right: 1, where: "কাপড়ের দোকান", rule: "পোশাক ফারসি থেকে আসা শব্দ। বিদেশি শব্দে ষ বসে না, তাই শ।" },
      { id: "oushodh", options: ["ঔষধ", "ঔষুধ"], right: 0, where: "ফার্মেসি", rule: "ঔষধ বা ওষুধ, দুটোই শুদ্ধ। কিন্তু ‘ঔষুধ’ কোনো অভিধানে নেই।" },
      { id: "sushwadu", options: ["সুসাদু", "সুস্বাদু"], right: 1, where: "খাবারের হোটেল", rule: "সু + স্বাদু। ‘স্বাদ’-এর ব-ফলা এখানেও থাকে।" },
      { id: "swatwadhikari", options: ["স্বত্বাধিকারী", "সত্ত্বাধিকারী"], right: 0, where: "সাইনবোর্ডের নিচের কোনা", rule: "মালিকানা মানে ‘স্বত্ব’ (স্ব + ত্ব)। ‘সত্ত্ব’ আলাদা শব্দ, মানে অস্তিত্ব বা গুণ।" },
      { id: "udbodhon", options: ["উদ্ভোধন", "উদ্বোধন"], right: 1, where: "নতুন দোকানের ব্যানার", rule: "উৎ + বোধন = উদ্বোধন। এখানে ব, ভ না।" },
      { id: "mishtanno", options: ["মিষ্টান্ন", "মিস্টান্ন"], right: 0, where: "রসগোল্লা-সন্দেশের দোকান", rule: "মিষ্ট + অন্ন। সংস্কৃত থেকে আসা ‘মিষ্ট’-এ ষ্ট; স্ট বসে ইংরেজি শব্দে, যেমন স্টেশন।" },
      { id: "porishkar", options: ["পরিস্কার", "পরিষ্কার"], right: 1, where: "লন্ড্রি", rule: "পরি + কার। ই-কারের পরে এখানে স না, ষ বসে।" },
      { id: "lobon", options: ["লবন", "লবণ"], right: 1, where: "মুদি দোকান", rule: "লবণ সংস্কৃত শব্দ, বানানেই মূর্ধন্য ণ। মুখের ‘নুন’-এ দন্ত্য ন।" },
      { id: "shasthyo", options: ["স্বাস্থ্য", "স্বাস্থ"], right: 0, where: "ক্লিনিক", rule: "স্বস্থ থেকে স্বাস্থ্য। শেষে য-ফলা থাকে।" },
      { id: "dhumpan", options: ["ধুমপান", "ধূমপান"], right: 1, where: "দোকানের দেয়াল", rule: "‘ধূম’ মানে ধোঁয়া, দীর্ঘ ঊ-কারে লেখা। তাই ধূমপান।" },
    ],
  },
  {
    id: "school", label: "স্কুলের নোটিশ বোর্ড", short: "স্কুল",
    words: [
      { id: "porikkha", options: ["পরিক্ষা", "পরীক্ষা"], right: 1, where: "নোটিশ বোর্ড", rule: "পরি + ঈক্ষা। মাঝখানে দীর্ঘ ঈ-কার।" },
      { id: "mukhostho", options: ["মুখস্থ", "মুখস্ত"], right: 0, where: "পড়ার টেবিল", rule: "মুখ + স্থ (যা থেকে যায়)। স্থান, স্থির-এর মতো স্থ।" },
      { id: "protijogita", options: ["প্রতিযোগীতা", "প্রতিযোগিতা"], right: 1, where: "স্কুলের ব্যানার", rule: "প্রতিযোগী + তা হলে ঈ-কার হ্রস্ব হয়, যেমন সহযোগিতা।" },
      { id: "monojog", options: ["মনযোগ", "মনোযোগ"], right: 1, where: "ক্লাসের বোর্ড", rule: "মনঃ + যোগ = মনোযোগ। বিসর্গ মিলে ও-কার হয়।" },
      { id: "puroshkar", options: ["পুরস্কার", "পুরষ্কার"], right: 0, where: "বার্ষিক অনুষ্ঠানের ব্যানার", rule: "পুরঃ + কার। অ-কারের পরে এখানে স বসে, যেমন ভাস্কর।" },
      { id: "ontorbhukto", options: ["অন্তর্ভূক্ত", "অন্তর্ভুক্ত"], right: 1, where: "ভর্তির নোটিশ", rule: "‘ভুক্ত’ সবসময় হ্রস্ব উ-কারে: অন্তর্ভুক্ত, অভুক্ত।" },
      { id: "koutuhol", options: ["কৌতূহল", "কৌতুহল"], right: 0, where: "বিজ্ঞান মেলা", rule: "‘তূ’-তে দীর্ঘ ঊ-কার: কৌতূহল, কৌতূহলী।" },
      { id: "sharirik", options: ["শারিরীক", "শারীরিক"], right: 1, where: "খেলার মাঠ", rule: "শরীর + ইক। শরীরের ঈ থাকে, শেষের ‘ইক’ হ্রস্ব, যেমন সামাজিক।" },
      { id: "abishkar", options: ["আবিস্কার", "আবিষ্কার"], right: 1, where: "বিজ্ঞানের বই", rule: "আবিঃ + কার। ই-কারের পরে এখানে ষ বসে।" },
      { id: "pipilika", options: ["পিপীলিকা", "পিপিলীকা"], right: 0, where: "ছোটদের ছড়ার বই", rule: "পি-পী-লি-কা: শুধু দ্বিতীয় অক্ষরে দীর্ঘ ঈ-কার।" },
    ],
  },
  {
    id: "deyal", label: "দেয়াল আর ব্যানার", short: "দেয়াল",
    words: [
      { id: "mumurshu", options: ["মুমুর্ষু", "মুমূর্ষু"], right: 1, where: "রক্তদানের পোস্টার", rule: "মু-মূর্-ষু: দ্বিতীয় অক্ষরে দীর্ঘ ঊ-কার।" },
      { id: "ujjol", options: ["উজ্জ্বল", "উজ্জল"], right: 0, where: "লাইট-ফ্যানের দোকান", rule: "উৎ + জ্বল (জ্বলা থেকে)। জ্জ-এর সাথে ব-ফলা থাকে।" },
      { id: "santwona", options: ["সান্তনা", "সান্ত্বনা"], right: 1, where: "কবিতার দেয়ালিকা", rule: "ন্ত-এর সাথে ব-ফলা: সান্ত্বনা।" },
      { id: "durniti", options: ["দুর্নীতি", "দূর্নীতি"], right: 0, where: "অফিসের দেয়াল", rule: "দুঃ (মন্দ) + নীতি। এখানে হ্রস্ব উ; দীর্ঘ ঊ-এর ‘দূর’ মানে দূরে।" },
      { id: "somman", options: ["সন্মান", "সম্মান"], right: 1, where: "অনুষ্ঠানের ব্যানার", rule: "সম্‌ + মান = সম্মান। দুটো ম পাশাপাশি।" },
      { id: "uchchhash", options: ["উচ্ছ্বাস", "উচ্ছাস"], right: 0, where: "খেলা জেতার ব্যানার", rule: "উৎ + শ্বাস। শ্বাস-এর ব-ফলাটা থেকে যায়।" },
      { id: "durobostha", options: ["দুরাবস্থা", "দুরবস্থা"], right: 1, where: "খবরের কাগজের শিরোনাম", rule: "দুঃ + অবস্থা = দুরবস্থা। মাঝে আ-কার নেই।" },
      { id: "ottodhik", options: ["অত্যধিক", "অত্যাধিক"], right: 0, where: "দোকানের নোটিশ", rule: "অতি + অধিক = অত্যধিক। মাঝে আ-কার আসে না।" },
      { id: "akangkha", options: ["আকাঙ্খা", "আকাঙ্ক্ষা"], right: 1, where: "বিজ্ঞাপনের বোর্ড", rule: "যুক্তবর্ণটা ঙ্ক্ষ (ঙ + ক + ষ)। শুনতে খ, লেখায় ক্ষ।" },
      { id: "protishthan", options: ["প্রতিষ্ঠান", "প্রতিষ্টান"], right: 0, where: "অফিসের সাইনবোর্ড", rule: "ষ-এর সাথে ঠ মিলে ষ্ঠ, যেমন শ্রেষ্ঠ, নিষ্ঠা।" },
    ],
  },
  {
    id: "e75", label: "একুশের ৭৫ বছর", short: "একুশ", sober: true,
    words: [
      { id: "bornomala", options: ["বর্নমালা", "বর্ণমালা"], right: 1, where: "একুশের দেয়ালিকা", rule: "র-এর পরে ণ বসে (ণত্ব বিধান): বর্ণ, বর্ণমালা।" },
      { id: "uchcharon", options: ["উচ্চারণ", "উচ্চারন"], right: 0, where: "আবৃত্তির মঞ্চ", rule: "‘চারণ’-এ র-এর পরে ণ, তাই উচ্চারণ।" },
      { id: "matribhasha", options: ["মাত্রিভাষা", "মাতৃভাষা"], right: 1, where: "একুশের ব্যানার", rule: "মাতৃ মানে মা। এখানে ঋ-কার (ৃ), র-ফলা আর ই-কার না।" },
      { id: "attotyag", options: ["আত্মত্যাগ", "আত্বত্যাগ"], right: 0, where: "স্মরণসভা", rule: "আত্ম-তে ত-এর সাথে ম-ফলা (ত্ম), ব-ফলা না।" },
      { id: "shroddhanjoli", options: ["শ্রদ্ধাঞ্জলী", "শ্রদ্ধাঞ্জলি"], right: 1, where: "ফুলের তোড়ার ফিতা", rule: "শ্রদ্ধা + অঞ্জলি। অঞ্জলি-তে হ্রস্ব ই-কার।" },
      { id: "antorjatik", options: ["আন্তর্জাতিক", "আন্তর্জাতীক"], right: 0, where: "২১ ফেব্রুয়ারির ব্যানার", rule: "জাতি + ইক। শেষের ‘ইক’ হ্রস্ব ই-কারে, যেমন সামাজিক।" },
      { id: "morjada", options: ["মর্জাদা", "মর্যাদা"], right: 1, where: "দেয়াল লিখন", rule: "র-এর পরে অন্তঃস্থ য, জ না: মর্যাদা।" },
      { id: "shadhinota", options: ["স্বাধিনতা", "স্বাধীনতা"], right: 1, where: "ইতিহাসের বই", rule: "‘অধীন’-এ দীর্ঘ ঈ-কার, তাই স্বাধীন, স্বাধীনতা।" },
      { id: "smoroniyo", options: ["স্মরণীয়", "স্মরনীয়"], right: 0, where: "স্মৃতিফলক", rule: "‘স্মরণ’-এ র-এর পরে ণ, তাই স্মরণীয়।" },
      { id: "kritoggota", options: ["কৃতজ্ঞতা", "কৃতঙ্গতা"], right: 0, where: "শ্রদ্ধার ব্যানার", rule: "শুনতে ‘গ্গঁ’-এর মতো, কিন্তু লেখায় জ্ঞ (জ + ঞ)।" },
    ],
  },
] as const satisfies readonly WordSet[];

export type SetId = (typeof wordSets)[number]["id"];
