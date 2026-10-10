"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { shortDate } from "../../koto-din-baki/lib/countdown";
import { bankShapes, coinShapes, type Shape } from "../lib/bank-art";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  LIMITS, addDays, bankLine, bn, breakDays, breakLabel, caption, cleanText, coinScale, defaultBank, dhakaToday, everyWord,
  isBreakId, loadBank, owner, parseShareHash, perChoices, plan, possessive, progressLine, readTaka, saveBank, shareHash, sources, sumLine,
  type Bank, type Every,
} from "../lib/bank";

const TOOL = "matir-bank";
// The page is static HTML: it shows this day until the phone's own date is read, then swaps in the real one.
const SAMPLE_DAY = "2026-10-10";
const store = () => { try { return window.localStorage; } catch { return null; } };

function Paths({ shapes }: { shapes: Shape[] }) {
  return <>{shapes.map((shape, index) => <path key={index} d={shape.d} fill={shape.fill === "clay" ? "url(#mb-clay)" : shape.fill ?? "none"} stroke={shape.stroke} strokeWidth={shape.width} strokeLinecap="round" strokeLinejoin="round" />)}</>;
}

function BankArt({ cracked, drops }: { cracked: boolean; drops: number }) {
  return <svg className="mb-art" viewBox="0 12 200 202" aria-hidden="true">
    <defs>
      <radialGradient id="mb-clay" gradientUnits="userSpaceOnUse" fx="72" fy="92" fr="8" cx="100" cy="124" r="112">
        <stop offset="0" stopColor="#e0834a" /><stop offset=".55" stopColor="#bf5a2c" /><stop offset="1" stopColor="#7d3313" />
      </radialGradient>
    </defs>
    {/* Re-keyed on every drop so the wobble and the falling coin play again. */}
    <g className="mb-pot" key={`pot-${drops}`} data-cracked={cracked}><Paths shapes={bankShapes(cracked)} /></g>
    {drops > 0 && !cracked && <g className="mb-coin" key={`coin-${drops}`}><Paths shapes={coinShapes(100, 40, 13)} /></g>}
  </svg>;
}

