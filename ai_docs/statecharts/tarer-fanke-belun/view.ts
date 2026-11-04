export const title = "Tarer Fanke Belun: the run, the window, your finger and the hum";
const run = (v: any) =>
  v.sheet ? "Level list open" : v.phase === "title" ? "On the title" : v.phase === "over" ? "Card shows" : v.paused ? "Paused (menu)"
    : v.phase === "ready" ? (v.spare ? "Waiting for the first press" : "A spare balloon waits") : v.phase === "pop" ? "ফটাস!" : v.phase === "glide" ? "Cleared: floating free" : "Flying";
export const state = (v: any) => ({
  Run: run(v),
  Window: !v.visible || !v.focused || !v.inView ? "Away: another window, a hidden tab or the lane scrolled off" : "You're on the lane",
});
const STEPS: Record<string, string | null> = {
  YouTapTheBalloon: "you tap the title balloon",
  YouPress: null,
  StepTakesPress: "you press: the balloon flies",
  YouLetGo: null,
  BalloonPops: "the balloon touches a wire, a crow or the street",
  PopEnds: "the pop ends",
  LastCrossing: "the last crossing is passed (stars kept)",
  GlideEnds: "the card shows",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  ScrollAway: "you scroll the lane away",
  ScrollBack: "you scroll the lane back",
  YouOpenTheMenu: "you press pause",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: "you press নতুন করে শুরু",
  YouOpenTheList: "you open সব লেভেল",
  YouCloseTheList: "you close the list",
  YouPickALevel: "you pick a level",
  YouPlayOn: "you pick পরের লেভেল or আবার খেলো",
  ChimesEnd: null,
  SoundOff: null,
  SoundOn: null,
};
export const step = (action: string) => action in STEPS ? STEPS[action] : action;
export const group = (v: any) => v.phase === "over" ? "done" : v.paused || v.sheet ? "held" : v.phase === "title" || v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
