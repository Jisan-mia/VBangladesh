export const title = "পাটি বুনি: round, window, hand and the bundle";
const game = (v: any) => {
  if (v.phase === "over") return "Frame full, slip shows";
  if (v.phase === "ready") return "Start card";
  if (v.phase === "paused") return v.stack ? "Paused, stack half full" : "Paused";
  const stack = v.stack ? "stack half full" : "stack low";
  return v.breath ? `Breath after resuming, ${stack}` : `Strips falling, ${stack}`;
};
export const state = (v: any) => ({
  Game: game(v),
  Window: !v.visible ? "Tab hidden" : !v.focused ? "Another window has focus" : v.inView ? "Board on screen" : "Scrolled past the board",
  Hand: ({ none: "Hands off", side: "Holding ◀ or ▶", down: "Holding নামাও or ↓" } as any)[v.hand],
  Bundle: v.friend ? "Friend's bundle" : "Own bundle",
});
export const step = (action: string, from: any, to: any) => ({
  YouStart: "you press শুরু করো",
  YouHoldAControl: "you hold a control",
  YouLetGo: "you let go",
  StripLands: to.phase === "over" ? "the last strip tops out" : to.stack !== from.stack ? "a strip lands and the stack grows" : "a strip lands and weaves a row",
  BreathEnds: "the breath ends",
  WindowBlurs: "you click into another window",
  WindowFocuses: "you come back to the window",
  TabHides: "you hide the tab",
  TabShows: "the tab shows again",
  YouScrollAway: "you scroll past the board",
  YouScrollBack: "you scroll back to the board",
  YouPause: "you press pause",
  YouResume: "you press চালিয়ে যাও",
  YouPlayAgain: "you press আরেকবার",
  YouPlayFromTheCard: "you press আরেকবার খেলো under the card",
  FriendLinkOpens: "you open a friend's link",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "over" ? "done" : v.phase === "paused" || v.phase === "ready" ? "held" : "play";
export const colors = { play: "teal", held: "yellow", done: "blue" };
