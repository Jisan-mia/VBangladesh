import { amountText, convert, isUnitId, parseAmount, pitchText, unitById, units, type UnitId } from "./units";

export const labels = [
  { id: "vita", label: "ভিটা" },
  { id: "khet", label: "ধানক্ষেত" },
  { id: "pukur", label: "পুকুর" },
] as const;
export type LabelId = (typeof labels)[number]["id"];
const isLabelId = (id: string): id is LabelId => labels.some(label => label.id === id);
export const labelText = (id: LabelId | "") => labels.find(label => label.id === id)?.label ?? "";

export type Plot = { value: number; unit: UnitId; label: LabelId | "" };
export const sample: Plot = { value: 1, unit: "bigha", label: "" };

export function plotHash({ value, unit, label }: Plot) {
  return `v=${value}&u=${unit}${label ? `&l=${label}` : ""}`;
}

export function parsePlot(hash: string): Plot | null {
  let params: URLSearchParams;
  try { params = new URLSearchParams(hash.replace(/^#/, "")); } catch { return null; }
  const unit = params.get("u") ?? "";
  // Links are written with ASCII digits only; anything else is someone editing by hand.
  const raw = params.get("v") ?? "";
  const value = /^\d{1,7}(\.\d{1,4})?$/.test(raw) ? parseAmount(raw) : null;
  if (value === null || !isUnitId(unit)) return null;
  const label = params.get("l") ?? "";
  return { value, unit, label: isLabelId(label) ? label : "" };
}

export const sqftOf = ({ value, unit }: Plot) => convert(value, unit, "sqft");
/** "৩ কাঠা", the size as typed. */
export const sizeText = ({ value, unit }: Plot) => `${amountText(value)} ${unitById(unit).label}`;
export const titleText = (plot: Plot) => `${sizeText(plot)}${plot.label ? ` ${labelText(plot.label)}` : ""}`;

/** Every other unit, in display order. */
export const conversions = (plot: Plot) => units.filter(unit => unit.id !== plot.unit).map(unit => ({ id: unit.id, label: unit.label, value: convert(plot.value, plot.unit, unit.id), text: amountText(convert(plot.value, plot.unit, unit.id)) }));

/** "১ বিঘা = ৩৩.০৬ শতাংশ = ২০ কাঠা = ১৪,৪০০ বর্গফুট": the three conversions people ask about most, skipping the one typed. */
export function equation(plot: Plot) {
  const keys: UnitId[] = ["shotangsho", "katha", "sqft", "bigha", "acre"];
  const parts = keys.filter(id => id !== plot.unit).slice(0, 3).map(id => `${amountText(convert(plot.value, plot.unit, id))} ${unitById(id).label}`);
  return [sizeText(plot), ...parts].join(" = ");
}

export const pitchLine = (plot: Plot) => pitchText(sqftOf(plot));

/** One warm line chosen from the size and what the land is. */
export function plotLine(plot: Plot) {
  const sqft = sqftOf(plot);
  const pitch = pitchText(sqft);
  if (plot.label === "vita") return sqft < 14400 ? "ভিটেমাটি মাপে ছোট হতে পারে, টানে সবচেয়ে বড়।" : "বড় ভিটা। উঠোনে পুরো পাড়ার দাওয়াত এঁটে যাবে।";
  if (plot.label === "pukur") return sqft < 3600 ? "ছোট্ট পুকুর, তবু লাফ দিয়ে গোসলের মজা একই।" : "বড় পুকুর। জাল ফেললে পাড়াসুদ্ধ লোক পাড়ে এসে দাঁড়াবে।";
  if (plot.label === "khet" && sqft >= 720 && sqft < 43560) return "ধান পাকলে পুরোটা সোনালি, আল ধরে হাঁটলেই ধানের গন্ধ।";
  if (sqft < 720) return "এক কাঠারও কম, তবু নিজের মাটি তো নিজেরই।";
  if (sqft < 3600) return "শহরে এই মাপের জমি পাওয়া সহজ না।";
  if (sqft < 14400) return "উঠোন, দুটো আমগাছ আর একটা টিনের ঘর, সব এঁটে যাবে।";
  if (sqft < 43560) return "আল ধরে এক চক্কর দিলেই বিকেলের হাঁটা হয়ে যাবে।";
  if (!pitch.includes("গুণ")) return "এত বড় জমি, এ মাথা থেকে ডাক দিলে ও মাথায় শোনা যাবে না।";
  return "পুরো একটা ফুটবল মাঠের চেয়েও বড়। খেলা হবে, নাকি চাষ?";
}

export const previewTitle = (plot: Plot) => `${plot.label ? `${labelText(plot.label)}: ` : ""}${equation(plot)}`;
