export const title = "Chhobi photao (nonogram): picture, clock, drag and drawers";
export const state = (v: any) => {
  if (v.phase === "solved") return "Picture solved, card shows";
  if (v.paused) return "Paused, clock stopped";
  const away = !v.visible || !v.focused;
  const base = v.phase === "fresh" ? "Blank picture, clock not started" : v.ticking ? "Filling in, clock counting" : "Filling in";
  const drag = v.stroke ? (away ? ", drag still held while you're away" : ", dragging") : "";
  const where = v.ticking && away ? ", you're in another window" : v.drawer && v.ticking ? ", levels drawer open" : "";
  return base + drag + where;
};
const labels: Record<string, string> = {
  YouStartAStroke: "you press a cell and drag",
  YouDragOn: "your pointer moves over the grid",
  YouLetGo: "you let go",
  YouFillWithKeysOrHint: "you fill a cell with keys or a hint",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back",
  TabHides: "you hide the tab",
  TabShows: "you come back",
  YouResume: "you press চালিয়ে যাও",
  YouOpenADrawer: "you open সব লেভেল or the album",
  YouCloseTheDrawer: "you close the drawer",
  YouPickALevel: "you pick a level",
  YouStartAgain: "you press শুরু থেকে, পরের লেভেল or আবার খেলো",
  AFriendsLinkOpens: "a friend's link opens",
};
// Hidden: the celebration timers (they stay on "solved"), friend links and level picks (the same reset as শুরু থেকে)
// except from a solved picture.
export const step = (action: string, from: any) => {
  if (action === "CheerPlays") return null;
  if ((action === "AFriendsLinkOpens" || action === "YouPickALevel")) return null;
  if (action === "YouStartAgain" && from.phase !== "solved") return null;
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "solved" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
