// The bells' look in one place: the colours, the shape (one set of paths for the live SVG and the card canvas),
// and one palette per world. All art is code; there are no image files.

/** Each bell's own colour (a painted band, and the glow when it rings): teal, marigold, magenta, indigo, olive. Numbered 1–5 too, so colour is never the only cue. */
export const BELL_COLORS = ["#13917f", "#e3940a", "#c8326b", "#3f56c8", "#6f8f1d"] as const;
/** Bell sizes left to right: the biggest bell sounds lowest. */
export const BELL_SCALE = [1, 0.93, 0.86, 0.8, 0.74] as const;

/** A bell in a 100 × 130 box, hung by its top (the swing turns about (50, 0)). */
export const BELL = {
  rope: "M50 0V14",
  body: "M50 22C65 22 73 36 75 58C77 80 84 94 93 103V111H7V103C16 94 23 80 25 58C27 36 35 22 50 22Z",
  band: "M11 104Q50 113 89 104",
  shine: "M36 40Q31 62 24 86",
  clapper: "M50 108V118",
};

export const palette = {
  paper: "#f6ecd6", paperLine: "#eadcb9", ink: "#33200f", muted: "#74543a", brass: "#c99a2e", brassDark: "#8a6414", brassLight: "#efce6d",
  beam: "#a8793a", beamDark: "#6f4a1e", star: "#f2a900", starOff: "#dccbaa", band: "#33200f", ask: "#ffd27a",
};

/** One palette per world: the rack's wall, its beam and the glow behind the bells. */
export const WORLD_ART = [
  { name: "মেলার গেট", wall: "#f3e2bd", wall2: "#ead2a0", beam: "#a8793a", glow: "#fff2c4", flags: ["#c8326b", "#e3940a", "#13917f", "#3f56c8"] },
  { name: "বটতলার আসর", wall: "#2e5b4c", wall2: "#234639", beam: "#7a5a2c", glow: "#ffd98a", flags: ["#e3940a", "#c8326b", "#f3e2bd", "#13917f"] },
  { name: "রাতের মেলা", wall: "#252a5e", wall2: "#181c45", beam: "#6a4b25", glow: "#ffe6a0", flags: ["#ffd166", "#ef476f", "#06d6a0", "#8ecae6"] },
] as const;
