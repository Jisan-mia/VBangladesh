"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard, type Card } from "../lib/card";
import { caption, cutLine, humanLine, sharedHash, SLUG, type Shared } from "../lib/link";

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
    loadCardFonts("ভো-কাট্টা! ১২৩৪টা ঘুড়ি কাটল সন্ধ্যা নামল সেকেন্ডে").then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, card, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="vk-result" id="result" aria-labelledby="vk-result-title">
      <h2 id="vk-result-title">তোমার <em>ভো-কাট্টা</em> কার্ড</h2>
      <div className="vk-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="vk-card-summary" />
          <figcaption id="vk-card-summary" className="vk-sr">{cutLine(card.cuts, clean)}। {humanLine(card.won, card.lost, card.cuts)}</figcaption>
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="vk-share">
          <label className="vk-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName="vo-katta.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state}
            hint="বন্ধু লিংক খুললে একই আকাশ, একই বাতাস আর একই ছাদের ঘুড়ি পাবে।" />
        </div>
      </div>
    </section>
  );
}
