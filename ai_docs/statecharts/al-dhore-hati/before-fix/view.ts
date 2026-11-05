export const title = "আল ধরে হাঁটি: the walk, the window, your hand and the wind";
const walk = (v: any) =>
  v.phase === "ready" ? "Standing at the ridge" : v.phase === "won" ? "Across: card shows" : v.phase === "fell" ? "Fell: card shows" : v.paused ? "Paused" : "Walking the আল";
export const state = (v: any) => ({
  Walk: walk(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Hand: v.held ? "Holding ← or →" : "Hands off",
  Wind: v.wind === "live" ? "Wind playing" : v.wind === "stub" ? "Wind silent (made while muted)" : "No wind",
  Field: v.field === "friend" ? "Friend's field" : "A fresh field",
});
const STEPS: Record<string, string | null> = {
  YouOpenAFriendsLink: "you open a friend's link",
  YouStart: "you tap শুরু করো",
  YouHoldASide: "you hold ← or →",
  YouLetGo: "you let go",
  TheWindBlows: "the wind starts to blow",
  YouReachTheEnd: "you reach the end of the field",
  YouFallTheThirdTime: "you slip the third time",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  SoundOff: null,
  SoundOn: null,
  YouTryAgainAfterAFall: "you press আরেকবার",
  YouPlayAgainAfterAWin: "you press আবার খেলো",
  YouPickAnotherLevel: "you pick a level (the walk starts at once)",
};
export const step = (action: string) => action in STEPS ? STEPS[action] : action;
export const group = (v: any) => v.phase === "won" || v.phase === "fell" ? "done" : v.paused ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
