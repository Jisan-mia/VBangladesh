// The 18 countries and six trips. Facts checked October 2026 against Britannica, the CIA World Factbook and national tourism
// sites; greetings are the everyday word in the language most people there speak (or one of the official ones), written as it sounds.

export type Kind = "food" | "place" | "animal" | "flag";
export type Item = { name: string; note: string };
export type Country = {
  id: string;
  name: string;
  capital: string;
  continent: string;
  /** Where the pin sits on the map: roughly the middle of the country, so neighbours don't overlap Dhaka. */
  lon: number;
  lat: number;
  /** The word, written in Bangla as it sounds; `means` when it is not plain "hello". */
  hello: { word: string; language: string; means?: string };
  food: Item;
  place: Item;
  animal: Item;
  /** "আমাদের মতোই": one way it is like home. */
  like: string;
  /** Many Bangladeshis live and work here (প্রবাসী). */
  probash: boolean;
  /** What the stamp question asks about. */
  ask: Kind;
  /** The stamp's ink. */
  ink: string;
};

export const DHAKA = { lon: 90.4, lat: 23.8 };

export const COUNTRIES: readonly Country[] = [
  {
    id: "in", name: "ভারত", capital: "নয়াদিল্লি", continent: "এশিয়া", lon: 79, lat: 22,
    hello: { word: "নমস্তে", language: "হিন্দি" },
    food: { name: "দোসা", note: "চাল আর ডালের গোলা দিয়ে বানানো পাতলা, মচমচে রুটি।" },
    place: { name: "তাজমহল", note: "আগ্রার সাদা মার্বেল পাথরের সমাধি, প্রায় ৩৭০ বছরের পুরোনো।" },
    animal: { name: "ময়ূর", note: "ভারতের জাতীয় পাখি। পেখম মেলে দাঁড়ায়।" },
    like: "ভারতের পশ্চিমবঙ্গ আর ত্রিপুরার মানুষও বাংলায় কথা বলে।",
    probash: false, ask: "place", ink: "#c2410c",
  },
  {
    id: "np", name: "নেপাল", capital: "কাঠমান্ডু", continent: "এশিয়া", lon: 84, lat: 28.2,
    hello: { word: "নমস্কার", language: "নেপালি" },
    food: { name: "মোমো", note: "ভেতরে পুর ভরে ভাপে সেদ্ধ করা, অনেকটা পিঠার মতো।" },
    place: { name: "এভারেস্ট", note: "নেপাল আর চীনের সীমানায় পৃথিবীর সবচেয়ে উঁচু চূড়া, ৮,৮৪৯ মিটার।" },
    animal: { name: "লাল পান্ডা", note: "বিড়ালের চেয়ে একটু বড়, লেজে ডোরা। বাঁশপাতা খায়।" },
    like: "নেপালের বরফগলা পানি নদী হয়ে আমাদের পদ্মায় এসে মেশে।",
    probash: false, ask: "animal", ink: "#b91c1c",
  },
  {
    id: "bt", name: "ভুটান", capital: "থিম্পু", continent: "এশিয়া", lon: 90.4, lat: 27.4,
    hello: { word: "কুজুজাংপো লা", language: "জংখা" },
    food: { name: "এমা দাতশি", note: "কাঁচা মরিচ আর পনির দিয়ে রাঁধা ঝাল তরকারি।" },
    place: { name: "টাইগার্স নেস্ট", note: "খাড়া পাহাড়ের গায়ে বৌদ্ধ মঠ, উপত্যকা থেকে প্রায় ৯০০ মিটার ওপরে।" },
    animal: { name: "টাকিন", note: "ভুটানের জাতীয় প্রাণী। দেখতে একটু ছাগল, একটু গরুর মতো।" },
    like: "ভুটানেও রোজ ভাত খায়, তবে লাল চালের।",
    probash: false, ask: "food", ink: "#a16207",
  },
  {
    id: "mm", name: "মিয়ানমার", capital: "নেপিদো", continent: "এশিয়া", lon: 96, lat: 21,
    hello: { word: "মিঙ্গালাবা", language: "বর্মি" },
    food: { name: "মোহিঙ্গা", note: "মাছের ঝোলে চালের নুডলস। সকালের নাশতায় খায়।" },
    place: { name: "শ্বেডাগন প্যাগোডা", note: "ইয়াঙ্গুন শহরের সোনালি বৌদ্ধ প্যাগোডা।" },
    animal: { name: "এশীয় হাতি", note: "মিয়ানমারের বনে থাকে। শুঁড় দিয়ে পানি ছিটিয়ে গোসল করে।" },
    like: "মিয়ানমারও মাছ-ভাতের দেশ, আমাদের মতোই।",
    probash: false, ask: "flag", ink: "#15803d",
  },
  {
    id: "my", name: "মালয়েশিয়া", capital: "কুয়ালালামপুর", continent: "এশিয়া", lon: 102, lat: 4,
    hello: { word: "সেলামাত পাগি", language: "মালয়", means: "শুভ সকাল" },
    food: { name: "নাসি লেমাক", note: "নারকেলের দুধে রাঁধা ভাত, সাথে ডিম আর ঝাল সাম্বাল।" },
    place: { name: "পেট্রোনাস টুইন টাওয়ার", note: "কুয়ালালামপুরের জোড়া টাওয়ার, প্রতিটা ৮৮ তলা।" },
    animal: { name: "ওরাংওটাং", note: "কমলা লোমের বনমানুষ। বোর্নিও দ্বীপের বনে গাছে গাছে থাকে।" },
    like: "মালয়েশিয়াতেও রোজ ভাত খায়, আর বর্ষায় খুব বৃষ্টি হয়।",
    probash: true, ask: "animal", ink: "#1d4ed8",
  },
  {
    id: "sg", name: "সিঙ্গাপুর", capital: "সিঙ্গাপুর", continent: "এশিয়া", lon: 103.8, lat: 1.35,
    hello: { word: "ভণক্কম", language: "তামিল" },
    food: { name: "চিকেন রাইস", note: "মুরগির ঝোলে রাঁধা ভাত, ওপরে সেদ্ধ মুরগি।" },
    place: { name: "মারলায়ন", note: "মাথা সিংহের, শরীর মাছের। মুখ দিয়ে পানি ছাড়ে।" },
    animal: { name: "ভোঁদড়", note: "শহরের নদী আর খালে দল বেঁধে সাঁতার কাটে।" },
    like: "আমাদের নড়াইলেও ভোঁদড় আছে, জেলেরা ওদের দিয়ে মাছ ধরেন।",
    probash: true, ask: "food", ink: "#be123c",
  },
  {
    id: "cn", name: "চীন", capital: "বেইজিং", continent: "এশিয়া", lon: 104, lat: 35,
    hello: { word: "নি হাও", language: "চীনা (ম্যান্ডারিন)" },
    food: { name: "জিয়াওজি", note: "পুর ভরা ডাম্পলিং। নতুন বছরের উৎসবে বেশি খায়।" },
    place: { name: "চীনের মহাপ্রাচীর", note: "পাহাড়ের ওপর দিয়ে হাজার হাজার কিলোমিটার লম্বা দেয়াল।" },
    animal: { name: "পান্ডা", note: "সাদা-কালো ভালুক। দিনের বেশির ভাগ সময় বাঁশ খায়।" },
    like: "চীনেও ধান চাষ হয়, অনেকে রোজ ভাত খায়।",
    probash: false, ask: "place", ink: "#b91c1c",
  },
  {
    id: "jp", name: "জাপান", capital: "টোকিও", continent: "এশিয়া", lon: 138.5, lat: 36.5,
    hello: { word: "কোনিচিওয়া", language: "জাপানি" },
    food: { name: "সুশি", note: "ভিনেগার মাখা ভাতের ওপর মাছ।" },
    place: { name: "ফুজি পাহাড়", note: "জাপানের সবচেয়ে উঁচু পাহাড়, ৩,৭৭৬ মিটার। চূড়ায় বরফ।" },
    animal: { name: "জাপানি বানর", note: "শীতে গরম পানির ঝরনায় বসে থাকে।" },
    like: "জাপানেও ভাত খায়, সাথে মাছ।",
    probash: false, ask: "flag", ink: "#be123c",
  },
  {
    id: "au", name: "অস্ট্রেলিয়া", capital: "ক্যানবেরা", continent: "ওশেনিয়া", lon: 134, lat: -25,
    hello: { word: "গ’ডে", language: "অস্ট্রেলিয়ার ইংরেজি" },
    food: { name: "লামিংটন", note: "চকলেটে ডোবানো, নারকেল কুচি মাখা ছোট কেক।" },
    place: { name: "সিডনি অপেরা হাউস", note: "সাগরের পাড়ে, ছাদটা পালতোলা নৌকার মতো।" },
    animal: { name: "ক্যাঙারু", note: "লাফিয়ে চলে। মা ক্যাঙারু পেটের থলেতে বাচ্চা রাখে।" },
    like: "অস্ট্রেলিয়ার ছোটরাও মাঠে ক্রিকেট খেলে, আমাদের মতোই।",
    probash: false, ask: "animal", ink: "#c2410c",
  },
  {
    id: "sa", name: "সৌদি আরব", capital: "রিয়াদ", continent: "এশিয়া", lon: 45, lat: 24,
    hello: { word: "মারহাবা", language: "আরবি" },
    food: { name: "কাবসা", note: "মসলা দেওয়া ভাতের সাথে মাংস, অনেকটা বিরিয়ানির মতো।" },
    place: { name: "রুব আল খালি", note: "পৃথিবীর সবচেয়ে বড় টানা বালুর মরুভূমি।" },
    animal: { name: "উট", note: "এক কুঁজের উট। মরুভূমিতে অনেক দিন পানি ছাড়া চলে।" },
    like: "দেখা হলে সৌদি আরবেও বলে আসসালামু আলাইকুম।",
    probash: true, ask: "food", ink: "#15803d",
  },
  {
    id: "ae", name: "সংযুক্ত আরব আমিরাত", capital: "আবুধাবি", continent: "এশিয়া", lon: 54.3, lat: 24,
    hello: { word: "আহলান", language: "আরবি" },
    food: { name: "লুকাইমাত", note: "তেলে ভাজা ছোট গোল মিষ্টি, খেজুরের রসে ডোবানো।" },
    place: { name: "বুর্জ খলিফা", note: "দুবাইয়ের ৮২৮ মিটার উঁচু ভবন, এখন পৃথিবীর সবচেয়ে উঁচু।" },
    animal: { name: "আরবি অরিক্স", note: "লম্বা সোজা শিংয়ের সাদা হরিণের মতো প্রাণী।" },
    like: "আমাদের পিঠার মতো লুকাইমাতও তেলে ভেজে রসে ডোবায়।",
    probash: true, ask: "place", ink: "#7c2d12",
  },
  {
    id: "eg", name: "মিসর", capital: "কায়রো", continent: "আফ্রিকা", lon: 30, lat: 26.5,
    hello: { word: "সাবাহ এল খেইর", language: "আরবি", means: "শুভ সকাল" },
    food: { name: "কোশারি", note: "ভাত, মসুর ডাল আর পাস্তা, ওপরে টমেটো সস।" },
    place: { name: "গিজার পিরামিড", note: "প্রায় সাড়ে চার হাজার বছর আগে পাথর দিয়ে বানানো।" },
    animal: { name: "ফেনেক শিয়াল", note: "মরুভূমির ছোট শিয়াল। বড় কান দিয়ে শরীরের গরম বের করে দেয়।" },
    like: "কোশারি অনেকটা আমাদের খিচুড়ির মতো, ভাত আর ডাল একসাথে।",
    probash: false, ask: "animal", ink: "#a16207",
  },
  {
    id: "ke", name: "কেনিয়া", capital: "নাইরোবি", continent: "আফ্রিকা", lon: 38, lat: 0.5,
    hello: { word: "জাম্বো", language: "সোয়াহিলি" },
    food: { name: "উগালি", note: "ভুট্টার আটা জ্বাল দিয়ে বানানো নরম মণ্ড, শাকের সাথে খায়।" },
    place: { name: "মাসাই মারা", note: "বিশাল তৃণভূমি। লাখো ওয়াইল্ডবিস্ট এখানে নদী পার হয়।" },
    animal: { name: "জিরাফ", note: "পৃথিবীর সবচেয়ে লম্বা প্রাণী। উঁচু গাছের পাতা খায়।" },
    like: "কেনিয়ায় উগালি হাত দিয়ে মেখে খায়, আমরা যেমন ভাত খাই।",
    probash: false, ask: "animal", ink: "#15803d",
  },
  {
    id: "it", name: "ইতালি", capital: "রোম", continent: "ইউরোপ", lon: 12.5, lat: 42.8,
    hello: { word: "চাও", language: "ইতালীয়" },
    food: { name: "পিৎজা", note: "রুটির ওপর টমেটো আর পনির দিয়ে চুলায় সেঁকা। শুরু নাপোলি শহরে।" },
    place: { name: "পিসার হেলানো মিনার", note: "একদিকে হেলে আছে, তবু ৬০০ বছরের বেশি দাঁড়িয়ে।" },
    animal: { name: "ইতালীয় নেকড়ে", note: "পাহাড়ি বনে দল বেঁধে থাকে।" },
    like: "ইতালিতেও ধান হয়। ইউরোপে সবচেয়ে বেশি চাল ফলে ওখানেই।",
    probash: true, ask: "flag", ink: "#15803d",
  },
  {
    id: "gb", name: "যুক্তরাজ্য", capital: "লন্ডন", continent: "ইউরোপ", lon: -1.5, lat: 53,
    hello: { word: "হ্যালো", language: "ইংরেজি" },
    food: { name: "ফিশ অ্যান্ড চিপস", note: "ময়দার গোলায় ভাজা মাছ, সাথে মোটা আলু ভাজা।" },
    place: { name: "বিগ বেন", note: "লন্ডনের ঘড়িঘর। বিগ বেন আসলে এর ভেতরের বড় ঘণ্টাটার নাম।" },
    animal: { name: "কাঁটাচুয়া", note: "গায়ে কাঁটা। ভয় পেলে বলের মতো গুটিয়ে যায়।" },
    like: "লন্ডনের কিছু রাস্তার নাম বাংলাতেও লেখা।",
    probash: true, ask: "place", ink: "#1d4ed8",
  },
  {
    id: "ca", name: "কানাডা", capital: "অটোয়া", continent: "উত্তর আমেরিকা", lon: -100, lat: 57,
    hello: { word: "বোঁজুর", language: "ফরাসি" },
    food: { name: "ম্যাপল সিরাপ", note: "ম্যাপল গাছের মিষ্টি রস, প্যানকেকের ওপর ঢেলে খায়।" },
    place: { name: "নায়াগ্রা জলপ্রপাত", note: "কানাডা আর আমেরিকার সীমানায় বিশাল জলপ্রপাত।" },
    animal: { name: "বিভার", note: "ধারালো দাঁতে গাছ কেটে নদীতে বাঁধ বানায়।" },
    like: "ম্যাপল সিরাপ বানায় গাছের রস জ্বাল দিয়ে, আমাদের খেজুরের গুড়ের মতোই।",
    probash: false, ask: "animal", ink: "#b91c1c",
  },
  {
    id: "us", name: "যুক্তরাষ্ট্র", capital: "ওয়াশিংটন ডিসি", continent: "উত্তর আমেরিকা", lon: -98, lat: 39,
    hello: { word: "হাই", language: "ইংরেজি" },
    food: { name: "বার্গার", note: "দুই টুকরা গোল রুটির মাঝে মাংসের চাপ আর সালাদ।" },
    place: { name: "গোল্ডেন গেট ব্রিজ", note: "সান ফ্রান্সিসকোর কমলা-লাল ঝুলন্ত সেতু।" },
    animal: { name: "বাইসন", note: "কাঁধে কুঁজ, গায়ে ঘন লোম। দেশের জাতীয় স্তন্যপায়ী প্রাণী।" },
    like: "নিউইয়র্কের জ্যাকসন হাইটসে বাংলা সাইনবোর্ড আর মিষ্টির দোকান আছে।",
    probash: true, ask: "flag", ink: "#1d4ed8",
  },
  {
    id: "br", name: "ব্রাজিল", capital: "ব্রাসিলিয়া", continent: "দক্ষিণ আমেরিকা", lon: -52, lat: -10,
    hello: { word: "ওলা", language: "পর্তুগিজ" },
    food: { name: "পাও দে কেইজো", note: "পনির দিয়ে বানানো ছোট, গোল, নরম রুটি।" },
    place: { name: "আমাজন বন", note: "পৃথিবীর সবচেয়ে বড় বৃষ্টিবন, মাঝ দিয়ে আমাজন নদী।" },
    animal: { name: "টুকান", note: "বিশাল রঙিন ঠোঁট, কিন্তু ঠোঁটটা খুব হালকা।" },
    like: "ব্রাজিলেও রোজকার খাবার ভাত আর ডাল, তবে শিমের ডাল।",
    probash: false, ask: "place", ink: "#15803d",
  },
];

export const countryOf = (id: string) => COUNTRIES.find(country => country.id === id);

/** Six trips of three, from next door to across the ocean. Each is a level. */
export const TRIPS: readonly { title: string; ids: readonly string[] }[] = [
  { title: "পাশের দেশে", ids: ["in", "np", "bt"] },
  { title: "পুবের পথে", ids: ["mm", "my", "sg"] },
  { title: "আরও পুবে", ids: ["cn", "jp", "au"] },
  { title: "মরুভূমির দেশে", ids: ["sa", "ae", "eg"] },
  { title: "আফ্রিকা থেকে ইউরোপ", ids: ["ke", "it", "gb"] },
  { title: "সাগর পেরিয়ে আমেরিকা", ids: ["ca", "us", "br"] },
];
