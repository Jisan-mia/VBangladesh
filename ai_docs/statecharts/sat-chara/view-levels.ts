export const title = "Sat Chara: open levels and a friend's link";
const list = (c: any): number[] => Array.isArray(c) ? c : Object.values(c ?? {});
export const state = (v: any) => {
  const c = list(v.cleared);
  let run = 0; while (c.includes(run + 1)) run++;
  return {
    Round: v.kind === "old" ? "A friend's old pile" : `Level ${v.level}`,
    Phone: `Levels 1-${v.open} open${run + 1 < v.open ? ", a gap" : ""}`,
    Link: v.visit ? "Friend's level 3 playable this visit" : "No link",
  };
};
export const step = (action: string) => ({
  YouClearIt: "you knock all seven down",
  NextLevel: "you press পরের লেভেল",
  PlayAgain: "you play it again",
  PickLevel: "you pick a level in সব লেভেল",
  FriendLinkOpens: "you open a friend's level-3 link",
  OldLinkOpens: "you open an old-format link",
} as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.kind === "old" ? "old" : v.visit ? "link" : "own";
export const colors = { own: "teal", link: "yellow", old: "blue" };
