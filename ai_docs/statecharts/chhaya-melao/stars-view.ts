export const title = "ছায়া মেলাও: a round's stars";
export const state = (v: any) => ({
  Round: v.phase === "title" ? "Title" : v.phase === "end" ? `End screen, ${v.shown} stars, best ${v.best}` : `Playing: ${v.scored} of 4 scored, ${v.first} on the first try${v.forced ? ", last toy landed" : ""}`,
});
export const step = (action: string) => ({
  YouStartARound: "you start a round",
  YouMatchOnTheFirstTry: "you match a shadow on the first try",
  YouMatchAfterASlip: "you match a shadow after a slip",
  YouMatchTheLastToy: "you land the last toy on the last shadow",
  YouGoBackToTheTitle: "শেষ",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "play" ? "play" : "done";
export const colors = { play: "teal", done: "blue" };
