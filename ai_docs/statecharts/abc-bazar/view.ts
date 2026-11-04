export const title = "এবিসি বাজার: round, stars, window, rest screen and parent gate";
const game = (v: any) => {
  if (v.out === "childLeft") return "The child left for another page";
  if (v.out !== "none") return "The share sheet opened";
  if (v.phase === "done") return "Done screen";
  if (v.phase === "menu") return "আরেকটা খেলবে? menu";
  const item = v.idx === 1 ? "first item" : "last item";
  return v.solved ? `${item} solved` : `On the ${item}`;
};
const on = (v: any, label: string) => v.out === "none" ? label : "—";
export const state = (v: any) => ({
  Game: game(v),
  Window: on(v, v.away ? "Away" : "On the page"),
  Grownups: on(v, [v.resting ? "Rest screen" : v.limit ? "Today's time is up" : "", v.gate === "parent" ? "a parent has the gate open" : v.gate === "child" ? "gate left open, the child has the phone" : v.showing ? "showing a parent" : ""].filter(Boolean).join(", ") || "Time left, gate shut"),
});
export const step = (action: string) => ({
  YouTapTheRightPicture: "you tap the right one",
  YouTapAWrongPicture: "you tap a wrong one",
  YouPressNext: "you press পরেরটা",
  YouPressSeeTheEnd: "you press শেষ দেখো",
  YouPressPlayAgain: "you press আবার খেলো",
  YouPressShesh: "you press শেষ",
  YouPickALevel: "you pick a level",
  YouShowAParent: "you press আব্বু-আম্মুকে দেখাও",
  ShowingIsOver: "you press দেখানো শেষ",
  YouToggleSound: "you press the sound switch",
  YouLeave: "you go to another window or tab",
  YouComeBack: "you come back",
  TheDailyLimitPasses: "today's time runs out",
  AParentOpensTheGate: "a parent opens বড়দের জন্য",
  TheParentHandsThePhoneBack: "the parent hands the phone back",
  SomeoneClosesTheGate: "someone presses বন্ধ করো",
  SomeoneGivesTenMinutes: "someone gives ১০ মিনিট more",
  SomeoneShares: "someone shares the link or prints",
  TheChildTapsASiteLink: "the child taps a link in the header, the guide or the related games",
  Gone: "the page is gone",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.out !== "none" ? "gone" : v.resting ? "rest" : v.phase === "play" ? "play" : "done";
export const colors = { play: "teal", rest: "yellow", done: "blue", gone: "pink" };
