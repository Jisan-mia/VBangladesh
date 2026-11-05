"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { makeClass } from "../lib/class";
import { benchesOf, seconds, sharedHash, type Shared } from "../lib/challenge";
import { cardBlob, cardWhere, drawCard } from "../lib/card";
import { SLUG } from "../lib/levels";
import { caption, cardLine } from "../lib/lines";

export function ResultCard({ shared: base, stars, site }: { shared: Omit<Shared, "name">; stars: number; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const shared: Shared = { ...base, name: cleanName(name) };
  const state = sharedHash(shared);
  const teacher = makeClass(shared.seed, shared.level, shared.mode, shared.old).teacher;

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`স্যার ঘুরলেই থামো ২২.৪ সেকেন্ডে টিফিনে ঝালমুড়ি? রাফি ${cardWhere(shared)} ${cardLine(stars, teacher)}`).then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, shared, format, site, stars);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, stars]);

  return (
    <section className="sg-result" id="result" aria-labelledby="sg-result-title">
      <h2 id="sg-result-title">তোমার <em>চিরকুট</em> কার্ড</h2>
      <div className="sg-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img"
            aria-label={`${shared.name ? `${shared.name}, ` : ""}${cardWhere(shared)}, ${benchesOf(shared)} বেঞ্চ ${seconds(shared.tenths)} সেকেন্ডে। ${cardLine(stars, teacher)}`} />
          {error && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="sg-share">
          <label className="sg-name">
            <span>নাম <small>ডাকনাম দিতে পারো, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName={`sir-ghurlei-thamo-${shared.old ? "class" : "level"}-${shared.level}.png`} makeImage={() => cardBlob(shared, format, site, stars)} imageKey={`${state}|${format}|${stars}`}
            caption={caption(shared.tenths, teacher, benchesOf(shared))} state={state} hint="লিংক খুললে বন্ধু একই ক্লাস পাবে: একই শিক্ষক, একই সময়ে ঘোরা।" />
        </div>
      </div>
    </section>
  );
}
