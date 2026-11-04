export const title = "হাত ধুই, দাঁত মাজি: routine, finish timer, window, rest screen and parent gate";
const game = (v: any) => {
  if (v.out === "childLeft") return "The child left for another page";
  if (v.out !== "none") return "The share sheet opened";
  if (v.phase === "done") return v.fake ? "Done screen for a routine you never finished" : "Done screen";
  if (v.phase === "idle") return "Today's record";
  if (v.mode === "kokhon") return "কখন ধোব quiz";
  return ({ ready: "Waiting for শুরু করো", run: "Ring filling", pause: "Paused", end: "হয়ে গেছে" } as any)[v.rstate];
};
const on = (v: any, label: string) => v.out === "none" ? label : "—";
export const state = (v: any) => ({
  Game: game(v),
  Timer: on(v, v.pending === "none" ? "No finish timer" : v.phase === "play" && v.rstate === "end" && v.pending === v.mode ? "Finish timer for this routine" : "Finish timer for a routine you left"),
  Window: on(v, v.away === "hidden" ? "Tab hidden" : v.away === "blurred" ? "Another window has focus" : "On the page"),
  Rest: on(v, v.resting ? "Rest screen" : v.limit ? "Today's time is up" : "Time left today"),
  Gate: on(v, v.gate === "parent" ? "A parent has the gate open" : v.gate === "child" ? "Gate left open, the child has the phone" : v.showing ? "Showing a parent" : "Gate shut"),
});
export const step = (action: string) => ({
  YouPickATab: "you tap a tab",
  YouPressPlayAgain: "you press আবার খেলো",
  YouPressStart: "you press শুরু করো",
  YouPause: "you press একটু থামাও",
  YouResume: "you press আবার চালাও",
  TheRingFills: "the ring fills",
  TheFinishTimerFires: "0.7 s later the finish timer fires",
  YouAnswerTheQuiz: "you pick the right pictures",
  YouSeeWhatYouLearned: "you press দেখো কী শিখলে",
  YouPressShesh: "you press শেষ",
  YouShowAParent: "you press আব্বু-আম্মুকে দেখাও",
  ShowingIsOver: "you press দেখানো শেষ",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "the tab hides",
  TabShows: "the tab shows again",
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
