"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, cardKicker, drawCard } from "../lib/card";
import { sharedHash, type Shared } from "../lib/challenge";
import { bn, caption } from "../lib/words";

export function ResultCard({ result, site, line }: { result: Shared; site: string; line: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card: Shared = { ...result, name: cleanName(name) };
  const state = sharedHash(card);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("চুড়ির বাজার রাফি ৩২৪০ পয়েন্ট লেভেল বড় বায়না নববর্ষের ভিড় বিয়ের বায়না মেলা ভাঙার আগে").then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, card, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="cb-result" id="result" aria-labelledby="cb-result-title">
      <h2 id="cb-result-title"><em>লেভেল {bn(card.level)}</em> {bn(card.count)} চালে পার</h2>
      <p>{line}</p>
      <div className="cb-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="cb-card-summary" />
          <figcaption id="cb-card-summary" className="cb-sr">কার্ড: {cardKicker(card)}, {bn(card.count)} চালে, {bn(card.score)} পয়েন্ট, {bn(card.stars)} তারা।</figcaption>
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="cb-share">
          <label className="cb-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool="churir-bazar" fileName={`churir-bazar-level-${card.level}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`}
            caption={caption(card)} state={state}
            hint="বন্ধু লিংক খুললে একই লেভেলে একই সাজানো চুড়ি পাবে। চালগুলো আবার খেলে মিলিয়ে দেখা হয়, তাই হিসাবটা সত্যি।" />
        </div>
      </div>
    </section>
  );
}
