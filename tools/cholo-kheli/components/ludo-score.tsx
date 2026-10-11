"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { championBlob, drawChampion } from "../lib/draw-poster";
import { bn } from "../lib/invite";
import { champions, championTitle, emptySession, ludoCaption, ludoHash, ludoLine, MAX_HISTORY, MAX_PLAYER_NAME, OCCASIONS, parseSession, PIECES, playerName, tally, tallyPath, tallyWidth, type Ludo, type Session } from "../lib/ludo";

const STORAGE_KEY = "cholo-kheli:ludo";

export function savedSession() {
  try { return parseSession(localStorage.getItem(STORAGE_KEY)); } catch { return null; }
}

/** "কে জিতল?": one tap on the winner after each game, a running tally kept on this phone, and the champion card. */
export function LudoScore({ players, site }: { players: number; site: string }) {
  const [session, setSession] = useState<Session>(() => emptySession(players));
  const [ready, setReady] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);

  const ludo = useMemo<Ludo>(() => ({ wins: tally(session.history, players), names: session.names.slice(0, players), occasion: session.occasion }), [session, players]);
  const total = ludo.wins.reduce((sum, count) => sum + count, 0);
  const leaders = champions(ludo.wins);
  const state = total ? ludoHash(ludo).slice(1) : "";

  useEffect(() => {
    const saved = savedSession();
    if (saved) setSession(saved);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...session, players })); } catch { setStorageFailed(true); }
  }, [session, players, ready]);

  useEffect(() => {
    if (!total) return;
    let cancelled = false;
    loadCardFonts("ঈদের লুডু চ্যাম্পিয়ন").then(() => {
      if (cancelled) return;
      if (preview.current) drawChampion(preview.current, ludo, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [ludo, total, format, site]);

  function win(player: number) {
    setSession(current => ({ ...current, history: [...current.history, player].slice(-MAX_HISTORY), at: Date.now() }));
    setConfirmReset(false);
  }

  // Takes back the last game won by someone still at the board.
  function undo() {
    setSession(current => {
      let last = current.history.length - 1;
      while (last >= 0 && current.history[last] >= players) last--;
      return last < 0 ? current : { ...current, history: current.history.filter((_, index) => index !== last), at: Date.now() };
    });
  }

  const rename = (player: number, name: string) => setSession(current => ({ ...current, names: current.names.map((old, index) => index === player ? name : old) }));
  const status = !total ? "দান শেষ হলেই যে জিতল, তার ঘরে একবার চাপো।"
    : `${bn(total)} দান হলো · ${leaders.length > 1 ? `${leaders.map(index => playerName(ludo.names, index)).join(" আর ")} সমান সমান` : `এগিয়ে ${playerName(ludo.names, leaders[0])}`}`;

  return <>
    <p className="kheli-ludo-kicker">লুডুর আসর</p>
    <h2 id="ludo-title">কে জিতল?</h2>
    <p className="kheli-ludo-lead">প্রতি দান শেষে যে জিতল, তার ঘরে চাপো। নাম না দিলে গুটির রং দিয়েই চলবে। হিসাবটা এই ফোনেই থাকে।</p>
    <ol className="kheli-ludo-board">
      {ludo.wins.map((count, player) => (
        <li key={PIECES[player].label} style={{ "--piece": PIECES[player].color } as CSSProperties} data-lead={total > 0 && leaders.includes(player)}>
          <input value={session.names[player]} maxLength={MAX_PLAYER_NAME} onChange={event => rename(player, event.target.value)} placeholder={`${PIECES[player].label} গুটি`} aria-label={`${PIECES[player].label} গুটি কে চালছে? নাম লেখো`} autoComplete="off" />
          <button type="button" onClick={() => win(player)} aria-label={`${playerName(ludo.names, player)} জিতল। এখন পর্যন্ত ${bn(count)} জয়`}>
            <strong key={count}>{bn(count)}</strong>
            <svg viewBox={`0 0 ${tallyWidth(count)} 26`} aria-hidden="true"><path d={tallyPath(count)} /></svg>
            <span>জিতল</span>
          </button>
        </li>
      ))}
    </ol>
    <p className="kheli-ludo-status" role="status" aria-live="polite">{status}</p>
    {session.history.length > 0 && <div className="kheli-ludo-actions">
      <button type="button" className="kit-secondary" onClick={undo} disabled={!session.history.some(winner => winner < players)}>শেষ দানটা ফিরিয়ে নাও</button>
      {confirmReset
        ? <><button type="button" className="kit-secondary kheli-ludo-wipe" onClick={() => { setSession(current => ({ ...current, history: [] })); setConfirmReset(false); }}>হ্যাঁ, হিসাব মুছে দাও</button><button type="button" className="kit-link" onClick={() => setConfirmReset(false)}>না, থাক</button></>
        : <button type="button" className="kit-link" onClick={() => setConfirmReset(true)}>নতুন করে শুরু করো</button>}
    </div>}
    {storageFailed && <p className="kit-status" role="alert">এই ব্রাউজারে হিসাব জমিয়ে রাখা যাচ্ছে না। পাতাটা বন্ধ কোরো না।</p>}

    {total > 0 && <div className="kheli-invite-body kheli-ludo-card">
      <figure className="kit-card" data-format={format}>
        <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`চ্যাম্পিয়নের কার্ড: ${championTitle(ludo)}। ${ludoLine(ludo.wins)}`} />
        {previewError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
      </figure>
      <div className="kheli-controls">
        <fieldset className="kit-chips">
          <legend>কার্ডে লেখা থাকবে</legend>
          {OCCASIONS.map(item => <button type="button" key={item.id} aria-pressed={session.occasion === item.id} onClick={() => setSession(current => ({ ...current, occasion: item.id }))}>{item.label} লুডু</button>)}
        </fieldset>
        <FormatToggle value={format} onChange={setFormat} />
        <ShareBar tool="cholo-kheli" fileName="ludo-champion.png" makeImage={() => championBlob(ludo, format, site)} imageKey={`${state}|${format}`} caption={ludoCaption(ludo)} state={state} hint="লিংক খুললে সবাই এই চ্যাম্পিয়ন কার্ডটাই দেখবে। আরও দান হলে পরে আবার পাঠাও।" />
      </div>
    </div>}
  </>;
}
