// The few lines of Bangla around the game, for the parent: what the child can do now, a task off the screen, the card title.
// The child never has to read any of it. Bangladeshi চলিত, তুমি voice, short.
import { levelOf, type WorldId } from "./levels";

const NEWS: Record<number, string> = {
  1: "একটা ছায়া দেখে ঠিক ছবিটা বেছে নিলে।",
  2: "তিনটার মধ্যে থেকে ঠিকটা খুঁজে নিলে।",
  3: "চারটার মধ্যেও ঠিক ছবিটা চিনলে।",
  6: "দুই ছায়া একসাথে, কোনটা কোথায় বসবে ঠিক করলে।",
  7: "তিন ছায়ার তিন ছবি আলাদা করে মেলালে।",
  8: "বাড়তি ছবির ভিড়েও ঠিকগুলো বেছে নিলে।",
  4: "একই দলের ছবিগুলো আকার দেখে আলাদা করলে।",
  9: "পশুপাখির আকার দেখে মেলালে।",
  10: "একটু কাত হওয়া ছায়াও চিনলে।",
  5: "উল্টো আর ঘোরানো ছায়াও চিনে নিলে।",
  11: "দুটো ঘোরানো ছায়া একসাথে মেলালে।",
};
export const newsOf = (level: number) => NEWS[levelOf(level).id] ?? NEWS[1];

const TASKS: Record<WorldId, string> = {
  0: "এবার আম্মুর সাথে টর্চ জ্বেলে দেয়ালে একটা জিনিসের ছায়া ফেলো।",
  1: "দুইটা জিনিস পাশাপাশি ধরো, টর্চ জ্বালো। দুই ছায়া আলাদা করে দেখো।",
  2: "দুইটা জন্তুর খেলনা নাও। ছায়ায় কান, লেজ আর পায়ের তফাত খোঁজো।",
  3: "একটা খেলনা ঘুরিয়ে টর্চের সামনে ধরো। ছায়াটা কেমন বদলায়?",
};
export const taskOf = (level: number) => TASKS[levelOf(level).world];

export const doneLine = (count: number, bn: (n: number) => string) => `${bn(count)}টা ছায়া মেলালে।`;
export const cardTitle = (count: number, bn: (n: number) => string) => `আজ ${bn(count)}টা ছায়া মেলালাম`;
export const methodLine = "প্রথমবারেই সবগুলো। ভালো করে দেখে মিলিয়েছ।";

/** The fixed result behind `#og`, for the site's preview image only: it saves nothing and skips the daily limit. */
export const OG_DEMO = { level: 3, stars: 3, ids: ["hati", "riksha", "chhata", "has", "nouka", "jirafa"] };
export const isOgHash = (hash: string) => hash === "#og";
