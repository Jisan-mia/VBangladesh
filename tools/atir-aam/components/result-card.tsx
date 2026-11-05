"use client";
// The share card under the game: the canvas card, a name, feed or story, and the share buttons.
import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, MAX_NAME } from "../../../shared/game-core";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { stageName } from "../lib/board";
import { cardBlob, cardKicker, drawCard } from "../lib/card";
import { sharedHash, type Shared } from "../lib/challenge";
import { bn, caption, stageLine } from "../lib/words";

export function ResultCard({ result, site, line }: { result: Shared; site: string; line: string }) {
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [error, setError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const card: Shared = { ...result, name: cleanName(name) };
  const state = sharedHash(card);
  const level = card.kind === "level";

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("আঁটি থেকে আম রাফির বাগানে পাকা আম ১২৪০ পয়েন্ট লেভেল শিলাবৃষ্টি কালবৈশাখী মধুমাস").then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, card, format, site);
      setError(false);
    }).catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  return (
    <section className="aa-result" id="result" aria-labelledby="aa-result-title">
      <h2 id="aa-result-title">{level ? <><em>লেভেল {bn(card.level)}</em> {bn(card.count)} চালে পার</> : <><em>{stageName(card.top)}</em> পর্যন্ত, {bn(card.score)} পয়েন্ট</>}</h2>
      <p>{line || stageLine(card.top)}</p>
      <div className="aa-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={canvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="aa-card-summary" />
          <figcaption id="aa-card-summary" className="aa-sr">কার্ড: {cardKicker(card)}, {level ? `${bn(card.count)} চালে` : `${stageName(card.top)} পর্যন্ত, ${bn(card.score)} পয়েন্ট`}, {bn(card.stars)} তারা।</figcaption>
          {error && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="aa-share">
          <label className="aa-name">
            <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool="atir-aam" fileName={level ? `atir-aam-level-${card.level}.png` : "atir-aam.png"} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`}
            caption={caption(card)} state={state}
            hint="বন্ধু লিংক খুললে একই শুরু পাবে। চালগুলো আবার খেলে মিলিয়ে দেখা হয়, তাই হিসাবটা সত্যি।" />
        </div>
      </div>
    </section>
  );
}
