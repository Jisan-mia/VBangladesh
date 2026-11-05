"use client";
// Ask before wiping: a started page is only thrown away after a yes. A choice moment, so the clock is already stopped
// (the caller opened it from a sheet pause). Numbered for the keyboard (১ থাকো, ২ ছেড়ে যাও); staying is the default.
import { useEffect, useRef } from "react";

export type Ask = { now: string; then: string; leave: () => void };

export function AskCard({ ask, onStay }: { ask: Ask; onStay: () => void }) {
  const stay = useRef<HTMLButtonElement>(null);
  useEffect(() => { stay.current?.focus({ preventScroll: true }); }, [ask]);
  return (
    <div className="sk-sheet sk-ask" role="alertdialog" aria-modal="true" aria-labelledby="sk-ask-title" aria-describedby="sk-ask-body">
      <div className="sk-ask-card">
        <h2 id="sk-ask-title">এই পাতা ছেড়ে যাবে?</h2>
        <p id="sk-ask-body" className="sk-ask-swap"><span>{ask.now}</span><i aria-hidden="true">→</i><span>{ask.then}</span></p>
        <p className="sk-ask-note">ছেড়ে গেলে এই পাতার কাটা শব্দ আর সময় মুছে যাবে।</p>
        <div className="sk-ask-actions">
          <button ref={stay} type="button" className="kit-primary" onClick={onStay}><kbd aria-hidden="true">১</kbd>এখানেই থাকো<small>সুপারিশ</small></button>
          <button type="button" className="kit-secondary" onClick={ask.leave}><kbd aria-hidden="true">২</kbd>ছেড়ে যাও</button>
        </div>
      </div>
    </div>
  );
}
