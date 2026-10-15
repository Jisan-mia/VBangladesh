// The six packs of নাম শিখি: every item's Bangla and English name and its picture id (lib/art.ts).
// English is standard British spelling, the way a Bangladeshi school book writes it.
import type { View } from "./art";

export type HabitatId = "home" | "sundarban" | "desert" | "ice" | "river" | "forest";
export type Choice = { id: string; bn: string; en: string; art: string };
export type Item = Choice & {
  /** পশুপাখি: where it lives, places it also lives (never shown as a wrong answer), and one line on why. */
  home?: HabitatId; also?: HabitatId[]; fact?: string;
  /** রং: a thing that has this colour. */
  thing?: Choice;
  /** প্রতীক: "জাতীয় ফুল" and so on. */
  role?: string;
  /** শরীর: where the part is on the figure, and in which view. */
  view?: View; spots?: [number, number][];
};
export type Mode = "bn" | "en" | "read" | "home" | "thing" | "role";
export type PackId = "pashu" | "fol" | "sobji" | "shorir" | "rong" | "protik";
export type Pack = {
  id: PackId; bn: string; en: string; icon: string;
  /** "আজ ৬টা ফলের নাম শিখলাম" */
  noun: string;
  levels: Mode[]; items: Item[];
  /** One thing to do away from the screen, on the finished screen. */
  away: string;
};

const c = (id: string, bn: string, en: string, art = id): Choice => ({ id, bn, en, art });

export const HABITATS: (Choice & { id: HabitatId; at: string })[] = [
  { ...c("home", "গ্রামের বাড়ি", "Village home"), id: "home", at: "গ্রামের বাড়িতে" },
  { ...c("sundarban", "সুন্দরবন", "Sundarbans"), id: "sundarban", at: "সুন্দরবনে" },
  { ...c("desert", "মরুভূমি", "Desert"), id: "desert", at: "মরুভূমিতে" },
  { ...c("ice", "বরফের দেশ", "Ice and snow"), id: "ice", at: "বরফের দেশে" },
  { ...c("river", "নদী", "River"), id: "river", at: "নদীতে" },
  { ...c("forest", "পাহাড়ি বন", "Hill forest"), id: "forest", at: "পাহাড়ি বনে" },
];

const PASHU: Item[] = [
  { ...c("cat", "বিড়াল", "Cat"), home: "home", fact: "বিড়াল অন্ধকারেও বেশ ভালো দেখে।" },
  { ...c("dog", "কুকুর", "Dog"), home: "home", fact: "কুকুর গন্ধ শুঁকে মানুষ চেনে।" },
  { ...c("cow", "গরু", "Cow"), home: "home", fact: "গরু ঘাস খায়, আমাদের দুধ দেয়।" },
  { ...c("goat", "ছাগল", "Goat"), home: "home", fact: "কালো ছাগলটা ব্ল্যাক বেঙ্গল, বাংলাদেশের নিজের জাত।" },
  { ...c("duck", "হাঁস", "Duck"), home: "home", also: ["river"], fact: "হাঁসের পায়ের আঙুলে পাতলা চামড়া জোড়া, তাই ভালো সাঁতার কাটে।" },
  { ...c("hen", "মুরগি", "Hen"), home: "home", fact: "মুরগির ডিম থেকে ছানা বের হয় ২১ দিনে।" },
  { ...c("elephant", "হাতি", "Elephant"), home: "forest", fact: "বাংলাদেশে বুনো হাতি থাকে চট্টগ্রামের পাহাড়ি বনে।" },
  { ...c("tiger", "বাঘ", "Tiger"), home: "sundarban", also: ["forest"], fact: "রয়েল বেঙ্গল টাইগার সুন্দরবনে থাকে, নদী সাঁতরে পার হয়।" },
  { ...c("monkey", "বানর", "Monkey"), home: "forest", also: ["sundarban"], fact: "বানর দল বেঁধে থাকে, গাছে গাছে লাফিয়ে চলে।" },
  { ...c("deer", "হরিণ", "Deer"), home: "sundarban", also: ["forest"], fact: "চিত্রা হরিণের গায়ে সাদা ফোঁটা। সুন্দরবনে এদের অনেক দেখা যায়।" },
  { ...c("camel", "উট", "Camel"), home: "desert", fact: "উট অনেক দিন পানি না খেয়ে চলতে পারে।" },
  { ...c("penguin", "পেঙ্গুইন", "Penguin"), home: "ice", fact: "পেঙ্গুইন উড়তে পারে না, তবে খুব ভালো সাঁতার কাটে।" },
  { ...c("dolphin", "শুশুক", "River dolphin"), home: "river", also: ["sundarban"], fact: "শুশুক নদীর ডলফিন। চোখে প্রায় দেখে না, শব্দ দিয়ে পথ চেনে।" },
  c("doyel", "দোয়েল", "Magpie robin"),
];

const FOL: Item[] = [
  c("mango", "আম", "Mango"), c("jackfruit", "কাঁঠাল", "Jackfruit"), c("banana", "কলা", "Banana"),
  c("guava", "পেয়ারা", "Guava"), c("lychee", "লিচু", "Lychee"), c("pineapple", "আনারস", "Pineapple"),
  c("papaya", "পেঁপে", "Papaya"), c("watermelon", "তরমুজ", "Watermelon"), c("coconut", "নারকেল", "Coconut"),
  c("apple", "আপেল", "Apple"),
];

