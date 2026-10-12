"use client";

import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { SoundToggle } from "../../../shared/game-ui";
import { tone } from "../../../shared/game-sound";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { bn, bucketOf, buckets, calculate, caption, clamp, cleanRoute, defaults, habitLine, humanLine, limits, overAnHour, parseShareHash, readDigits, shareHash, MAX_ROUTE, WEEKS_PER_YEAR, type Commute } from "../lib/jam";

const TOOL = "jam";
// Below this, "৩ জন হিসাব করেছে" reads as an empty room rather than social proof.
const SOCIAL_PROOF_MIN = 50;
// Percentages from a handful of people are noise.
const COMPARE_MIN = 20;
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

type Field = "minutes" | "days" | "years";

function Stepper({ id, label, unit, value, field, onChange }: { id: string; label: string; unit: string; value: number; field: Field; onChange: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null);
  const range = limits[field];
  const commit = (text: string) => { const typed = readDigits(text); if (!Number.isNaN(typed)) onChange(clamp(typed, range)); setDraft(null); };
  return <div className="jam-stepper">
    <label htmlFor={id}>{label}</label>
    <div className="jam-stepper-row">
      <button type="button" aria-label={`${label}: কমাও`} disabled={value <= range.min} onClick={() => onChange(clamp(value - range.step, range))}>−</button>
      <span className="jam-stepper-value">
        <input id={id} inputMode="numeric" autoComplete="off" value={draft ?? bn(value)} onFocus={event => { setDraft(bn(value)); event.currentTarget.select(); }} onChange={event => { setDraft(event.target.value); const typed = readDigits(event.target.value); if (!Number.isNaN(typed) && typed >= range.min) onChange(clamp(typed, range)); }} onBlur={event => commit(event.target.value)} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} />
        <span aria-hidden="true">{unit}</span>
      </span>
      <button type="button" aria-label={`${label}: বাড়াও`} disabled={value >= range.max} onClick={() => onChange(clamp(value + range.step, range))}>+</button>
    </div>
  </div>;
}

