// What goes on the end-of-round card for each mode: pure data, drawn by draw-card.ts.
import { ICONS, POSES, mouth } from "./art";
import type { CardData } from "./draw-card";
import { QUESTIONS } from "./quiz";
import { BRUSH_ZONES, WASH_STEPS, cardTitle, modeOf, type ModeId } from "./routines";

const POOL = `<circle cx="100" cy="100" r="96" fill="#e3f4f6"/>`;

export const BRUSH_TIP = "মিষ্টি খাওয়ার পর মুখ ধোও";

export function cardData(mode: ModeId, stars: number, bedtime: boolean, bn: (n: number) => string): CardData {
  const base = { label: `হাত ধুই, দাঁত মাজি · ${modeOf(mode).bn}`, title: cardTitle(mode, bn, QUESTIONS.length), stars };
  if (mode === "hat") return { ...base, tiles: WASH_STEPS.map(step => ({ svg: POOL + POSES[step.id].art, box: 200, text: step.bn })), footer: "বেসিনের পাশে ফোন রেখে একসাথে হাত ধুই" };
  if (mode === "dat") return {
    ...base,
    ...(bedtime ? { badge: "রাতে ঘুমানোর আগে মাজলাম", badgeSvg: ICONS.raat } : {}),
    tiles: [...BRUSH_ZONES.map(zone => ({ svg: mouth(zone), box: 200, text: zone.bn })), { svg: ICONS.mishti, box: 64, text: BRUSH_TIP }],
    footer: "সকালে আর রাতে, দুই মিনিট করে দাঁত মাজি",
  };
  return { ...base, tiles: QUESTIONS.map(q => ({ svg: ICONS[q.id], box: 64, text: q.right.bn })), footer: "খাওয়ার আগে, টয়লেটের পরে: সাবানে হাত ধুই" };
}
