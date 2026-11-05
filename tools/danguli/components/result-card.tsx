"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/card";
import { sharedHash, type Shared } from "../lib/challenge";
import { levelDef, SLUG } from "../lib/levels";
import { bn, caption, hitLabel, humanLine, levelLabel, ordinal } from "../lib/lines";

export function ResultCard({ shared: played, site }: { shared: Omit<Shared, "name">; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const shared: Shared = { ...played, name: cleanName(name) };
  const state = sharedHash(shared), def = levelDef(shared.level);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`ডাংগুলি ১২৩ ডাং রাফি ${def.rival.short} ${levelLabel(shared.level)} ${humanLine(shared.total)} ক্যাচ ফসকে`).then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, shared, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="dg-result" id="result" aria-labelledby="dg-result-title">
      <h2 id="dg-result-title">তিন মারে <em>{bn(shared.total)} ডাং</em></h2>
      <p>{humanLine(shared.total)}</p>
      <div className="dg-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img"
            aria-label={`ডাংগুলির কার্ড: ${levelLabel(shared.level)}, তিন মারে ${bn(shared.total)} ডাং। ${shared.hits.map((hit, index) => `${ordinal(index)} ${hitLabel(hit)}`).join(", ")}।`} />
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="dg-share">
          <label className="dg-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName={`danguli-${shared.level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
            hint="লিংক পেলে বন্ধু একই মাঠে খেলবে: একই বাতাস, একই পুকুর, একই ফিল্ডার। স্কোরটা তোমার ফোনের।" />
        </div>
      </div>
    </section>
  );
}
