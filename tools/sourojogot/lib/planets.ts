// The eight planets and the "সূর্য যদি একটা ফুটবল হয়" scale. Pure data and math, no React.
// Sizes, distances and facts: science.nasa.gov planet fact pages (checked October 2026).

export type PlanetId = "mercury" | "venus" | "earth" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune";

export type Planet = {
  id: PlanetId;
  name: string;
  /** Equatorial diameter, km. Mercury, Mars and Jupiter: twice the radius NASA lists. */
  diameterKm: number;
  /** Average distance from the Sun, millions of km. */
  distanceMkm: number;
  /** One fact per stop on the trip, said to a child. */
  fact: string;
  /** The planet drawn in the game and on the card (not to scale). */
  color: string;
  shade: string;
  drawR: number;
};

export const PLANETS: readonly Planet[] = [
  { id: "mercury", name: "বুধ", diameterKm: 4_880, distanceMkm: 58, fact: "সবচেয়ে ছোট গ্রহ, আর সূর্যের সবচেয়ে কাছে। ৮৮ দিনেই সূর্যকে একবার ঘুরে আসে।", color: "#a8a49c", shade: "#6f6b64", drawR: 15 },
  { id: "venus", name: "শুক্র", diameterKm: 12_104, distanceMkm: 108, fact: "সবচেয়ে গরম গ্রহ, প্রায় ৪৬৭ ডিগ্রি সেলসিয়াস। আর ঘোরে উল্টো দিকে।", color: "#e9c27a", shade: "#b98a3e", drawR: 21 },
  { id: "earth", name: "পৃথিবী", diameterKm: 12_756, distanceMkm: 150, fact: "আমাদের বাড়ি। এখন পর্যন্ত জানা একমাত্র গ্রহ, যেখানে প্রাণ আছে আর নদী-সাগরে পানি।", color: "#3b82d6", shade: "#1f5aa5", drawR: 22 },
  { id: "mars", name: "মঙ্গল", diameterKm: 6_780, distanceMkm: 228, fact: "লাল গ্রহ। পাথর আর ধুলার লোহায় মরিচা ধরেছে, তাই লাল দেখায়।", color: "#cf5b3f", shade: "#93371f", drawR: 18 },
  { id: "jupiter", name: "বৃহস্পতি", diameterKm: 139_822, distanceMkm: 778, fact: "সবচেয়ে বড় গ্রহ। এর ভেতরে প্রায় ১০০০টা পৃথিবী ধরে যায়।", color: "#d9a066", shade: "#a8673a", drawR: 38 },
  { id: "saturn", name: "শনি", diameterKm: 120_500, distanceMkm: 1_400, fact: "চারপাশে বড় বলয়। বলয়টা অসংখ্য বরফ আর পাথরের টুকরো দিয়ে তৈরি।", color: "#e6cc8a", shade: "#b39550", drawR: 28 },
  { id: "uranus", name: "ইউরেনাস", diameterKm: 51_118, distanceMkm: 2_900, fact: "কাত হয়ে, প্রায় শুয়ে শুয়ে ঘোরে।", color: "#92d6e3", shade: "#4fa2b5", drawR: 25 },
  { id: "neptune", name: "নেপচুন", diameterKm: 49_528, distanceMkm: 4_500, fact: "সূর্য থেকে সবচেয়ে দূরে। এখানে বাতাস বয় সবচেয়ে জোরে। সূর্যকে একবার ঘুরতে লাগে ১৬৫ বছর।", color: "#4170d8", shade: "#23449a", drawR: 25 },
];

export const planetOf = (id: PlanetId) => PLANETS.find(planet => planet.id === id)!;
export const orderOf = (id: PlanetId) => PLANETS.findIndex(planet => planet.id === id);

/** The Sun's diameter, km (NASA: radius about 696,000 km; IAU nominal 695,700). */
export const SUN_KM = 1_391_400;
/** A size-5 football is 68–70 cm round, so about 22 cm across. */
export const FOOTBALL_CM = 22;
/** A school field, end to end, in metres: the yardstick a child knows. */
export const FIELD_M = 100;

/** How big and how far each planet would be if the Sun were a football. */
export function footballScale(planet: Planet) {
  const metresPerKm = FOOTBALL_CM / 100 / SUN_KM;
  return { sizeMm: planet.diameterKm * metresPerKm * 1000, distanceM: planet.distanceMkm * 1e6 * metresPerKm };
}

/** Things a child has held, to guess a planet's size against the football Sun. Sizes in mm. */
export const THINGS = [
  { id: "sand", name: "বালুর দানা", sizeMm: 0.8 },
  { id: "mustard", name: "সরিষার দানা", sizeMm: 2 },
  { id: "pea", name: "মটরদানা", sizeMm: 8 },
  { id: "marble", name: "মার্বেল", sizeMm: 20 },
  { id: "orange", name: "কমলা", sizeMm: 70 },
] as const;
export type Thing = (typeof THINGS)[number];

/** The thing closest in size (compared by ratio, since sizes span a hundredfold). */
export function nearestThing(sizeMm: number): Thing {
  return THINGS.reduce((best, thing) => Math.abs(Math.log(thing.sizeMm / sizeMm)) < Math.abs(Math.log(best.sizeMm / sizeMm)) ? thing : best);
}

/** Where a planet would sit, measured from the football Sun at one end of the school field. */
export const ZONES = [
  { id: "field", name: "মাঠের ভেতরেই", upToM: FIELD_M },
  { id: "street", name: "মাঠ পেরিয়ে, কয়েকটা বাড়ি পরে", upToM: 300 },
  { id: "far", name: "অনেক দূরে, পাশের পাড়ায়", upToM: Infinity },
] as const;
export type Zone = (typeof ZONES)[number];

export const zoneOf = (distanceM: number): Zone => ZONES.find(zone => distanceM <= zone.upToM)!;

/** How many Earths fit inside a planet by volume (NASA rounds Jupiter down to about 1,000 once the gaps between balls count). */
export const earthsInside = (planet: Planet) => (planet.diameterKm / planetOf("earth").diameterKm) ** 3;

/** Print sheet: Earth this many mm across, everything else in true ratio. */
export const PRINT_EARTH_MM = 8;
export const printMm = (diameterKm: number) => diameterKm * PRINT_EARTH_MM / planetOf("earth").diameterKm;
/** Saturn's main rings reach about 2.27 planet-widths across (A ring's outer edge 136,775 km, planet radius 60,268 km). */
export const SATURN_RING = 2.27;

const digits = new Intl.NumberFormat("bn-BD", { useGrouping: false, maximumFractionDigits: 1 });
const grouped = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 0 });
/** Bangla digits; one decimal place at most. */
export const bn = (value: number) => digits.format(value);
export const bnGrouped = (value: number) => grouped.format(value);

/** "২ মিমি" or "০.৮ মিমি": a size that reads cleanly aloud. */
export const mmLabel = (mm: number) => `${bn(mm < 3 ? Math.round(mm * 10) / 10 : Math.round(mm))} মিমি`;
export const metreLabel = (m: number) => `${bnGrouped(Math.round(m))} মিটার`;
