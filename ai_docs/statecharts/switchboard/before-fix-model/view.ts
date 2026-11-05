export const title = "সুইচবোর্ড: board, pause, hum and levels";
const skipped = (v: any) => { const c = [...(v.cleared ?? [])]; return c.includes(2) && !c.includes(1); };
const locked = (v: any) => { const c = [...(v.cleared ?? [])]; return v.level === 2 && !c.includes(1) && !c.includes(2); };
// One flat chart: what the board shows, whether the hum plays, and whether you're on a level you never opened.
export const state = (v: any) => {
  if (v.solved) return skipped(v) ? "All bulbs lit, level 2 saved though level 1 never was" : "All bulbs lit, stars show";
  if (v.paused) return v.moves === v.frozenAt ? "Paused, board as you left it" : "Paused, but a move was taken back";
  if (!v.visible) return "Tab hidden";
  if (v.moves === 0) return locked(v) ? "Fresh board on a locked level" : "Fresh board";
  return v.hum !== "real" && v.sound ? "Flipping switches, hum silent though sound is on" : "Flipping switches, hum plays when sound is on";
};
// "you start a new board" covers শুরু থেকে, আবার খেলো, পরের লেভেল and সব লেভেল: each leaves for a fresh board.
export const step = (action: string) => ({
  YouPressASwitch: "you press a switch",
  YouLightTheLastBulb: "you light the last bulb",
  YouTakeBack: "you press Z to take back",
  YouStartOver: "you start a new board",
  YouGoToNextLevel: "you start a new board",
  YouPickALevel: "you start a new board",
  FriendLinkOpens: "you open a friend's link",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouResume: "you press চালিয়ে যাও",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  ChimesPlay: "the star chimes play",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.solved ? "done" : v.paused || !v.visible ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
