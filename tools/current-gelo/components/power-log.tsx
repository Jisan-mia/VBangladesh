"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, type CardData } from "../lib/draw-card";
import { CROWD_NOTE, DAY, DAY_MINUTES, HOUR, MINUTE, MIN_SAMPLE, bn, bucketOf, caption, clock, crowd, dayKey, dayStart, divisionOf, divisions, duration, humanLine, parseShareHash, previousDay, reports, shareHash, tallyId, votesToSend, whenLabel, type Day } from "../lib/gelo";
import { ASK_AFTER, STORAGE_KEY, clearAdjust, comeOn, dayMinutes, empty, endAt, endOf, goOff, hhmm, openOutage, outageCount, parseSaved, removeOutage, stepHours, type Saved } from "../lib/log";
import { Candle, Hurricane } from "./props";

const TOOL = "current-gelo";
const UNDO_FOR = 20_000;

export function PowerLog() {
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [saved, setSaved] = useState<Saved>(empty);
  const [storageFailed, setStorageFailed] = useState(false);
  const [undo, setUndo] = useState<{ before: Saved; note: string } | null>(null);
  const [note, setNote] = useState("");
  const [askedAbout, setAskedAbout] = useState<number | null>(null);
  const [typedFix, setTypedFix] = useState<{ off: number; time: string } | null>(null);
  const [fixError, setFixError] = useState("");
  const [friend, setFriend] = useState<Day | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [tally, setTally] = useState<Tally | null>(null);
  const [voting, setVoting] = useState<"idle" | "sending" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const today = dayKey(now);
  const open = openOutage(saved);
  const minutes = ready ? dayMinutes(saved, today, now) : 0;
  const times = ready ? outageCount(saved.outages, today, now) : 0;
  const yesterday = ready ? dayMinutes(saved, previousDay(today), now) : 0;
  const openFor = open ? Math.max(0, now - open.off) : 0;
  const asking = open && openFor > ASK_AFTER && askedAbout !== open.off ? open : null;
  // The time box starts an hour after the power went; what the person types sticks to that outage only.
  const fixTime = asking ? (typedFix?.off === asking.off ? typedFix.time : hhmm(Math.min(asking.off + HOUR, now))) : "";
  const adjust = saved.adjust[today] ?? 0;
  const division = saved.division;
  const area = divisionOf(division);
  const crowdInfo = useMemo(() => crowd(tally, today, division), [tally, today, division]);
  const day: Day = { minutes, times, division, date: ready ? today : "" };
  const state = shareHash(day).slice(1);
  const card: CardData = useMemo(() => ({ minutes, times, division, date: today, today, crowd: crowdInfo }), [minutes, times, division, today, crowdInfo]);
  const line = humanLine(minutes, times);
  const bucket = bucketOf(minutes);
  const votedId = saved.votes[today];
  const currentId = division ? tallyId(today, division, bucket.id) : "";
  const reported = reports(tally, today, division);
  const start = dayStart(today);
  const todays = saved.outages.map((outage, index) => ({ outage, index })).filter(({ outage }) => endOf(outage, now) >= start && outage.off < start + DAY);

  useEffect(() => {
    const at = Date.now();
    try { setSaved(parseSaved(localStorage.getItem(STORAGE_KEY), at)); } catch { setStorageFailed(true); }
    setNow(at);
    setReady(true);
    setSite(window.location.host);
    // In-page anchors (#result) also change the hash, so only a real shared day replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    readTally(TOOL, dayKey(at).slice(2).replaceAll("-", "")).then(setTally);
    const tick = () => setNow(Date.now());
    const timer = window.setInterval(tick, 20_000);
    document.addEventListener("visibilitychange", tick);
    window.addEventListener("hashchange", readFriend);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", tick); window.removeEventListener("hashchange", readFriend); };
  }, []);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { setStorageFailed(true); }
  }, [saved, ready]);

  useEffect(() => {
    if (!undo) return;
    const timer = window.setTimeout(() => setUndo(null), UNDO_FOR);
    return () => window.clearTimeout(timer);
  }, [undo]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    loadCardFonts("আজ ৭ ঘণ্টা অন্ধকারে").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, { ...friend, today, crowd: crowd(tally, friend.date, friend.division) }, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [ready, card, format, site, friend, today, tally]);

  function act(change: (current: Saved, at: number) => Saved, message: string, undoable = true) {
    const at = Date.now();
    const next = change(saved, at);
    setNow(at);
    if (next === saved) return;
    setSaved(next);
    setNote(message);
    setUndo(undoable ? { before: saved, note: message } : null);
  }

  const wentOff = () => act((current, at) => goOff(current, at), `কারেন্ট গেল ${clock(Date.now())}-এ। ফিরলে ‘কারেন্ট এল’ চাপো।`);
  const cameOn = () => act((current, at) => comeOn(current, at), open ? `কারেন্ট এল! এবারে গেছিল ${duration(Math.round(Math.min(Date.now() - open.off, 12 * HOUR) / MINUTE))}।` : "");

  function fixEnd() {
    if (!asking) return;
    const at = endAt(asking.off, fixTime, Date.now());
    if (at === null) { setFixError("এই সময়টা এখনো আসেনি। কারেন্ট যাওয়ার পরের একটা সময় দাও।"); return; }
    act((current, moment) => comeOn(current, moment, at), `ঠিক করা হলো: কারেন্ট এসেছিল ${clock(at)}-এ।`);
  }

  async function vote() {
    if (!currentId) return;
    setVoting("sending");
    const votes = votesToSend(saved.votes, today, currentId);
    const next = await addToTally(TOOL, Object.values(votes), today.slice(2).replaceAll("-", ""));
    if (!next) { setVoting("failed"); return; }
    setTally(next);
    setSaved(current => ({ ...current, votes }));
    setVoting("idle");
  }

  const friendWhen = friend ? whenLabel(friend.date, today) : "";
  const friendArea = friend ? divisionOf(friend.division) : undefined;

  return (
    <div className="cg">
      {friend && (
        <section className="cg-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`বন্ধুর কার্ড: ${friend.minutes ? `${duration(friend.minutes)} অন্ধকারে` : "কারেন্ট যায়নি"}`} />
          <div>
            <p className="cg-friend-kicker">তোমার জন্য একটা মোমবাতি এসেছে</p>
            <h2 id="friend-title">{friendArea ? `${friendArea.at} ` : ""}বন্ধুর {friendWhen} {friend.minutes ? `${duration(friend.minutes)} কেটেছে অন্ধকারে` : "কারেন্ট একবারও যায়নি"}।<br /><span>তোমার আজ কত ঘণ্টা?</span></h2>
            <a className="kit-primary" href="#room">আমারটা হিসাব করি</a>
          </div>
        </section>
      )}

      <div className="cg-room" id="room" data-power={open ? "off" : "on"}>
        <span className="cg-tube" aria-hidden="true" />
        <p className="cg-status"><i aria-hidden="true" />{!ready ? "হিসাব খোলা হচ্ছে…" : open ? `কারেন্ট নেই · ${duration(Math.floor(openFor / MINUTE))} ধরে` : "কারেন্ট আছে"}</p>
        <div className="cg-readout">
          <p className="cg-label">আজ অন্ধকারে কেটেছে</p>
          <p className="cg-total">{minutes === 0 && !open ? <span className="cg-none">এখনো একটুও না</span> : <TotalText minutes={minutes} />}</p>
          <p className="cg-sub">{[times ? `${bn(times)} বার গেল` : "", yesterday ? `গতকাল ${duration(yesterday)}` : ""].filter(Boolean).join(" · ") || (open ? "ফিরলে ‘কারেন্ট এল’ চাপো" : "কারেন্ট গেলেই নিচের সুইচ চাপো")}</p>
        </div>
        <div className="cg-props">
          <Candle minutes={minutes} lit={Boolean(open)} />
          <Hurricane lit={Boolean(open)} />
        </div>
        <span className="cg-table" aria-hidden="true" />
      </div>

      <div className="cg-board" role="group" aria-label="কারেন্টের খবর দাও">
        <button type="button" className="cg-switch" data-kind="off" disabled={!ready || Boolean(open)} onClick={wentOff}>
          <span className="cg-rocker" aria-hidden="true" /><span>কারেন্ট গেল</span>
        </button>
        <button type="button" className="cg-switch" data-kind="on" disabled={!ready || !open} onClick={cameOn}>
          <span className="cg-rocker" aria-hidden="true" /><span>কারেন্ট এল</span>
        </button>
      </div>

      {asking ? (
        <div className="cg-fix">
          <p><strong>{duration(Math.floor(openFor / MINUTE))} ধরে কারেন্ট নেই</strong> দেখাচ্ছে। ‘এল’ চাপতে ভুলে গেছ?</p>
          <div className="cg-fix-row">
            <label>কখন এসেছিল? <input type="time" value={fixTime} onChange={event => { setTypedFix({ off: asking.off, time: event.target.value }); setFixError(""); }} /></label>
            <button type="button" className="kit-secondary" onClick={fixEnd}>এই সময়ে এসেছিল</button>
          </div>
          <button type="button" className="kit-link" onClick={() => setAskedAbout(asking.off)}>না, এখনো আসেনি</button>
          <p className="kit-status" role="alert">{fixError || "একটানা ১২ ঘণ্টার বেশি গোনা হয় না।"}</p>
        </div>
      ) : (
        <p className="cg-note" role="status" aria-live="polite">
          {storageFailed ? "এই ব্রাউজারে হিসাব জমানো যাচ্ছে না, পাতা বন্ধ করলে মুছে যাবে।" : note}
          {undo && <button type="button" className="kit-link" onClick={() => { setSaved(undo.before); setUndo(null); setNote("আগের অবস্থায় ফিরিয়ে আনা হলো।"); setNow(Date.now()); }}>ভুল করে চাপলে? ফিরিয়ে আনো</button>}
        </p>
      )}

      <div className="cg-manual">
        <p id="cg-manual-label">চাপতে ভুলে গেছ? <strong>আজকের মোট সময় নিজেই বসাও</strong></p>
        <div className="cg-stepper">
          <button type="button" aria-label="এক ঘণ্টা কমাও" disabled={!ready || minutes === 0} onClick={() => act((current, at) => stepHours(current, dayKey(at), at, -1), "", false)}>−</button>
          <output aria-labelledby="cg-manual-label" aria-live="polite">{minutes ? duration(minutes) : "০ ঘণ্টা"}</output>
          <button type="button" aria-label="এক ঘণ্টা বাড়াও" disabled={!ready || minutes >= DAY_MINUTES} onClick={() => act((current, at) => stepHours(current, dayKey(at), at, 1), "", false)}>+</button>
        </div>
        {adjust !== 0 && <p className="cg-adjust">এর মধ্যে নিজে {adjust > 0 ? "যোগ" : "বাদ"} করা {duration(Math.abs(adjust))}। <button type="button" className="kit-link" onClick={() => act(current => clearAdjust(current, today), "শুধু চাপা হিসাবটা রইল।")}>এটা বাদ দাও</button></p>}
      </div>

      <fieldset className="kit-chips cg-divisions">
        <legend>কোন বিভাগে আছ? <small>কার্ডে আর গড়ে লাগবে</small></legend>
        {divisions.map(item => <button type="button" key={item.id} aria-pressed={division === item.id} onClick={() => setSaved(current => ({ ...current, division: current.division === item.id ? "" : item.id }))}>{item.label}</button>)}
      </fieldset>

      {times > 0 && (
        <details className="cg-log">
          <summary>আজকের খাতা · {bn(times)} বার গেল</summary>
          <ol>
            {todays.map(({ outage, index }) => (
              <li key={outage.off}>
                <span>{clock(outage.off)} → {outage.on === null ? "এখনো নেই" : clock(outage.on)}</span>
                <small>{duration(Math.floor((endOf(outage, now) - outage.off) / MINUTE))}</small>
                <button type="button" className="kit-link" aria-label={`${clock(outage.off)}-এর হিসাবটা মুছে দাও`} onClick={() => act(current => removeOutage(current, index), "একটা হিসাব মুছে দেওয়া হলো।")}>মুছে দাও</button>
              </li>
            ))}
          </ol>
        </details>
      )}

      <StickyNext show={ready && minutes > 0 && !resultVisible} title={<><strong>{duration(minutes)}</strong> অন্ধকারে</>} sub={line} href="#result" label="কার্ডটা দেখো" />

      <section className="cg-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="cg-result-head">
          <h2 id="result-title">{minutes ? <>আজ <em>{duration(minutes)}</em> অন্ধকারে</> : <>আজ কারেন্ট <em>যায়নি!</em></>}</h2>
          <p>{line}</p>
        </div>
        <div className="cg-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="cg-sr">{minutes ? `আজ ${duration(minutes)} কারেন্ট ছিল না` : "আজ কারেন্ট যায়নি"}{area ? `, ${area.label} বিভাগ` : ""}। {line}{crowdInfo ? ` ${crowdInfo.line}, ${CROWD_NOTE}।` : ""}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="cg-share">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="current-gelo.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${crowdInfo?.line ?? ""}`} caption={caption(day)} state={state} disabled={!ready} hint="লিংক পেলে বন্ধু তোমার মোমবাতি দেখবে, আর নিজের এলাকার হিসাব দেবে।" />
          </div>
        </div>

        <div className="cg-everyone">
          <h3>তোমার এলাকায় অন্যদের কেমন গেল?</h3>
          {crowdInfo ? (
            <p className="cg-crowd"><strong>{crowdInfo.line}</strong><span>{CROWD_NOTE} · আজ {bn(crowdInfo.count)} জন</span></p>
          ) : (
            <p>{reported.count ? `আজ ${area ? `${area.label} বিভাগ থেকে` : "এখন পর্যন্ত"} ${bn(reported.count)} জন জানিয়েছে।` : "আজ এখনো কেউ জানায়নি।"} অন্তত {bn(MIN_SAMPLE)} জন জানালে গড় দেখাব।</p>
          )}
          <p>চাইলে তোমার হিসাবটাও যোগ করো। শুধু তারিখ, বিভাগ আর তোমার ঘণ্টা কোন ঘরে (‘{bucket.label}’) সেটা গোনা হবে। নাম বা ঠিকানা যাবে না।</p>
          {!division ? <p className="kit-status">যোগ করতে আগে ওপরে বিভাগ বেছে নাও।</p> : (
            <button type="button" className="kit-secondary" onClick={vote} disabled={!ready || voting === "sending" || votedId === currentId}>
              {voting === "sending" ? "যোগ হচ্ছে…" : votedId === currentId ? "যোগ হয়েছে, ধন্যবাদ!" : votedId ? "নতুন হিসাবটা দাও" : "আমার হিসাব যোগ করো"}
            </button>
          )}
          {voting === "failed" && <p className="kit-status" role="alert">এখন যোগ করা গেল না। নেট ঠিক আছে কি না দেখে আবার চেষ্টা করো।</p>}
        </div>
      </section>
    </div>
  );
}

function TotalText({ minutes }: { minutes: number }) {
  const hours = Math.floor(minutes / 60), rest = minutes % 60;
  return <>{hours > 0 && <><b>{bn(hours)}</b> ঘণ্টা </>}{(rest > 0 || hours === 0) && <><b>{bn(rest)}</b> মিনিট</>}</>;
}
