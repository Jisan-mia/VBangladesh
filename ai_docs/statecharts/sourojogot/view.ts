export const title = "Sourojogot (solar system tour): round, daily limit, parent gate and header search";
const game = (v: any) => {
  if (v.resting) return v.phase === "done" || v.phase === "menu" ? "Rest screen at the end of a round" : v.phase === "fresh" ? "Rest screen as the game opens" : "Rest screen over a round in play";
  if (v.show !== "off") return v.show === "gate" ? "আব্বু-আম্মুকে দেখাও, save open" : "আব্বু-আম্মুকে দেখাও";
  return ({ fresh: "New round, nothing tapped yet", play: "Playing a round", late: "Playing a round after today's time is up", done: "Round finished", menu: "Level menu" } as any)[v.phase];
};
const gate = (v: any) => {
  if (v.stage === "early") return "Sum question opened by a short press";
  if (v.stage === "stale") return "Share link left open for the child";
  if (v.stage === "open") return "Share link open for a grown-up";
  if (v.stage === "ask") return "Sum question";
  return v.hold === "none" ? "বড়দের জন্য closed" : "Holding বড়দের জন্য";
};
export const state = (v: any) => ({
  Game: game(v),
  Today: v.due ? "Today's time is up" : "Time left today",
  Gate: gate(v),
  Search: v.search === "open" ? "Typing in the site search" : "Search untouched",
});
const labels: Record<string, string> = {
  YouStartTapping: "you tap the first planet or choice",
  YouFinishTheRound: "you finish the round",
  YouPlayAgain: "you press আবার খেলো or pick a level",
  YouPickALevel: "you press আবার খেলো or pick a level",
  YouPressShesh: "you press শেষ",
  TodaysTimeRunsOut: "today's time runs out",
  AGrownUpGivesTenMore: "a grown-up gives ১০ more minutes",
  YouReload: "you open or reload the game",
  YouHoldTheGate: "you hold বড়দের জন্য",
  YouLetGoEarly: "you let go before 2 s",
  TheHoldTimerFires: "2 s pass",
  AGrownUpAnswersTheSum: "a grown-up answers the sum",
  TheGateCloses: "থাক, বন্ধ করো, two misses, one use, a minute or hiding the tab closes it",
  YouShowAGrownUp: "you press আব্বু-আম্মুকে দেখাও",
  AGrownUpOpensSave: "a grown-up opens ছবিটা রাখো",
  YouCloseShowParent: "you press দেখানো শেষ",
  YouTypeInTheSearch: "you type in the site search",
};
// Hidden: reloads that land on a new round with time left (a reset from every state).
export const step = (action: string, from: any, to: any) => action === "YouReload" && !to.resting ? null : labels[action] ?? action;
export const group = (v: any) => v.resting ? "rest" : v.phase === "done" || v.phase === "menu" ? "done" : "play";
export const colors = { play: "teal", rest: "yellow", done: "blue" };
