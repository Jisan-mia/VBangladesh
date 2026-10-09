export const HISTORY_LIMIT = 50;
export type History<T> = { past: T[]; present: T; future: T[] };

export function createHistory<T>(initial: T): History<T> {
  return { past: [], present: initial, future: [] };
}

function sameDocument(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object') return false;
  if (Array.isArray(left) !== Array.isArray(right)) return false;
  const keys = Object.keys(left);
  if (keys.length !== Object.keys(right).length) return false;
  return keys.every(key => Object.hasOwn(right, key) && sameDocument(
    (left as Record<string, unknown>)[key], (right as Record<string, unknown>)[key],
  ));
}

// Immutable JSON documents let unchanged photo data and drawing paths compare by reference.
export function commitHistory<T>(history: History<T>, next: T): History<T> {
  if (sameDocument(history.present, next)) return history;
  return { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: next, future: [] };
}

export function undoHistory<T>(history: History<T>): History<T> {
  if (!history.past.length) return history;
  return { past: history.past.slice(0, -1), present: history.past[history.past.length - 1], future: [history.present, ...history.future] };
}

export function redoHistory<T>(history: History<T>): History<T> {
  if (!history.future.length) return history;
  return { past: [...history.past, history.present].slice(-HISTORY_LIMIT), present: history.future[0], future: history.future.slice(1) };
}
