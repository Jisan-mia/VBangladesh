export const title = "Chhobi photao (nonogram): round, clock, stroke, sheet and stars";
export const state = (v: any) => {
  if (v.phase === "over") return "Picture bloomed, end screen";
  if (v.phase === "title") return v.sheet ? "Title, levels sheet open" : "Title";
  if (v.phase === "paused") return v.why === "sheet" ? "Paused by the levels sheet, clock stopped" : "Paused, clock stopped";
  const away = !v.visible || !v.focused;
  const base = !v.armed ? "Blank cloth, clock waiting" : v.clock ? "Stitching, clock counting" : "Stitching";
  const drag = v.stroke ? (away ? ", drag held while you're away" : ", dragging") : "";
  return base + drag + (v.wrong > 0 ? `, ${v.wrong === 3 ? "3+" : v.wrong} mistake${v.wrong === 1 ? "" : "s"}` : "");
};
const labels: Record<string, string> = {
  YouPressPlay: "you press ফোটাও",
  YouStartAStroke: "you press a cell and drag",
  YouLetGo: "you let go",
  YouStitchWrong: "you stitch a wrong cell: the thread snaps",
  YouStitchRight: "you stitch a cell by tap, key or hint",
  YouStitchTheLastCell: "you stitch the last cell",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back",
  TabHides: "you hide the tab",
  TabShows: "you come back",
  YouResume: "you press চালিয়ে যাও",
  YouOpenTheSheet: "you open সব লেভেল",
  YouCloseTheSheet: "you close the sheet",
  YouPressNextLevel: "you press পরের লেভেল",
  YouPlayAgain: "you press আবার খেলো",
  YouRestart: "you press নতুন করে শুরু",
};
// Hidden: the celebration timers (they stay on the end screen), friend links and level picks (the same reset as নতুন করে শুরু).
export const step = (action: string, from: any) => {
  if (action === "CheerFires" || action === "FriendLinkOpens" || action === "YouPickALevel") return null;
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : v.phase === "title" ? "start" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", start: "tan" };
