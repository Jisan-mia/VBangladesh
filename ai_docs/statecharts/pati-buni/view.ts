export const title = "Pati Buni after the rewrite: run, the list, window and link";
const game = (v: any) => {
  if (v.picking) return v.phase === "paused" ? "সব পাটি open, run paused" : "সব পাটি open";
  if (v.phase === "title") return "Title (বোনা শুরু)";
  if (v.phase === "paused") return "Paused";
  if (v.phase === "over") return v.woven >= 1 && v.stack < 1 ? "Goal woven, end screen" : "Frame full, end screen";
  return "Strips falling";
};
const link = (v: any) => v.link === "none" ? "No friend's link"
  : v.link === "other" ? "Friend's link, another পাটি picked"
  : v.seed === "theirs" ? "Friend's পাটি, their seed" : "Friend's পাটি, your own seed";
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : !v.focused ? "Another window has focus" : v.inView ? "Frame on screen" : "Frame scrolled off",
  Link: link(v),
});
export const step = (action: string, from: any, to: any) => ({
  YouStart: "you press বোনা শুরু (or a key, or tap the frame)",
  YouHold: "you hold a control",
  YouLetGo: "you let go",
  StripLands: to.phase === "over" ? (to.woven >= 1 ? "the last row weaves" : "the frame fills for good") : to.stack < from.stack ? "the frame fills and rolls up" : "a strip lands",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouScrollAway: "you scroll the frame off screen",
  YouScrollBack: "you scroll the frame back",
  YouPause: "you press P or ⏸",
  YouResume: "you press চালিয়ে যাও (or tap the cover)",
  YouOpenTheList: "you open সব পাটি",
  YouCloseTheList: "you close সব পাটি",
  YouPickAPati: "you pick a পাটি",
  CheerFires: "the celebration timer fires",
  YouPlayAgain: "you press আবার খেলো",
  YouGoOn: "you press পরের পাটি",
  YouRestart: "you press নতুন করে শুরু",
  FriendLinkOpens: "a friend's link opens",
  YouHoldEnter: "you hold Enter",
  EnterRepeats: "Enter repeats",
  YouLetGoOfEnter: "you let go of Enter",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" || v.picking ? "held" : v.phase === "title" ? "wait" : "play";
export const colors = { wait: "blue", play: "teal", held: "yellow", done: "blue" };
