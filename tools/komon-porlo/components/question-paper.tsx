"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { drawPaper, paperBlob } from "../lib/draw-paper";
import { bingoLines, bingoWord, bn, caption, chipOrder, countOf, createCard, defaultPack, has, headline, humanLine, packById, parseShareHash, possessive, seasonPack, shareHash, squareId, tallyItems, toggle, MAX_NAME_LENGTH, SIZE, type PackId, type Shared } from "../lib/paper";

const TOOL = "komon-porlo";
// Percentages from a handful of people are noise ("১০০% মানুষের কমন" after one vote).
const COMPARE_MIN = 20;
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

export function QuestionPaper() {
  const [packId, setPackId] = useState<PackId>("relatives");
  const [masks, setMasks] = useState<Partial<Record<PackId, number>>>({});
  // Fast double taps land before React re-renders; read the latest stamps from here so none is lost.
  const latest = useRef(masks);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [flash, setFlash] = useState(0);
  const [news, setNews] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [season, setSeason] = useState<PackId | null>(null);
  const chips = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const pack = packById(packId);
  const mask = masks[packId] ?? 0;
  const own = useMemo(() => ({ pack: packId, mask, name }), [packId, mask, name]);
  const card = useMemo(() => createCard(own, friend), [own, friend]);
  const state = shareHash(own).slice(1);
  const lined = new Set(card.lines.flat());
  const ghost = friend?.pack === packId ? friend : null;
  const friendName = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared card replaces the friend.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (shared) { setFriend(shared); setPackId(shared.pack); }
      return shared;
    };
    // Picked after mount so a statically built page still follows today's season.
    if (!readFriend()) setPackId(defaultPack(new Date()));
    setSeason(seasonPack(new Date()));
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    // A friend's link can open a pack whose chip sits off-screen in the scrolling row; slide it into view.
    const row = chips.current, chip = row?.querySelector<HTMLElement>("[aria-pressed=true]");
    if (!row || !chip) return;
    const box = row.getBoundingClientRect(), place = chip.getBoundingClientRect();
    if (place.left < box.left || place.right > box.right) row.scrollLeft += place.left - box.left - 8;
  }, [packId, season]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(pack.title).then(() => {
      if (cancelled) return;
      if (preview.current) drawPaper(preview.current, card, format, site);
      if (friend && friendPreview.current) drawPaper(friendPreview.current, createCard(friend), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend, pack.title]);

  function stamp(next: number) {
    latest.current = { ...latest.current, [packId]: next };
    setMasks(latest.current);
  }

  function tap(index: number) {
    const current = latest.current[packId] ?? 0;
    const next = toggle(current, index);
    const before = bingoLines(current).length, after = bingoLines(next).length;
    if (after > before) { setFlash(value => value + 1); setNews(`${bingoWord(after)} ${bn(countOf(next))}টা কমন।`); }
    else setNews(has(next, index) ? `কমন! মোট ${bn(countOf(next))}টা।` : `ছাপ তোলা হলো। মোট ${bn(countOf(next))}টা।`);
    stamp(next);
    // Changed picks make the old comparison stale; let them compare again.
    setCompared(current => current === "done" ? "idle" : current);
  }

  function choosePack(id: PackId) {
    setPackId(id);
    setCompared("idle");
    setNews(`${packById(id).title}: নতুন প্রশ্নপত্র।`);
  }

  function restart() {
    if (card.count > 2 && !window.confirm("এই প্রশ্নপত্রের সব ছাপ মুছে নতুন করে দাগাবে?")) return;
    stamp(0);
    setCompared("idle");
    document.getElementById("paper")?.scrollIntoView({ behavior: "smooth" });
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, tallyItems(own));
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const seen = everyone?.counts[`seen:${packId}`] ?? 0;
  const ranked = compared === "done" && everyone ? pack.squares.flatMap((text, index) => has(mask, index) ? [{ text, percent: percent(everyone.counts[squareId(packId, index)] ?? 0, seen) }] : []).sort((a, b) => b.percent - a.percent) : [];

  return (
    <div className="komon">
      {friend && (
        <section className="komon-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName} প্রশ্নপত্র`} />
          <div>
            <p className="komon-kicker">তোমার জন্য একটা প্রশ্নপত্র এসেছে</p>
            <h2 id="friend-title">{packById(friend.pack).title}: {friendName} {bn(countOf(friend.mask))}টা কমন পড়েছে।<br /><span>তোমার কয়টা?</span></h2>
            <a className="kit-primary" href="#paper">আমারটা দাগাই</a>
          </div>
        </section>
      )}

      <fieldset className="komon-packs">
        <legend>বিষয় বেছে নাও</legend>
        <div className="komon-packs-row" ref={chips}>
          {chipOrder(season).map(item => <button type="button" key={item.id} aria-pressed={item.id === packId} onClick={() => choosePack(item.id)}>{item.chip}{(masks[item.id] ?? 0) > 0 && <small> · {bn(countOf(masks[item.id]!))}</small>}</button>)}
        </div>
      </fieldset>

      <div className="paper" id="paper">
        <header className="paper-head">
          <p className="paper-exam">{pack.exam} · বিষয় কোড: {pack.code}</p>
          <h2 className="paper-title">{pack.title}</h2>
          <p className="paper-meta"><span>সময়: {pack.time}</span><span>পূর্ণমান: {bn(SIZE)}</span></p>
        </header>
        <div className="paper-score" aria-hidden="true"><b>{bn(card.count)}</b><span>{bn(SIZE)}</span></div>
        <p className="paper-rule"><strong>নির্দেশনা:</strong> যেটা শুনেছ বা ঘটেছে, তাতে চাপ দাও। এক লাইন মিললেই বিঙ্গো!</p>
        {ghost && <p className="paper-ghost-note">হালকা ছাপগুলো {friendName} কমন।</p>}
        <div className="paper-grid">
          {pack.squares.map((text, index) => (
            <button type="button" key={`${packId}-${index}`} className="paper-q" aria-pressed={has(mask, index)} data-line={lined.has(index) || undefined} onClick={() => tap(index)}>
              <span className="paper-no">{bn(index + 1)}.</span>
              <span className="paper-text">{text}</span>
              {ghost && has(ghost.mask, index) && <span className="paper-ghost" aria-hidden="true">কমন</span>}
              {ghost && has(ghost.mask, index) && <span className="komon-sr"> ({friendName}ও কমন)</span>}
              <span className="paper-stamp" aria-hidden="true" style={{ rotate: `${((index * 37) % 9 - 5) * 2}deg` }}>কমন</span>
            </button>
          ))}
        </div>
        <p className="paper-note">দ্রষ্টব্য: {pack.note}</p>
        {card.bingo && <p className="paper-bingo-tag">{card.bingo}</p>}
        {flash > 0 && <span key={flash} className="paper-pop" aria-hidden="true">বিঙ্গো!</span>}
        <p className="komon-sr" role="status" aria-live="polite">{news}</p>
      </div>

      <StickyNext show={card.count > 0 && !resultVisible} title={<><strong>{bn(card.count)}টা</strong> কমন{card.bingo ? ` · ${card.bingo}` : ""}</>} sub={humanLine(card.count, pack)} href="#result" label="ফল দেখো" />

      <section className="komon-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="komon-result-head">
          <h2 id="result-title">{card.count ? <>ফল বেরিয়েছে: <em>{bn(card.count)}টা</em> কমন{card.bingo && <span className="komon-bingo">{card.bingo}</span>}</> : "এখনো একটাও দাগাওনি"}</h2>
          <p>{card.count ? card.line : "ওপরের প্রশ্নপত্রে যেটা যেটা শুনেছ, চাপ দাও। লাল ছাপ পড়বে।"}</p>
          {card.match && <p className="komon-match">{card.match}</p>}
        </div>

        <div className="komon-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="komon-sr">{pack.title}। {headline(card.count)} {pack.squares.filter((_, index) => has(mask, index)).join(", ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">প্রশ্নপত্রের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="komon-controls">
            <label className="komon-field">
              <span>পরীক্ষার্থীর নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`komon-porlo-${packId}.png`} makeImage={() => paperBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="লিংক পেলে বন্ধু তোমার ছাপগুলো দেখবে, তারপর নিজেরটা দাগাবে।" />
            {card.count > 0 && <button type="button" className="kit-link komon-restart" onClick={restart}>ছাপ মুছে আবার দাগাও</button>}
          </div>
        </div>

        {card.count > 0 && (
          <div className="komon-everyone">
            <h3>সবার সাথে মিলিয়ে দেখবে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>দেখো কোন প্রশ্নটা প্রায় সবার কমন পড়ে। নাম যাবে না, শুধু কোন ঘরে ছাপ দিয়েছ সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : seen < COMPARE_MIN ? <p className="kit-status">এই প্রশ্নপত্রে এখনো {bn(seen)} জন মিলিয়েছে, হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও, কয়েকজন দাগালেই মজাটা শুরু!</p> : <>
              {ranked[0] && <p className="komon-top"><strong>“{ranked[0].text}”</strong> {bn(ranked[0].percent)}% মানুষের কমন পড়েছে</p>}
              <ul className="komon-bars">{ranked.map(item => <li key={item.text}><span>{item.text}</span><i style={{ width: `${item.percent}%` }} /><b>{bn(item.percent)}%</b></li>)}</ul>
              <p className="kit-status">{bn(seen)} জনের প্রশ্নপত্রের সাথে মেলানো।</p>
            </>}
          </div>
        )}
      </section>
    </div>
  );
}
