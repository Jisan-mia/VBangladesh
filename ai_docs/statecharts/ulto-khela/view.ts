export const title = "উল্টো খেলা: pictures, timers, bell, drawer, window, rest screen and parent gate";
const game = (v: any) => {
  if (v.out === "childLeft") return "The child left for another page";
  if (v.out !== "none") return "The share sheet opened";
  if (v.phase === "end") return "End screen";
  if (v.phase === "closed") return "সূর্য ডুবল (closed)";
  const pic = v.idx === 3 ? "last picture" : v.idx === 1 ? "first picture (demo)" : "picture after the bell (demo)";
  return v.stage === "done" ? `Got the ${pic}` : `Waiting on the ${pic}`;
};
const on = (v: any, label: string) => v.out === "none" ? label : "—";
export const state = (v: any) => ({
  Game: game(v),
  Settings: on(v, v.quick ? "চটপট on" : "চটপট off"),
  Eyes: on(v, v.look === "away" ? "Away (another window or tab)" : v.look === "drawer" ? "সব ধাপ open" : "On the game"),
  Grownups: on(v, [v.resting ? "Rest screen" : v.limit ? "Today's time is up" : "", v.gate === "parent" ? "a parent has the gate open" : v.gate === "child" ? "gate left open, the child has the phone" : v.showing ? "showing a parent" : ""].filter(Boolean).join(", ") || "Time left, gate shut"),
});
export const step = (action: string) => ({
  YouTapTheRightPicture: "you tap the right picture",
  TheQuickTimerPasses: "4 s pass and the picture passes as a miss",
  TheNextPictureComes: "0.7 s later the next picture comes",
  TheRoundEnds: "0.7 s later the round ends",
  YouPlayAgainOrNext: "you press আবার খেলো or পরের ধাপ",
  YouPressShesh: "you press শেষ",
  YouShowAParent: "you press আব্বু-আম্মুকে দেখাও",
  ShowingIsOver: "you press দেখানো শেষ",
  YouOpenOrCloseTheDrawer: "you open or close সব ধাপ",
  YouPickALevel: "you pick a level in সব ধাপ",
  YouToggleQuick: "you press চটপট",
  YouToggleSound: "you press the sound switch",
  YouLeave: "you go to another window or tab",
  YouComeBack: "you come back",
  TheDailyLimitPasses: "today's time runs out",
  AParentOpensTheGate: "a parent opens বড়দের জন্য",
  TheParentHandsThePhoneBack: "the parent hands the phone back",
  SomeoneClosesTheGate: "someone presses বন্ধ করো",
  SomeoneGivesTenMinutes: "someone gives ১০ মিনিট more",
  SomeoneShares: "someone shares the link or saves the picture",
  TheChildTapsASiteLink: "the child taps a link in the header or the related games",
  Gone: "the page is gone",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.out !== "none" ? "gone" : v.resting ? "rest" : v.phase === "play" ? "play" : "done";
export const colors = { play: "teal", rest: "yellow", done: "blue", gone: "pink" };