export function JamCalculator() {
  const [commute, setCommute] = useState<Commute>(defaults);
  const [friend, setFriend] = useState<Commute | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const totals = calculate(commute);
  const line = humanLine(commute);
  const state = shareHash(commute).slice(1);
  const mine = bucketOf(commute.minutes);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared card replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("জ্যামে জীবনের ৯৮ দিন").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, commute, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [commute, format, site, friend]);

  function set(field: Field, value: number) {
    setCommute(current => ({ ...current, [field]: value }));
    setCompared(current => current === "done" ? "idle" : current);
  }

  async function compareWithEveryone() {
    setCompared("sending");
    tone(20, 0.01, 0); // silent: wakes the audio inside the tap, so the honk can play once the answer is back
    const tally = await addToTally(TOOL, [mine.id]);
    if (tally) {
      setEveryone(tally); setCompared("done");
      // A two-note bus horn, honked twice.
      for (const delay of [0, 0.3]) { tone(392, 0.2, 0.07, "square", delay); tone(494, 0.2, 0.07, "square", delay); }
    } else setCompared("failed");
  }

  const friendTotals = friend ? calculate(friend) : null;
  const gap = friend && friendTotals && friendTotals.unit === "দিন" && totals.unit === "দিন" ? Math.round(totals.days) - Math.round(friendTotals.days) : null;
  const longer = everyone ? overAnHour.reduce((sum, id) => sum + (everyone.counts[id] ?? 0), 0) : 0;

  return (
    <div className="jam">
      {friend && friendTotals && (
        <section className="jam-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`বন্ধুর কার্ড: জ্যামে জীবনের ${friendTotals.value} ${friendTotals.unit}`} />
          <div>
            <p className="jam-friend-kicker">তোমার জন্য একটা বাস এসেছে</p>
            <h2 id="friend-title">বন্ধুর জীবনের {friendTotals.value} {friendTotals.unit} গেছে জ্যামে।<br /><span>তোমার কত?</span></h2>
            <a className="kit-primary" href="#jam-bus">আমারটা হিসাব করি</a>
          </div>
        </section>
      )}

      {everyone && everyone.total >= SOCIAL_PROOF_MIN && <p className="jam-proof">এখন পর্যন্ত <strong>{bn(everyone.total)} জন</strong> নিজের জ্যাম হিসাব করেছে</p>}

      <div className="jam-stage">
      <div className="jam-vehicle">
      <div className="jam-bus" id="jam-bus">
        <label className="jam-board">
          <span className="jam-sr">রুট (চাইলে বদলাও)</span>
          <input value={commute.route} maxLength={MAX_ROUTE} onChange={event => setCommute(current => ({ ...current, route: event.target.value }))} onBlur={() => setCommute(current => ({ ...current, route: cleanRoute(current.route) }))} placeholder="তোমার রুট লেখো" autoComplete="off" />
          <svg className="jam-pen" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4Zm11-15 4 4" /></svg>
        </label>
        <div className="jam-windows" aria-hidden="true"><i /><i /><i /><b>সিটিং</b></div>
        <div className="jam-side" aria-live="polite">
          <p className="jam-side-kicker">জ্যামে জীবনের</p>
          <p className="jam-big"><strong key={totals.value}>{totals.value}</strong> {totals.unit}</p>
          <p className="jam-habit">{habitLine(commute)}</p>
        </div>
        <span className="jam-wheel jam-wheel-back" aria-hidden="true" />
        <span className="jam-wheel jam-wheel-front" aria-hidden="true" />
      </div>
      <div className="jam-road" aria-hidden="true" />
      </div>

      <div className="jam-controls">
        <Stepper id="jam-minutes" label="রোজ জ্যামে কত মিনিট?" unit="মিনিট" field="minutes" value={commute.minutes} onChange={value => set("minutes", value)} />
        <Stepper id="jam-days" label="সপ্তাহে কয় দিন রাস্তায়?" unit="দিন" field="days" value={commute.days} onChange={value => set("days", value)} />
        <Stepper id="jam-years" label="কত বছর ধরে?" unit="বছর" field="years" value={commute.years} onChange={value => set("years", value)} />
      </div>
      </div>

      <section className="jam-equal" aria-labelledby="equal-title">
        <h2 id="equal-title">এই সময়ে যা হয়ে যেত</h2>
        <ul>{totals.counts.map(item => <li key={item.id}><strong>{item.text}</strong><span>{item.basis} ধরে</span></li>)}</ul>
        <p className="jam-math">হিসাবটা: রোজ {bn(commute.minutes)} মিনিট × সপ্তাহে {bn(commute.days)} দিন × বছরে {bn(WEEKS_PER_YEAR)} সপ্তাহ × {bn(commute.years)} বছর = {bn(Math.round(totals.hours))} ঘণ্টা। এক দিন মানে পুরো ২৪ ঘণ্টা। শুধু তোমার দেওয়া সংখ্যা থেকে হিসাব, শহরের কোনো জরিপ থেকে না।</p>
      </section>

      <StickyNext show={!resultVisible} title={<><strong>{totals.value} {totals.unit}</strong> জ্যামে</>} sub={line} href="#result" label="কার্ডটা দেখো" />

      <section className="jam-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="jam-result-head">
          <h2 id="result-title">তোমার বাসের কার্ড: <em>{totals.value} {totals.unit}</em></h2>
          <p>{line}</p>
          {gap !== null && <p className="jam-compare">{gap === 0 ? "বন্ধুর সাথে একদম সমান! একই বাসের যাত্রী নাকি?" : gap > 0 ? `বন্ধুর চেয়ে ${bn(gap)} দিন বেশি জ্যামে। তুমিই এই রুটের সিনিয়র।` : `বন্ধুর চেয়ে ${bn(-gap)} দিন কম জ্যামে। কপাল ভালো!`}</p>}
        </div>
        <div className="jam-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="jam-sr">জ্যামে জীবনের {totals.value} {totals.unit}। {habitLine(commute)}। {totals.counts.slice(0, 3).map(item => item.text).join(", ")}। {line}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা রিলোড করে দেখো।</p>}
          </figure>
          <div className="jam-share">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="jame-jibon.png" makeImage={() => cardBlob(commute, format, site)} imageKey={`${state}|${format}`} caption={caption(commute)} state={state} hint="লিংকে তোমার বাসটাই যায়। বন্ধু খুলে নিজের হিসাবও করতে পারবে।" />
          </div>
        </div>

        <div className="jam-everyone">
          <h3>সবার সাথে মিলিয়ে দেখবে?</h3>
          {compared !== "done" || !everyone ? <>
            <p>দেখো তোমার মতো কতজন রোজ এতক্ষণ রাস্তায় বসে থাকে। শুধু তোমার রোজকার মিনিটের ঘরটা (যেমন ‘{mine.label}’) গোনা হবে, আর কিছু না।</p>
            <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button> <SoundToggle compact />
            {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : everyone.total < COMPARE_MIN ? <p className="kit-status">এখনো খুব কম মানুষ হিসাব করেছে, তাই এখনই কিছু বলা যাবে না। বন্ধুদের লিংক পাঠাও, কয়েকজন মেলালে দেখা যাবে।</p> : <>
            <p className="jam-everyone-big">যারা হিসাব করেছে, তাদের <strong>{bn(percent(longer, everyone.total))}%</strong> রোজ ১ ঘণ্টা বা তার বেশি জ্যামে থাকে।</p>
            <ul className="jam-bars">{buckets.map(item => { const share = percent(everyone.counts[item.id] ?? 0, everyone.total); return <li key={item.id} data-mine={item.id === mine.id}><span>{item.label}{item.id === mine.id ? " · তুমি" : ""}</span><i style={{ width: `${share}%` }} /><b>{bn(share)}%</b></li>; })}</ul>
            <p className="kit-status">{bn(everyone.total)} জনের হিসাব থেকে। এটা একটুখানির খেলা, কোনো জরিপ না।</p>
          </>}
        </div>
      </section>
    </div>
  );
}
