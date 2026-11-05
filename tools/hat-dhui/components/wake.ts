import { useEffect } from "react";

/** Keeps the screen awake while `active` (a routine running, not paused, not over); takes the lock back when the tab returns. */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    let lock: WakeLockSentinel | null = null, live = true;
    const take = () => {
      navigator.wakeLock?.request("screen").then(sentinel => { if (live) lock = sentinel; else void sentinel.release().catch(() => {}); }, () => { /* not allowed: fine */ });
    };
    const back = () => { if (!document.hidden) take(); };
    take();
    document.addEventListener("visibilitychange", back);
    return () => {
      live = false;
      document.removeEventListener("visibilitychange", back);
      void lock?.release().catch(() => {});
      lock = null;
    };
  }, [active]);
}
