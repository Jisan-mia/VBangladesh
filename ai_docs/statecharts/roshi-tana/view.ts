export const title = "রশি টানাটানি after the rewrite: the match, the window, the list, the clock and the crowd";
const match = (v: any) =>
  v.phase === "title" ? "Title drum waiting" : v.phase === "over" ? "Card shows" : v.sheet ? "Level list open" : v.paused ? "Paused (menu)" : v.unseen > 0 ? "Beats going by unseen" : "Pulling on the beat";
export const state = (v: any) => ({
  Match: match(v),
  Window: !v.visible ? "Tab hidden" : !v.focused ? "Another window has focus" : v.inView ? "You're on the field" : "Stage scrolled away",
  Crowd: v.hum === "live" ? "Crowd playing" : v.hum === "stub" ? "Crowd silent (made while muted)" : "No crowd",
  Sound: v.sound ? "Sound on" : "Sound off",
});
const STEPS: Record<string, string | null> = {
  YouStart: "you tap the drum to start",
  YouWinTheMatch: "the ribbon reaches our line",
  YouLoseTheMatch: "the ribbon reaches their line",
  BeatGoesByUnseen: "a beat goes by while the loop is frozen",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  ScrollAway: "you scroll the stage away",
  ScrollBack: "you scroll the stage back",
  YouPause: "you press ⏸ or P",
  YouResume: "you press চালিয়ে যাও (a fresh ৩-২-১)",
  OpenTheList: "you open the level list",
  CloseTheList: "you close the level list",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
};
export const step = (action: string) => action in STEPS ? STEPS[action] : action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "title" ? "wait" : v.paused || v.sheet ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
