export const title = "কোনটা নেই?: shelf, window, hum and level list";
const game = (v: any) => {
  if (v.paused) return v.phase === "ask" ? "Paused on the question" : "Paused while looking";
  if (v.blink === "toAsk") return "Eyes closing, মামা takes one";
  if (v.blink === "toNextShelf" || v.blink === "toNewLevel") return "Eyes closing before a shelf";
  return ({ ready: "Shutter down", look: "Looking at the shelf", ask: "কোনটা নেই? choices", reveal: "Answer shown", over: "Level card" } as any)[v.phase];
};
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : v.focused ? "You're on the page" : "Another window has focus",
  Hum: v.hum ? "Hum on" : "Hum off",
  Sound: v.sound ? "Sound on" : "Sound off",
  Clock: v.overcharged ? "Away time charged" : "Fair clock",
  Levels: v.drawer ? "Level list open" : "Level list shut",
});
const steps: Record<string, string | null> = {
  YouStart: "you press শুরু করো",
  LookTimeEnds: "the look time runs out",
  EyesOpenOnTheGap: "the eyes open on the shelf with a gap",
  YouAnswer: "you pick an answer",
  YouTapNextShelf: "you press পরের তাক",
  YouPlayOn: "you press আবার খেলো or পরের লেভেল",
  EyesOpenOnAShelf: "the eyes open on a new shelf",
  YouPickALevel: null,
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  YouResume: "you press চালিয়ে যাও",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  YouOpenTheLevels: "you open সব লেভেল",
  YouCloseTheLevels: "you close সব লেভেল",
};
// The level arrows / drawer pick (a reset to the shutter from every state) is hidden; see README.
export const step = (action: string) => (action in steps ? steps[action] : action);
export const group = (v: any) => v.phase === "over" ? "done" : v.paused ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
