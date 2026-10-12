// Twenty fields in four scenes (সকাল → পুকুরপাড় → বাতাসের বিকাল → সন্ধ্যা). Each level adds one small thing:
// a longer, more winding আল, a narrower ridge, then puddles (from 4), goats (from 7) and wind (from 11).

export type Scene = "morning" | "noon" | "afternoon" | "evening";

export const LEVEL_COUNT = 20;
export const SCENES: readonly Scene[] = ["morning", "noon", "afternoon", "evening"];
export const SCENE_NAME: Record<Scene, string> = {
  morning: "সকালের সবুজ খেত",
  noon: "পুকুরপাড়ের খেত",
  afternoon: "বাতাসের বিকাল",
  evening: "সন্ধ্যার পাকা ধান",
};

export type LevelSpec = {
  level: number;
  scene: Scene;
  /** Field length in metres. */
  metres: number;
  /** Walking speed, board px per second. */
  speed: number;
  /** Half the ridge's width in board px: the feet slip once their centre is further than this from the middle. */
  half: number;
  /** The steepest the ridge may turn (sideways px per px walked) before the start ramp. */
  bend: number;
  puddles: number;
  goats: number;
  /** Strongest sideways push of the wind, board px per second. */
  wind: number;
};

export const isLevel = (level: number) => Number.isInteger(level) && level >= 1 && level <= LEVEL_COUNT;
export const clampLevel = (level: number) => Math.min(LEVEL_COUNT, Math.max(1, Math.round(level) || 1));
export const sceneOf = (level: number): Scene => SCENES[Math.floor((clampLevel(level) - 1) / 5)];

export function levelSpec(level: number): LevelSpec {
  const n = clampLevel(level), p = (n - 1) / (LEVEL_COUNT - 1);
  return {
    level: n,
    scene: sceneOf(n),
    metres: 30 + 5 * (n - 1),
    speed: Math.round(62 + 22 * p),
    half: Math.round(30 - 11 * p),
    bend: Math.round((0.14 + 0.36 * p ** 0.7) * 100) / 100,
    puddles: n < 4 ? 0 : Math.min(5, 1 + Math.floor((n - 4) / 3)),
    goats: n < 7 ? 0 : Math.min(3, 1 + Math.floor((n - 7) / 4)),
    wind: n < 11 ? 0 : 10 + (n - 11),
  };
}

/** What's new on this field, for the ready screen. */
export function newThing(level: number) {
  const n = clampLevel(level);
  if (n === 1) return "আঙুল চেপে ডানে-বাঁয়ে টানো, পা থাকুক আলের মাঝখানে।";
  if (n === 4) return "আলে পানি জমেছে। পানির পাশ দিয়ে শুকনো দিকে হাঁটো।";
  if (n === 7) return "আলের ওপর ছাগল চরছে। পাশ কাটিয়ে যাও।";
  if (n === 11) return "বাতাস ঠেলবে। দাগগুলো যেদিকে যায়, তার উল্টো দিকে টানো।";
  const spec = levelSpec(n);
  if (spec.wind) return "বাতাস ঠেলে। দাগ যেদিকে যায়, উল্টো দিকে টানো।";
  if (spec.goats) return "পানি আর ছাগলের পাশ কাটিয়ে আল ধরে হাঁটো।";
  if (spec.puddles) return "পানির পাশ দিয়ে শুকনো দিকে হাঁটো।";
  return "আঁকাবাঁকা আল। পা থাকুক মাঝখানে।";
}
