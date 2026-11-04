"use client";
// Asked before a choice throws away a started level: before → after, two numbered answers, staying is the default.
export type Ask = { now: string; then: string; leave: () => void };

export function AskCard({ ask, onStay }: { ask: Ask; onStay: () => void }) {
  return (
    <div className="bk-sheet bk-ask" role="alertdialog" aria-modal="true" aria-labelledby="bk-ask-title" aria-describedby="bk-ask-what">
      <div className="bk-sheet-card">
        <h2 id="bk-ask-title">এই ছবি ছেড়ে যাবে?</h2>
        <p id="bk-ask-what" className="bk-ask-what"><span>{ask.now}</span><span aria-hidden="true">→</span><span>{ask.then}</span></p>
        <div className="bk-ask-actions">
          <button type="button" className="kit-primary" onClick={onStay} data-first><kbd>১</kbd> এখানেই থাকো <small>সুপারিশ</small></button>
          <button type="button" className="kit-secondary" onClick={ask.leave}><kbd>২</kbd> ছেড়ে যাও</button>
        </div>
      </div>
    </div>
  );
}
