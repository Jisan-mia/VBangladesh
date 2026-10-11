"use client";

import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, drawStage } from "../lib/draw-card";
import { EVENT, averageLine, bn, caption, clampHours, compareLine, defaults, divisions, HOURS, humanLine, MAX_NAME, modes, parseShareHash, possessive, readDigits, routeAverage, routeLabel, routeWords, shareHash, tallyId, tripLine, MIN_SAMPLE, mode, type Average, type DivisionId, type ModeId, type Trip } from "../lib/jatra";

const TOOL = "eidjatra";
type Added = { status: "idle" | "sending" | "failed" } | { status: "done"; average: Average | null };

function ModeIcon({ id }: { id: ModeId }) {
  const paths: Record<ModeId, string> = {
    bus: "M4 7h22a2 2 0 0 1 2 2v9H2V9a2 2 0 0 1 2-2Zm2 3v4m5-4v4m5-4v4m5-4v4M8 21a2 2 0 1 0 0-.1M22 21a2 2 0 1 0 0-.1",
    train: "M3 8h15v11H3zM18 8h4c3 0 4 4 4 7v4h-8M6 11h3v3H6zm6 0h3v3h-3zM7 21a2 2 0 1 0 0-.1M21 21a2 2 0 1 0 0-.1M1 24h28",
    launch: "M2 15h26l-3 5H5l-3-5Zm4 0v-4h17v4M10 11V7h9v4m-4-4V4M1 24c3-2 5-2 7 0s5 2 7 0 5-2 7 0 5 2 7 0",
    car: "M3 16h24v4H3zm4 0 3-6h10l4 6M8 22a2 2 0 1 0 0-.1M22 22a2 2 0 1 0 0-.1",
  };
  return <svg viewBox="0 0 30 26" aria-hidden="true"><path d={paths[id]} /></svg>;
}

function HoursStepper({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = (text: string) => { const typed = readDigits(text); if (!Number.isNaN(typed)) onChange(clampHours(typed)); setDraft(null); };
  return <div className="jatra-hours">
    <label htmlFor="jatra-hours">কত ঘণ্টা লাগল?</label>
    <div className="jatra-hours-row">
      <button type="button" aria-label="এক ঘণ্টা কমাও" disabled={value <= HOURS.min} onClick={() => onChange(clampHours(value - 1))}>−</button>
      <span className="jatra-hours-value">
        <input id="jatra-hours" inputMode="numeric" autoComplete="off" value={draft ?? bn(value)} onFocus={event => { setDraft(bn(value)); event.currentTarget.select(); }} onChange={event => { setDraft(event.target.value); const typed = readDigits(event.target.value); if (!Number.isNaN(typed) && typed >= HOURS.min) onChange(clampHours(typed)); }} onBlur={event => commit(event.target.value)} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} />
        <span aria-hidden="true">ঘণ্টা</span>
      </span>
      <button type="button" aria-label="এক ঘণ্টা বাড়াও" disabled={value >= HOURS.max} onClick={() => onChange(clampHours(value + 1))}>+</button>
    </div>
  </div>;
}

function DivisionChips({ legend, value, onChange }: { legend: string; value: DivisionId; onChange: (id: DivisionId) => void }) {
  return <fieldset className="jatra-chips">
    <legend>{legend}</legend>
    <div>{divisions.map(item => <button type="button" key={item.id} aria-pressed={value === item.id} onClick={() => onChange(item.id)}>{item.label}</button>)}</div>
  </fieldset>;
}

