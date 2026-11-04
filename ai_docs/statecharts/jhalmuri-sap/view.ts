export const title = "Jhalmuri Sap: the run, the story, pause, going away, the card and held keys";
export const state = (v: any) => ({
  Game: ({ title: "Title screen", story: "Story plays", playing: "Snake moving", paused: "Paused (player's menu)", over: "Card shows" } as any)[v.phase],
  Away: ({ "": "You're on the game", blur: "Another window has focus", hide: "Tab hidden", scroll: "Stage scrolled away" } as any)[v.away],
  Card: v.cheer ? "Celebration queued" : v.guard ? "Card buttons wait 0.7 s" : "Card buttons ready",
  Keys: v.held ? "A key is held down" : "No key held",
});
export const step = (action: string, from: any, to: any) => {
  if (action === "GoAway") return to.away === "blur" ? "you click into another window" : to.away === "hide" ? "you hide the tab" : "you scroll the stage away";
  if (action === "RunEnds") return to.cheer ? "the run ends with a celebration" : "the run ends";
  return ({
    YouStart: "you press খেলো", StoryEnds: "the story ends or you hold to skip", YouPause: "you press ⏸ or Escape", YouResume: "you press চালিয়ে যাও",
    YouHoldKey: "you hold a key down", YouLetGo: "you let go", GuardLifts: "0.7 s pass", CheerPlays: "the confetti plays",
    YouPlayAgain: "you press আবার খেলো (or a fresh Enter)", HeldKeyRepeats: "the held key repeats on the card",
    YouReset: "you press নতুন করে শুরু or pick a level", ComeBack: "you come back",
  } as Record<string, string>)[action] ?? action;
};
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" ? "held" : v.phase === "title" ? "wait" : "play";
export const colors = { wait: "blue", play: "teal", held: "yellow", done: "blue" };
