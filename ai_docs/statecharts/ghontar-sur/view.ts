export const title = "Ghontar sur (pot memory): run, tune, pause and links";
export const state = (v: any) => {
  if (v.phase === "over") return "Result shows";
  if (v.phase === "ready") return v.sent && v.from !== v.sent ? "Friend's tune ready, from level ১" : "Ready to start";
  const away = !v.visible || !v.focused;
  let base = v.cleared ? "Level clear screen" : v.pending === "tune" || v.pending === "gap" ? "The tune plays" : v.pending === "clear" ? "Level done, clear screen coming"
    : v.phase === "play" ? "Your turn" : "Waiting for a tap";
  if (v.paused) base = v.pending === "tune" ? "Paused, but the tune plays" : v.cleared ? "Paused on the clear screen" : "Paused";
  const lost = v.owed && v.pending !== "clear" ? ", clear screen skipped" : "";
  const where = v.paused ? "" : v.pending === "tune" && away ? ", you're away" : v.pending === "tune" && v.list ? ", level list open" : "";
  return base + lost + where;
};
const labels: Record<string, string> = {
  YouStart: "you press শুরু করো or আরেকবার",
  TheTuneEnds: "the tune ends",
  YouRepeatTheTuneOrSlip: "you repeat the tune or slip once",
  YouClearALevel: "you finish a level's last tune",
  YouSlipTheThirdTime: "you slip the third time",
  TheTuneReplays: "the next tune starts",
  TheClearScreenShows: "the clear screen shows",
  YouPressNextLevel: "you press পরের লেভেল",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back",
  TabHides: "you hide the tab",
  TabShows: "you come back",
  YouResume: "you press চালিয়ে যাও",
  YouOpenTheLevels: "you open সব লেভেল",
  YouCloseTheLevels: "you close সব লেভেল",
  YouPickALevel: "you pick a level",
  AFriendsLinkOpens: "a friend's link opens",
};
const shows = (v: any) => (state(v) as string).replace(/^.*, /, "");
// Hidden: picking a level (a reset every state has), friend links except from a fresh shelf, and the steps that
// carry an already-open list or an already-away window into a tune (চালিয়ে যাও, পরের লেভেল, the next tune):
// the chart shows how you get there by opening the list or leaving.
export const step = (action: string, from: any, to: any) => {
  const lands = shows(to);
  if ((lands === "level list open" || lands === "you're away") && shows(from) !== lands
      && ["YouResume", "YouPressNextLevel", "TheTuneReplays", "TabShows", "WindowFocuses"].includes(action)) return null;
  if (action === "YouPickALevel") return null;
  if (action === "AFriendsLinkOpens" && from.phase !== "ready") return null;
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.paused ? "held" : v.phase === "ready" ? "start" : "play";
export const colors = { start: "teal", play: "teal", held: "yellow", done: "blue" };
