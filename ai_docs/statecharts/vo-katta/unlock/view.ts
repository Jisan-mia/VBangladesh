export const title = "ভো-কাট্টা: which levels open, with a friend's link in the mix";
const cleared = (v: any) => Object.values(v.stars).filter((s: any) => s > 0).length;
export const state = (v: any) => ({
  Cleared: `${cleared(v)} of 3 cleared`,
  Friend: v.ahead.length ? "a friend's far level kept apart" : "no far level",
});
export const step = (action: string) => action.startsWith("YouClearFriendsLevel") ? "you clear a friend's far level" : action.startsWith("YouClear") ? "you clear an open level" : action;
export const group = () => "play";
export const colors = { play: "teal" };
