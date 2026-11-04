export const title = "Marble Sinri after the rewrite: floor, menu, list, window and link";
const game = (v: any) =>
  v.phase === "title" ? (v.picking ? "সব তলা open" : "Title (গড়াও)")
  : v.phase === "playing" ? "Marble rolling"
  : v.phase === "paused" ? (v.picking ? "সব তলা open, floor paused" : "Paused")
  : (v.picking ? "সব তলা open" : "Card shows");
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : !v.focused ? "Another window has focus" : "You're on the page",
  Menu: v.menu ? "Pause menu open" : "No menu",
  Link: v.link === "none" ? "No friend's link" : v.link === "theirs" ? "Friend's floor on screen" : "Friend's link, another floor",
});
const labels: Record<string, string> = {
  YouStart: "you press গড়াও (or an arrow, or Space)",
  YouHoldSide: "you hold a side",
  YouLetGo: "you let go",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  MenuOpens: "you press P or ⏸",
  MenuResumes: "you press চালিয়ে যাও",
  YouRestart: "you press নতুন করে শুরু",
  YouResume: "you tap the board to go on",
  YouOpenTheList: "you open সব তলা",
  YouCloseTheList: "you close সব তলা",
  YouPickAFloor: "you pick a floor",
  FloorEnds: "the floor ends and the card shows",
  CheerFires: "the celebration timer fires",
  YouPlayAgain: "you press আবার",
  YouGoOn: "you press পরের তলা",
  FriendLinkOpens: "a friend's link opens",
  YouHoldEnter: "you hold Enter",
  EnterRepeats: "Enter repeats",
  YouLetGoOfEnter: "you let go of Enter",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
};
export const step = (action: string) => labels[action.replace(/\(.*$/, "")] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" || v.picking || v.menu ? "held" : v.phase === "playing" ? "play" : "wait";
export const colors = { wait: "blue", play: "teal", held: "yellow", done: "blue" };
