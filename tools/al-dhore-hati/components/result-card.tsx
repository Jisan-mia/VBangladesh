"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard, cardStars } from "../lib/card";
import { specOf, legacySpec } from "../lib/levels";
import { bn, caption, cardHash, humanLine, playLabel, SLUG, slipText, type Card } from "../lib/link";

export function ResultCard({ result, site }: { result: Omit<Card, "name">; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card: Card = { ...result, name: cleanName(name) };
  const state = cardHash(card);
  const metres = (card.kind === "old" ? legacySpec(card.level) : specOf(card.level, card.mode)).metres;

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`আল ধরে হাঁটি লেভেল ১২৩ রাফি মিটার ${playLabel(card)} একবারও না পিছলে`).then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, card, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="al-result" id="result" aria-labelledby="al-result-title">
      <h2 id="al-result-title"><em>{bn(metres)} মিটার</em> আল পার হলে</h2>
      <p>{humanLine(card)}</p>
      <div className="al-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img"
            aria-label={`আল ধরে হাঁটির কার্ড: ${playLabel(card)}, ${bn(metres)} মিটার, ${slipText(card.slips)}, ${bn(cardStars(card))} তারা।`} />
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="al-share">
          <label className="al-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName={`al-dhore-hati-${card.level}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
            hint="বন্ধু লিংক খুললে একই খেত, একই আল পাবে। পিছলানোর হিসাবটা তোমার ফোনের।" />
        </div>
      </div>
    </section>
  );
}
