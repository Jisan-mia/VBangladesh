"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { dhakaToday } from "../../koto-din-baki/lib/countdown";
import { LAMPS } from "../lib/arch";
import { cardBlob, drawCard, type CardContent } from "../lib/draw-card";
import { bn, bucketOf, cardHeadline, clampCount, everyoneSays, friendLine, momentLabel, moments, parseShareHash, possessive, pujaDates, PUJA, shareHash, signOff, toggleMoment, tourLine, yearLabel, MAX_COUNT, MAX_NAME_LENGTH, MAX_PANDALS_LENGTH, type MomentId, type Tour } from "../lib/mondop";
import { ArchArt } from "./arch-art";

const TOOL = "mondop";
// The count is kept per Puja year, so next year's arch starts dark again.
const STORAGE_KEY = `mondop-${PUJA.year}`;
// "বেশিরভাগ ৪–৭টা" from a handful of people is noise, not a trend.
const TALLY_MIN = 30;

function cardFor(tour: Tour, friend: Tour | null, today: string): CardContent {
  return { ...tour, line: tourLine(tour.count, tour.moments), signOff: signOff(tour.year, today), friend: friendLine(tour.count, friend) };
}

export function MondopBuilder() {
  const [count, setCount] = useState(0);
  const [picked, setPicked] = useState<MomentId[]>([]);
  const [name, setName] = useState("");
  const [pandals, setPandals] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Tour | null>(null);
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [joined, setJoined] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const own: Tour = useMemo(() => ({ count, moments: picked, year: PUJA.year, name, pandals }), [count, picked, name, pandals]);
  const card = useMemo(() => cardFor(own, friend, today), [own, friend, today]);
  const state = shareHash(own).slice(1);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared card replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    try {
      const saved = parseShareHash(localStorage.getItem(STORAGE_KEY) ?? "");
      if (saved && saved.year === PUJA.year) { setCount(saved.count); setPicked(saved.moments); setName(saved.name); setPandals(saved.pandals); }
    } catch { /* private mode: the count just won't survive a reload */ }
    setLoaded(true);
    setSite(window.location.host);
    setToday(dhakaToday(new Date()));
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    // A night of pandal-hopping spans many page loads; the tally of the night lives in this browser only.
    try { localStorage.setItem(STORAGE_KEY, state); } catch { /* storage blocked */ }
  }, [loaded, state]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("রাফির পূজা শুভ বিজয়া ১১").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, cardFor(friend, null, today), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend, today]);

  const stale = () => setJoined(current => current === "done" ? "idle" : current);

  function add(step: number) {
    setCount(current => clampCount(current + step));
    if (step > 0) navigator.vibrate?.(12);
    stale();
  }

  function toggle(id: MomentId) {
    setPicked(current => toggleMoment(current, id));
    stale();
  }

  function restart() {
    if (count > 2 && !window.confirm("গোনা মুছে শূন্য থেকে শুরু করবে?")) return;
    setCount(0);
    setPicked([]);
    stale();
  }

  async function join() {
    const bucket = bucketOf(count);
    if (!bucket) return;
    setJoined("sending");
    // Only the count's range and fixed moment ids are counted; names and pandal names never leave the link.
    const tally = await addToTally(TOOL, [bucket.id, ...picked]);
    if (tally) { setEveryone(tally); setJoined("done"); } else setJoined("failed");
  }

  const dates = pujaDates();
  const says = everyone ? everyoneSays(everyone.counts, TALLY_MIN) : null;
  const friendName = friend?.name || "তোমার বন্ধু";
  const gap = friend ? friend.count - count : 0;
  const caption = card.friend
    ? `${card.friend}! এবার পূজায় আমি ${bn(count)}টা মণ্ডপ ঘুরলাম। তুমি কয়টা? ${card.signOff}`
    : `এবার পূজায় ${bn(count)}টা মণ্ডপ ঘুরলাম! ${card.line} তুমি কয়টা ঘুরলে? ${card.signOff}`;

  return (
    <div className="mp">
      {friend && (
        <section className="mp-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${cardHeadline(friend.name)}: ${bn(friend.count)}টা মণ্ডপ`} />
          <div>
            <p className="mp-kicker">তোমার জন্য একটা চালচিত্র এসেছে</p>
            <h2 id="friend-title">{friendName} এবার <em>{bn(friend.count)}টা</em> মণ্ডপ ঘুরেছে।<br />তুমি কয়টা?</h2>
            <a className="kit-primary" href="#mp-counter">আমারটা গুনি</a>
          </div>
        </section>
      )}

      <div className="mp-stage" id="mp-counter">
        <div className="mp-arch">
          <ArchArt count={count} />
          <p className="mp-count" data-long={count >= 100} aria-live="polite"><strong>{bn(count)}</strong><span>টা মণ্ডপ</span></p>
        </div>
        <div className="mp-buttons">
          <button type="button" className="mp-minus" onClick={() => add(-1)} disabled={count === 0} aria-label="একটা কমাও">−</button>
          <button type="button" className="kit-primary mp-plus" onClick={() => add(1)} disabled={count >= MAX_COUNT}><span aria-hidden="true">+</span> মণ্ডপ ঘুরলাম</button>
        </div>
        <p className="mp-line">
          {count > LAMPS ? "সব প্রদীপ জ্বলে গেছে, পুরো চালচিত্র আলোয় ভরা। " : ""}
          {friend && count > 0 ? (gap > 0 ? `${friendName} ${bn(friend.count)}টা। আর ${bn(gap)}টা হলেই ধরে ফেলবে!` : gap === 0 ? `${friendName}ও ${bn(friend.count)}টা, একদম সমান সমান!` : `${friendName} ${bn(friend.count)}টা, এবার তুমি এগিয়ে!`) : tourLine(count, picked)}
        </p>

        <fieldset className="mp-moments">
          <legend>কোন মুহূর্তগুলো হলো?</legend>
          <p>নিজে করেছ বা পাশে দাঁড়িয়ে দেখেছ, যেগুলো হয়েছে টিক দাও। না দিলেও চলবে।</p>
          <div>
            {moments.map(moment => (
              <button type="button" key={moment.id} aria-pressed={picked.includes(moment.id)} onClick={() => toggle(moment.id)}>
                <svg viewBox="-10 -10 20 20" aria-hidden="true">{[0, 72, 144, 216, 288].map(angle => <ellipse key={angle} cy="-4.6" rx="2.7" ry="4.3" transform={`rotate(${angle})`} />)}<circle r="2.3" /></svg>
                {moment.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <StickyNext show={count > 0 && !resultVisible} title={<><strong>{bn(count)}টা</strong> মণ্ডপ</>} sub={tourLine(count, picked)} href="#result" label="কার্ডটা দেখো" />

      <section className="mp-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="mp-result-head">
          <h2 id="result-title">{count ? <>এবার তোমার <em>{bn(count)}টা মণ্ডপ</em></> : "চালচিত্রটা এখনো অন্ধকার"}</h2>
          <p>{count ? card.line : "ওপরের ‘মণ্ডপ ঘুরলাম’ চাপলেই প্রথম প্রদীপ জ্বলবে, কার্ডও তৈরি হবে।"}</p>
        </div>

        <div className="mp-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="mp-card-summary" />
            <figcaption id="mp-card-summary" className="mp-sr">{cardHeadline(name)}: এবার {bn(count)}টা মণ্ডপ। {card.signOff}। {picked.map(momentLabel).join(", ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="mp-controls">
            <label className="mp-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <label className="mp-field">
              <span>কোন কোন মণ্ডপে গেলে? <small>না দিলেও চলবে · শুধু তোমার কার্ড আর লিংকে থাকবে</small></span>
              <input value={pandals} maxLength={MAX_PANDALS_LENGTH} onChange={event => setPandals(event.target.value)} placeholder="যেমন: ঢাকেশ্বরী, বনানী, শাঁখারীবাজার" autoComplete="off" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="mondop.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${card.signOff}|${card.friend}`} caption={caption} state={state} disabled={!count} hint={count ? `বন্ধুকে লিংক পাঠালে সে ${name ? possessive(name) : "তোমার"} চালচিত্র দেখে নিজেরটা গুনতে পারবে।` : ""} />
            {count > 0 && <button type="button" className="kit-link mp-restart" onClick={restart}>শূন্য থেকে আবার গুনি</button>}
            <p className="mp-date">
              দুর্গাপূজা {yearLabel(PUJA.year)}: ষষ্ঠী <strong>সম্ভাব্য {dates.shashthi}</strong> (পঞ্জিকা অনুযায়ী, এলাকাভেদে এক দিন এদিক-ওদিক হতে পারে), বিজয়া দশমী <strong>{dates.dashami}</strong>। {PUJA.holidays}।{" "}
              সূত্র: {PUJA.sources.map((source, index) => <span key={source.url}>{index ? " · " : ""}<a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></span>)}
            </p>
          </div>
        </div>

        {count > 0 && (
          <div className="mp-everyone">
            <h3>সবাই কয়টা মণ্ডপ ঘুরল, দেখবে?</h3>
            {joined !== "done" ? <>
              <p>তোমার সংখ্যাটা কোন ঘরে পড়ে (যেমন ৪–৭টা) আর টিক দেওয়া মুহূর্তগুলো সবার হিসাবে যোগ হবে। নাম বা মণ্ডপের নাম যাবে না।</p>
              <button type="button" className="kit-secondary" onClick={join} disabled={joined === "sending"}>{joined === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {joined === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : says ? <>
              <p>{bn(says.people)} জনের সাথে মেলানো হলো।{says.bucket && <> বেশিরভাগ মানুষ ঘুরেছে <strong>{says.bucket.label}</strong> মণ্ডপ।</>}</p>
              {says.moment && <p>সবচেয়ে বেশি মানুষের হয়েছে: <strong>{says.moment.label}</strong></p>}
            </> : <p className="kit-status">যোগ হয়েছে! এখনো কম মানুষ মিলিয়েছে, তাই হিসাবটা এখনই বলা যাচ্ছে না। বন্ধুদের লিংক পাঠাও।</p>}
          </div>
        )}
      </section>
    </div>
  );
}
