// The parent's number, kept on this phone only when the parent says so (a tick behind the gate). This is the one file in the tool that
// touches storage for it: localStorage under one key, never sessionStorage, a cookie, the address, a card, a log or the network.
// A grown-up clears it behind the gate (clearSaved). Anything in storage that isn't a number is ignored.
import { parseNumber, type Who } from "./play";

export const SAVED_KEY = "ektukhani-ammur-number-saved";
export type Numbers = Partial<Record<Who, string>>;

export function readSaved(raw: string | null): Numbers {
  if (!raw) return {};
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object") return {};
    const out: Numbers = {};
    for (const who of ["ammu", "abbu"] as const) {
      const value = (data as Record<string, unknown>)[who];
      const number = typeof value === "string" ? parseNumber(value) : null;
      if (number) out[who] = number;
    }
    return out;
  } catch { return {}; }
}

export function loadSaved(): Numbers {
  try { return readSaved(localStorage.getItem(SAVED_KEY)); } catch { return {}; }
}

/** Keeps `number` for `who`, next to the other person's. */
export function save(who: Who, number: string) {
  try { localStorage.setItem(SAVED_KEY, JSON.stringify({ ...loadSaved(), [who]: number })); } catch { /* private mode: it stays in memory only */ }
}

/** Forgets one person's number, or both. */
export function forget(who?: Who) {
  try {
    if (!who) { localStorage.removeItem(SAVED_KEY); return; }
    const rest = loadSaved();
    delete rest[who];
    if (Object.keys(rest).length) localStorage.setItem(SAVED_KEY, JSON.stringify(rest)); else localStorage.removeItem(SAVED_KEY);
  } catch { /* nothing stored */ }
}
