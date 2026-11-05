export const title = "পৃথিবী ঘুরি: the level list and the trip under it";
export const state = (v: any) => ({
  Screen: v.screen === "title" ? "The envelope" : v.screen === "end" ? "The end screen" : v.screen === "levels" ? (v.back === "play" ? "The level list, the trip waiting under it" : "The level list")
    : v.paused ? "Trip, pause menu open" : v.progress === 0 ? "A trip just begun" : v.progress === 1 ? "A trip under way" : "Nearly done",
  Dropped: v.dropBy === "tap" ? "A trip dropped by one tap" : v.dropBy === "menu" ? "A trip replaced from the list" : "Nothing dropped",
});
export const step = (action: string) => ({
  YouStartATrip: "the child taps উড়াল দাও or আবার খেলো",
  TheTripMovesOn: "the trip moves on",
  TheTripEnds: "the last answer, ➜",
  YouOpenThePauseMenu: "⏸, P, Esc, or the window blurs",
  YouResume: "চালিয়ে যাও",
  YouOpenTheLevelList: "the child opens the level list",
  YouOpenTheListFromTheMenu: "সব লেভেল in the pause menu",
  YouCloseTheList: "ফিরে যাও",
  YouPickALevel: "the child picks a level",
  YouTapATripNumber: "a tap on a trip number (old)",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.dropBy === "tap" ? "bad" : v.screen === "levels" ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue", bad: "orange" };
