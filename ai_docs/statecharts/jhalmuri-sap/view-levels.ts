export const title = "Jhalmuri Sap: the level list, a friend's link and the unlock";
export const state = (v: any) => ({
  Game: ({ title: "Title or level list", playing: "Snake moving", over: "Card (or level list)" } as any)[v.phase],
  Level: v.friend && v.on === 3 ? (v.seed === "theirs" ? "Friend's level, friend's ঠোঙা" : "Friend's level, other ঠোঙা") : "Your own level",
  Unlock: v.unlock === 1 ? "Only level 1 open" : v.unlock === 2 ? "Levels 1–2 open" : "Levels 1–3 open",
});
export const step = (action: string, from: any, to: any) => {
  if (action === "YouClear") return to.unlock > from.unlock ? "you clear your furthest level" : from.on === 3 && from.friend ? "you clear the friend's level" : "you clear a level";
  if (action === "YouPickLevel") return to.on === 3 && to.friend ? "you pick the friend's level" : "you pick a level";
  if (action === "YouPlayAgain") return to.on !== from.on ? "you press পরের লেভেল" : "you press আবার খেলো";
  return ({ YouStart: "you press খেলো", YouCrash: "the snake crashes", YouOpenList: "you open সব লেভেল", YouCloseList: "you close the list", FriendLinkOpens: "a friend's link opens" } as Record<string, string>)[action] ?? action;
};
export const group = (v: any) => v.phase === "playing" ? "play" : v.picking ? "held" : "wait";
export const colors = { wait: "blue", play: "teal", held: "yellow" };
