export const title = "জোড়া মেলাও: Enter held through the end of a board";
export const state = (v: any) => ({ Screen: v.phase === "end" ? "End screen" : "Playing", Key: v.held ? "Enter held down" : "Enter up" });
export const step = (action: string) => ({ YouPressEnter: "you press Enter", EnterRepeats: "the key repeats", YouLetGo: "you let go", TheEndScreenShows: "the end screen shows" } as any)[action] ?? action;
