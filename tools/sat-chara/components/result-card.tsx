"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/card";
import { sharedHash } from "../lib/challenge";
import { ballsText, caption, humanLine, roundLabel, type Claim } from "../lib/words";

export function ResultCard({ claim, site }: { claim: Omit<Claim, "name">; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card: Claim = { ...claim, name: cleanName(name) };
  const state = sharedHash(card);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`সাত চাড়া লেভেল ১২৩ রাফি ${roundLabel(card.kind, card.level)} তুমি কয় বলে পারবে`).then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, card, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="sc-result" id="result" aria-labelledby="sc-result-title">
      <h2 id="sc-result-title"><em>{roundLabel(card.kind, card.level)}</em>, সাতটাই {ballsText(card.balls)}</h2>
      <p>{humanLine(card.balls)}</p>
      <div className="sc-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`সাত চাড়ার কার্ড: ${roundLabel(card.kind, card.level)}, ৭টা চাড়া ${ballsText(card.balls)}।`} />
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="sc-share">
          <label className="sc-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool="sat-chara" fileName={`sat-chara-${card.kind === "old" ? "old" : "level"}-${card.level}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
            hint="বন্ধু লিংক খুললে একই সাজানো চাড়া পাবে। কয় বলে পেরেছ, সেটা তোমার ফোনের হিসাব।" />
        </div>
      </div>
    </section>
  );
}
