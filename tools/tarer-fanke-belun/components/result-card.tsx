"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard, type Card } from "../lib/card";
import { caption, humanLine, scoreLine, sharedHash, SLUG, type Shared } from "../lib/link";

export function ResultCard({ result, card: base, site }: { result: Omit<Shared, "name" | "won">; card: Omit<Card, "name">; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const clean = cleanName(name);
  const card: Card = { ...base, name: clean };
  const state = sharedHash({ ...result, name: clean });

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("তারের ফাঁকে বেলুন ১২৩৪/টা ফাঁক পার সেকেন্ড").then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, card, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws, except the stars (from this phone, in `card`).
  }, [state, format, site, card.stars]);

  return (
    <section className="tb-result" id="result" aria-labelledby="tb-result-title">
      <h2 id="tb-result-title">তোমার <em>বেলুন</em> কার্ড</h2>
      <div className="tb-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="tb-card-summary" />
          <figcaption id="tb-card-summary" className="tb-sr">{scoreLine(card.score, clean)}। {humanLine({ level: card.level, won: card.won, lost: card.lost, grazes: card.grazes, score: card.score })}</figcaption>
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="tb-share">
          <label className="tb-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName="tarer-fanke-belun.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${card.stars}`} caption={caption(card)} state={state}
            hint="বন্ধু লিংক খুললে ঠিক এই তার, এই কাক আর এই হাওয়াই পাবে।" />
        </div>
      </div>
    </section>
  );
}
