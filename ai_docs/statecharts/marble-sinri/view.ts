export const title = "Marble Sinri (মার্বেল-সিঁড়ি): run, window, held side, hum and chime";
const game = (v: any) => v.view === "over" ? "Result shows" : v.paused ? "Paused" : v.view === "ready" ? "First screen" : "Marble rolling down";
const moving = (v: any) => v.view === "play" && !v.paused && v.visible && !v.away;
const where = (v: any) => !v.visible ? "Tab hidden" : !v.focused ? (moving(v) ? "Away, stairs moving" : "Away, stairs frozen") : "On the page";
const side = (v: any) => v.held && !v.hand ? "Marble rolls on its own" : v.held ? "You hold a side" : v.hand ? "Holding, game didn't notice" : "Hands off";
const hum = (v: any) => !v.sound ? "Sound off" : v.hum === "real" ? "Hum on" : v.hum === "stub" ? "Hum stuck silent" : "Hum off";
export const state = (v: any) => ({
  Game: game(v),
  You: where(v),
  Side: side(v),
  Hum: hum(v),
  Chime: v.chimedWrong ? "Chime played out of place" : v.chime ? "Chime coming" : "No chime due",
});
const labels: Record<string, string> = {
  YouHoldSide: "you hold a side",
  YouLetGo: "you let go",
  AFloorIsCleared: "you clear a floor without a fall",
  TheChimePlays: "the chime plays",
  TheRunEnds: "you lose the last chance",
  YouPlayAgain: "you play again or pick a floor",
  YouPause: "you press থামাও or P",
  YouResume: "you press চালিয়ে যাও",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
};
export const step = (action: string) => labels[action] ?? action;
export const group = (v: any) => v.view === "over" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
