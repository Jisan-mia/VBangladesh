export const title = "Ponero ghor (15 puzzle): plate, window, finger and levels";
const open = (v: any) => Math.max(v.unlocked, v.friend);
export const state = (v: any) => {
  if (v.phase === "won") return "Solved, card shows";
  const plate = v.paused ? "Paused" : v.phase === "playing" ? "Plate started" : "Fresh plate";
  const away = !v.visible || !v.focused;
  const finger = !v.press ? "" : away ? ", finger still counts as down while you're away" : ", finger down";
  const locked = v.opened > open(v) && v.phase === "ready" && !v.press ? ", a level you opened is locked again" : "";
  return plate + finger + locked;
};
const labels: Record<string, string> = {
  YouPutAFingerDown: "you press a ঘুঁটি",
  YouLiftIt: "you lift your finger",
  YouSlideWithKeys: "you slide with the keys or a hint",
  WindowBlurs: "you leave (another window or tab)",
  TabHides: "you leave (another window or tab)",
  WindowFocuses: "you come back",
  TabShows: "you come back",
  YouResume: "you press চালিয়ে যাও",
  YouGoToALevel: "you press আরেকবার or পরের লেভেল",
  AFriendsLinkOpens: "a friend's link opens",
};
// Hidden: the touch being cancelled (same as lifting), the star chimes (they stay on "Solved"),
// picking a level from mid-plate (a reset every state has), and friend links that open mid-plate (the same reset).
export const step = (action: string, from: any, to: any) => {
  if (action === "TheTouchIsCancelled" || action === "ChimesPlay") return null;
  if (action === "YouGoToALevel" && from.phase !== "won") return null;
  if (action === "AFriendsLinkOpens" && from.phase !== "ready") return null;
  return labels[action] ?? action;
};
export const group = (v: any) => v.phase === "won" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
