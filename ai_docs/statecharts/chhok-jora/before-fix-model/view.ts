export const title = "ছক-জোড়া: the quilt, the tab, the finger and কাটাকুটি";
export const state = (v: any) => ({
  Quilt: v.left === 0 ? (v.beat ? "Quilt just finished" : "Result on screen") : v.paused ? "Paused" : !v.started ? "Fresh quilt" : v.turn === "bot" ? "Bot's turn" : "Your turn",
  Screen: v.mode === "quilt" ? "Quilt on screen" : v.kturn === "bot" ? "কাটাকুটি, bot's turn" : v.kturn === "over" ? "কাটাকুটি round over" : "কাটাকুটি, your turn",
  Tab: v.visible ? "Tab showing" : "Tab hidden",
  Finger: v.held === "yes" ? "Finger on the cloth" : v.held === "stale" ? "Page still thinks a finger is down" : "No finger",
  Cheer: v.cheer ? "Cheer on its way" : "Quiet",
});
export const step = (action: string, from: any, to: any) => {
  const sew = (who: string) => to.left === 0 ? `${who} the last box` : `${who} a stitch`;
  const labels: Record<string, string | null> = {
    YouTouchTheCloth: "you touch the cloth",
    YouLiftYourFinger: from.left !== to.left || from.turn !== to.turn ? sew("you sew") : "you lift your finger",
    YouPressEnterOnAGap: to.left === 0 ? "you press Enter on the last gap" : null,
    TheTouchIsCancelled: null,
    TheBotSews: sew("the bot sews"),
    TabHides: "you hide the tab",
    TabShows: "the tab shows again",
    YouResume: "you press চালিয়ে যাও",
    TheCheerPlays: "the cheer plays",
    TheMomentPasses: "a moment passes",
    YouStartANewQuilt: "you press আরেকবার or Enter",
    YouPickAQuiltMode: "you pick a quilt mode",
    YouOpenKatakuti: "you open কাটাকুটি",
    YouMarkACell: "you mark a cell",
    TheKatakutiBotMarks: "the কাটাকুটি bot marks",
    YouPlayAnotherRound: "you press আরেক দান",
  };
  return action in labels ? labels[action] : action;
};
export const group = (v: any) => v.left === 0 ? "done" : v.paused ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