const SOBJI: Item[] = [
  c("potato", "আলু", "Potato"), c("tomato", "টমেটো", "Tomato"), c("brinjal", "বেগুন", "Brinjal"),
  c("carrot", "গাজর", "Carrot"), c("lau", "লাউ", "Bottle gourd"), c("korola", "করলা", "Bitter gourd"),
  c("dheros", "ঢেঁড়স", "Okra"), c("pumpkin", "মিষ্টিকুমড়া", "Pumpkin"), c("cauliflower", "ফুলকপি", "Cauliflower"),
  c("morich", "কাঁচামরিচ", "Green chilli"),
];

const part = (id: string, bn: string, en: string, view: View, ...spots: [number, number][]): Item => ({ ...c(id, bn, en, "body"), view, spots });
const SHORIR: Item[] = [
  part("hair", "চুল", "Hair", "face", [60, 19]),
  part("eye", "চোখ", "Eye", "face", [51, 40], [69, 40]),
  part("ear", "কান", "Ear", "face", [35.5, 42], [84.5, 42]),
  part("nose", "নাক", "Nose", "face", [60, 45.5]),
  part("mouth", "মুখ", "Mouth", "face", [60, 55]),
  part("neck", "গলা", "Neck", "face", [60, 67]),
  part("shoulder", "কাঁধ", "Shoulder", "body", [40, 77], [80, 77]),
  part("hand", "হাত", "Hand", "body", [25.5, 123], [94.5, 123]),
  part("tummy", "পেট", "Tummy", "body", [60, 104]),
  part("knee", "হাঁটু", "Knee", "body", [52, 157], [68, 157]),
  part("foot", "পা", "Foot", "body", [48, 186], [72, 186]),
];

const RONG: Item[] = [
  { ...c("lal", "লাল", "Red"), thing: c("tomato", "টমেটো", "Tomato") },
  { ...c("holud", "হলুদ", "Yellow"), thing: c("banana", "কলা", "Banana") },
  { ...c("sobuj", "সবুজ", "Green"), thing: c("morich", "কাঁচামরিচ", "Green chilli") },
  { ...c("komola", "কমলা", "Orange"), thing: c("carrot", "গাজর", "Carrot") },
  { ...c("beguni", "বেগুনি", "Purple"), thing: c("brinjal", "বেগুন", "Brinjal") },
  { ...c("badami", "বাদামি", "Brown"), thing: c("coconut", "নারকেল", "Coconut") },
  { ...c("kalo", "কালো", "Black"), thing: c("goat", "ছাগল", "Goat") },
  { ...c("sada", "সাদা", "White"), thing: c("duck", "হাঁস", "Duck") },
  c("nil", "নীল", "Blue"),
  c("golapi", "গোলাপি", "Pink"),
];

const PROTIK: Item[] = [
  { ...c("shapla", "শাপলা", "Water lily"), role: "জাতীয় ফুল" },
  { ...c("doyel", "দোয়েল", "Magpie robin"), role: "জাতীয় পাখি" },
  { ...c("ilish", "ইলিশ", "Hilsa"), role: "জাতীয় মাছ" },
  { ...c("jackfruit", "কাঁঠাল", "Jackfruit"), role: "জাতীয় ফল" },
  { ...c("tiger", "বাঘ", "Royal Bengal tiger"), role: "জাতীয় পশু" },
  { ...c("amgach", "আমগাছ", "Mango tree"), role: "জাতীয় গাছ" },
  { ...c("flag", "জাতীয় পতাকা", "National flag"), role: "জাতীয় পতাকা" },
];

export const PACKS: Pack[] = [
  { id: "pashu", bn: "পশুপাখি", en: "Animals and birds", icon: "cat", noun: "পশুপাখির", levels: ["bn", "en", "home", "read"], items: PASHU, away: "এবার আম্মুকে একটা পশুর ডাক শোনাও। আম্মু বলুক কোনটা।" },
  { id: "fol", bn: "ফল", en: "Fruits", icon: "mango", noun: "ফলের", levels: ["bn", "en", "read"], items: FOL, away: "আজ কোন ফলটা খেতে ইচ্ছা করছে? নামটা ইংরেজিতে বলো।" },
  { id: "sobji", bn: "সবজি", en: "Vegetables", icon: "carrot", noun: "সবজির", levels: ["bn", "en", "read"], items: SOBJI, away: "রান্নাঘরে একটা সবজি খুঁজে আনো। নামটা ইংরেজিতে বলো।" },
  { id: "shorir", bn: "শরীর", en: "Body", icon: "body", noun: "শরীরের অঙ্গের", levels: ["bn", "en", "read"], items: SHORIR, away: "আব্বুকে বলো “Touch your nose”। তারপর তুমি বলো, আব্বু করুক।" },
  { id: "rong", bn: "রং", en: "Colours", icon: "lal", noun: "রঙের", levels: ["bn", "en", "thing"], items: RONG, away: "ঘরে একটা লাল জিনিস খুঁজে আম্মুকে দেখাও।" },
  { id: "protik", bn: "দেশের প্রতীক", en: "National symbols", icon: "flag", noun: "জাতীয় প্রতীকের", levels: ["bn", "en", "role"], items: PROTIK, away: "জানালায় দোয়েল খোঁজো: কালো-সাদা পাখি, লেজ উঁচু করে নাচে।" },
];

export const packOf = (id: string | null | undefined) => PACKS.find(pack => pack.id === id) ?? PACKS[0];

/** "#p=fol" → "fol"; anything else → null. */
export function packFromHash(hash: string): PackId | null {
  const id = new URLSearchParams(hash.replace(/^#/, "")).get("p");
  return PACKS.some(pack => pack.id === id) ? (id as PackId) : null;
}

export const LEVEL_TITLE: Record<Mode, string> = {
  bn: "বাংলা নাম", en: "ইংরেজি নাম", read: "ছবি দেখে নাম", home: "কোথায় থাকে", thing: "কোনটা কোন রং", role: "জাতীয় প্রতীক",
};
