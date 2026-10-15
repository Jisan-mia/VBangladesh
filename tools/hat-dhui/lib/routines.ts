// The routines and modes, with no React: WHO's handwashing steps over 20 seconds, 2 minutes of brushing zone by zone,
// where a timer is at any moment, the bedtime check and the card titles.

export type Pose = "palms" | "backs" | "between" | "thumbs" | "nails" | "wrists";
export type Step = { id: Pose; bn: string; seconds: number };
export type Row = "up" | "low" | "tongue";
export type Face = "out" | "in" | "top" | "tongue";
export type Zone = { id: string; bn: string; row: Row; face: Face; seconds: number };
export type ModeId = "hat" | "dat" | "kokhon";

/** WHO's rubbing steps (palms, backs, between the fingers, thumbs, fingertips and nails, wrists): 20 seconds in all. */
export const WASH_STEPS: readonly Step[] = [
  { id: "palms", bn: "তালুতে তালু ঘষো", seconds: 4 },
  { id: "backs", bn: "হাতের পিঠ ঘষো", seconds: 3 },
  { id: "between", bn: "আঙুলের ফাঁকে ফাঁকে", seconds: 4 },
  { id: "thumbs", bn: "বুড়ো আঙুল ঘোরাও", seconds: 3 },
  { id: "nails", bn: "নখ ঘষো তালুতে", seconds: 3 },
  { id: "wrists", bn: "কবজি ঘোরাও", seconds: 3 },
];

/** Two minutes: upper and lower, outside, inside and chewing surfaces, then the tongue. */
export const BRUSH_ZONES: readonly Zone[] = [
  { id: "up-out", bn: "ওপরের দাঁত, বাইরের দিক", row: "up", face: "out", seconds: 18 },
  { id: "up-in", bn: "ওপরের দাঁত, ভেতরের দিক", row: "up", face: "in", seconds: 18 },
  { id: "up-top", bn: "ওপরের দাঁত, চিবানোর দিক", row: "up", face: "top", seconds: 18 },
  { id: "low-out", bn: "নিচের দাঁত, বাইরের দিক", row: "low", face: "out", seconds: 18 },
  { id: "low-in", bn: "নিচের দাঁত, ভেতরের দিক", row: "low", face: "in", seconds: 18 },
  { id: "low-top", bn: "নিচের দাঁত, চিবানোর দিক", row: "low", face: "top", seconds: 18 },
  { id: "tongue", bn: "জিভটাও আলতো করে", row: "tongue", face: "tongue", seconds: 12 },
];

/** Germs per step or zone: two sit on the part being washed, and leave when it's done. */
export const GERMS_EACH = 2;

export const MODES: readonly { id: ModeId; bn: string; level: number }[] = [
  { id: "hat", bn: "হাত ধোয়া", level: 1 },
  { id: "dat", bn: "দাঁত মাজা", level: 2 },
  { id: "kokhon", bn: "কখন ধোব", level: 3 },
];

export const modeOf = (id: string | null | undefined) => MODES.find(mode => mode.id === id) ?? MODES[0];
export const modeFromHash = (hash: string): ModeId | null => { const id = new URLSearchParams(hash.replace(/^#/, "")).get("m"); return MODES.some(mode => mode.id === id) ? id as ModeId : null; };

export const totalSeconds = (steps: readonly { seconds: number }[]) => steps.reduce((sum, step) => sum + step.seconds, 0);

/** Which step is running `t` seconds in, how far through it, and whether the routine is over. */
export function stepAt(steps: readonly { seconds: number }[], t: number) {
  let start = 0;
  for (let index = 0; index < steps.length; index++) {
    const length = steps[index].seconds;
    if (t < start + length) return { index, fraction: Math.max(0, (t - start) / length), done: false };
    start += length;
  }
  return { index: steps.length - 1, fraction: 1, done: true };
}

/** The ring: 0 at the start, 1 when the routine is over. */
export const progressAt = (steps: readonly { seconds: number }[], t: number) => Math.max(0, Math.min(1, t / totalSeconds(steps)));

/** Evening in Bangladesh (6 pm to 4 am): a finished brush then earns the bedtime star. Shown once, never counted as a streak. */
export function isBedtime(date: Date) {
  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Dhaka" }).format(date));
  return hour >= 18 || hour < 4;
}

/** What the card says was done today, with no name. */
export function cardTitle(mode: ModeId, bn: (n: number) => string, moments = 6) {
  if (mode === "hat") return `আজ ${bn(totalSeconds(WASH_STEPS))} সেকেন্ড ধরে ${bn(WASH_STEPS.length)} ধাপে হাত ধুলাম`;
  if (mode === "dat") return `আজ ${bn(totalSeconds(BRUSH_ZONES) / 60)} মিনিট ধরে দাঁত মাজলাম`;
  return `আজ হাত ধোয়ার ${bn(moments)}টা সময় চিনলাম`;
}
