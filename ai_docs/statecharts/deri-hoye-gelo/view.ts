export const title = "Deri hoye gelo: the road, the window, your hand and the end";
const road = (v: any) =>
  v.sheet ? "Level list open" : v.screen === "title" ? "On the title" : v.screen === "intro" ? "The story" : v.screen === "over" ? "End screen"
    : v.paused ? "Paused (menu)" : v.phase === "ready" ? "Waiting for the first press" : v.phase === "end" ? "At the gate or the bell" : "Running";
export const state = (v: any) => ({
  Road: road(v),
  Window: v.win === "here" ? "You're on the road" : v.win === "blurred" ? "In another window" : v.win === "hidden" ? "Tab hidden" : "Road scrolled off",
});
const STEPS: Record<string, string | null> = {
  YouTapStart: "you tap চলো!",
  YouFinishTheStory: "you tap through the story",
  YouPress: null,
  YouLetGo: null,
  StepTakesPress: "you press: the run starts",
  RoadRuns: null,
  GateReached: "the kid reaches the gate (stars kept)",
  BellRings: "the bell rings first",
  EndMomentPasses: "the end screen shows",
  BreathEnds: null,
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  ScrollAway: "you scroll the road away",
  ScrollBack: "you scroll the road back",
  YouOpenTheMenu: "you press pause",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: "you press নতুন করে শুরু",
  YouOpenTheListFromTheMenu: "you open সব লেভেল",
  YouOpenTheList: "you open সব লেভেল",
  YouCloseTheList: "you close the list",
  YouPickALevel: "you pick a level",
  YouPlayOn: "you pick পরের লেভেল or আবার খেলো",
  FriendLinkOpens: "you open a friend's link",
  YouPlayYourOwn: "you play your own",
  ChimesEnd: null,
  SoundOff: null,
  SoundOn: null,
};
export const step = (action: string) => action in STEPS ? STEPS[action] : action;
export const group = (v: any) => v.screen === "over" ? "done" : v.paused || v.sheet ? "held" : v.screen === "title" || v.screen === "intro" || v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
