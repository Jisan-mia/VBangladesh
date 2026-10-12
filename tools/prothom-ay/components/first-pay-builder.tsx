"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, drawStage, STAGE } from "../lib/draw-card";
import { bn, bnYear, cardTitle, FIRST_YEAR, giftLabel, giftList, gifts, MAX_AMOUNT_DIGITS, MAX_GIFTS, MAX_NAME_LENGTH, parseAmount, parseShareHash, payLine, possessive, sample, shareHash, sourceById, sources, styles, toggleGift, type FirstPay, type GiftId, type SourceId, type StyleId } from "../lib/first-pay";

const TOOL = "prothom-ay";
// Below this, "৪০% মানুষ মিষ্টি বিলিয়েছে" is a handful of people, not everyone.
const TALLY_MIN = 30;
const PROOF_MIN = 50;
const THIS_YEAR = new Date().getFullYear();
const years = Array.from({ length: THIS_YEAR - FIRST_YEAR + 1 }, (_, index) => THIS_YEAR - index);
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

export function FirstPayBuilder() {
  const [source, setSource] = useState<SourceId>(sample.source);
  const [picked, setPicked] = useState<GiftId[]>(sample.gifts);
  const [year, setYear] = useState(sample.year);
  const [style, setStyle] = useState<StyleId>(sample.style);
  const [name, setName] = useState("");
  const [showAmount, setShowAmount] = useState(false);
  const [amountInput, setAmountInput] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<FirstPay | null>(null);
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [joined, setJoined] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [previewError, setPreviewError] = useState(false);
  const stage = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const amount = showAmount ? parseAmount(amountInput) : 0;
  const pay: FirstPay = useMemo(() => ({ source, gifts: picked, year, style, name, amount }), [source, picked, year, style, name, amount]);
  const state = shareHash(pay).slice(1);
  const line = payLine(pay);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared envelope replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("রাফির প্রথম আয় বেতন অমূল্য").then(() => {
      if (cancelled) return;
      if (stage.current) drawStage(stage.current, pay);
      if (preview.current) drawCard(preview.current, pay, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [pay, format, site, friend]);

  function nudge() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    stage.current?.animate([{ transform: "translateY(-6px) rotate(-1deg)" }, { transform: "none" }], { duration: 320, easing: "cubic-bezier(.3,1.5,.5,1)" });
  }

  function changed() { setJoined(current => current === "done" ? "idle" : current); }

  function toggle(id: GiftId) {
    setPicked(current => {
      const next = toggleGift(current, id);
      // An empty envelope has nothing to show; keep the last pick instead.
      return next.length ? next : current;
    });
    changed();
    nudge();
  }

  async function join() {
    setJoined("sending");
    // Only the fixed source and gift ids are counted; name, year and amount never leave the link.
    const tally = await addToTally(TOOL, [source, ...picked]);
    if (tally) { setEveryone(tally); setJoined("done"); } else setJoined("failed");
  }

  const ready = everyone && everyone.total >= TALLY_MIN;
  const topGift = ready ? gifts.reduce((best, gift) => (everyone.counts[gift.id] ?? 0) > (everyone.counts[best.id] ?? 0) ? gift : best, gifts[0]) : null;
  const topSource = ready ? sources.reduce((best, item) => (everyone.counts[item.id] ?? 0) > (everyone.counts[best.id] ?? 0) ? item : best, sources[0]) : null;
  const friendWho = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";
  const caption = `${cardTitle(name)} (${sourceById(source).label}${year ? `, ${bnYear(year)}` : ""}): ${giftList(pay)}। ${line} তোমার প্রথম আয় দিয়ে কী করেছিলে?`;

  return (
    <div className="pa">
      {friend && (
        <section className="pa-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendWho} প্রথম আয়ের খাম: ${giftList(friend)}`} />
          <div>
            <p className="pa-kicker">তোমার জন্য একটা খাম এসেছে</p>
            <h2 id="friend-title">{friendWho} প্রথম আয়: <em>{giftList(friend)}</em><br />তোমারটা দিয়ে কী করেছিলে?</h2>
            <a className="kit-primary" href="#pa-picks">আমার খাম বানাই</a>
          </div>
        </section>
      )}

      {everyone && everyone.total >= PROOF_MIN && <p className="pa-proof">এখন পর্যন্ত <strong>{bn(everyone.total)} জন</strong> নিজের প্রথম আয়ের খাম বানিয়েছে</p>}

      <div className="pa-stage">
        <canvas ref={stage} width={STAGE.width} height={STAGE.height} role="img" aria-label={`বাদামি বেতনের খাম: ${sourceById(source).scribble}${year ? `, ${bnYear(year)}` : ""}। ভেতর থেকে উঁকি দিচ্ছে ${giftList(pay)}`} />
      </div>

      <div className="pa-picks" id="pa-picks">
        <fieldset className="pa-chips">
          <legend>প্রথম আয়টা কিসের?</legend>
          {sources.map(item => <button type="button" key={item.id} aria-pressed={source === item.id} onClick={() => { setSource(item.id); changed(); }}>{item.label}</button>)}
        </fieldset>
        <fieldset className="pa-chips pa-gifts">
          <legend>টাকাটা দিয়ে কী করেছিলে? <small>তিনটা পর্যন্ত</small></legend>
          {gifts.map(gift => <button type="button" key={gift.id} aria-pressed={picked.includes(gift.id)} onClick={() => toggle(gift.id)}>{giftLabel(gift.id, style)}</button>)}
        </fieldset>
        <label className="pa-year">
          <span>কোন সালে?</span>
          <select value={year} onChange={event => setYear(Number(event.target.value))}>
            <option value={0}>মনে নেই</option>
            {years.map(item => <option key={item} value={item}>{bnYear(item)}</option>)}
          </select>
        </label>
      </div>

      <StickyNext show={!resultVisible} title={<strong>খামটা তৈরি</strong>} sub={giftList(pay)} href="#result" label="কার্ডটা দেখো" />

      <section className="pa-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="pa-result-head">
          <h2 id="result-title">{name.trim() ? possessive(name.trim()) : "তোমার"} <em>প্রথম আয়</em>, এক খামে</h2>
          <p>{line}</p>
        </div>

        <div className="pa-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="pa-card-summary" />
            <figcaption id="pa-card-summary" className="pa-sr">{cardTitle(name)}: {sourceById(source).label}{year ? `, ${bnYear(year)}` : ""}। {giftList(pay)}। {line}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="pa-controls">
            <label className="pa-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <fieldset className="kit-chips">
              <legend>বাসায় কী বলে ডাকো?</legend>
              {styles.map(item => <button type="button" key={item.id} aria-pressed={style === item.id} onClick={() => setStyle(item.id)}>{item.label}</button>)}
            </fieldset>
            {showAmount ? (
              <div className="pa-amount">
                <label className="pa-field">
                  <span>টাকার অংক <small>খামে পেনসিলে লেখা উঠবে</small></span>
                  <input value={amountInput} inputMode="numeric" maxLength={MAX_AMOUNT_DIGITS + 4} onChange={event => setAmountInput(event.target.value)} placeholder="যেমন: ৩০০০" autoFocus />
                </label>
                <p>অংকটা কার্ডে আর লিংকে যাবে, কিন্তু কোথাও গোনা বা কারও সাথে মেলানো হবে না। না দিলে খামে লেখা থাকবে “অমূল্য”।</p>
                <button type="button" className="kit-link" onClick={() => { setShowAmount(false); setAmountInput(""); }}>অংক সরিয়ে দাও</button>
              </div>
            ) : <button type="button" className="kit-link pa-amount-open" onClick={() => setShowAmount(true)}>টাকার অংকটাও লিখবে? (না লিখলেও চলে)</button>}
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="prothom-ay.png" makeImage={() => cardBlob(pay, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint="বন্ধু লিংক খুলে তোমার খাম দেখবে, তারপর নিজেরটা বানাবে।" />
          </div>
        </div>

        <div className="pa-everyone">
          <h3>সবাই প্রথম আয়ে কী করেছিল?</h3>
          {joined !== "done" ? <>
            <p>শুধু কিসের আয় আর টাকাটা দিয়ে কী করেছিলে, এটুকু সবার হিসাবে যোগ হবে। নাম, সাল বা টাকার অংক যাবে না।</p>
            <button type="button" className="kit-secondary" onClick={join} disabled={joined === "sending"}>{joined === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
            {joined === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : ready && topGift && topSource ? <>
            <p>{bn(everyone.total)} জনের সাথে মেলানো হলো।</p>
            <p className="pa-top"><span>সবচেয়ে বেশি মানুষ প্রথম আয়ে</span><strong>{giftLabel(topGift.id, style)}</strong></p>
            <p className="pa-top"><span>সবচেয়ে বেশি মানুষের প্রথম আয়</span><strong>{topSource.label}</strong></p>
            <ul className="pa-bars">{picked.map(id => { const share = percent(everyone.counts[id] ?? 0, everyone.total); return <li key={id}><span>{giftLabel(id, style)}</span><i style={{ width: `${share}%` }} /><b>{bn(share)}%</b></li>; })}</ul>
          </> : <p className="kit-status">যোগ হয়েছে! এখনো খুব কম মানুষ মিলিয়েছে, তাই হিসাবটা এখনই বলা যাবে না। বন্ধুদের লিংক পাঠাও।</p>}
        </div>
      </section>
    </div>
  );
}
