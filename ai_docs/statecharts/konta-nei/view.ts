export const title = "কোনটা নেই? after the rewrite: shelf, window, hum and level list";
const game = (v: any) => {
  if (v.why === "sheet") return "Paused by সব লেভেল";
  if (v.why === "away") return "Paused, shutter down over the shelf";
  return ({
    ready: "Shutter down (ঝাঁপ তোলো)", opening: "Shutter rolling up", look: "Looking at the shelf",
    closing: "Eyes closing, মামা takes one", ask: "কোনটা নেই? pictures", reveal: "Answer shown, things go back",
    blink: "Eyes closing before a shelf", over: "Cash memo",
  } as any)[v.phase];
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.visible && v.focused ? "You're on the page" : "Away: tab hidden or another window",
});
const steps: Record<string, string | null> = {
  YouStart: "you tap the shutter",
  ShutterUp: "the shutter is up",
  LookTimeEnds: "the look time runs out or you press মনে আছে",
  YouRemember: "the look time runs out or you press মনে আছে",
  EyesOpenOnTheGap: "the eyes open on the question",
  YouAnswer: "you pick the answer",
  RevealEnds: "পরের তাক, or the reveal moves on",
  EyesOpenOnAShelf: "the eyes open on the next shelf",
  YouPlayOn: "you press পরের লেভেল or আবার খেলো",
  YouPickALevel: "you pick a level",
  TabHides: "you hide the tab or click into another window",
  TabShows: "you come back",
  WindowBlurs: "you hide the tab or click into another window",
  WindowFocuses: "you come back",
  YouResume: "you press চালিয়ে যাও",
  YouOpenTheSheet: "you open সব লেভেল",
  YouCloseTheSheet: "you close সব লেভেল",
  SoundOff: null, SoundOn: null,
  YouHoldEnter: null, EnterRepeats: null, YouLetGo: null,
};
// The sound switch and a held Enter are checked by the rules (HumOnlyWhileLooking, HumComesBack, ResultNeedsFreshPress)
// but change nothing drawn here, so their steps are hidden; see README.
export const step = (action: string) => (action in steps ? steps[action] : action);
export const group = (v: any) => v.phase === "over" ? "done" : v.why !== "none" ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
