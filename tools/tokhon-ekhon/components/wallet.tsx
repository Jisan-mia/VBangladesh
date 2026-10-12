"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { CHECKED, SOURCE_URL } from "../lib/cpi";
import { cardBlob, drawCard } from "../lib/draw-card";
import { amounts, bn, bnYear, createCard, noteCount, parseShareHash, shareHash, years, DEFAULT, FIRST_YEAR, LATEST_YEAR, type Shared } from "../lib/tokhon";

const TOOL = "tokhon-ekhon";
const LAST_PICK = years[years.length - 1];
// "সবচেয়ে বেশি খোঁজা সাল" from a handful of people is noise.
const TALLY_MIN = 20;

function Chevron({ back }: { back?: boolean }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={back ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} /></svg>;
}

export function Wallet() {
  const [shared, setShared] = useState<Shared>(DEFAULT);
  const [touched, setTouched] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const card = useMemo(() => createCard(shared), [shared]);
  const friendCard = useMemo(() => friend && createCard(friend), [friend]);
  const state = shareHash(shared).slice(1);

  useEffect(() => {
    // In-page anchors (#result, #wallet) also change the hash, so only a real shared link replaces the friend.
    const readFriend = () => {
      const link = parseShareHash(window.location.hash);
      if (!link) return;
      setFriend(link);
      setShared(current => ({ ...current, amount: link.amount }));
    };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("দাম তখন আর এখন ৳১,০০০").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friendCard && friendPreview.current) drawCard(friendPreview.current, friendCard, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friendCard]);

  function update(next: Partial<Shared>) {
    setShared(current => ({ ...current, ...next }));
    setTouched(true);
    // A new year makes the earlier count stale; let them add the new one.
    setCounted(current => current === "done" ? "idle" : current);
  }

  async function countMine() {
    setCounted("sending");
    const tally = await addToTally(TOOL, [String(shared.year)]);
    if (tally) { setEveryone(tally); setCounted("done"); }
    else setCounted("failed");
  }

  const count = noteCount(card.times);
  const spread = Math.min(44, 5 * (count - 1));
  const top = everyone && everyone.total >= TALLY_MIN
    ? years.map(String).filter(year => (everyone.counts[year] ?? 0) > 0).sort((a, b) => everyone.counts[b] - everyone.counts[a]).slice(0, 3)
    : [];
  const caption = `${shared.birth ? `আমার জন্মসাল ${bnYear(card.year)}। তখনকার ${bn(card.amount)} টাকা` : card.headline} এখন প্রায় ${bn(card.now)} টাকা। (${card.basis}) তোমার জন্মসালেরটা দেখো তো:`;

  return (
    <div className="te">
      {friend && friendCard && (
        <section className="te-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={friendCard.sentence} />
          <div>
            <p className="te-kicker">বন্ধু তার সালটা পাঠিয়েছে</p>
            <h2 id="friend-title">{friend.birth ? <>বন্ধুর জন্মসাল {bnYear(friend.year)}: তখনকার {bn(friend.amount)} টাকা এখন প্রায় {bn(friendCard.now)} টাকা।</> : <>{friendCard.headline} এখন প্রায় {bn(friendCard.now)} টাকা।</>}<br /><span>এবার তোমার সালটা দেখো</span></h2>
            <a className="kit-primary" href="#wallet">আমার সালটা দেখি</a>
          </div>
        </section>
      )}

      <div className="te-wallet" id="wallet">
        <div className="te-inner" aria-hidden="true">
          <div className="te-side">
            <div className="te-notes"><i className="te-note te-old"><b>৳</b><em>{bnYear(card.year)}</em></i></div>
            <div className="te-pocket"><span>তখন · {bnYear(card.year)}</span><strong>{bn(card.amount)}<small> টাকা</small></strong></div>
          </div>
          <div className="te-side">
            <div className="te-notes">
              {Array.from({ length: count }, (_, index) => (
                <i key={index} className="te-note te-new" style={{ "--r": `${count === 1 ? 0 : -spread / 2 + (spread * index) / (count - 1)}deg` } as CSSProperties}><b>৳</b></i>
              ))}
            </div>
            <div className="te-pocket"><span>এখন · {bnYear(LATEST_YEAR)}</span><strong>{bn(card.now)}<small> টাকা</small></strong></div>
          </div>
        </div>
        <p className="te-sr" aria-live="polite">{card.sentence}। {card.growth}।</p>
        <p className="te-basis">{card.growth} · {card.basis} · <a href={SOURCE_URL} target="_blank" rel="noopener">সূত্র</a></p>

        <div className="te-controls">
          <div className="te-year">
            <button type="button" className="te-nudge" aria-label="এক বছর আগে" disabled={shared.year <= FIRST_YEAR} onClick={() => update({ year: shared.year - 1 })}><Chevron back /></button>
            <label htmlFor="te-year"><span>কোন সাল?</span><strong>{bnYear(shared.year)}</strong></label>
            <button type="button" className="te-nudge" aria-label="এক বছর পরে" disabled={shared.year >= LAST_PICK} onClick={() => update({ year: shared.year + 1 })}><Chevron /></button>
          </div>
          <input id="te-year" className="te-range" type="range" min={FIRST_YEAR} max={LAST_PICK} step={1} value={shared.year} aria-valuetext={`${bnYear(shared.year)} সাল`} onChange={event => update({ year: Number(event.target.value) })} />
          <p className="te-ends" aria-hidden="true"><span>{bnYear(FIRST_YEAR)}</span><span>{bnYear(LAST_PICK)}</span></p>
          <fieldset className="te-chips">
            <legend>কত টাকা?</legend>
            {amounts.map(amount => <button type="button" key={amount} aria-pressed={shared.amount === amount} onClick={() => update({ amount })} aria-label={`${bn(amount)} টাকা`}>৳{bn(amount)}</button>)}
          </fieldset>
          <button type="button" className="te-birth" aria-pressed={shared.birth} onClick={() => update({ birth: !shared.birth })}><i aria-hidden="true" />এটা আমার জন্মসাল</button>
        </div>
      </div>

      <StickyNext show={touched && !resultVisible} title={<>এখনকার <strong>{bn(card.now)} টাকা</strong></>} sub={card.headline} href="#result" label="কার্ডটা দেখো" />

      <section className="te-result" id="result" ref={result} aria-labelledby="result-title">
        <h2 id="result-title">{card.headline} ≈ <em>এখনকার {bn(card.now)} টাকা</em></h2>
        <p className="te-line">{card.line}</p>
        <div className="te-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="te-sr">{card.kicker}। {card.sentence}। {card.growth}। {card.line} {card.basis}।</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="te-share">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="tokhon-ekhon.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint="লিংক পাঠালে বন্ধুও নিজের সালের টাকা দেখে নিতে পারবে।" />
            <a className="kit-link te-again" href="#wallet">অন্য একটা সাল দেখি</a>
            <p className="te-source">{card.basis}, সব জিনিসের গড় দাম ধরে; আলাদা কোনো জিনিসের দাম না। সূত্র: <a href={SOURCE_URL} target="_blank" rel="noopener">বিবিএসের ভোক্তা মূল্যসূচক, বিশ্বব্যাংকের তথ্যভান্ডার</a> · যাচাই করা: {CHECKED}</p>
          </div>
        </div>

        <div className="te-everyone">
          <h3>কোন সালটা সবাই সবচেয়ে বেশি খুঁজছে?</h3>
          {top.length > 0 && <>
            <p>সবচেয়ে বেশি খোঁজা সাল: <strong>{bnYear(Number(top[0]))}</strong> <small>({bn(everyone!.total)} জনের হিসাব)</small></p>
            <ol className="te-top">{top.map(year => <li key={year} data-mine={year === String(shared.year)}><span>{bnYear(Number(year))}</span><b>{bn(Math.round((everyone!.counts[year] / everyone!.total) * 100))}%</b></li>)}</ol>
          </>}
          {counted === "done"
            ? <p className="kit-status">{bnYear(shared.year)} যোগ হয়েছে!{top.length ? "" : " এখনো খুব কম মানুষ যোগ করেছে, বন্ধুদের লিংক পাঠাও।"}</p>
            : <>
              <p className="te-muted">তোমার সালটা ({bnYear(shared.year)}) সবার হিসাবে যোগ করবে? শুধু সালটা গোনা হবে, আর কিছু না।</p>
              <button type="button" className="kit-secondary" onClick={countMine} disabled={counted === "sending"}>{counted === "sending" ? "যোগ হচ্ছে…" : "আমার সালটা যোগ করো"}</button>
              {counted === "failed" && <p className="kit-status" role="alert">এখন যোগ করা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </>}
        </div>
      </section>
    </div>
  );
}
