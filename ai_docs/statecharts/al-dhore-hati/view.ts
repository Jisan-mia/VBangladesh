export const title = "Al Dhore Hati: the screen, the menu, the window, your hand and the wind";
const screen = (v: any) =>
  v.screen === "title" ? "Title: the signboard" : v.screen === "ready" ? "Ready card: this level's new thing" : v.screen === "over" ? "End screen" : v.sheet ? "Level list open" : v.paused ? "Paused" : "Walking the আল";
export const state = (v: any) => ({
  Screen: screen(v),
  Window: v.focused ? "You're on the page" : "Another window has focus (or the tab is hidden)",
  Hand: v.finger ? "A finger on the field" : v.held ? "Holding ← or →" : "Hands off",
  Wake: v.guard ? "Just back: presses only wake the game" : "Ready for presses",
  Wind: v.wind ? "Wind playing" : "No wind",
  Field: v.field === "friend" ? "Friend's field" : "A fresh field",
});
const STEPS: Record<string, string | null> = {
  YouOpenAFriendsLink: "you open a friend's link",
  YouTapChalo: "you tap চলো on the title",
  YouPickAnUnseenLevel: "you pick a level you haven't met (its card shows first)",
  YouPickASeenLevel: "you pick a level you know (the walk starts)",
  YouTapChaloOnTheCard: "you tap চলো on the card",
  YouHoldAKey: "you hold ← or →",
  YouPressTheField: "you press the field",
  YouLetGo: "you let go",
  TheWalkAdvances: "the walk takes a step",
  YouReachTheEnd: "you reach the yard or slip the last time",
  WindowBlurs: "you click into another window (or hide the tab)",
  WindowFocuses: "you come back to the window (or the tab)",
  GuardEnds: "a quarter second passes",
  TheMenuOpens: "the menu opens",
  YouResume: "you press চালিয়ে যাও",
  YouOpenTheList: "you open সব লেভেল",
  YouCloseTheList: "you close the list",
  SoundOff: null,
  SoundOn: null,
  YouTryAgain: "you press আবার খেলো (or আরেকবার)",
};
export const step = (action: string) => action in STEPS ? STEPS[action] : action;
export const group = (v: any) => v.screen === "over" ? "done" : v.screen === "play" && !v.paused && !v.sheet ? "play" : v.screen === "play" ? "held" : "wait";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
