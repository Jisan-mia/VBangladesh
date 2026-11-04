export const title = "Golir Badminton (গলির ব্যাডমিন্টন): match, window, racket, wind and result";
const over = (v: any) => v.phase === "won" || v.phase === "lost";
const game = (v: any) => {
  if (v.skipped) return "Result skipped by a key";
  if (over(v)) return v.fresh ? "Result just appeared" : "Result shows";
  if (v.paused) return v.phase === "ready" ? "Paused before the first serve" : "Paused";
  return v.phase === "ready" ? "First screen" : "Match in play";
};
const moving = (v: any) => v.phase === "play" && !v.paused && v.inView && v.visible && !v.away;
const where = (v: any) => {
  if (!v.visible) return "Tab hidden";
  if (!v.focused) return moving(v) ? "Away, shuttle moving" : "Away, shuttle frozen";
  return v.inView ? "On the page" : "Court off screen";
};
export const state = (v: any) => ({
  Game: game(v),
  You: where(v),
  Leftovers: [v.cocked ? "racket up" : "", v.wind === "real" && v.sound ? "wind howls" : ""].filter(Boolean).join(", ") || "Nothing left on",
});
const labels: Record<string, string> = {
  YouStart: "you press শুরু করো",
  YouRaiseRacket: "you press and hold",
  YouLetGo: "you let go (a swing)",
  TheShuttleFlies: "the next shuttle flies",
  TheMatchEnds: "someone reaches five points",
  TheResultSettles: "a moment passes",
  YouPressSpaceOnResult: "you press Space",
  YouPickALevel: "you pick a level or play again",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  ScrollAway: "the court scrolls off screen",
  ScrollBack: "the court scrolls back",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
};
export const step = (action: string, from: any) => {
  if (action === "SoundOff" || action === "SoundOn") return null;
  if (action === "YouPickALevel" && from.phase === "play") return null;
  return labels[action] ?? action;
};
export const group = (v: any) => over(v) ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
