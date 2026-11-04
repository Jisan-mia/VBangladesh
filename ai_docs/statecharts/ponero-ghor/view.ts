export const title = "Ponero ghor (15 puzzle) after the rewrite: title, plate, window, finger, sheet, levels and links";
export const state = (v: any) => {
  const away = !v.visible || !v.focused;
  if (v.phase === "title") return v.sheet ? "Title, সব লেভেল open" : "Title: the plate is the খেলো button";
  if (v.phase === "story") return "Story (first run)";
  if (v.phase === "over") return v.sheet ? "Solved, সব লেভেল open" : "Solved: stars saved, end screen";
  if (v.phase === "paused") return v.why === "sheet" ? "Paused by সব লেভেল" : "Paused (you're away or in the menu)";
  return v.press ? "Playing, a line under your finger" : away ? "Playing while away" : "Playing";
};
const labels: Record<string, string> = {
  YouPressPlay: "you press খেলো",
  TheStoryEnds: "you tap through the story or hold to skip",
  YouPressTheplate: "you press the plate",
  YouLiftYourFinger: "you let go (it lands, springs back or solves it)",
  YouSlideWithKeys: "you slide with the keys (it may solve it)",
  YouPressEnterOnTheResult: "you press পরের লেভেল or আবার খেলো",
  YouTapNextOrAgain: "you press পরের লেভেল or আবার খেলো",
  YouOpenTheSheet: "you open সব লেভেল",
  YouCloseTheSheet: "you close সব লেভেল",
  YouPickFromTheSheet: "you pick a level",
  WindowBlurs: "you leave (another window, a tab, the menu)",
  TabHides: "you leave (another window, a tab, the menu)",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: "you press নতুন করে শুরু",
  AFriendsLinkOpens: "a friend's link opens",
};
// Hidden: coming back to the window (nothing moves until you resume), Enter held or released (it changes nothing on
// screen; HeldKeyNeverSkips checks it), the celebration timers (they stay on "Solved"), a restart and a friend's link
// from mid-plate (the same reset every state has), and the press that only wakes the plate (the same as চালিয়ে যাও).
export const step = (action: string, from: any, to: any) => {
  if (["WindowFocuses", "TabShows", "YouHoldEnter", "YouLetGoOfEnter", "TheHeldEnterRepeats", "TheCelebrationFires"].includes(action)) return null;
  if (action === "YouRestart" && from.phase !== "over") return null;
  if (action === "AFriendsLinkOpens" && from.phase !== "title") return null;
  if (action === "YouPressTheplate" && from.phase === "paused") return "you press চালিয়ে যাও";
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : v.phase === "title" || v.phase === "story" ? "start" : "play";
export const colors = { start: "blue", play: "teal", held: "yellow", done: "blue" };
