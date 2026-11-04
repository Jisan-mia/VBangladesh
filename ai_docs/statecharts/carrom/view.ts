export const title = "ক্যারম: board, window, hand and hum, boards";
const game = (v: any) => v.phase === "over" ? "Strikes done, slip shows"
  : v.phase === "paused" ? (v.shot === "rolling" ? "Paused mid-roll" : "Paused, aiming")
  : v.phase === "ready" ? "Board waiting for the first strike"
  : v.shot === "rolling" ? (v.resized ? "Discs rolling, striker resized" : "Discs rolling") : "Aiming the next strike";
const hand = (v: any) => {
  const held = ({ none: "Hands off", pull: "Pulling back", space: "Holding Space" } as any)[v.hand];
  return v.hum ? `${held}, hum playing` : v.hand === "none" ? held : `${held}, quiet`;
};
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : !v.focused ? "Another window has focus" : v.inView ? "Board on screen" : "Scrolled past the board",
  Hand: hand(v),
  Sound: v.sound ? "Sound on" : "Sound off",
  Boards: ({ none: "No board passed", inOrder: "Board 1 passed", skipped: "Only board 2 passed, board 2 open for good" } as any)[v.cleared],
});
export const step = (action: string, from: any, to: any) => action === "YouLetGoToShoot" ? (from.hand === "space" ? "you let go of Space and the striker flies" : "you let go and the striker flies") : ({
  YouPull: "you pull back or hold মারো",
  YouHoldSpace: "you hold Space",
  YouLetGoToShoot: "you let go and the striker flies",
  YouScrollAway: "you scroll past the board",
  YouScrollBack: "you scroll back to the board",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouPause: "you press pause",
  YouResume: "you press চালিয়ে যাও",
  DiscsStop: from.cleared === to.cleared ? "the discs stop" : `the discs stop and board ${to.level} is passed for the first time`,
  YouToggleBigStriker: "you tap বড় স্ট্রাইকার",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
  YouPlayAgain: "you press আবার খেলো",
  YouGoToNextBoard: "you press পরের বোর্ড",
  YouPickABoard: "you pick a board",
  FriendLinkOpens: "you open a friend's board-2 link",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
