// Browser side of the share/tally/suggest APIs. Every call degrades gracefully: if the server is unreachable, sharing falls back to a #hash link.
export type Tally = { total: number; counts: Record<string, number> };

/** A short /s/<id> link with a personal preview, or the plain #hash link if the API is unavailable. */
/** `local` keeps sensitive state (e.g. health data) off our server: the link carries it in the #hash only. */
export async function shareLink(tool: string, state: string, local = false): Promise<string> {
  // Percent-encode Bangla so chat apps still recognise the whole fallback as one link.
  const fallback = `${window.location.origin}/${tool}#${state.replace(/[^\x00-\x7f]+/g, encodeURIComponent)}`;
  if (local) return fallback;
  try {
    const response = await fetch("/api/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool, state }) });
    if (!response.ok) return fallback;
    const { path } = await response.json() as { path: string };
    return window.location.origin + path;
  } catch {
    return fallback;
  }
}

/** A random id kept in this browser so voting again replaces the earlier vote. Not linked to any person. */
function voterToken() {
  const make = () => [...crypto.getRandomValues(new Uint8Array(18))].map(byte => "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"[byte % 64]).join("");
  try {
    const saved = localStorage.getItem("ektukhani-voter");
    if (saved) return saved;
    const token = make();
    localStorage.setItem("ektukhani-voter", token);
    return token;
  } catch {
    return make();
  }
}

/** `prefix` returns only ids starting with it (plus the total), for tools whose ids pile up per day or event. */
export async function readTally(tool: string, prefix = ""): Promise<Tally | null> {
  try {
    const response = await fetch(`/api/tally/${tool}${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`);
    return response.ok ? await response.json() as Tally : null;
  } catch { return null; }
}

/** `group` keeps one vote per page or round (e.g. a quiz set) instead of one per tool. */
export async function addToTally(tool: string, items: readonly string[], prefix = "", group = ""): Promise<Tally | null> {
  try {
    const response = await fetch(`/api/tally/${tool}${prefix ? `?prefix=${encodeURIComponent(prefix)}` : ""}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: voterToken(), items, ...(group ? { group } : {}) }) });
    return response.ok ? await response.json() as Tally : null;
  } catch { return null; }
}

export async function sendSuggestion(tool: string, text: string): Promise<boolean> {
  try {
    const response = await fetch("/api/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool, text }) });
    return response.ok;
  } catch { return false; }
}
