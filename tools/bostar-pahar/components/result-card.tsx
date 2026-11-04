"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, cardLine, drawCard } from "../lib/draw-card";
import { bn, caption, cardHash, playLabel, sacksLabel, SLUG, type Card } from "../lib/link";

export function ResultCard({ result, site }: { result: Omit<Card, "name">; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card: Card = { ...result, name: cleanName(name) };
  const state = cardHash(card);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("বস্তার পাহাড় ২৮টা বস্তা ঠিক মাঝে লেভেল সন্ধ্যার লঞ্চ").then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, card, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="bp-result" id="result" aria-labelledby="bp-result-title">
      <h2 id="bp-result-title">ট্রাকে উঠল <em>{sacksLabel(card.sacks)}</em></h2>
      <div className="bp-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="bp-card-summary" />
          <figcaption id="bp-card-summary" className="bp-sr">বস্তার পাহাড়{card.name && `, ${card.name}`}: {playLabel(card)}, {sacksLabel(card.sacks)}। ঠিক মাঝে {bn(card.perfect)} বার, টানা {bn(card.streak)} বার। {cardLine(card)}</figcaption>
          {error && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="bp-share">
          <label className="bp-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName="bostar-pahar.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
            hint="লিংক পেলে বন্ধু একই দোল পাবে: প্রতিটা বস্তা একই তালে দুলবে।" />
        </div>
      </div>
    </section>
  );
}
