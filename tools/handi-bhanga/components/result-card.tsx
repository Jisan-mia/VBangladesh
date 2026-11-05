"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/card";
import { bn, caption, cardHash, playLabel, SLUG, tallyLine, type Card } from "../lib/link";

export function ResultCard({ result, site }: { result: Omit<Card, "name">; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card: Card = { ...result, name: cleanName(name) };
  const state = cardHash(card);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("হাঁড়িভাঙা দোকান সাফ লেভেল তারা পয়েন্ট ৩৫টার").then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, card, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="hb-result" id="result" aria-labelledby="hb-result-title">
      <h2 id="hb-result-title">{playLabel(card)}: <em>{bn(card.score)} পয়েন্ট</em></h2>
      <div className="hb-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="hb-card-summary" />
          <figcaption id="hb-card-summary" className="hb-sr">হাঁড়িভাঙা{card.name && `, ${card.name}`}: {playLabel(card)}, {bn(card.score)} পয়েন্ট, {tallyLine(card)} হাঁড়ি।</figcaption>
          {error && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="hb-share">
          <label className="hb-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName="handi-bhanga.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
            hint="লিংক পেলে বন্ধু ঠিক একই দোকান পাবে: একই হাঁড়ি, একই জায়গায়।" />
        </div>
      </div>
    </section>
  );
}
