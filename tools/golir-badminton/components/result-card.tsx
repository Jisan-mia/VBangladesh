"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { sharedHash, type Shared } from "../lib/challenge";
import { cardBlob, drawCard } from "../lib/card";
import { levelDef, SLUG } from "../lib/levels";
import { caption, humanLine, levelLabel, pointsOf, score } from "../lib/lines";

export function ResultCard({ shared: played, site }: { shared: Omit<Shared, "name">; site: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const shared: Shared = { ...played, name: cleanName(name) };
  const state = sharedHash(shared), def = levelDef(shared.level);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`গলির ব্যাডমিন্টন লেভেল ১২৩ রাফি ${def.rival.obj} ${levelLabel(shared.level)} ${humanLine(shared)}`).then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, shared, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="gb-result" id="result" aria-labelledby="gb-result-title">
      <h2 id="gb-result-title"><em>{score(pointsOf(shared), shared.them)}</em> পয়েন্টে {def.rival.obj} হারালে</h2>
      <p>{humanLine(shared)}</p>
      <div className="gb-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`গলির ব্যাডমিন্টনের কার্ড: ${levelLabel(shared.level)}, ${def.rival.obj} ${score(pointsOf(shared), shared.them)} পয়েন্টে হারানো।`} />
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="gb-share">
          <label className="gb-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={SLUG} fileName={`golir-badminton-${shared.level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
            hint="বন্ধু লিংক খুললে একই প্রতিপক্ষ, একই শাটলের হিসাব পাবে। স্কোরটা তোমার ফোনের।" />
        </div>
      </div>
    </section>
  );
}
