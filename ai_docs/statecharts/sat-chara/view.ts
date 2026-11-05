export const title = "Sat Chara: the throw, the window, your hand, the hum";
const game = (v: any) => v.screen === "title" ? "Title" : v.screen === "over" ? "Result" : v.phase === "flying" ? "Ball in the air" : "Aiming";
export const state = (v: any) => ({
  Game: game(v),
  Page: !v.visible || !v.focused ? "Away" : v.paused || v.sheet ? "Menu or list open" : "On the page",
  Hand: v.hold === "pull" && v.dragging ? "Pulling the ball back" : "Not pulling",
  Hum: !v.sound ? "Sound off" : v.hum ? "Hum on" : "Sound on, no hum",
});
export const step = (action: string) => ({
  YouStart: "you press খেলো",
  YouPressTheLane: "you put a finger on the lane",
  YouPullBack: "you pull the ball back",
  YouLetGo: "you let go",
  YouCancelThePull: "you bring it back to the start, or the touch is cancelled",
  YouPressEnter: "you press Space or Enter",
  YouLiftEnter: "you lift the key",
  SomeStillStand: "the ball stops and some pieces stand",
  RoundEnds: "the round ends: all seven down, or the last ball",
  TheResultSettles: "the end screen settles",
  YouChooseOnTheResult: "you press পরের লেভেল or আবার খেলো",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouPause: "you open the pause menu",
  YouResume: "you press চালিয়ে যাও",
  YouRestart: "you press নতুন করে শুরু in the menu",
  TheBreathPasses: "a moment passes",
  YouOpenTheList: "you open সব লেভেল",
  YouOpenTheListFromTheMenu: "you open সব লেভেল from the menu",
  YouCloseTheList: "you close the list",
  YouPickALevel: "you pick a level",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.paused || v.sheet || !v.focused || !v.visible ? "held" : v.screen === "over" ? "done" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
