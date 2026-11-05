export const title = "Golokdhadha: which levels open (3 levels stand in for 30)";
const list = (s: any) => (Array.isArray(s) ? s : Object.values(s ?? {})).slice().sort().join(", ");
const ahead = (v: any) => (Array.isArray(v.ahead) ? v.ahead : Object.values(v.ahead ?? {}));
export const state = (v: any) => {
  const open = (() => { const c = Array.isArray(v.cleared) ? v.cleared : Object.values(v.cleared ?? {}); const a = ahead(v); const own = c.filter((x: number) => !a.includes(x)); let b = Math.min(3, 1 + Math.max(0, ...own)); while (b < 3 && c.includes(b) && a.includes(b)) b++; return b; })();
  return `Open up to ${open}` + (ahead(v).length ? `, friend's ${list(v.ahead)} waiting` : "");
};
export const step = (action: string) => ({ YouClearALevel: "you clear a level you had opened", YouClearAFriendsLevel: "you clear a friend's level further on" } as Record<string, string>)[action] ?? action;
