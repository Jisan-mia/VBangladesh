"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard, type Card } from "../lib/card";
import { bn, caption, humanLine, sharedHash, SLUG, type Shared } from "../lib/link";

export function ResultCard({ result, card: base, site, startName = "" }: { result: Omit<Shared, "name" | "won" | "oldDay">; card: Omit<Card, "name">; site: string; startName?: string }) {
  const [name, setName] = useState(startName);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const clean = cleanName(name);
  const card: Card = { ...base, name: clean };
  const state = sharedHash({ ...result, name: clean });

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("দেরি হয়ে গেল! মিটার লেভেল হোঁচট পাতা সেকেন্ড ০১২৩৪৫৬৭৮৯").then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, card, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws, except the stars (from this phone, in `card`).
  }, [state, format, site, card.stars]);

  return (
    <section className="dh-result" id="result" aria-labelledby="dh-result-title">
      <h2 id="dh-result-title">তোমার <em>স্কুলের পথ</em> কার্ড</h2>
      <div className="dh-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="dh-card-summary" />
          <figcaption id="dh-card-summary" className="dh-sr">দেরি হয়ে গেল!{clean && ` · ${clean}`}: {bn(card.meters)} মিটার{card.stars ? `, ${bn(card.stars)} তারা` : ""}। {humanLine({ level: card.level, won: card.won, stumbles: card.stumbles, pages: card.pages, meters: card.meters })}</figcaption>
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="dh-share">
          <label className="dh-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName="deri-hoye-gelo.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${card.stars}`} caption={caption(card)} state={state}
            hint="বন্ধু লিংক খুললে ঠিক এই রাস্তাটাই পাবে, একই কাদা, একই চাকা।" />
        </div>
      </div>
    </section>
  );
}
