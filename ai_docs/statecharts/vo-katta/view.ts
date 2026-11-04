export const title = "ভো-কাট্টা: the evening, the window, your hand and the wind";
const evening = (v: any) =>
  v.sheet ? "Level list open" : v.phase === "title" ? "On the title" : v.phase === "over" ? "Card shows" : v.paused ? "Paused (menu)" : v.phase === "ready" ? "Waiting for the first touch" : v.hooked ? "In a প্যাঁচ" : "Flying";
export const state = (v: any) => ({
  Evening: evening(v),
  Window: !v.visible || !v.focused || !v.inView ? "Away: another window, a hidden tab or the sky scrolled off" : "You're on the sky",
});
const STEPS: Record<string, string | null> = {
  YouTapTheKite: "you tap the title kite",
  YouTouchTheSky: "you put a finger on the sky",
  YouLetGo: null,
  StringsCross: "the strings cross",
  YouCutOne: "you cut one (ভো-কাট্টা!)",
  TheyCutYours: "they cut yours",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  ScrollAway: "you scroll the sky away",
  ScrollBack: "you scroll the sky back",
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
