"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  axisTicks, axisUnit, bn, caption, createCard, curvePath, finalId, finalSplit, moodCounts, moods, parseShareHash, possessive, readMatch, shareHash, sportOf, sports, summaryText, wormPoints,
  MAX_MOODS, MAX_TEXT, MIN_SHARE, SAMPLE, type Match, type SportId,
} from "../lib/worm";

const TOOL = "matcher-mon";
// The match in progress lives in this browser, so a reload or an app switch mid-match loses nothing.
const SAVE_KEY = "matcher-mon-match";
const UNDO_LIMIT = 120;
// Plot coordinates: 1000 wide, one 100-high row per mood. The SVG stretches to the board, strokes don't.
const W = 1000, PAD = 26;
type Own = { sport: SportId; moods: number[]; name: string; label: string };

function Face({ mood }: { mood: number }) {
  const face = moods[mood];
  return <svg viewBox="0 0 48 48" aria-hidden="true" className="mm-face">
    <circle cx="24" cy="24" r="21" fill={face.color} stroke="#1b2340" strokeWidth="2.4" />
    {face.light && <path d={face.light} fill="#fff" />}
    {face.dark && <path d={face.dark} fill="#1b2340" />}
    <path d={face.lines} fill="none" stroke="#1b2340" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function plotPoints(list: readonly number[], sport: SportId, longest: number) {
  return wormPoints(list, sport, longest).map(point => ({ x: PAD + point.x * (W - 2 * PAD), y: point.row * 100 + 50, row: point.row }));
}

function Worm({ list, sport, longest, kind, fresh }: { list: readonly number[]; sport: SportId; longest: number; kind: "own" | "friend" | "sample"; fresh?: number }) {
  const points = plotPoints(list, sport, longest);
  return <g className={`mm-worm mm-worm-${kind}`}>
    <path className="mm-line-under" d={curvePath(points)} />
    <path className="mm-line" d={curvePath(points)} />
    {points.map((point, index) => {
      // Zero-length round-capped strokes stay circles even though the SVG is stretched to the board.
      const d = `M${point.x} ${point.y}h0`;
      const isNew = kind === "own" && index > 0 && index === points.length - 1 ? true : undefined;
      return <g key={isNew ? `end-${fresh}` : index}>
        <path className="mm-ring" d={d} data-new={isNew} />
        <path className={index ? "mm-dot" : "mm-dot mm-dot-start"} d={d} stroke={index ? moods[point.row].color : undefined} data-new={isNew} />
      </g>;
    })}
  </g>;
}

export function MoodBoard() {
  const [own, setOwn] = useState<Own>({ sport: "cricket", moods: [], name: "", label: "" });
  const [undoStack, setUndoStack] = useState<number[][]>([]);
  const [friendLink, setFriendLink] = useState<Match | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [taps, setTaps] = useState(0);
  const [status, setStatus] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const friend = friendLink ? { moods: friendLink.moods, name: friendLink.name } : null;
  const hasOwn = own.moods.length > 0;
  const ready = own.moods.length >= MIN_SHARE;
  const match: Match = useMemo(() => ({ ...own, friend: friendLink ? { moods: friendLink.moods, name: friendLink.name } : null }), [own, friendLink]);
  // Until there are taps of your own, the card shows the sample so you can see what you'll get.
  const card = useMemo(() => createCard(hasOwn ? match : { ...match, moods: SAMPLE, name: "", label: "নমুনা", friend: null }), [hasOwn, match]);
  const state = ready ? shareHash(match).slice(1) : "";
  const counts = moodCounts(own.moods);
  const showSample = !hasOwn && !friend;
  const longest = Math.max(own.moods.length, friend?.moods.length ?? 0, showSample ? SAMPLE.length : 0);
  const split = finalSplit(everyone);

  useEffect(() => {
    let saved: Match | null = null;
    try { saved = readMatch(localStorage.getItem(SAVE_KEY) ?? ""); } catch { /* private mode: start fresh */ }
    const link = parseShareHash(window.location.hash);
    if (saved) setOwn({ sport: saved.sport, moods: saved.moods, name: saved.name, label: saved.label });
    if (link) {
      setFriendLink(link);
      // A friend's match is probably the one you watched too; follow their sport if you haven't started.
      if (!saved?.moods.length) setOwn(current => ({ ...current, sport: link.sport }));
    }
    setLoaded(true);
    // In-page anchors (#result, #mm-board) also change the hash, so only a real shared match replaces the friend.
    const readLink = () => { const next = parseShareHash(window.location.hash); if (next) setFriendLink(next); };
    window.addEventListener("hashchange", readLink);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readLink);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(SAVE_KEY, shareHash({ ...own, friend: null })); } catch { /* storage full or blocked: the match still works for this visit */ }
  }, [own, loaded]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("ম্যাচের মন উল্লাস হতাশা").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friendLink && friendPreview.current) drawCard(friendPreview.current, createCard(friendLink), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friendLink]);

  function remember() {
    setUndoStack(stack => [...stack.slice(-UNDO_LIMIT + 1), own.moods]);
  }

  function tap(mood: number) {
    if (own.moods.length >= MAX_MOODS) { setStatus(`${bn(MAX_MOODS)}টা চাপ হয়ে গেছে। এবার কার্ডটা দেখো।`); return; }
    remember();
    setOwn(current => ({ ...current, moods: [...current.moods, mood] }));
    setTaps(count => count + 1);
    setStatus(`${bn(own.moods.length + 1)} নম্বর চাপ: ${moods[mood].label}`);
    setCounted(current => current === "done" ? "idle" : current);
    try { navigator.vibrate?.(18); } catch { /* not every phone allows it */ }
  }

  function undo() {
    const previous = undoStack.at(-1);
    // After a reload the undo list is gone, but the last tap can still come off.
    const next = previous ?? own.moods.slice(0, -1);
    if (previous) setUndoStack(stack => stack.slice(0, -1));
    setOwn(current => ({ ...current, moods: next }));
    setStatus(next.length ? `ফিরিয়ে আনা হলো। এখন ${bn(next.length)}টা চাপ।` : "ফিরিয়ে আনা হলো।");
    setCounted(current => current === "done" ? "idle" : current);
  }

  function startFresh() {
    remember();
    setOwn(current => ({ ...current, moods: [] }));
    setStatus("নতুন ম্যাচ! প্রথম চাপেই শুরু। ভুল হলে ‘ফিরিয়ে আনো’ চাপো, আগেরটা ফিরে আসবে।");
    setCounted("idle");
  }

  async function countMine() {
    const id = finalId(own.moods);
    if (!id) return;
    setCounted("sending");
    const next = await addToTally(TOOL, [id]);
    if (next) { setEveryone(next); setCounted("done"); } else setCounted("failed");
  }

  const friendName = friend ? (friend.name ? possessive(friend.name) : "বন্ধুর") : "";
  const canUndo = undoStack.length > 0 || hasOwn;
  const last = own.moods.at(-1);

  return (
    <div className="mm">
      {friendLink && (
        <section className="mm-friend" aria-labelledby="mm-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName} ম্যাচের মন: ${summaryText(friendLink.moods)}`} />
          <div>
            <p className="mm-kicker">তোমার জন্য একটা ম্যাচের মন এসেছে</p>
            <h2 id="mm-friend-title">{friendName} মন: {summaryText(friendLink.moods)}।<span> তোমার মন কেমন দুলল?</span></h2>
            <p className="mm-friend-note">লাল ওয়ার্মটা {friendName}। তুমি চাপ দিলে নীল ওয়ার্ম পাশাপাশি আঁকা হবে।</p>
          </div>
        </section>
      )}

      <div className="mm-tv" id="mm-board">
        <div className="mm-strip">
          {hasOwn && friend
            ? <span className="mm-live mm-pair"><i aria-hidden="true" />তুমি<i aria-hidden="true" /><span>{friend.name || "বন্ধু"}</span></span>
            : <span className="mm-live"><i aria-hidden="true" />মনের স্কোর</span>}
          <div className="mm-sports" role="group" aria-label="কোন খেলা দেখছ?">
            {sports.map(sport => <button type="button" key={sport.id} aria-pressed={own.sport === sport.id} onClick={() => setOwn(current => ({ ...current, sport: sport.id }))}>{sport.label}</button>)}
          </div>
          <span className="mm-taps" aria-label={`${bn(own.moods.length)}টা চাপ`}>{bn(own.moods.length)}<small>চাপ</small></span>
        </div>

        <div className="mm-board">
          <div className="mm-plot">
            <svg viewBox="0 0 1000 500" preserveAspectRatio="none" role="img" aria-label={hasOwn ? `তোমার মনের গ্রাফ: ${summaryText(own.moods)}` : showSample ? "নমুনা গ্রাফ: শেষ ওভারে জেতা এক ম্যাচ" : `${friendName} মনের গ্রাফ`}>
              {moods.map((mood, index) => <rect key={mood.id} x="0" y={index * 100 + 4} width="1000" height="92" fill={mood.color} fillOpacity=".12" />)}
              {axisTicks(own.sport, longest).map(tick => <path key={tick.label} className="mm-tick" d={`M${PAD + tick.x * (W - 2 * PAD)} 0V500`} />)}
              {showSample && <Worm list={SAMPLE} sport={own.sport} longest={longest} kind="sample" />}
              {friend && <Worm list={friend.moods} sport={own.sport} longest={longest} kind="friend" />}
              {hasOwn && <Worm list={own.moods} sport={own.sport} longest={longest} kind="own" fresh={taps} />}
            </svg>
            {showSample && <p className="mm-hint"><b>নমুনা</b> প্রথম চাপেই তোমার ম্যাচ শুরু →</p>}
            {!hasOwn && friend && <p className="mm-hint"><b>লাল: {friend.name || "বন্ধু"}</b> এবার তোমার পালা →</p>}
          </div>
          <div className="mm-keys" role="group" aria-label="এখন তোমার মন কেমন? চাপলে গ্রাফে যোগ হবে">
            {moods.map((mood, index) => (
              <button type="button" key={mood.id} className="mm-key" data-mood={mood.id} data-last={last === index || undefined} onClick={() => tap(index)} aria-label={`${mood.label}${counts[index] ? `, এ পর্যন্ত ${bn(counts[index])} বার` : ""}`}>
                <Face mood={index} />
                <span>{mood.label}</span>
                {counts[index] > 0 && <b aria-hidden="true">{bn(counts[index])}</b>}
              </button>
            ))}
          </div>
          <div className="mm-axis" aria-hidden="true">
            {axisTicks(own.sport, longest).map(tick => <span key={tick.label} style={{ left: `${(PAD + tick.x * (W - 2 * PAD)) / 10}%` }} data-edge={tick.x === 0 ? "start" : tick.x === 1 ? "end" : undefined}>{tick.label}</span>)}
          </div>
          <p className="mm-unit" aria-hidden="true">← {axisUnit(own.sport)}</p>
        </div>
      </div>

      <div className="mm-controls">
        <button type="button" className="mm-undo" onClick={undo} disabled={!canUndo}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7 4 12l5 5M4.5 12H15a5 5 0 0 1 0 10h-3" /></svg>ফিরিয়ে আনো</button>
        <p className="mm-status" role="status" aria-live="polite">{status || sportOf(own.sport).hint}</p>
        {hasOwn && <button type="button" className="mm-fresh" onClick={startFresh}>নতুন ম্যাচ</button>}
      </div>

      <StickyNext show={ready && !resultVisible} title={<><strong>{bn(own.moods.length)}টা</strong> চাপ{last !== undefined && <> · এখন {moods[last].label}</>}</>} sub="খেলা শেষ হলে কার্ডটা দেখো" href="#result" label="খেলা শেষ" />

      <section className="mm-result" id="result" ref={result} aria-labelledby="mm-result-title">
        <div className="mm-result-head">
          <h2 id="mm-result-title">{ready ? <>তোমার ম্যাচের মন</> : "কার্ডটা দেখতে এমন হবে"}</h2>
          <p>{ready ? (card.pair ? `${card.pair}। ${card.line}` : `${summaryText(own.moods)}। ${card.line}`) : `ওপরে অন্তত ${bn(MIN_SHARE)} বার চাপলে এখানে তোমার নিজের ওয়ার্ম আঁকা হবে।`}</p>
        </div>
        <div className="mm-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={ready ? caption(match) : "নমুনা কার্ড"} />
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="mm-side">
            <div className="mm-fields">
              <label className="mm-field">
                <span>তোমার নাম <small>না দিলেও চলবে</small></span>
                <input value={own.name} maxLength={MAX_TEXT} onChange={event => setOwn(current => ({ ...current, name: event.target.value }))} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <label className="mm-field">
                <span>ম্যাচের নাম <small>কার্ডের ওপরে বসবে</small></span>
                <input value={own.label} maxLength={MAX_TEXT} onChange={event => setOwn(current => ({ ...current, label: event.target.value }))} placeholder="যেমন: শেষ ওভারের ফাইনাল" />
              </label>
            </div>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="matcher-mon.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(match)} state={state} disabled={!ready} hint={ready ? "লিংক পেলে বন্ধু তোমার ওয়ার্ম দেখবে, আর নিজের মন চাপলে দুটো একসাথে আঁকা হবে।" : `অন্তত ${bn(MIN_SHARE)} বার চাপলে শেয়ার করা যাবে।`} />

            {ready && <div className="mm-count">
              <h3>খেলা শেষে সবার মন কেমন?</h3>
              {counted !== "done" ? <>
                <p>শুধু তোমার শেষ মনটা ({moods[last!].label}) গোনা হবে। নাম, ম্যাচের নাম বা গ্রাফ যাবে না।</p>
                <button type="button" className="kit-secondary" onClick={countMine} disabled={counted === "sending"}>{counted === "sending" ? "গোনা হচ্ছে…" : "আমার শেষ মনটা গোনো"}</button>
                {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
              </> : split ? <>
                <ul className="mm-bars">{moods.map((mood, index) => <li key={mood.id} data-mine={index === last || undefined}><span>{mood.label}</span><i style={{ width: `${split.percents[index]}%`, background: mood.color }} /><b>{bn(split.percents[index])}%</b></li>)}</ul>
                <small>একটুখানিতে {bn(split.total)} জন যা জানিয়েছে, জরিপ না। পরে আবার গোনালে আগেরটা বাদ যাবে।</small>
              </> : <p className="kit-status">গোনা হয়েছে! এখনো খুব কম মানুষ জানিয়েছে, তাই ভাগটা পরে দেখাব। বন্ধুদের লিংক পাঠাও।</p>}
            </div>}
          </div>
        </div>
      </section>
    </div>
  );
}
