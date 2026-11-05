"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { SLUG } from "../lib/levels";
import { beatsText, caption, duoCaption, duoTitle, sharedHash, teamOf, type DuoWin, type Shared } from "../lib/link";
import { cardBlob, drawCard, duoCard, soloCard } from "../lib/draw-card";

export type Last = { kind: "solo"; shared: Omit<Shared, "name"> } | { kind: "duo"; win: Omit<DuoWin, "name"> };

export function ResultCard({ last, site }: { last: Last; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const clean = cleanName(name);
  const shared: Shared | null = last.kind === "solo" ? { ...last.shared, name: clean } : null;
  const win: DuoWin | null = last.kind === "duo" ? { ...last.win, name: clean } : null;
  const card = shared ? soloCard(shared) : duoCard(win!);
  const state = shared ? sharedHash(shared) : "";
  const key = shared ? state : `duo-${win!.winner}-${win!.beats}-${clean}`;

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`রশি টানাটানি লেভেল ১২৩ রাফি ${card.kicker} ${card.line}`).then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, card, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `key` encodes everything the card draws.
  }, [key, format, site]);

  return (
    <section className="rt-result" id="result" aria-labelledby="rt-result-title">
      <h2 id="rt-result-title">
        {shared ? <>{teamOf(shared.level, shared.old).obj} <em>{beatsText(shared.beats)}</em> হারালে</> : <>{duoTitle({ winner: win!.winner, name: "" })}, <em>{beatsText(win!.beats)}</em></>}
      </h2>
      <div className="rt-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`রশি টানাটানির কার্ড: ${card.kicker}। ${card.big}। ${card.line}`} />
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="rt-share">
          <label className="rt-name">
            <span>{shared ? "তোমার নাম" : "জয়ী দলের নাম"} <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          {shared ? (
            <ShareBar tool={SLUG} fileName={`roshi-tana-level-${shared.level}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
              hint="বন্ধু লিংক খুললে একই দল আর একই ঢোল পাবে। হিসাবটা তোমার ফোনের।" />
          ) : (
            <ShareBar tool={SLUG} fileName="roshi-tana-duo.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${key}|${format}`} caption={duoCaption(win!)}
              hint="দুজনের খেলার লিংকে শুধু খেলার পাতাটা যায়।" />
          )}
        </div>
      </div>
    </section>
  );
}
