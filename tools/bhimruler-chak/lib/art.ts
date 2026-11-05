// The orchard's look, shared by the live board (CSS, under data-world in product.css) and the canvas card: one palette per
// world. বাড়ির পেছনে is a green morning, রাজশাহী a gold noon among ripe mangoes, চাঁপাইনবাবগঞ্জ a dusk in long shadows.
// The গামছা, nests, mangoes and posts keep their colours everywhere, so each always reads as itself.

export type Art = {
  ground: string; card: string; edge: string; ink: string; muted: string; sky: string;
  grass: string; grassDeep: string; leaf: string; leafLight: string; earth: string; accent: string; band: string; ask: string;
};

export const WORLD_ART: readonly Art[] = [
  { ground: "#eef5df", card: "#fbfdf4", edge: "#d6e4bd", ink: "#24301c", muted: "#5b6b46", sky: "#fdf3cf", grass: "#8cc461", grassDeep: "#6aa84f", leaf: "#2f6b2a", leafLight: "#3f8a36", earth: "#f3e7c6", accent: "#2f6b2a", band: "#2f6b2a", ask: "#ffe08a" },
  { ground: "#fbf0cf", card: "#fffaea", edge: "#ecd79a", ink: "#3a2a0e", muted: "#76602e", sky: "#fff1b8", grass: "#b5c95a", grassDeep: "#8fa83c", leaf: "#3d6b1f", leafLight: "#5b8a2a", earth: "#f6e6b8", accent: "#a8650f", band: "#7a4a0c", ask: "#ffd65a" },
  { ground: "#2a2238", card: "#352c47", edge: "#4d4166", ink: "#fbeedd", muted: "#d4c3e0", sky: "#f6b17a", grass: "#5f7d4a", grassDeep: "#465e36", leaf: "#2c4a2a", leafLight: "#3e6336", earth: "#e9d2b4", accent: "#f59e42", band: "#1d1728", ask: "#ffc27a" },
];
export const artFor = (world: number) => WORLD_ART[Math.max(0, Math.min(WORLD_ART.length - 1, world - 1))];

export const FIXED = {
  mango: "#f2b632", mangoBlush: "#e07b28", nest: "#c99a5b", nestLine: "#8a6232", gamchha: "#c8322b", bark: "#7a4b26",
  bamboo: "#d8b66a", bambooDark: "#9c7a35", star: "#f2a900", starOff: "#d9d2b0", danger: "#c0392b",
};
