export const title = "Kagojer Urojahaj (কাগজের উড়োজাহাজ): wave, window, steering and wind";
const game = (v: any) => v.view === "end" ? (v.cheer ? "Result, cheer coming" : "Result shows") : v.paused ? "Paused" : v.view === "ready" ? "First screen (উড়াও)" : "Wave in play";
const moving = (v: any) => v.view === "play" && !v.paused && v.visible && !v.away;
const where = (v: any) => !v.visible ? "Tab hidden" : !v.focused ? (moving(v) ? "Away, sky moving" : "Away, sky frozen") : "On the page";
const steering = (v: any) => v.held && !v.hand ? "Plane steers on its own" : v.held ? "You steer" : v.hand ? "Holding, game didn't notice" : "Hands off";
export const state = (v: any) => ({
  Game: game(v),
  You: where(v),
  Steering: steering(v),
  Wind: v.wind === "real" && v.sound ? "Wind blows" : v.sound ? "Wind quiet" : "Sound off",
});
const labels: Record<string, string> = {
  YouLaunch: "you press উড়াও",
  YouHoldSteer: "you hold a side",
  YouLetGo: "you let go",
  TheWaveEnds: "the wave ends",
  TheCheerPlays: "the cheer plays",
  YouPlayAgain: "you play again or pick a level",
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
export const group = (v: any) => v.view === "end" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
