export const title = "ডাইনোসর খুঁজি: the pit, the finger, pause, the book, the rest screen and the parent gate";
const game = (v: any) => ({
  title: "The pit (খুঁড়ি)",
  levels: "The level list",
  dig: v.settling ? "Last bone lifting out" : "Digging",
  build: "Building the skeleton",
  meet: "What did it eat?",
  facts: v.solved && v.index === 1 ? "Facts: round won, stars saved, ▶ waits" : "Facts, ▶ waits",
  end: "End: ↻ / house",
} as any)[v.phase];
export const state = (v: any) => ({
  Game: game(v),
  Window: v.paused ? "Pause menu open" : !v.focused ? "Another window has focus" : v.swallow ? "Back from away, the next tap only wakes" : "On the page",
  Hand: v.stroke ? "Finger on the sand" : "Hands off",
  Cover: v.book ? "The book is open" : v.resting && !["dig", "build", "meet", "facts"].includes(v.phase) ? "Rest screen" : v.gate ? "Parent gate open" : "Nothing over the stage",
});
export const step = (action: string) => ({
  YouStartARound: "you tap খুঁড়ি or আবার খেলো",
  YouStartPastTheLimit: "you tap খুঁড়ি with today's time used up",
  YouOpenTheLevels: "the level list opens",
  YouTapEnd: "you tap the house (শেষ)",
  YouTouchTheSand: "you press the sand",
  SandClears: "the last bone of the pit comes out",
  YouLiftYourFinger: "you lift your finger",
  YouLetGoElsewhere: "you let go in the other window",
  TouchIsCancelled: "the phone cancels the touch",
  WindowBlurs: "you click into another window: the menu opens, the stroke ends",
  WindowFocuses: "you come back to the window",
  YouPause: "⏸, P or Escape",
  YouResume: "চালিয়ে যাও",
  YouOpenTheBook: "you open the finder's book",
  YouCloseTheBook: "you close the book",
  BonesLiftOut: "the beat ends: the bones come up to the board",
  YouFinishTheSkeleton: "you place the last bone: the dinosaur stands",
  YouPickTheRightFood: "you pick the right food",
  YouPressNext: "▶",
  TodaysTimeRunsOut: "today's minutes run out",
  ParentGivesTenMore: "a parent gives ten more minutes",
  ParentOpensTheGate: "a parent opens বড়দের জন্য",
  ParentHandsThePhoneBack: "the parent hands the phone back",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting && !["dig", "build", "meet", "facts"].includes(v.phase) ? "rest" : ["dig", "build", "meet", "facts"].includes(v.phase) ? "play" : "done";
export const colors = { play: "teal", rest: "yellow", done: "blue" };
