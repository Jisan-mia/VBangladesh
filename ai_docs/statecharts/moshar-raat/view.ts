export const title = "মশার রাত: the night, the window and the whine";
const night = (v: any) =>
  v.phase === "ready" ? "Lights on, waiting" : v.phase === "won" ? "Dawn: card shows" : v.phase === "lost" ? "Woken up: card shows" : v.paused ? "Paused" : "Mosquitoes flying";
export const state = (v: any) => ({
  Night: night(v),
  Window: !v.visible ? "Tab hidden" : !v.focused ? "Another window has focus" : v.inView ? "You're on the room" : "Room scrolled away",
  Whine: v.whine === "live" ? "পিন-পিন playing" : v.whine === "stub" ? "Whine silent (made while muted)" : "No whine",
  Sound: v.sound ? "Sound on" : "Sound off",
});
const STEPS: Record<string, string | null> = {
  YouStart: "you tap শুরু করো",
  MosquitoesFly: "a mosquito flies near",
  DawnComes: "dawn comes",
  ThirdBite: "the third bite wakes the sleeper",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  ScrollAway: "you scroll the room away",
  ScrollBack: "you scroll the room back",
  YouResume: "you press চালিয়ে যাও",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  YouPlayAgain: "you press আবার খেলো",
  YouPickANight: null,
};
export const step = (action: string) => action in STEPS ? STEPS[action] : action;
export const group = (v: any) => v.phase === "won" || v.phase === "lost" ? "done" : v.paused ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
