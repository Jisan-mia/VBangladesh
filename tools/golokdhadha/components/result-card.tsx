"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { caption, fullLabel, humanLine, seconds, sharedHash, type Shared } from "../lib/link";
import { cardBlob, drawCard, type CardData } from "../lib/draw-card";

const SLUG = "golokdhadha";

export function ResultCard({ result, trail, walked, site }: { result: Omit<Shared, "name">; trail: readonly number[]; walked: readonly number[]; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const card = useRef<HTMLCanvasElement>(null);
  const shared: Shared = { ...result, name: cleanName(name) };
  const data: CardData = { ...shared, trail, walked };
  const state = sharedHash(shared);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("গোলকধাঁধা রাফি ১২.৪ সেকেন্ডে দোকানে পৌঁছেছে").then(() => {
      if (cancelled || !card.current) return;
      drawCard(card.current, data, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws except the route, which belongs to this run (and `trail` with it).
  }, [state, format, site, trail]);

  return (
    <section className="gd-result" id="result" aria-labelledby="gd-result-title">
      <h2 id="gd-result-title"><em>{fullLabel(shared)}</em> পার, {seconds(shared.tenths)} সেকেন্ডে</h2>
      <div className="gd-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={card} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="gd-card-summary" />
          <figcaption id="gd-card-summary" className="gd-sr">কার্ড: {fullLabel(shared)}, {seconds(shared.tenths)} সেকেন্ড। {humanLine(shared.stars, shared.clean)}</figcaption>
          {error && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="gd-share">
          <label className="gd-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName={`golokdhadha-${shared.level || shared.seed}.png`} makeImage={() => cardBlob(data, format, site)} imageKey={`${state}|${format}`}
            caption={caption(shared)} state={state} hint="বন্ধু লিংক খুললে এই ধাঁধাটাই পাবে, আর দেখবে তোমার সময়।" />
        </div>
      </div>
    </section>
  );
}
