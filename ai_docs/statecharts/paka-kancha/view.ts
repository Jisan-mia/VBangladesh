export const title = "পাকা-কাঁচা: the row, the Enter key and the levels";
const over = (v: any) => v.won || v.guesses === 1;
export const state = (v: any) => ({
  Game: over(v) ? "Result shows" : v.input === "full" ? "Four digits typed" : v.input === "part" ? "Typing a row" : "Row empty",
  Focus: v.focus === "page" ? "Focus on the page" : v.focus === "erase" ? "Focus on মুছো" : "Focus on a level button",
  Enter: v.enter === "fine" ? "Enter did what it said" : "Enter threw a full row away",
  Levels: v.stars[2] > 0 && v.stars[1] === 0 ? "Level 2 has stars, level 1 never played" : v.link === "friend" ? "Opened from a friend's level 2 link" : "Opened on level 1",
});
export const step = (action: string, from: any, to: any) => {
  if (action === "YouPressEnter" || action === "YouTapCheck") {
    if (from.focus !== "page" && action === "YouPressEnter") return "you press Enter";
    const skip = (x: any) => x.stars[2] > 0 && x.stars[1] === 0;
    if (skip(to) && !skip(from)) return "you crack the friend's level 2 code";
    return to.won ? "you check the row and it's right" : "you check the row and it's wrong";
  }
  const labels: Record<string, string | null> = {
    YouTypeADigit: "you type a digit",
    YouTapADigit: "you tap a digit on the pad",
    YouTapErase: "you tap মুছো",
    YouClickTheBoard: "you click the board",
    YouPickALevel: "you pick a level under সব লেভেল",
    YouPressNextLevel: "you press পরের লেভেল or আবার খেলো",
    YouPlayAgain: "you press পরের লেভেল or আবার খেলো",
    TheCheerPlays: null,
  };
  return action in labels ? labels[action] : action;
};
export const group = (v: any) => over(v) ? "done" : "play";
export const colors = { play: "teal", done: "blue" };
