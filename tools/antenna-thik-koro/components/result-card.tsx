"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { bn, caption, channelsOf, humanLine, seconds, sharedHash, SLUG, type Shared } from "../lib/antenna";
import { cardBlob, drawCard } from "../lib/draw-card";

export function ResultCard({ result, site }: { result: Omit<Shared, "name">; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const card = useRef<HTMLCanvasElement>(null);
  const shared: Shared = { ...result, name: cleanName(name) };
  const state = sharedHash(shared);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("অ্যান্টেনা ঠিক করো ৪৭.৩ সেকেন্ডে").then(() => {
      if (cancelled || !card.current) return;
      drawCard(card.current, shared, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="at-result" id="result" aria-labelledby="at-result-title">
      <h2 id="at-result-title">তোমার <em>ছবি এল</em> কার্ড</h2>
      <div className="at-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={card} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="at-card-summary" />
          <figcaption id="at-card-summary" className="at-sr">{shared.name && `${shared.name}, `}{bn(channelsOf(shared))}টা চ্যানেল {seconds(shared.tenths)} সেকেন্ডে। {humanLine(shared.tenths)}</figcaption>
          {error && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="at-share">
          <label className="at-name">
            <span>নাম <small>ডাকনাম দিতে পারো, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName="antenna-thik-koro.png" makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
            hint={`লিংক খুললে বন্ধু একই ${bn(channelsOf(shared))}টা চ্যানেল, একই জায়গায় পাবে।`} />
        </div>
      </div>
    </section>
  );
}
