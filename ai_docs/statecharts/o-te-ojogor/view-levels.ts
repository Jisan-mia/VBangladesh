export const title = "o-te-ojogor (after the rewrite): levels, the game's own unlock and old links";
const bn = (n: number) => "০১২৩".charAt(n);
const open = (v: any) => [1, 2, 3].filter(l => l <= v.unlocked || v.cleared.includes?.(l) || v.links.includes?.(l));
export const state = (v: any) => ({
  Game: (v.phase === "done" ? "End screen" : "Title") + `, level ${bn(v.level)}` + (v.rival ? " (the link's tree)" : ""),
  Open: "levels " + open(v).map(bn).join(", ") + " open",
  Links: v.friend ? `A link opened level ${bn(v.friend)}` : "No link yet",
});
export const step = (action: string) => ({
  YouClearTheLevel: "you play the level through",
  YouFinishUp: "you press শেষ",
  YouPickALevel: "you pick a level",
  AnOldLinkOpens: "an old link opens",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "done" ? "done" : "title";
export const colors = { title: "tan", done: "blue" };
