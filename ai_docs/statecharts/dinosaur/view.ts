export const title = "ডাইনোসর খুঁজি: the dig, the hand, the rest screen and the parent gate";
const game = (v: any) => ({
  dig: v.dug ? "Bones lifting out of the sand" : "Brushing the sand",
  build: v.timer === "toMeet" ? "Skeleton complete" : "Building the skeleton",
  meet: "What did it eat?",
  facts: "Fact card",
  done: "Level done: আবার খেলো / শেষ",
  menu: "Pick a level",
} as any)[v.phase];
export const state = (v: any) => ({
  Game: game(v),
  Window: v.focused ? "You're on the page" : "Another window has focus",
  Hand: v.finger ? (v.stroke ? "Finger on the sand" : "Finger down, ignored") : (v.stroke ? "No finger, sand still listening" : "Hands off"),
  Rest: v.resting ? "Rest screen up" : v.late ? "Today's time used up" : "Time left today",
  Gate: v.gate ? (v.holder === "parent" ? "Gate open, parent holding" : "Gate open, child holding") : (v.holder === "parent" ? "Parent holding" : "Child holding"),
});
export const step = (action: string) => ({
  YouTouchTheSand: "you touch the sand",
  SandClears: "the sand clears off the bones",
  YouLiftYourFinger: "you lift your finger",
  YouLetGoElsewhere: "you let go in the other window",
  TouchIsCancelled: "the phone cancels the touch",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  BonesLiftOut: "the bones come up",
  YouFinishTheSkeleton: "you place the last bone",
  SkeletonStands: "the dinosaur stands up",
  YouPickTheRightFood: "you pick the right food",
  YouKeepItInTheBook: "you press বইয়ে রাখো on the last dinosaur",
  YouTapPlayAgain: "you tap আবার খেলো",
  YouTapEnd: "you tap শেষ",
  YouPickALevel: "you pick a level",
  YouTabAndEnterBehindRest: "you press Tab and Enter behind the rest screen",
  TodaysTimeRunsOut: "today's minutes run out",
  ParentGivesTenMore: "a parent gives ten more minutes",
  ParentOpensTheGate: "a parent opens বড়দের জন্য",
  ParentClosesTheGate: "a parent presses বন্ধ করো",
  ParentHandsThePhoneBack: "the parent hands the phone back",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "rest" : v.phase === "done" || v.phase === "menu" ? "done" : "play";
export const colors = { play: "teal", rest: "yellow", done: "blue" };