export function JatraBuilder() {
  const [trip, setTrip] = useState<Trip>(defaults);
  const [friend, setFriend] = useState<Trip | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [added, setAdded] = useState<Added>({ status: "idle" });
  const stage = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const state = shareHash(trip).slice(1);
  const average = added.status === "done" ? added.average : null;
  const line = humanLine(trip);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared trip counts as a friend's.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("ঢাকা → রংপুর ১৪ ঘণ্টা").then(() => {
      if (cancelled) return;
      if (stage.current) drawStage(stage.current, trip);
      if (preview.current) drawCard(preview.current, trip, format, site, average);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the trip draws.
  }, [state, format, site, friend, average]);

  function update(change: Partial<Trip>) {
    setTrip(current => ({ ...current, ...change }));
    // A changed route, vehicle or hour makes the average stale (names don't count, so they leave it alone).
    if (!("name" in change)) setAdded(current => current.status === "done" ? { status: "idle" } : current);
  }

  async function addMine() {
    setAdded({ status: "sending" });
    const tally = await addToTally(TOOL, [tallyId(trip)], `${EVENT}:`);
    setAdded(tally ? { status: "done", average: routeAverage(tally.counts, trip) } : { status: "failed" });
  }

  return (
    <div className="jatra">
      {friend && (
        <section className="jatra-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name ? possessive(friend.name) : "বন্ধুর"} ঈদযাত্রার কার্ড: ${routeLabel(friend)}, ${tripLine(friend)}`} />
          <div>
            <p className="jatra-kicker">একটা পথের নকশা এসেছে</p>
            <h2 id="friend-title">{friend.name || "বন্ধু"} {routeWords(friend)} {friend.onTheWay ? `যাচ্ছে, ${mode(friend.mode).by} ${bn(friend.hours)} ঘণ্টা ধরে পথে` : `গেছে ${mode(friend.mode).by} ${bn(friend.hours)} ঘণ্টায়`}। <span>এবার তোমার পালা!</span></h2>
            <a className="kit-primary" href="#jatra-stage">আমার পথটা আঁকি</a>
          </div>
        </section>
      )}

      <div className="jatra-stage" id="jatra-stage">
        <canvas ref={stage} width={1080} height={660} role="img" aria-label={`পথের নকশা: ${routeLabel(trip)}, ${tripLine(trip)}`} />
        <p className="jatra-summary" aria-live="polite"><strong>{routeLabel(trip)}</strong><span>{tripLine(trip)}</span></p>
      </div>

      <div className="jatra-controls">
        <DivisionChips legend="কোথা থেকে রওনা দিলে?" value={trip.from} onChange={from => update({ from })} />
        <DivisionChips legend="বাড়ি কোন বিভাগে?" value={trip.to} onChange={to => update({ to })} />
        <fieldset className="jatra-chips jatra-modes">
          <legend>কীসে চড়ে?</legend>
          <div>{modes.map(item => <button type="button" key={item.id} aria-pressed={trip.mode === item.id} onClick={() => update({ mode: item.id })}><ModeIcon id={item.id} />{item.label}</button>)}</div>
        </fieldset>
        <HoursStepper value={trip.hours} onChange={hours => update({ hours })} />
        <fieldset className="jatra-chips jatra-status">
          <legend>এখন কোথায়?</legend>
          <div>
            <button type="button" aria-pressed={!trip.onTheWay} onClick={() => update({ onTheWay: false })}>বাড়ি পৌঁছে গেছি</button>
            <button type="button" aria-pressed={trip.onTheWay} onClick={() => update({ onTheWay: true })}>এখনো পথে</button>
          </div>
        </fieldset>
        <label className="jatra-name">
          <span>নাম <small>না দিলেও চলবে</small></span>
          <input value={trip.name} maxLength={MAX_NAME} onChange={event => update({ name: event.target.value })} placeholder="যেমন: রাফি" autoComplete="nickname" />
        </label>
      </div>

      <StickyNext show={!resultVisible} title={<><strong>{bn(trip.hours)} ঘণ্টা</strong> {trip.onTheWay ? "ধরে পথে" : "পথে"}</>} sub={line} href="#result" label="কার্ডটা দেখো" />

      <section className="jatra-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="jatra-result-head">
          <h2 id="result-title">তোমার পথের নকশা: <em>{bn(trip.hours)} ঘণ্টা</em></h2>
          <p>{line}</p>
        </div>
        <div className="jatra-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="jatra-sr">{trip.name ? `${possessive(trip.name)} ঈদযাত্রা` : "ঈদযাত্রা"}: {routeLabel(trip)}, {tripLine(trip)}। {line}{average && !trip.onTheWay ? ` ${averageLine(trip, average)}।` : ""}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="jatra-share">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="eidjatra.png" makeImage={() => cardBlob(trip, format, site, average)} imageKey={`${state}|${format}|${average?.people ?? 0}`} caption={caption(trip)} state={state} hint="বন্ধুকে লিংক পাঠালে সে তোমার পথ দেখে নিজেরটাও আঁকতে পারবে।" />
          </div>
        </div>

        <div className="jatra-tally">
          <h3>{added.status === "done" ? "তোমার ঘণ্টাটা যোগ হয়েছে" : "এবারের ঈদযাত্রায় তোমার ঘণ্টাটাও যোগ করবে?"}</h3>
          {trip.onTheWay ? <p>বাড়ি পৌঁছে ‘বাড়ি পৌঁছে গেছি’ বেছে নাও, তখন পুরো ঘণ্টাটা যোগ করতে পারবে। পথের মাঝের হিসাব যোগ করলে সবার গড় ভুল হয়ে যেত।</p>
            : added.status !== "done" ? <>
              <p>যোগ করলে দেখাবে, {routeWords(trip)} {mode(trip.mode).by} যারা জানিয়েছে, তাদের গড়ে কত ঘণ্টা লেগেছে। শুধু পথ, বাহন আর ঘণ্টার ঘরটা গোনা হয়। নাম বা আর কিছু যায় না।</p>
              <button type="button" className="kit-secondary" onClick={addMine} disabled={added.status === "sending"}>{added.status === "sending" ? "যোগ হচ্ছে…" : "আমার ঘণ্টাটা যোগ করো"}</button>
              {added.status === "failed" && <p className="kit-status" role="alert">এখন যোগ করা গেল না। নেট ঠিক আছে কি না দেখে আরেকবার চেষ্টা করো।</p>}
            </>
            : added.average ? <>
              <p className="jatra-tally-big">{averageLine(trip, added.average)}</p>
              <p>{compareLine(trip.hours, added.average)} লাইনটা তোমার কার্ডেও বসে গেছে।</p>
              <p className="kit-status">ঘণ্টার ঘর ধরে আন্দাজে গড়। এটা একটুখানির খেলা, কোনো জরিপ বা রাস্তার খবর না।</p>
            </>
            : <p className="kit-status">ধন্যবাদ! এই পথে {mode(trip.mode).by} এখনো {bn(MIN_SAMPLE)} জন জানায়নি, তাই গড়টা এখনই দেখাচ্ছি না। একই পথের বন্ধুদের লিংক পাঠাও।</p>}
        </div>
      </section>
    </div>
  );
}
