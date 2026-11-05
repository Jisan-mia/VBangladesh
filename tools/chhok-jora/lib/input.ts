// The finger on the cloth, the second tap on a stitch that gives boxes away, and what each key does, as pure functions, so the
// statechart's input rules (InputReleasedWhenAway, GhostOnlyUnderAFinger, EnterNeverUndoes) replay in node tests.
import { needsSecondTap } from "./quilt";
import type { Screen } from "./flow";

/** A finger or mouse button held on the cloth (`id` ≥ 0), or a mouse hovering (`id` -1, `hover` true), and the gap under it. */
export type Finger = { id: number; gap: number; hover: boolean };
export const NO_FINGER: Finger = { id: -1, gap: -1, hover: false };

export const press = (id: number, gap: number): Finger => ({ id, gap, hover: false });
/** A move: the held finger slides to another gap, or a mouse with no button hovers one. */
export function slide(f: Finger, id: number, gap: number, mouse: boolean): Finger {
  if (f.id >= 0) return id === f.id && gap !== f.gap ? { ...f, gap } : f;
  if (!mouse) return f;
  return gap === f.gap && f.hover ? f : { id: -1, gap, hover: gap >= 0 };
}
/** The finger lifts: the gap under it is the one to sew (or -1 if it wasn't this finger). */
export function lift(f: Finger, id: number): { finger: Finger; gap: number } {
  if (f.id < 0 || id !== f.id) return { finger: f, gap: -1 };
  return { finger: NO_FINGER, gap: f.gap };
}
/** pointercancel, blur, a hidden tab, the menu, the sheet, the bot's turn: nothing counts as held. */
export const release = (): Finger => NO_FINGER;
/** The pale stitch shows only under a finger that is down now (or a hovering mouse) while play runs. */
export const ghostOf = (f: Finger, live: boolean) => live && (f.id >= 0 || f.hover) ? f.gap : -1;

/**
 * A tap that would sew `gap`: sew it, or arm it first when it gives away more than any other stitch would. A second tap on
 * the armed gap sews it; a tap elsewhere moves the arming. Returns what to do and the new armed gap.
 */
export function attempt(gap: number, armed: number, gifts: readonly number[]): { act: "sew" | "arm" | "none"; armed: number } {
  if (gap < 0 || gifts[gap] < 0) return { act: "none", armed };
  if (needsSecondTap(gifts, gap) && armed !== gap) return { act: "arm", armed: gap };
  return { act: "sew", armed: -1 };
}

export type KeyAct = "none" | "pause" | "start" | "mode" | "level" | "go" | "cursor" | "show" | "sew" | "undo" | "swallow";
export type KeyContext = {
  screen: Screen;
  /** The sheet or the menu is open: keys belong to it. */
  blocked: boolean;
  repeat: boolean;
  /** The focused element is a button or link reached with Tab (clicked ones drop focus). */
  onButton: boolean;
  /** The keyboard cursor is on the cloth. */
  cursor: number;
  /** flow.takesResultKey at this moment. */
  resultReady: boolean;
};

/**
 * What a key does. During play Enter and Space belong to the cloth: with the cursor out they sew its gap whatever is
 * focused, so one Enter can never press ফিরিয়ে আনো or a mode chip. A button reached with Tab still works while the cursor is
 * away. On the result only a fresh press after the guard goes on.
 */
export function keyAct(key: string, ctx: KeyContext): KeyAct {
  if (ctx.blocked) return "none";
  const enter = key === "Enter" || key === " ";
  if ((key === "p" || key === "P") && (ctx.screen === "play" || ctx.screen === "kata")) return ctx.repeat ? "swallow" : "pause";
  if (ctx.screen === "title") {
    if (enter) return ctx.onButton ? "none" : ctx.repeat ? "swallow" : "start";
    if (key === "1" || key === "2" || key === "3") return "mode";
    if (key === "ArrowLeft" || key === "ArrowRight") return "level";
    return "none";
  }
  if (ctx.screen === "over") {
    if (!enter) return "none";
    if (ctx.onButton) return "none";
    return ctx.resultReady ? "go" : "swallow";
  }
  if (ctx.screen !== "play") return "none";
  if (key.startsWith("Arrow")) return "cursor";
  if (key === "z" || key === "Z" || key === "Backspace") return ctx.repeat ? "swallow" : "undo";
  if (!enter) return "none";
  if (ctx.repeat) return "swallow";
  if (ctx.cursor >= 0) return "sew";
  return ctx.onButton ? "none" : "show";
}
