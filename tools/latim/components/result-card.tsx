"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/card";
import { sharedHash, type Shared } from "../lib/challenge";
import { SLUG } from "../lib/levels";
import { bn, caption, humanLine, secs } from "../lib/lines";

export function ResultCard({ shared: played, site, versus }: { shared: Omit<Shared, "name">; site: string; versus: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const shared: Shared = { ...played, name: cleanName(name) };
  const state = sharedHash(shared);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("লাটিম ১২.৪ সেকেন্ড রাফি হাতে তুলে").then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, shared, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="lt-result" id="result" aria-labelledby="lt-result-title">
      <h2 id="lt-result-title">লাটিম ঘুরল <em>{secs(shared.score)} সেকেন্ড</em></h2>
      <p>{versus || humanLine(shared.score)}</p>
      <div className="lt-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img"
            aria-label={`লাটিমের কার্ড: লেভেল ${bn(shared.level)}, ${secs(shared.score)} সেকেন্ড। ${humanLine(shared.score)}`} />
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="lt-share">
          <label className="lt-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName="latim.png" makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
            hint="লিংক পেলে বন্ধু একই জায়গায় খেলবে: একই পাতা, একই নুড়ি, একই হাওয়া। সময়টা তোমার ফোনের।" />
        </div>
      </div>
    </section>
  );
}