export function BankBuilder() {
  const [today, setToday] = useState(SAMPLE_DAY);
  const [bank, setBank] = useState<Bank>(() => defaultBank(SAMPLE_DAY));
  const [loaded, setLoaded] = useState(false);
  const [saved, setSaved] = useState(true);
  const [drops, setDrops] = useState(0);
  const [touched, setTouched] = useState(false);
  const [perField, setPerField] = useState("");
  const [showCoins, setShowCoins] = useState(false);
  const [friend, setFriend] = useState<Bank | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const resultVisible = useInView(resultRef);

  const p = useMemo(() => plan(bank), [bank]);
  const coins = Math.min(bank.coins ?? 0, p?.count ?? 0);
  const full = Boolean(p && coins >= p.count);
  const locked = coins > 0;
  // Coins go into the card and the link only when the person ticks the box.
  const shared = useMemo<Bank>(() => ({ ...bank, coins: showCoins ? coins : null }), [bank, coins, showCoins]);
  const state = p ? shareHash(shared).slice(1) : "";
  const friendPlan = useMemo(() => friend ? plan(friend) : null, [friend]);

  useEffect(() => {
    const now = dhakaToday(new Date());
    setToday(now);
    setSite(window.location.host);
    const storage = store();
    const own = storage ? loadBank(storage, now) : null;
    setBank(own ?? defaultBank(now));
    setLoaded(true);
    // In-page anchors (#result) also change the hash, so only a real shared bank counts as a friend's.
    const readLink = () => { const link = parseShareHash(window.location.hash, now); if (link) setFriend(link); };
    readLink();
    window.addEventListener("hashchange", readLink);
    return () => window.removeEventListener("hashchange", readLink);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const storage = store();
    setSaved(Boolean(storage && saveBank(storage, bank)));
  }, [bank, loaded]);

  useEffect(() => {
    if (!p) return;
    let cancelled = false;
    loadCardFonts("৳৩,০২০ মাটির ব্যাংক").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, shared, p, format, site);
      if (friend && friendPlan && friendPreview.current) drawCard(friendPreview.current, friend, friendPlan, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [shared, p, format, site, friend, friendPlan]);

  /** Goal changes only while the bank is empty, and a new goal starts today. */
  function setGoal(change: Partial<Pick<Bank, "per" | "every" | "until">>) {
    if (locked) return;
    setBank(current => ({ ...current, ...change, start: today, coins: 0 }));
    setTouched(true);
  }

  function drop() {
    if (!p || full) return;
    setBank(current => ({ ...current, coins: Math.min(p.count, (current.coins ?? 0) + 1) }));
    setDrops(count => count + 1);
    setTouched(true);
  }

  function takeBack() {
    setBank(current => ({ ...current, coins: Math.max(0, (current.coins ?? 0) - 1) }));
  }

  function restart() {
    if (coins > 2 && !window.confirm("ব্যাংকটা খালি করে নতুন করে শুরু করবে? জমানোর হিসাব মুছে যাবে।")) return;
    setBank(current => ({ ...current, start: today, coins: 0 }));
    setDrops(0);
  }

  function joinFriend() {
    if (!friend) return;
    if (coins > 0 && !window.confirm("তোমার এখনকার ব্যাংকটা খালি করে বন্ধুর লক্ষ্যে নতুন করে শুরু করবে?")) return;
    const next = { ...bank, per: friend.per, every: friend.every, until: friend.until, start: today, label: friend.label, coins: 0 };
    // A friend's own date may already have passed for us; then keep our break day.
    setBank(plan(next) ? next : { ...next, until: bank.until });
    setPerField("");
    setDrops(0);
    setFriend(null);
    setTouched(true);
    document.getElementById("mb-stage")?.scrollIntoView({ behavior: "smooth" });
  }

  function typePer(text: string) {
    setPerField(text);
    const value = readTaka(text);
    if (value >= 1 && value <= LIMITS.per) setGoal({ per: value });
  }

  const scale = p ? coinScale(p.count) : 1;
  const cells = p ? Math.ceil(p.count / scale) : 0;
  const filledCells = Math.ceil(coins / scale);
  const customDate = !isBreakId(bank.until);
  const friendWho = friend?.name ? possessive(friend.name) : "এক বন্ধুর";
  const perOk = !perField || (readTaka(perField) >= 1 && readTaka(perField) <= LIMITS.per);

  return (
    <div className="mb">
      {friend && friendPlan && (
        <section className="mb-friend" aria-labelledby="mb-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={caption(friend, friendPlan)} />
          <div>
            <p className="mb-friend-kicker">এবার তোমার পালা</p>
            <h2 id="mb-friend-title">{friendWho} মাটির ব্যাংক: {everyWord(friend.every)} {bn(friend.per)} টাকা, <span>{friendPlan.on} ৳{bn(friendPlan.total)}</span></h2>
            {friend.coins !== null && <p className="mb-friend-progress">{progressLine(friend.per, friendPlan, friend.coins)}</p>}
            <button type="button" className="kit-primary" onClick={joinFriend}>আমিও সাথে জমাই</button>
          </div>
        </section>
      )}

      <div className="mb-stage" id="mb-stage">
        <p className="mb-owner">{owner(bank.name)}{bank.label && <> · <span>{bank.label}</span></>}</p>
        {p ? <>
          <p className="mb-total"><strong>৳{bn(p.total)}</strong><span>{p.on} ভাঙলে{!customDate && <> · {p.likely ? "সম্ভাব্য " : ""}{shortDate(p.date)}</>}</span></p>
          <div className="mb-scene"><BankArt cracked={full} drops={drops} /></div>
          <p className="mb-count" aria-live="polite"><b>{coins ? progressLine(bank.per, p, coins) : `${bn(p.count)}টা পয়সায় ব্যাংক ভরবে`}</b><span>{bankLine(bank, p, coins)}</span></p>
          {full ? <a className="kit-primary mb-drop" href="#result">ভরে গেছে! কার্ডটা দেখো</a> : <button type="button" className="kit-primary mb-drop" onClick={drop}>ঠং! {bn(bank.per)} টাকা ফেলো</button>}
          <div className="mb-stage-row">
            <button type="button" className="kit-link" onClick={takeBack} disabled={!coins}>ভুল হয়েছে, একটা ফেরত নাও</button>
            {locked && <button type="button" className="kit-link" onClick={restart}>নতুন ব্যাংক</button>}
          </div>
        </> : <p className="mb-problem">এই দিনটা আর সামনে নেই। নিচে অন্য একটা দিন বেছে নাও।</p>}
      </div>

      <div className="mb-goal">
        <fieldset className="mb-chips" disabled={locked}>
          <legend>কত করে জমাবে?</legend>
          {perChoices.map(value => <button type="button" key={value} aria-pressed={bank.per === value && !perField} onClick={() => { setPerField(""); setGoal({ per: value }); }}>{bn(value)} টাকা</button>)}
          <label className="mb-own" data-bad={!perOk || undefined}>
            <span className="mb-sr">নিজের অঙ্ক, টাকায়</span>
            <input value={perField} onChange={event => typePer(event.target.value)} inputMode="numeric" autoComplete="off" maxLength={7} placeholder="অন্য অঙ্ক" aria-invalid={!perOk} />
          </label>
        </fieldset>
        <fieldset className="mb-chips" disabled={locked}>
          <legend>কত দিন পরপর?</legend>
          {(["day", "week"] as Every[]).map(every => <button type="button" key={every} aria-pressed={bank.every === every} onClick={() => setGoal({ every })}>{everyWord(every)}</button>)}
        </fieldset>
        <fieldset className="mb-chips" disabled={locked}>
          <legend>কবে ব্যাংক ভাঙবে?</legend>
          {breakDays.filter(id => plan({ ...bank, until: id, start: today })).map(id => <button type="button" key={id} aria-pressed={bank.until === id} onClick={() => setGoal({ until: id })}>{breakLabel(id)}</button>)}
          <label className="mb-own mb-date" data-on={customDate || undefined}>
            <span>অন্য দিন</span>
            <input type="date" value={customDate ? bank.until : ""} min={addDays(today, 1)} max={`${Number(today.slice(0, 4)) + LIMITS.years}${today.slice(4)}`} onChange={event => { if (event.target.value) setGoal({ until: event.target.value }); }} />
          </label>
        </fieldset>
        {p && <p className="mb-sum">{sumLine(bank, p)}</p>}
        {locked && <p className="mb-note">পয়সা পড়া শুরু হয়ে গেছে, তাই লক্ষ্য এখন বদলাবে না। বদলাতে চাইলে “নতুন ব্যাংক” চাপো।</p>}
        {p?.source && <p className="mb-source">
          {p.likely ? "সম্ভাব্য তারিখ। " : ""}সূত্র: <a href={sources[p.source].url} target="_blank" rel="noopener noreferrer">{sources[p.source].label}</a>
        </p>}
        <p className="mb-note">শুধু সোজা গুণ: কত করে × কত বার। কোনো সুদ, ব্যাংক বা বিনিয়োগের পরামর্শ না। {saved ? "জমানোর হিসাব এই ফোনের ব্রাউজারেই থাকে।" : "এই ব্রাউজারে হিসাব মনে রাখা যাচ্ছে না, পাতা বন্ধ করলে মুছে যাবে।"}</p>
      </div>

      {p && <div className="mb-grid-wrap">
        <p className="mb-grid-title">পয়সার ঘর <small>{scale > 1 ? `এক ঘর = ${bn(scale)}টা পয়সা` : `এক ঘর = এক ${bank.every === "day" ? "দিনের" : "সপ্তাহের"} পয়সা`}</small></p>
        <ol className="mb-grid" aria-hidden="true">{Array.from({ length: cells }, (_, index) => <li key={index} data-on={index < filledCells || undefined} />)}</ol>
      </div>}

      <StickyNext show={touched && Boolean(p) && !resultVisible} title={<><strong>৳{bn(p?.total ?? 0)}</strong> {p?.on}</>} sub={p ? bankLine(bank, p, coins) : ""} href="#result" label="কার্ডটা দেখো" />

      <section className="mb-result" id="result" ref={resultRef} aria-labelledby="mb-result-title">
        <h2 id="mb-result-title">তোমার মাটির ব্যাংকের কার্ড</h2>
        <div className="mb-result-body">
          <figure className="kit-card" data-format={format}>
            {p ? <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={caption(shared, p)} /> : <p className="mb-problem">ওপরে ভাঙার দিন বাছলে কার্ড এখানে দেখাবে।</p>}
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="mb-controls">
            <label className="mb-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={bank.name} maxLength={LIMITS.name} onChange={event => setBank(current => ({ ...current, name: event.target.value }))} onBlur={() => setBank(current => ({ ...current, name: cleanText(current.name, LIMITS.name) }))} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <label className="mb-field">
              <span>কিসের জন্য জমাচ্ছ? <small>ব্যাংকের গায়ে কাগজে লেখা থাকবে</small></span>
              <input value={bank.label} maxLength={LIMITS.label} onChange={event => setBank(current => ({ ...current, label: event.target.value }))} onBlur={() => setBank(current => ({ ...current, label: cleanText(current.label, LIMITS.label) }))} placeholder="যেমন: ঈদের জামা" autoComplete="off" />
            </label>
            <label className="mb-check">
              <input type="checkbox" checked={showCoins} onChange={event => setShowCoins(event.target.checked)} />
              <span>কত জমল, সেটাও দেখাও <small>না দিলে কার্ডে আর লিংকে শুধু লক্ষ্যটা থাকবে</small></span>
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="matir-bank.png" makeImage={() => cardBlob(shared, p!, format, site)} imageKey={`${state}|${format}`} caption={p ? caption(shared, p) : ""} state={state} disabled={!p} hint="লিংক পেলে বন্ধু তোমার লক্ষ্যটা দেখবে, চাইলে একই লক্ষ্যে নিজের ব্যাংক শুরু করবে।" />
          </div>
        </div>
      </section>
    </div>
  );
}
