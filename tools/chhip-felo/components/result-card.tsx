"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/card";
import { sharedHash, SLUG, type Shared } from "../lib/challenge";
import { caption, humanLine, levelLabel, weightText } from "../lib/lines";

export function ResultCard({ result, site }: { result: Omit<Shared, "name">; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const clean = cleanName(name);
  const shared: Shared = { ...result, name: clean };
  const state = sharedHash(shared);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`ছিপ ফেলো লেভেল ১২৩ রাফির ঝুড়িতে কেজি গ্রাম ${humanLine(shared)}`).then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, shared, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="cf-result" id="result" aria-labelledby="cf-result-title">
      <h2 id="cf-result-title">ঝুড়িতে <em>{shared.catches ? weightText(shared.grams) : "আজ কিছু নেই"}</em></h2>
      <div className="cf-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="cf-card-summary" />
          <figcaption id="cf-card-summary" className="cf-sr">ছিপ ফেলোর কার্ড: {levelLabel(shared.level)}, {weightText(shared.grams)}। {humanLine(shared)}</figcaption>
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="cf-share">
          <label className="cf-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName={`chhip-felo-level-${shared.level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
            hint="বন্ধু লিংক খুললে একই ঘাট, একই বুদবুদ পাবে। ওজনটা তোমার ফোনের হিসাব।" />
        </div>
      </div>
    </section>
  );
}
