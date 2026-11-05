export const title = "Ghontar sur: links";
export const state = (v: any) => v.phase === "play" ? "Playing" : v.sent ? "Friend's level ready" : v.level === 0 ? "Endless title" : "Title";
export const step = (action: string) => ({ YouStart: "you tap the big bell", YouClearARound: "you clear a round", YouPickALevel: "you pick a level", AFriendsLevelLinkOpens: "a friend's level link opens", AnEndlessLinkOpens: "a friend's endless link opens", YouPlayAgain: "you play again" } as Record<string, string>)[action] ?? action;
export const group = (v: any) => v.phase === "play" ? "play" : "start";
export const colors = { start: "teal", play: "teal" };
