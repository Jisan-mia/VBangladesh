// Browser side of the share/tally/suggest APIs. Every call degrades gracefully: if the server is unreachable, sharing falls back to a #hash link.
export type Tally = { total: number; counts: Record<string, number> };

/** A short /s/<id> link with a personal preview, or the plain #hash link if the API is unavailable. */
export async function shareLink(tool: string, state: string): Promise<string> {
  const fallback = `${window.location.origin}/${tool}#${state}`;
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

export async function readTally(tool: string): Promise<Tally | null> {
  try {
    const response = await fetch(`/api/tally/${tool}`);
    return response.ok ? await response.json() as Tally : null;
  } catch { return null; }
}

export async function addToTally(tool: string, items: readonly string[]): Promise<Tally | null> {
  try {
    const response = await fetch(`/api/tally/${tool}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: voterToken(), items }) });
    return response.ok ? await response.json() as Tally : null;
  } catch { return null; }
}

export async function sendSuggestion(tool: string, text: string): Promise<boolean> {
  try {
    const response = await fetch("/api/suggest", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool, text }) });
    return response.ok;
  } catch { return false; }
}
