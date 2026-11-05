export const title = "ছায়া মেলাও: a key held through the end";
export const state = (v: any) => ({
  Screen: v.screen === "title" ? "Title" : v.screen === "play" ? "Playing" : "End screen",
  Key: v.held ? (v.repeating ? "Enter held, repeating" : "Enter down") : "No key down",
});
export const step = (action: string) => ({
  YouPressEnterOnTheTitle: "you press Enter on the title",
  YouHoldEnterWhilePlaying: "you hold Enter",
  TheEndScreenComes: "the end screen comes",
  TheKeyRepeats: "the key auto-repeats",
  YouLetGoOfTheKey: "you let go",
  YouPressEnterAgain: "you press Enter again (a fresh press)",
  YouGoBackToTheTitle: "শেষ",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", done: "blue" };
