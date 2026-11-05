export const title = "Dudh uthlano levels: cleared, a friend's far level, and what is open";
export const state = (v: any) => ({
  Cleared: v.cleared.length ? [...v.cleared].sort().join(" ") : "none",
  Ahead: v.ahead.length ? [...v.ahead].sort().join(" ") : "none",
  Level: `Level ${v.lvl}${v.played ? " done" : ""}`,
});
export const step = (action: string, from: any, to: any) => action === "YouPickLevel" ? `you pick level ${to.lvl}` : ({
  YouOpenFriendsLevel: "you open the friend's level 3",
  YouClearIt: "you clear it",
  YouLoseIt: "you do not clear it",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.played ? "done" : "play";
export const colors = { play: "teal", done: "blue" };
