export const title = "Danguli: a friend's field, from the first screen, the end screen and the level list";
export const state = (v: any) => ({
  Page: v.screen === "title" ? "First screen" : v.screen === "play" ? "Playing a round" : "Result card",
  Link: v.link ? "Friend's challenge up" : "No challenge",
  Field: v.field === "friend" ? `Friend's field (level ${v.level})` : `A new field (level ${v.level})`,
});
const labels: Record<string, string> = {
  FriendLinkOpens: "you open a friend's link",
  YouStart: "you press খেলো",
  TheRoundEnds: "the round ends",
  YouPlayAgain: "you press আবার খেলো",
  YouPlayTheNextLevel: "you press পরের লেভেল",
  YouPickALevel: "you pick a level from the list",
};
export const step = (action: string) => labels[action] ?? action;
export const group = (v: any) => v.screen === "over" ? "done" : v.screen === "play" ? "play" : "wait";
export const colors = { play: "teal", done: "blue", wait: "tan" };
