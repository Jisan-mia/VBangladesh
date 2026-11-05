"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/card";
import { SLUG } from "../lib/levels";
import { caption, raceLabel, resultLine, shareHash, type Shared } from "../lib/link";

export type Last = Omit<Shared, "name">;

export function ResultCard({ last, site }: { last: Last; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const shared: Shared = { ...last, name: cleanName(name) };
  const state = shareHash(shared);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`বাইচের নৌকা সেকেন্ডে ১ম ২য় ৩য় ৪র্থ মাঝির হাত পাকা ০১২৩৪৫৬৭৮৯. ${raceLabel(shared)}`).then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, shared, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="bn-result" id="result" aria-labelledby="bn-result-title">
      <h2 id="bn-result-title">ঘাটে পৌঁছেছ: <em>{resultLine(shared)}</em></h2>
      <div className="bn-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`বাইচের নৌকার কার্ড: ${resultLine(shared)}`} />
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="bn-share">
          <label className="bn-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName="baicher-nouka.png" makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
            hint="বন্ধু লিংক খুললে ঠিক এই নদীটাই পাবে: একই কচুরিপানা, একই নৌকা, একই তাল। সময়টা তোমার ফোনের হিসাব।" />
        </div>
      </div>
    </section>
  );
}
