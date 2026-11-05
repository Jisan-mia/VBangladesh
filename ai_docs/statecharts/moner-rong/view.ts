export const title = "Moner Rong: the picture book, pause and focus, the stars and the daily limit";
const game = (v: any) => {
  if (v.screen === "title" || v.screen === "list") return "Title or level list";
  if (v.screen === "end") return "End screen";
  const picture = `Picture ${v.picture}`;
  if (v.step === "name") return `${picture}: a grey ?, faces on offer`;
  if (v.step === "kind") return `${picture}: the colour is filled, two kind things`;
  return v.picture === 2 ? "Last picture won and recorded, → shows" : `${picture}: settled, → shows`;
};
export const state = (v: any) => ({
  Game: game(v),
  Pause: v.menu ? "Pause menu" : v.swallow || v.window !== "here" ? "Away, next tap only wakes" : "Playing",
  Saved: `${v.plays} played, ${v.stars} stars, ${v.cardPictures} pictures on the card`,
  Today: v.resting ? "Rest screen (আজ এটুকুই)" : "No rest screen",
});
export const step = (action: string) => ({
  YouPressStart: "খেলো or আবার খেলো",
  TheSettleTimePasses: "a third of a second passes",
  YouTapTheRightFace: "the child taps the face that fits",
  YouTapAKindPicture: "the child taps a kind picture",
  YouPressNext: "the child presses →",
  TheGuardPasses: "the end screen's guard passes",
  YouPressShesh: "শেষ",
  YouOpenTheList: "সব লেভেল",
  YouPickAllLevelsInThePauseMenu: "সব লেভেল in the pause menu",
  YouPickALevel: "a level is picked",
  ThePageOpens: "the page opens again",
  YouPressPause: "⏸ or P",
  WindowBlurs: "the window or tab goes away",
  TabHides: "the window or tab goes away",
  YouComeBack: "the window is back",
  YouResume: "চালিয়ে যাও",
  YouRestart: "নতুন করে শুরু",
  TimeIsUp: "today's play time runs out",
  AParentGivesMoreTime: "a parent gives ১০ মিনিট more",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.resting ? "held" : v.screen === "play" ? "play" : "done";
export const colors = { play: "teal", held: "yellow", done: "blue" };
