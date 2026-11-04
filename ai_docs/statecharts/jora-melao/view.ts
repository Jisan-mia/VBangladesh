export const title = "জোড়া মেলাও: the board, the hidden tab and the levels";
const board = (v: any) => v.paused ? "Paused" : ({
  ready: "Fresh board, demo pair up",
  none: "Your move",
  one: "One card up",
  missed: "Missed pair showing",
  over: v.panel ? "সব জোড়া মিলেছে panel" : "Last pair found",
} as any)[v.board];
export const state = (v: any) => ({
  Board: board(v),
  Tab: v.visible ? "Tab showing" : "Tab hidden",
  Levels: v.stars[2] > 0 && v.stars[1] === 0 ? "Level 2 has stars, level 1 never played" : v.link === "friend" ? "Opened from a friend's level 2 link" : "Opened on level 1",
});
export const step = (action: string, from: any, to: any) => {
  if (action === "YouFlipACard") {
    const skip = (x: any) => x.stars[2] > 0 && x.stars[1] === 0;
    if (skip(to) && !skip(from)) return "you match the last pair of the friend's level 2";
    return to.board === "missed" ? "you flip a card that doesn't match" : to.board === "over" ? "you match the last pair" : to.board === "none" ? "you flip a match" : "you flip a card";
  }
  const labels: Record<string, string | null> = {
    YouTapAMissedCard: "the missed pair turns back",
    TheMissTurnsBack: "the missed pair turns back",
    TabHides: "you hide the tab",
    TabShows: "the tab shows again",
    YouResume: "you press চালিয়ে যাও",
    ThePanelShows: "the panel appears",
    TheCheerPlays: null,
    YouPressNextLevel: "you press পরের লেভেল or আবার খেলো",
    YouPlayAgain: "you press পরের লেভেল or আবার খেলো",
    YouPickALevel: "you pick a level under সব লেভেল",
  };
  return action in labels ? labels[action] : action;
};
export const group = (v: any) => v.board === "over" ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
