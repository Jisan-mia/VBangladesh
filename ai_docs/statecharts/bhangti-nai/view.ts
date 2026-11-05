export const title = "ভাংতি নাই! after the rewrite: the shift, the window and the day list";
const game = (v: any) => {
  if (v.why === "sheet") return "Paused by সব দিন";
  if (v.why === "away") return "Paused, a shutter hides the customer";
  return ({
    ready: "Bell on the counter (ঘণ্টা বাজাও)", opening: "Bell rings, the customer steps in", serve: "Customer waits, patience runs",
    right: "Right change: a happy beat", late: "Patience out: the customer huffs off", over: "The day's ledger",
  } as any)[v.phase];
};
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Away: tab hidden" : !v.focused ? "Away: another window" : v.inView ? "You're at the counter" : "Counter scrolled away",
});
const steps: Record<string, string | null> = {
  YouRingTheBell: "you ring the bell",
  CustomerSteps: "the customer steps in",
  YouGiveRightChange: "you hand over the right change",
  PatienceRunsOut: "the customer's patience runs out",
  BeatEnds: "the next customer steps up, or the ledger shows",
  YouPlayOn: "you press পরের দিন or আবার খেলো",
  YouPickADay: "you pick a day",
  YouRestart: "you press নতুন করে শুরু",
  TabHides: "you hide the tab",
  TabShows: "you come back",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back",
  ScrollAway: "you scroll the counter away",
  ScrollBack: "you scroll the counter back",
  YouResume: "you press চালিয়ে যাও",
  YouOpenTheSheet: "you open সব দিন",
  YouCloseTheSheet: "you close সব দিন",
  YouHoldAChit: null, YouLetGoOfTheChit: null,
  YouHoldEnter: null, EnterRepeats: null, YouLetGo: null,
};
// A held chit and a held Enter are checked by the rules (InputReleasedWhenAway, ResultNeedsFreshPress)
// but change nothing drawn here, so their steps are hidden; see README.
export const step = (action: string) => (action in steps ? steps[action] : action);
export const group = (v: any) => v.phase === "over" ? "done" : v.why !== "none" ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
