export const title = "আঁটি থেকে আম: the run, ফেরত নাও and the পাকা আম celebration";
const run = (v: any) => {
  if (v.phase === "paused") return v.visible ? "Paused, tab back" : "Paused, tab hidden";
  const base = ({ ready: "Fresh plot", playing: "Swiping", over: "Run over, card" } as any)[v.phase];
  return v.visible ? base : `${base}, tab hidden`;
};
const fell = (n: number) => (n >= 2 ? "confetti fell twice" : n === 1 ? "confetti fell once" : "");
export const state = (v: any) => ({
  Run: run(v),
  Board: v.top === "small" ? "No পাকা আম yet" : v.undo === "small" ? "পাকা আম just grown (ফেরত নাও removes it)" : "পাকা আম on the board",
  Celebration: [v.toast && "banner showing", v.cheerDue && (v.cheers ? "confetti due again" : "confetti due"), fell(v.cheers)].filter(Boolean).join(", ") || "Nothing yet",
});
const steps: Record<string, string | null> = {
  YouSwipe: "you swipe",
  YouGrowAMango: "you swipe two কাঁচা আম into a পাকা আম",
  TheConfettiFalls: "the confetti falls",
  TheToastFades: "the banner fades",
  YouTakeItBack: "you press ফেরত নাও",
  TheRunEnds: "the run ends",
  YouStartAnew: null,
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
};
// Starting a fresh plot (আরেকবার, the modes, the level list: a reset from every state) is hidden; see README.
export const step = (action: string) => (action in steps ? steps[action] : action);
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
