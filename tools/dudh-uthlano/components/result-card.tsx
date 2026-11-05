"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { bn, caption, potsWord, sharedHash, whereText, type Shared } from "../lib/challenge";
import { cardBlob, drawCard } from "../lib/card";
import { humanLine } from "../lib/lines";
import { SLUG } from "../lib/levels";

export function ResultCard({ shared: base, stars, site }: { shared: Omit<Shared, "name">; stars: number; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const shared: Shared = { ...base, name: cleanName(name) };
  const state = sharedHash(shared);
  const line = humanLine(shared.scores, shared.spills, shared.total);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`দুধ উথলানোর আগে লেভেল ${whereText(shared)} রাফি ৯১% ×২ উথলেছে`).then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, shared, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="du-result" id="result" aria-labelledby="du-result-title">
      <h2 id="du-result-title">তোমার <em>দুধের</em> কার্ড</h2>
      <div className="du-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img"
            aria-label={`${shared.name ? `${shared.name}, ` : ""}${whereText(shared)}, ${potsWord(shared.scores.length)} পাতিলের গড় ${bn(shared.total)}%${stars ? `, ${bn(stars)} তারা` : ""}। ${line}`} />
          {error && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="du-share">
          <label className="du-name">
            <span>নাম <small>ডাকনাম দিতে পারো, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName={`dudh-uthlano-${shared.old ? "old" : "level"}-${shared.level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`}
            caption={caption(shared)} state={state} hint={`লিংক খুললে বন্ধু একই ${potsWord(shared.scores.length)} পাতিল পাবে।`} />
        </div>
      </div>
    </section>
  );
}
