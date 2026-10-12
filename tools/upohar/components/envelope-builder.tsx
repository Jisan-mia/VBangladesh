"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { bn, canLower, canRaise, createCard, distances, foods, friendLine, modes, parseShareHash, relations, sampleEnvelope, shareHash, MAX_NAME_LENGTH, type Card, type Envelope } from "../lib/upohar";
import { cardBlob, drawCard } from "../lib/draw-card";

const TOOL = "upohar";
// Percentages from a handful of people are noise.
const COMPARE_MIN = 20;

/** The white wedding envelope lying on the gift table. */
function EnvelopeView({ card, label }: { card: Card; label: string }) {
  return (
    <div className="up-table" role="group" aria-label={label}>
      <p className="up-occasion">{card.occasion}</p>
      <div className="up-envelope">
        <span className="up-flap" aria-hidden="true" />
        <span className="up-seal" aria-hidden="true"><b>শুভ</b>বিবাহ</span>
        <p className="up-name"><span>নাম:</span> <i>{card.name}</i></p>
        <p key={card.headline} className="up-amount" data-mode={card.mode} aria-live="polite">{card.headline}</p>
        <p className="up-sub">{card.sub}</p>
      </div>
      <p className="up-line">{card.line}</p>
    </div>
  );
}

function Chips<T extends string>({ legend, items, value, onChange }: { legend: string; items: ReadonlyArray<{ id: T; label: string }>; value: T; onChange: (id: T) => void }) {
  return (
    <fieldset className="up-chips">
      <legend>{legend}</legend>
      <div>{items.map(item => <button key={item.id} type="button" aria-pressed={item.id === value} onClick={() => onChange(item.id)}>{item.label}</button>)}</div>
    </fieldset>
  );
}

