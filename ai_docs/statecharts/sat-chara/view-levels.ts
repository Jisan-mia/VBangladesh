export const title = "Sat Chara: open levels and a friend's link";
const list = (c: any): number[] => Array.isArray(c) ? c : Object.values(c ?? {});
export const state = (v: any) => {
  const c = list(v.cleared), top = c.length ? Math.max(...c) : 0, open = Math.min(3, top + 1);
  let run = 0; while (c.includes(run + 1)) run++;
  return {
    Level: `${v.done ? "Cleared" : "Playing"} level ${v.level}`,
    Phone: open > run + 1 ? `Level ${open} open, level ${run + 1} never played` : `Levels 1-${open} open`,
    Link: v.friend ? "Friend's level 3 open" : "No link",
  };
};
export const step = (action: string) => ({
  YouClearIt: "you knock all seven down",
  NextLevel: "you press পরের লেভেল",
  PlayAgain: "you play it again",
  PickLevel: "you pick a level in সব লেভেল",
  FriendLinkOpens: "you open a friend's level-3 link",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.friend ? "link" : "own";
export const colors = { own: "teal", link: "yellow" };
