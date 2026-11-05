// The pictures of the opposites game and the card sort: pure data. Words are for the parent to read aloud (there is no voice).
export type Pic = "sun" | "moon" | "day" | "night" | "cat" | "mouse" | "big" | "small" | "cold" | "hot" | "full" | "empty" | "open" | "shut";
export const WORDS: Record<Pic, string> = {
  sun: "সূর্য", moon: "চাঁদ", day: "দিন", night: "রাত", cat: "বিড়াল", mouse: "ইঁদুর", big: "বড়", small: "ছোট",
  cold: "ঠান্ডা", hot: "গরম", full: "ভরা", empty: "খালি", open: "খোলা", shut: "বন্ধ",
};
/** Pairs in the order the course brings them in: the first two are the day–night ones the youngest start with. */
export const PAIRS: readonly (readonly [Pic, Pic])[] = [["sun", "moon"], ["day", "night"], ["cat", "mouse"], ["big", "small"], ["cold", "hot"], ["full", "empty"], ["open", "shut"]];
export const pairIndex = (pic: Pic) => PAIRS.findIndex(pair => pair.includes(pic));
export const opposite = (pic: Pic): Pic => { const pair = PAIRS[pairIndex(pic)]; return pair[0] === pic ? pair[1] : pair[0]; };

export type Color = "red" | "blue";
export type Shape = "flower" | "boat";
export type Card = { color: Color; shape: Shape };
export const COLOR_WORDS: Record<Color, string> = { red: "লাল", blue: "নীল" };
export const SHAPE_WORDS: Record<Shape, string> = { flower: "ফুল", boat: "নৌকা" };
/** The two baskets of the card sort. Each card matches one basket by colour and the other by shape. */
export const TARGETS: readonly [Card, Card] = [{ color: "red", shape: "boat" }, { color: "blue", shape: "flower" }];
export const SORT_CARDS: readonly Card[] = [{ color: "red", shape: "flower" }, { color: "blue", shape: "boat" }];
export const cardWords = (card: Card) => `${COLOR_WORDS[card.color]} ${SHAPE_WORDS[card.shape]}`;

export type Rule = "ulto" | "same" | "color" | "shape";
export const RULES: Record<Rule, { name: string; say: string }> = {
  ulto: { name: "উল্টো", say: "উল্টোটায় চাপো" },
  same: { name: "একই", say: "একই ছবিতে চাপো" },
  color: { name: "রং মেলাও", say: "একই রঙের ঝুড়িতে দাও" },
  shape: { name: "আকার মেলাও", say: "একই আকারের ঝুড়িতে দাও" },
};
export const flip = (rule: Rule): Rule => ({ ulto: "same", same: "ulto", color: "shape", shape: "color" } as const)[rule];
