export const title = "Sat Chara: the throw, the window, your hand, the hum";
const game = (v: any) => v.paused ? "Paused, ball in the air"
  : ({ aim: "Aiming", flying: "Ball in the air", clear: "Result shows", fail: "Result shows" } as any)[v.phase];
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Hand: v.aim === "drag" ? "Pulling the ball back" : "Not pulling",
  Hum: !v.sound ? "Sound off" : v.hum ? "Hum on" : "Sound on, no hum",
});
export const step = (action: string) => ({
  YouPullBack: "you pull the ball back",
  YouLetGo: "you let go and the ball flies",
  YouPullBackToStart: "you bring it back to the start, or the touch is cancelled",
  YouTap: "you tap",
  YouPressEnter: "you press Enter",
  EnterRepeats: "you keep holding Enter",
  YouLiftEnter: "you lift Enter",
  AllSevenDown: "the throw ends: all seven down, or the last ball",
  SomeStillStand: "some stay standing; next ball",
  LastBallGone: "the throw ends: all seven down, or the last ball",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  YouMoveOn: "you press পরের লেভেল or আবার খেলো",
  PickLevel: "you pick a level in সব লেভেল",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.paused ? "held" : v.phase === "clear" || v.phase === "fail" ? "done" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
