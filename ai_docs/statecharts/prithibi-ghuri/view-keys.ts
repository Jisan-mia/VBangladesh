export const title = "পৃথিবী ঘুরি: a held Enter on postcards and results";
export const state = (v: any) => ({
  Screen: ({ card1: "Postcard 1", card2: "Last postcard", ask: "The stamp question", answered: "Right answer, ➜ waits", end: "The end screen" } as any)[v.screen],
  Key: v.held ? "Enter held" : "Keys up",
  Skipped: v.skippedCard ? "A postcard flew past unseen" : v.skippedResult ? "A result flew past unseen" : "Nothing skipped",
});
export const step = (action: string) => ({
  YouPressEnter: "the child presses Enter",
  YouPressEnterOnAQuestion: "the child presses Enter on the question (nothing happens)",
  TheKeyRepeats: "the held Enter repeats (old)",
  YouLetGo: "the child lets go of the key",
  YouTapTheRightPicture: "the child taps the right picture",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.skippedCard || v.skippedResult ? "bad" : v.screen === "end" ? "done" : "play";
export const colors = { play: "teal", done: "blue", bad: "orange" };