export function EnvelopeBuilder() {
  const [envelope, setEnvelope] = useState<Envelope>(sampleEnvelope);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Envelope | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const card = useMemo(() => createCard(envelope), [envelope]);
  const friendCard = useMemo(() => friend && createCard(friend), [friend]);
  const state = shareHash(envelope).slice(1);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared envelope counts.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      // Same wedding, your turn: start from the friend's picks, with your own amount and name.
      setEnvelope({ ...shared, nudge: 0, name: "" });
    };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("শুভ বিবাহ ২,০০০").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friendCard && friendCanvas.current) drawCard(friendCanvas.current, friendCard, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, friendCard, format, site]);

  const set = (patch: Partial<Envelope>) => { setEnvelope(current => ({ ...current, ...patch })); setCompared(current => current === "done" ? "idle" : current); };
  // Changing a pick starts the nudge over, so "একটু বেশি" always means more than the new guide.
  const pick = (patch: Partial<Envelope>) => set({ ...patch, nudge: 0 });

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, [envelope.relation]);
    if (tally) { setEveryone(tally); setCompared("done"); } else setCompared("failed");
  }

  const top = compared === "done" && everyone && everyone.total >= COMPARE_MIN ? [...relations].sort((a, b) => (everyone.counts[b.id] ?? 0) - (everyone.counts[a.id] ?? 0))[0] : null;
  const caption = card.mode === "heart"
    ? `${card.occasion}তে খামে যাবে সামর্থ্য অনুযায়ী, সাথে অনেক ভালোবাসা। ${card.note} তুমি খামে কত দাও?`
    : card.mode === "gift"
      ? `${card.occasion}তে উপহার: ${card.headline}। ${card.line} তুমি কী দাও?`
      : `${card.occasion}তে খামের আন্দাজ: ${card.range} (নিয়ম না, আন্দাজ)। ${card.note} তুমি খামে কত দাও?`;

  return (
    <div className="up">
      {friend && friendCard && (
        <section className="up-friend" aria-labelledby="friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={friendLine(friendCard)} />
          <div>
            <p className="up-kicker">একটা খাম এসেছে</p>
            <h2 id="friend-title">{friendLine(friendCard)}<br /><span>তুমি কত দেবে?</span></h2>
            <p>নিচের খামটা একই বিয়ের হিসাবে সাজানো আছে। নিজের মতো বদলে নাও।</p>
          </div>
        </section>
      )}

      <div className="up-builder">
        <div className="up-stage">
          <EnvelopeView card={card} label="তোমার খাম" />
          {card.mode !== "heart" && (
            <div className="up-nudge" role="group" aria-label="আন্দাজটা নিজের মতো ঠিক করো">
              <button type="button" onClick={() => set({ nudge: envelope.nudge - 1 })} disabled={!canLower(envelope)} aria-label="একটু কম করো">− একটু কম</button>
              <span>{envelope.nudge ? `নিজের মতো ${envelope.nudge > 0 ? "+" : "−"}${bn(Math.abs(envelope.nudge))}` : "নিজের মতো ঠিক করো"}</span>
              <button type="button" onClick={() => set({ nudge: envelope.nudge + 1 })} disabled={!canRaise(envelope)} aria-label="একটু বেশি করো">+ একটু বেশি</button>
            </div>
          )}
        </div>
        <div className="up-controls">
          <Chips legend="বিয়েটা কার?" items={relations} value={envelope.relation} onChange={relation => pick({ relation })} />
          <Chips legend="কোথা থেকে যাবে?" items={distances} value={envelope.distance} onChange={distance => pick({ distance })} />
          <Chips legend="মেনুতে কী?" items={foods} value={envelope.food} onChange={food => pick({ food })} />
          <Chips legend="খামে কী দেবে?" items={modes} value={envelope.mode} onChange={mode => set({ mode })} />
          <p className="up-honest">এগুলো শুধু হালকা আন্দাজ, কোনো নিয়ম না। পরিবার, এলাকা আর সামর্থ্য ভেদে অঙ্ক আলাদা হয়, আর যেটা তোমার জন্য আরামের, সেটাই ঠিক।</p>
        </div>
      </div>

      <StickyNext show={!resultVisible} title={<strong>{card.headline}</strong>} sub={card.occasion} href="#result" label="কার্ড দেখো" />

      <section className="up-result" id="result" ref={result} aria-labelledby="result-title">
        <h2 id="result-title">তোমার <em>খামের কার্ড</em></h2>
        <p className="up-result-line">{card.note}</p>
        <div className="up-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="screen-reader-only">{card.occasion}। খামে: {card.headline}। {card.sub}। {card.line}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="up-share">
            <label className="up-field">
              <span>খামে তোমার নাম <small>না দিলেও চলবে</small></span>
              <input value={envelope.name} maxLength={MAX_NAME_LENGTH} onChange={event => set({ name: event.target.value })} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="upohar-kham.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint="যে বন্ধুর সাথে একই বিয়েতে যাচ্ছ, তাকে লিংকটা পাঠাও। সে-ও নিজেরটা মিলিয়ে নিক।" />
          </div>
        </div>

        <div className="up-everyone">
          <h3>সবাই কার বিয়ের হিসাব সবচেয়ে বেশি করছে?</h3>
          {compared !== "done" || !everyone ? <>
            <p>তোমার বাছাই ({relations.find(relation => relation.id === envelope.relation)!.label}) সবার হিসাবে যোগ করো। নাম বা টাকার অঙ্ক যাবে না, শুধু সম্পর্কটা গোনা হবে।</p>
            <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "যোগ হচ্ছে…" : "সবার সাথে মেলাও"}</button>
            {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : !top ? (
            <p className="kit-status">যোগ হয়েছে! এখনো খুব কম মানুষ মিলিয়েছে। বন্ধুদের লিংক পাঠাও, তারপর দেখো।</p>
          ) : <>
            <p>সবচেয়ে বেশি হিসাব হয়েছে: <strong>{relations.find(relation => relation.id === top.id)!.of}</strong> ({bn(everyone.total)} জনের হিসাব)।</p>
            <ul className="up-bars">{relations.filter(relation => everyone.counts[relation.id]).map(relation => { const percent = Math.round(((everyone.counts[relation.id] ?? 0) / everyone.total) * 100); return <li key={relation.id} data-mine={relation.id === envelope.relation}><span>{relation.label}</span><i style={{ width: `${percent}%` }} /><b>{bn(percent)}%</b></li>; })}</ul>
          </>}
        </div>
      </section>
    </div>
  );
}
