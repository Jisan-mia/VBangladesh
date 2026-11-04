export const title = "নদী পার: the crossing, the window, the water and the river you're on";
export const state = (v: any) => ({
  River: ({ ready: "Ready card", playing: "Crossing", paused: "Paused (খেলা থেমে আছে)", over: "Across: card shows" } as any)[v.phase],
  Which: v.runLevel !== 0 && v.level !== v.runLevel ? "Page names another river" : v.misSaved ? "Saved under the wrong river" : "Page names your river",
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Water: v.water ? "Water sound on" : "Water sound off",
  Space: v.key ? "Space held down" : "Space up",
});
export const step = (action: string) => ({
  YouStart: "you start the crossing",
  YouPlayAgain: "you press আবার খেলো",
  YouReachTheGhat: "you reach the far ghat",
  CheerFires: "the cheer plays",
  YouPause: "you press থামাও",
  YouResume: "you press চালিয়ে যাও",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  YouOpenRivers: "you open সব নদী",
  YouCloseRivers: "you close সব নদী",
  YouPickARiver: "you pick a river",
  FriendLinkArrives: "a friend's link opens in this tab",
  YouHoldSpaceForTheLastHop: "you hold Space for the last hop",
  SpaceRepeatsOnTheCard: "Space, still held, repeats on the card",
  YouLetGoOfSpace: "you let go of Space",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
