"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { groupDigits, toBanglaDigits, toLatinDigits } from "../../taka-kothay/lib/number-words";
import { drawKhataCard, khataBlob } from "../lib/draw-card";
import { amountFigures, bn, possessive, MAX_AMOUNT, MAX_NAME_LENGTH } from "../lib/cheque";
import { defaultKhata, khataCount, khataGivers, khataHash, khataLabel, khataLine, khataNames, khataTitle, khataTotal, parseKhataHash, type Khata, type KhataGiverId } from "../lib/khata";

const TOOL = "salami-chek";

const Moon = () => <svg className="sc-khata-moon" viewBox="0 0 40 40" aria-hidden="true"><path d="M24 4a16 16 0 1 0 12 26A13 13 0 0 1 24 4Z" /></svg>;

/** সালামি খাতা: tap who gave this Eid; amounts are optional, off by default, and never counted anywhere. */
export function KhataBuilder({ switcher }: { switcher: ReactNode }) {
  const [khata, setKhata] = useState<Khata>(defaultKhata);
  // linked: opened from someone's খাতা link, read-only until "নিজের খাতা লেখো".
  const [linked, setLinked] = useState(false);
  const [withAmounts, setWithAmounts] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const empty = khata.rows.length === 0;
  const state = empty ? "" : khataHash(khata).slice(1);
  const title = khataTitle(khata.name);
  const count = khataCount(khata.rows);
  const total = khataTotal(khata.rows);

  useEffect(() => {
    const read = () => {
      const shared = parseKhataHash(window.location.hash);
      if (!shared) return;
      setKhata(shared);
      setLinked(true);
    };
    read();
    window.addEventListener("hashchange", read);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    if (empty) return;
    let cancelled = false;
    loadCardFonts("সালামি খাতা").then(() => {
      if (cancelled || !preview.current) return;
      drawKhataCard(preview.current, khata, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [khata, format, site, empty]);

  const pick = (giver: KhataGiverId) => setKhata(current => ({
    ...current,
    rows: current.rows.some(row => row.giver === giver) ? current.rows.filter(row => row.giver !== giver) : [...current.rows, { giver, amount: null }],
  }));

  function typeAmount(giver: KhataGiverId, text: string) {
    const digits = toLatinDigits(text).replace(/\D/g, "").slice(0, 6);
    const amount = Math.min(Number(digits), MAX_AMOUNT) || null;
    setKhata(current => ({ ...current, rows: current.rows.map(row => row.giver === giver ? { ...row, amount } : row) }));
  }

  function toggleAmounts(on: boolean) {
    setWithAmounts(on);
    // Turning it off wipes them, so an amount never travels in a link by accident.
    if (!on) setKhata(current => ({ ...current, rows: current.rows.map(row => ({ ...row, amount: null })) }));
  }

  function writeOwn() {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setKhata(defaultKhata);
    setLinked(false);
    setWithAmounts(false);
    document.getElementById("tool")?.scrollIntoView({ behavior: "smooth" });
  }

  const caption = linked
    ? `${title} দেখলাম, ${count}! এবার আমার খাতাটাও লিখব। তোমাকে কে কে দিল?`
    : `ঈদ মোবারক! এবারের সালামি খাতায় ${khataNames(khata.rows)}। সবার দোয়া আর আদরের জন্য অনেক ভালোবাসা। তোমাকে এবার কে কে দিল?`;

  return (
    <div className="sc">
      {!linked && switcher}
      {linked ? (
        <header className="sc-banner">
          <p className="sc-kicker">একটা সালামি খাতা এসেছে</p>
          <h2>{khata.name ? `${possessive(khata.name)} খাতায়` : "এই খাতায়"} <em>{count}</em></h2>
        </header>
      ) : (
        <fieldset className="sc-givers">
          <legend>এবার কে কে দিল?</legend>
          <div>{khataGivers.map(option => <button type="button" key={option.id} aria-pressed={khata.rows.some(row => row.giver === option.id)} onClick={() => pick(option.id)}>{option.label}</button>)}</div>
        </fieldset>
      )}

      <div className="sc-desk">
        <div className="sc-khata">
          <p className="sc-khata-head"><strong>{title}</strong><Moon /></p>
          {empty ? <p className="sc-khata-empty">খাতা এখনো খালি। ওপরের নামগুলোয় চাপো।</p> : (
            <ol aria-label={`${title}: ${count}`}>
              {khata.rows.map(row => {
                const label = khataLabel(row.giver);
                return (
                  <li key={row.giver}>
                    <span className="sc-khata-who">{label}</span>
                    {!linked && withAmounts
                      ? <label className="sc-khata-amount"><span className="sc-sr">{possessive(label)} সালামি, টাকায়</span><input value={row.amount ? toBanglaDigits(groupDigits(String(row.amount))) : ""} inputMode="numeric" placeholder="৳ কত" onChange={event => typeAmount(row.giver, event.target.value)} /></label>
                      : row.amount ? <b className="sc-khata-amount">৳{amountFigures(row.amount)}</b> : <Moon />}
                  </li>
                );
              })}
            </ol>
          )}
          {total !== null && <p className="sc-khata-total"><span>যোগ</span><b>৳{amountFigures(total)}</b></p>}
        </div>
      </div>

      {!linked && <>
        <label className="sc-check">
          <input type="checkbox" checked={withAmounts} onChange={event => toggleAmounts(event.target.checked)} />
          <span>টাকার অঙ্কও লিখব <small>না লিখলেও চলে। লিখলে শুধু তোমার কার্ড আর লিংকে দেখাবে, কোথাও গোনা হয় না।</small></span>
        </label>
        <label className="sc-field">
          <span>খাতাটা কার? <small>তোমার নাম</small></span>
          <input value={khata.name} maxLength={MAX_NAME_LENGTH} onChange={event => setKhata(current => ({ ...current, name: event.target.value }))} placeholder="যেমন: রাফি" autoComplete="nickname" />
        </label>
      </>}

      <StickyNext show={!empty && !resultVisible} title={<><strong>{bn(khata.rows.length)} জনের</strong> দোয়া আর সালামি</>} sub={khataLine(khata)} href="#result" label={linked ? "ছবিটা দেখো" : "কার্ডটা দেখো"} />

      {!empty && (
        <section className="sc-result" id="result" ref={result} aria-labelledby="result-title">
          <div className="sc-result-head">
            <h2 id="result-title">{linked ? <>{title}, <em>এক পাতায়</em></> : <>খাতাটা <em>সবাইকে দেখাও</em></>}</h2>
            <p>{khataLine(khata)}</p>
          </div>
          <div className="sc-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`${title}, ${count}: ${khataNames(khata.rows)}। ${khataLine(khata)}`} />
              {previewError && <p className="kit-status" role="alert">খাতার ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="sc-controls">
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="salami-khata.png" makeImage={() => khataBlob(khata, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint={linked ? "" : "লিংক খুললে সবাই তোমার খাতার এই পাতাটাই দেখবে।"} />
              {linked && (
                <div className="sc-turn">
                  <p><strong>এবার তোমার পালা।</strong> তোমাকে কে কে দিল, খাতায় লিখে রাখো।</p>
                  <button type="button" className="kit-secondary" onClick={writeOwn}>নিজের খাতা লেখো</button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
