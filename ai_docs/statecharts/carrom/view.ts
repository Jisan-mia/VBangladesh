export const title = "Carrom after the rewrite: board, window, hand and hum, boards";
const game = (v: any) => v.phase === "title" ? (v.why === "sheet" ? "Start card, সব বোর্ড open" : "Start card")
  : v.phase === "over" ? (v.cheer ? "End slip, fanfare queued" : "End slip")
  : v.phase === "paused" ? (v.why === "sheet" ? "Paused by সব বোর্ড" : "Paused (থেমে আছে)")
  : v.shot === "rolling" ? "Discs rolling" : "Aiming";
// Sound folds into the hand: with nothing held the switch changes nothing you can hear.
const hand = (v: any) => v.hold === "none" ? (v.hum ? "Hands off, hum playing" : v.sound ? "Hands off" : "Hands off, sound off")
  : v.hum ? "Pulling, hum playing" : v.sound ? "Pulling, quiet" : "Pulling, sound off";
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : !v.focused ? "Another window has focus" : v.inView ? "Board on screen" : "Scrolled past the board",
  Hand: hand(v),
  Boards: v.open === 2 ? "Board 2 opened by clearing board 1" : v.cleared === "skipped" ? "Only a friend's board 2 cleared, board 2 still shut" : "Board 1 open",
});
export const step = (action: string, from: any, to: any) => ({
  YouPressStart: "you press শুরু করো",
  YouPull: "you pull back or hold মারো",
  YouLetGoOfThePull: from.shot === "aim" && to.shot === "rolling" ? "you let go and the striker flies" : "you let go",
  YouPressSpace: "you hold Space",
  YouReleaseSpace: "you let go of Space",
  DiscsStop: to.phase === "over" ? (to.cleared !== from.cleared ? "the discs stop and the board is cleared" : "the discs stop and the strikes run out") : "the discs stop",
  FanfarePlays: "the fanfare plays",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouScrollAway: "you scroll past the board",
  YouScrollBack: "you scroll back to the board",
  YouResume: "you press চালিয়ে যাও",
  YouOpenTheSheet: "you open সব বোর্ড",
  YouCloseTheSheet: "you close সব বোর্ড",
  YouPickABoard: "you pick a board",
  YouLeaveTheResult: "you press পরের বোর্ড or আবার খেলো",
  FriendLinkOpens: "you open a friend's board-2 link",
  YouChangeTheHand: "you pick সহজ, মাঝারি or ওস্তাদ",
  SoundOff: "you turn sound off",
  SoundOn: "you turn sound on",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
