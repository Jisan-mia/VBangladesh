export const title = "Danguli: the hit, the window, the play key and the friend's field";
const play = (v: any) =>
  ({ aim: "Ready to flick", pop: "কাঠি in the air", fly: "Hit in play", rest: "Hit in play" } as any)[v.phase];
export const state = (v: any) => {
  if (v.key === "swung") return "Space held: the game plays by itself";
  if (v.key === "skipped") return "Space held: the card was skipped";
  if (v.link && v.level === 1 && v.field === "mine") return "Friend's challenge up, on a new field";
  if (v.phase === "over") return "Result card";
  if (v.paused) return "Paused";
  if (!v.visible) return "Tab hidden";
  if (!v.focused) return v.phase === "aim" ? "Away, waiting" : `${play(v)} while you're away`;
  return play(v);
};
const labels: Record<string, string> = {
  YouPressPlayKey: "you press Space",
  KeyRepeats: "the held key repeats",
  YouLetGo: "you let go",
  YouTogglePause: "you press P",
  KathiFalls: "the কাঠি lands untouched",
  ShotSettles: "the hit lands",
  RestEnds: "the round ends",
  ChimesPlay: "the star chimes play",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back",
  TabHides: "you hide the tab",
  TabShows: "you come back",
  YouPickLevel: "you pick a level from the grid",
  FriendLinkOpens: "you open a friend's link",
  YouPlayNewField: "you press নতুন মাঠে খেলো",
};
// The chart keeps these arrows (whole arrows only); the rest repeat what these show.
const kept = new Set([
  "Ready to flick|কাঠি in the air", "কাঠি in the air|Hit in play", "Hit in play|Result card", "Result card|Ready to flick",
  "Ready to flick|Tab hidden", "Tab hidden|Ready to flick", "Ready to flick|Away, waiting", "Away, waiting|Ready to flick",
  "কাঠি in the air|কাঠি in the air while you're away", "কাঠি in the air while you're away|কাঠি in the air",
  "কাঠি in the air while you're away|Hit in play while you're away", "Hit in play while you're away|Result card",
  "কাঠি in the air|Paused", "Paused|কাঠি in the air",
  "কাঠি in the air|Space held: the game plays by itself", "Space held: the game plays by itself|Space held: the card was skipped",
  "Space held: the game plays by itself|Hit in play", "Hit in play|Space held: the game plays by itself", "Space held: the card was skipped|Ready to flick", "Result card|Space held: the card was skipped",
  "Ready to flick|Friend's challenge up, on a new field", "Friend's challenge up, on a new field|Ready to flick",
]);
export const step = (action: string, from: any, to: any) => {
  const a = state(from), b = state(to);
  if (!kept.has(`${a}|${b}`)) return null;
  if (a === "Result card" && b === "Ready to flick") return "you start again";
  if (a.startsWith("Friend's") && b === "Ready to flick") return "you start again";
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
