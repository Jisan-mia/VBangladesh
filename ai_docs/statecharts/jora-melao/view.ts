export const title = "জোড়া মেলাও after the rewrite: the board, the peek, the birds, the window and the level list";
const game = (v: any) => {
  if (v.why === "sheet") return "Paused by সব লেভেল";
  if (v.why === "away") return "Paused, cards covered";
  if (v.phase === "ready") return "Start card, sign across the board";
  if (v.phase === "peek") return "The peek: every card up";
  if (v.phase === "over") return v.shown ? "End screen" : "Last pair found";
  return ({ none: "Your move", one: "One card up", missed: "Missed pair showing" } as any)[v.open];
};
export const state = (v: any) => ({
  Game: game(v),
  Window: v.here ? "You're on the page" : "Away: tab hidden or another window",
});
const steps: Record<string, string | null> = {
  YouStart: "you tap the sign",
  ThePeekRuns: null,
  ThePeekEnds: "the peek runs out",
  YouFlipACard: "you flip a card",
  YouTapAMissedPair: "the missed pair turns back",
  TheMissTurnsBack: "the missed pair turns back",
  YouLeaveThePage: "you hide the tab or click into another window",
  YouComeBack: "you come back",
  YouResume: "you press চালিয়ে যাও or tap the covered board",
  YouOpenTheLevelList: "you open সব লেভেল",
  YouCloseTheLevelList: "you close সব লেভেল",
  YouPickALevel: "you pick a level",
  TheEndScreenShows: "the end screen shows",
  YouPlayOn: "you press পরের লেভেল or আবার খেলো",
  YouPlayOnWithAClick: "you press পরের লেভেল or আবার খেলো",
  YouHoldEnter: null, EnterRepeats: null, YouLetGo: null,
};
// A held Enter changes nothing drawn here, so its steps are hidden; ResultNeedsFreshPress checks it. See README.
export const step = (action: string) => (action in steps ? steps[action] : action);
export const group = (v: any) => v.phase === "over" ? "done" : v.why !== "none" ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
