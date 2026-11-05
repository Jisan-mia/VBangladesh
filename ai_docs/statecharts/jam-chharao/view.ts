export const title = "Jam chharao (traffic jam puzzle) after the rewrite: title, jam, window, finger, hint, sheet, levels and links";
export const state = (v: any) => {
  const away = !v.visible || !v.focused;
  if (v.phase === "title") return v.sheet ? "Title, সব জ্যাম open" : "Title: the jam is the খেলো button";
  if (v.phase === "story") return "Story (first run)";
  if (v.phase === "over") return v.sheet ? "Cleared, সব জ্যাম open" : "Cleared: stars saved, end screen";
  if (v.phase === "paused") return v.why === "sheet" ? "Paused by সব জ্যাম" : "Paused (you're away or in the menu)";
  const base = v.press ? "Playing, a vehicle under your finger" : away ? "Playing while away" : "Playing";
  return v.jam.hint ? `${base}, a hint on show` : base;
};
const labels: Record<string, string> = {
  YouPressPlay: "you press খেলো",
  TheStoryEnds: "you tap through the story or hold to skip",
  YouPressAVehicle: "you press a vehicle",
  YouLiftYourFinger: "you let go (it lands, springs back or your CNG leaves)",
  YouSlideWithKeys: "you slide with the keys or tap your CNG",
  YouTakeBack: "you press ফিরিয়ে নাও",
  YouAskForAHint: "you press হিন্ট (it shows the move and why)",
  YouPressEnterOnTheResult: "you press পরের জ্যাম or আরেকবার",
  YouTapNextOrAgain: "you press পরের জ্যাম or আরেকবার",
  YouOpenTheSheet: "you open সব জ্যাম",
  YouCloseTheSheet: "you close সব জ্যাম",
  YouPickFromTheSheet: "you pick a jam",
  WindowBlurs: "you leave (another window, a tab, the menu)",
  TabHides: "you leave (another window, a tab, the menu)",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: "you press নতুন করে শুরু",
  AFriendsLinkOpens: "a friend's link opens",
};
// Hidden: coming back to the window (nothing moves until you resume), Enter held or released (it changes nothing on
// screen; HeldKeyNeverSkips checks it), the celebration timers (they stay on "Cleared"), a restart and a friend's link
// from mid-jam (the same reset every state has), and the press that only wakes the jam (the same as চালিয়ে যাও).
export const step = (action: string, from: any, to: any) => {
  if (["WindowFocuses", "TabShows", "YouHoldEnter", "YouLetGoOfEnter", "TheHeldEnterRepeats", "TheCelebrationFires"].includes(action)) return null;
  if (action === "YouRestart" && from.phase !== "over") return null;
  if (action === "AFriendsLinkOpens" && from.phase !== "title") return null;
  if (action === "YouPressAVehicle" && from.phase === "paused") return "you press চালিয়ে যাও";
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : v.phase === "title" || v.phase === "story" ? "start" : "play";
export const colors = { start: "blue", play: "teal", held: "yellow", done: "blue" };
