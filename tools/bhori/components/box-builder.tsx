"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { bn, caption, clampPoints, createCard, fromGrams, gramsExact, gramsValue, items, owners, parseGrams, parseShareHash, previewTitle, samplePiece, shareHash, split, units, MAX_NAME_LENGTH, MAX_POINTS, type Piece } from "../lib/bhori";
import { cardBlob, drawCard } from "../lib/draw-card";

const TOOL = "bhori";
// Percentages from a handful of people are noise.
const COMPARE_MIN = 20;

function Jewel({ drawing }: { drawing: string }) {
  return <svg className="bh-jewel" viewBox="0 0 48 48" aria-hidden="true"><path className="bh-jewel-edge" d={drawing} /><path className="bh-jewel-gold" d={drawing} /></svg>;
}

function Chips<T extends string>({ legend, list, value, onChange }: { legend: string; list: ReadonlyArray<{ id: T; label: string }>; value: T; onChange: (id: T) => void }) {
  return (
    <fieldset className="bh-chips">
      <legend>{legend}</legend>
      <div>{list.map(entry => <button key={entry.id} type="button" aria-pressed={entry.id === value} onClick={() => onChange(entry.id)}>{entry.label}</button>)}</div>
    </fieldset>
  );
}

export function BoxBuilder() {
  const [piece, setPiece] = useState<Piece>(samplePiece);
  const [gramText, setGramText] = useState<string | null>(null);
  const [typed, setTyped] = useState<number | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Piece | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const card = useMemo(() => createCard(piece), [piece]);
  const friendCard = useMemo(() => friend && createCard(friend), [friend]);
  const state = shareHash(piece).slice(1);
  const parts = split(piece.points);
  const gramsInvalid = gramText !== null && gramText.trim() !== "" && parseGrams(gramText) === null;
  const rounding = typed === null ? null : fromGrams(typed);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared piece counts.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("ক্যাশ মেমো অমূল্য ১৫.৩১").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friendCard && friendCanvas.current) drawCard(friendCanvas.current, friendCard, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, friendCard, format, site]);

  const set = (patch: Partial<Piece>) => { setPiece(current => ({ ...current, ...patch })); setCompared(current => current === "done" ? "idle" : current); };
  const step = (by: number) => { set({ points: clampPoints(piece.points + by) }); setGramText(null); setTyped(null); };

  function typeGrams(text: string) {
    setGramText(text);
    const value = parseGrams(text);
    if (value === null) return;
    setTyped(value);
    set({ points: fromGrams(value).points });
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, [piece.item]);
    if (tally) { setEveryone(tally); setCompared("done"); } else setCompared("failed");
  }

  const top = compared === "done" && everyone && everyone.total >= COMPARE_MIN ? [...items].sort((a, b) => (everyone.counts[b.id] ?? 0) - (everyone.counts[a.id] ?? 0))[0] : null;

  return (
    <div className="bh">
      {friend && friendCard && (
        <section className="bh-friend" aria-labelledby="friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={previewTitle(friendCard)} />
          <div>
            <p className="bh-kicker">একটা গয়নার বাক্স এসেছে</p>
            <h2 id="friend-title">{previewTitle(friendCard)}<br /><span>তোমার বাড়ির পুরোনো গয়নাটা কার?</span></h2>
            <p>নিচের বাক্সে নিজেরটার ওজন বসাও।</p>
          </div>
        </section>
      )}

      <div className="bh-builder">
        <div className="bh-box" role="group" aria-label="গয়নার বাক্স">
          <div className="bh-lid">
            <div className="bh-memo" aria-live="polite">
              <p className="bh-memo-head">ক্যাশ মেমো</p>
              <p className="bh-row"><span>গয়না:</span><b>{card.title}</b></p>
              <p className="bh-row"><span>ওজন:</span><b key={card.weight} className="bh-ink">{card.weight}</b></p>
              <p className="bh-row"><span>গ্রামে:</span><b key={card.grams} className="bh-ink">{card.grams} গ্রাম</b></p>
              <p className="bh-working">{card.working}</p>
              <span className="bh-stamp" aria-hidden="true"><small>দাম</small>অমূল্য</span>
            </div>
          </div>
          <div className="bh-tray"><Jewel key={card.item.id} drawing={card.item.drawing} /></div>
        </div>

        <div className="bh-controls">
          <fieldset className="bh-scale">
            <legend>ওজন বসাও</legend>
            <div className="bh-steppers">
              {units.map(unit => (
                <div className="bh-stepper" key={unit.id}>
                  <button type="button" onClick={() => step(-unit.points)} disabled={piece.points < unit.points} aria-label={`এক ${unit.label} কমাও`}>−</button>
                  <p><b>{bn(parts[unit.id])}</b><span>{unit.label}</span></p>
                  <button type="button" onClick={() => step(unit.points)} disabled={piece.points + unit.points > MAX_POINTS} aria-label={`এক ${unit.label} বাড়াও`}>+</button>
                </div>
              ))}
            </div>
            <label className="bh-grams">
              <span>অথবা গ্রামে লেখো</span>
              <span className="bh-grams-input">
                <input inputMode="decimal" autoComplete="off" value={gramText ?? bn(gramsValue(piece.points))} onChange={event => typeGrams(event.target.value)} onBlur={() => setGramText(null)} aria-invalid={gramsInvalid} aria-describedby="grams-note" />
                <i>গ্রাম</i>
              </span>
            </label>
            <p className="bh-note" id="grams-note" role="status">
              {gramsInvalid ? "শুধু সংখ্যা লেখো, যেমন ১০ বা ১১.৬৬৪ (১,১৬৬ গ্রামের মধ্যে)।"
                : rounding && rounding.diff > 0 ? `সবচেয়ে কাছের পয়েন্টে মেলানো হলো: ${bn(gramsExact(rounding.points))} গ্রাম। পার্থক্য মাত্র ${bn(String(rounding.diff))} গ্রাম, কারণ ১ পয়েন্ট = ০.০১২১৫ গ্রাম।`
                : "+ বা − চাপলে আনা ১৬ হলেই ভরি হয়ে যাবে, রতি ৬ হলে আনা।"}
            </p>
          </fieldset>
          <Chips legend="গয়নাটা কী?" list={items} value={piece.item} onChange={item => set({ item })} />
          <Chips legend="কার গয়না?" list={owners} value={piece.owner} onChange={owner => set({ owner })} />
        </div>
      </div>

      <StickyNext show={!resultVisible} title={<strong>{card.grams} গ্রাম</strong>} sub={`${card.title} · ${card.weight}`} href="#result" label="কার্ড দেখো" />

      <section className="bh-result" id="result" ref={result} aria-labelledby="result-title">
        <h2 id="result-title">{card.title}, <em>বাক্সে তোলা থাক</em></h2>
        <p className="bh-result-line">{card.line}</p>
        <div className="bh-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="screen-reader-only">{previewTitle(card)}। {card.line}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="bh-share">
            <label className="bh-field">
              <span>তোমার নাম <small>দিলে লেখা হবে ‘{piece.owner === "amar" ? "রাফির" : `রাফির ${owners.find(owner => owner.id === piece.owner)!.label}`} {card.item.label}’</small></span>
              <input value={piece.name} maxLength={MAX_NAME_LENGTH} onChange={event => set({ name: event.target.value })} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="bhori-gayna.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} disabled={piece.points < 1} hint={piece.points < 1 ? "আগে ওজনটা বসাও।" : "লিংকে যায় শুধু ওজন, গয়না, কার গয়না আর (দিলে) নাম। দাম কোথাও নেই।"} />
          </div>
        </div>

        <div className="bh-everyone">
          <h3>সবার বাক্সে কোন গয়নাটা বেশি?</h3>
          {compared !== "done" || !everyone ? <>
            <p>তোমার গয়নার ধরনটা ({card.item.label}) সবার হিসাবে যোগ করো। ওজন, নাম বা দাম যাবে না।</p>
            <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "যোগ হচ্ছে…" : "সবার সাথে মেলাও"}</button>
            {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : !top ? (
            <p className="kit-status">যোগ হয়েছে! এখনো খুব কম মানুষ মিলিয়েছে। বন্ধুদের লিংক পাঠাও, তারপর দেখো।</p>
          ) : <>
            <p>সবচেয়ে বেশি বাক্সে আছে: <strong>{top.label}</strong> ({bn(everyone.total)} জনের হিসাব)।</p>
            <ul className="bh-bars">{items.filter(item => everyone.counts[item.id]).map(item => { const percent = Math.round(((everyone.counts[item.id] ?? 0) / everyone.total) * 100); return <li key={item.id} data-mine={item.id === piece.item}><span>{item.label}</span><i style={{ width: `${percent}%` }} /><b>{bn(percent)}%</b></li>; })}</ul>
          </>}
        </div>
      </section>
    </div>
  );
}
