export const motifs = [
  { id: "flower", label: "ফুল" },
  { id: "leaf", label: "পাতা" },
  { id: "geometry", label: "জ্যামিতিক" },
] as const;
export const palettes = [
  { id: "clay", label: "মাটির রঙে সাদা", background: "#9c422f", ink: "#fff5d8", detail: "#efbd73" },
  { id: "indigo", label: "নীলের ওপর সাদা", background: "#243f59", ink: "#fff6df", detail: "#dfb56c" },
  { id: "green", label: "সবুজে হালকা হলুদ", background: "#324f40", ink: "#f8f1c9", detail: "#d2b570" },
  { id: "paper", label: "সাদা কাগজে লাল", background: "#fffaf0", ink: "#9b3d2c", detail: "#9b742f" },
] as const;
export const symmetries = [6, 8, 12] as const;
export const densities = [
  { id: "light", label: "হালকা" },
  { id: "full", label: "ভরা" },
  { id: "rich", label: "আরও ভরা" },
] as const;
export const layouts = [
  { id: "round", label: "গোল আলপনা" },
  { id: "border", label: "পাড়সহ নকশা" },
] as const;

export type Motif = (typeof motifs)[number]["id"];
export type PatternSettings = {
  motif: Motif;
  palette: (typeof palettes)[number]["id"];
  symmetry: (typeof symmetries)[number];
  density: (typeof densities)[number]["id"];
  layout: (typeof layouts)[number]["id"];
};
export const defaultSettings: PatternSettings = { motif: "flower", palette: "clay", symmetry: 8, density: "full", layout: "round" };
export const printLayout = { pageWidthMm: 210, pageHeightMm: 297, marginMm: 12, artworkMm: 180, calibrationMm: 50 } as const;
export const motifExtent = 68;

export function roundSvgValue(value: number) {
  return Number(value.toFixed(3)) || 0;
}

export function radialPositions(count: number, radius: number, phase = 0) {
  if (!Number.isInteger(count) || count < 1 || count > 144 || !Number.isFinite(radius) || radius < 0 || !Number.isFinite(phase)) {
    throw new RangeError("নকশার সাজটা মিলছে না।");
  }
  return Array.from({ length: count }, (_, index) => {
    const angle = phase + index * 360 / count;
    const radians = angle * Math.PI / 180;
    return { x: roundSvgValue(Math.cos(radians) * radius), y: roundSvgValue(Math.sin(radians) * radius), rotation: roundSvgValue(angle + 90) };
  });
}

export function patternRings(settings: Pick<PatternSettings, "symmetry" | "density">) {
  if (!symmetries.includes(settings.symmetry) || !densities.some(item => item.id === settings.density)) {
    throw new RangeError("নকশার ভাগ আর ঘনত্ব লিস্ট থেকে বেছে নাও।");
  }
  const count = settings.symmetry;
  if (settings.density === "light") return [{ radius: 187, size: 67, count, phase: -90 }];
  if (settings.density === "full") return [
    { radius: 123, size: 40, count, phase: -90 },
    { radius: 220, size: 54, count: count * 2, phase: -90 + 90 / count },
  ];
  return [
    { radius: 119, size: 34, count: count * 2, phase: -90 },
    { radius: 196, size: 45, count: count * 2, phase: -90 + 90 / count },
    { radius: 278, size: 31, count: count * 4, phase: -90 },
  ];
}

export function borderPositions(symmetry: PatternSettings["symmetry"]) {
  if (!symmetries.includes(symmetry)) throw new RangeError("নকশার ভাগ লিস্ট থেকে বেছে নাও।");
  const perSide = symmetry / 2;
  return Array.from({ length: perSide * 4 }, (_, index) => {
    const side = Math.floor(index / perSide);
    const along = 110 + (index % perSide + 0.5) * 580 / perSide;
    if (side === 0) return { x: roundSvgValue(along), y: 62, rotation: 180 };
    if (side === 1) return { x: 738, y: roundSvgValue(along), rotation: 270 };
    if (side === 2) return { x: roundSvgValue(800 - along), y: 738, rotation: 0 };
    return { x: 62, y: roundSvgValue(800 - along), rotation: 90 };
  });
}

export function describePattern(settings: PatternSettings) {
  const motif = motifs.find(item => item.id === settings.motif)!.label;
  const layout = layouts.find(item => item.id === settings.layout)!.label;
  const palette = palettes.find(item => item.id === settings.palette)!.label;
  const density = densities.find(item => item.id === settings.density)!.label;
  return motif + " · " + layout + " · " + new Intl.NumberFormat("bn-BD").format(settings.symmetry) + " ভাগ · " + density + " · " + palette;
}
