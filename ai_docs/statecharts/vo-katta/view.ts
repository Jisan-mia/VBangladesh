export const title = "ভো-কাট্টা: the evening, the window, your hand and the wind";
const evening = (v: any) =>
  v.phase === "ready" ? "Waiting on the roof" : v.phase === "over" ? "Card shows" : v.phase === "paused" ? "Paused" : "Flying kites";
export const state = (v: any) => ({
  Evening: evening(v),
  Window: !v.visible ? "Tab hidden" : !v.focused ? "Another window has focus" : v.inView ? "You're on the sky" : "Sky scrolled away",
  Hand: v.held ? "Holding টান or a key" : "Hands off",
  Sound: v.wind ? "Wind playing" : v.sound ? "Sound on, no wind" : "Sound off",
});
const STEPS: Record<string, string | null> = {
  YouStart: "you tap শুরু করো",
  YouHold: "you hold টান, a key or drag the sky",
  YouLetGo: "you let go",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  ScrollAway: "you scroll the sky away",
  ScrollBack: "you scroll the sky back",
  YouPause: "you press pause",
  YouResume: "you press চালিয়ে যাও",
  RoundEnds: "the round's clock runs out",
  NextRoofStarts: "the next roof starts",
  LastRoundEnds: "the last round ends and the card shows",
  FanfareFires: null,
  SoundOff: null,
  SoundOn: null,
  PlayAgain: "you press আবার খেলো",
  YouPickALevel: null,
};
export const step = (action: string) => action in STEPS ? STEPS[action] : action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : v.phase === "ready" ? "wait" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue", wait: "tan" };
