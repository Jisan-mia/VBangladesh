"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { groupDigits, toBanglaDigits, toLatinDigits } from "../../taka-kothay/lib/number-words";
import { cardBlob, cardTitle, drawCard } from "../lib/draw-card";
import { amountChips, amountFigures, bn, chequeLine, defaultCheque, giverLabel, givers, parseShareHash, possessive, readAmount, shareHash, topGiver, MAX_AMOUNT, MAX_NAME_LENGTH, type Cheque } from "../lib/cheque";
import { ChequeView } from "./cheque-view";

const TOOL = "salami-chek";
// "সবচেয়ে বেশি সই করেছে মামারা" after three signatures is noise.
const TALLY_MIN = 30;
// Bangla takes "কে" straight on (রাফিকে); a Latin name gets a hyphen (Rafi-কে).
const toWhom = (name: string) => /[ঀ-৿]$/.test(name) ? `${name}কে` : `${name}-কে`;

type Mode = "make" | "sign" | "done";

/** `switcher` is the চেক/খাতা switch, shown only while writing your own cheque. */
export function ChequeBuilder({ switcher }: { switcher?: ReactNode }) {
  const [cheque, setCheque] = useState<Cheque>(defaultCheque);
  // make: a child writes the cheque · sign: an elder opened it · done: signed (here, or the link came back signed).
  const [mode, setMode] = useState<Mode>("make");
  const [signedHere, setSignedHere] = useState(false);
  const [typed, setTyped] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const state = shareHash(cheque).slice(1);
  const giver = giverLabel(cheque.giver);
  const top = everyone ? topGiver(everyone.counts, everyone.total, TALLY_MIN) : null;
  const typedAmount = typed ? readAmount(typed) : null;

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real cheque link switches the mode.
    const read = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setCheque(shared);
      setMode(shared.ok ? "done" : "sign");
      setSignedHere(false);
    };
    read();
    window.addEventListener("hashchange", read);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("ঈদ সালামির চেক").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, cheque, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [cheque, format, site, mode]);

  const update = (patch: Partial<Cheque>) => setCheque(current => ({ ...current, ...patch }));

  function typeAmount(text: string) {
    const digits = toLatinDigits(text).replace(/\D/g, "").replace(/^0+/, "").slice(0, 7);
    setTyped(digits ? toBanglaDigits(groupDigits(digits)) : "");
    const amount = readAmount(digits);
    if (amount) update({ amount });
  }

  function sign() {
    setCheque(current => ({ ...current, ok: true }));
    setMode("done");
    setSignedHere(true);
    navigator.vibrate?.(30);
    // Only the fixed giver id is counted; the child's name and the amount never leave the link.
    addToTally(TOOL, [cheque.giver]).then(tally => { if (tally) setEveryone(tally); });
  }

  function makeOwn() {
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    setCheque(defaultCheque);
    setTyped("");
    setMode("make");
    setSignedHere(false);
    document.getElementById("tool")?.scrollIntoView({ behavior: "smooth" });
  }

  const asker = cheque.name || "কেউ একজন";
  const caption = mode === "make"
    ? `${giver}, ঈদ মোবারক! আমার সালামির চেকটা কেটে রেখেছি, শুধু তোমার সইটা বাকি। এক চাপে সই করে দাও:`
    : signedHere
      ? `${cheque.name ? cheque.name + ", " : ""}ঈদ মোবারক! তোমার সালামির চেকে সই করে দিলাম। নোটটা ঈদের দিন হাতে হাতে।`
      : `${giver} সই করে দিয়েছে! এবার শুধু নতুন নোটের অপেক্ষা। তোমার সালামি কে দেবে?`;

  return (
    <div className="sc">
      {mode === "make" && switcher}
      {mode === "sign" && (
        <header className="sc-banner">
          <p className="sc-kicker">তোমার কাছে একটা চেক এসেছে</p>
          <h2>{asker} তোমার কাছে <em>{amountFigures(cheque.amount)} টাকার</em> সালামি চেয়েছে</h2>
        </header>
      )}
      {mode === "done" && (
        <header className="sc-banner">
          <p className="sc-kicker">{signedHere ? "সই হয়ে গেছে!" : "চেক ফেরত এসেছে!"}</p>
          <h2>{!signedHere ? <>{giver} {cheque.name ? possessive(cheque.name) : "এই"} চেকে <em>সই করে দিয়েছে!</em></> : cheque.name ? <>এবার চেকটা <em>{toWhom(cheque.name)}</em> ফেরত পাঠাও</> : <>এবার চেকটা <em>ফেরত পাঠাও</em></>}</h2>
        </header>
      )}

      {mode === "make" && (
        <fieldset className="sc-givers">
          <legend>কার কাছে চাইবে?</legend>
          <div>{givers.map(option => <button type="button" key={option.id} aria-pressed={cheque.giver === option.id} onClick={() => update({ giver: option.id })}>{option.label}</button>)}</div>
        </fieldset>
      )}

      <div className="sc-desk" key={mode}>
        <ChequeView cheque={cheque} nameFor={mode === "make" ? "sc-name" : undefined} />
      </div>

      {mode === "make" && <>
        <fieldset className="sc-amounts">
          <legend>কত চাইবে?</legend>
          <div>
            {amountChips.map(amount => <button type="button" key={amount} aria-pressed={!typed && cheque.amount === amount} onClick={() => { update({ amount }); setTyped(""); }}>৳{bn(amount)}</button>)}
            <label className="sc-other">
              <span className="sc-sr">অন্য অঙ্ক লেখো</span>
              <input value={typed} inputMode="numeric" placeholder="অন্য অঙ্ক" aria-describedby="sc-amount-note" onChange={event => typeAmount(event.target.value)} />
            </label>
          </div>
          <p id="sc-amount-note" className="sc-note" data-warn={Boolean(typed) && !typedAmount}>{typed && !typedAmount ? `১ থেকে ${amountFigures(MAX_AMOUNT)} টাকার মধ্যে লেখো, চেকে আগেরটাই আছে।` : "কথায় লেখাটা নিজে থেকে বসে যায়।"}</p>
        </fieldset>
        <label className="sc-field">
          <span>সালামি কে পাবে? <small>তোমার নাম</small></span>
          <input id="sc-name" value={cheque.name} maxLength={MAX_NAME_LENGTH} onChange={event => update({ name: event.target.value })} placeholder="যেমন: রাফি" autoComplete="nickname" />
        </label>
        {top && <p className="sc-tally">এবার সবচেয়ে বেশি চেকে সই করেছে <strong>{giverLabel(top)}রা</strong></p>}
      </>}

      {mode === "sign" && (
        <div className="sc-signbox">
          <button type="button" className="kit-primary sc-signbtn" onClick={sign}>সই করে দাও</button>
          <p className="sc-note">সই করলে শুধু ‘{giver}’ কথাটা মোট হিসাবে গোনা হয়, নাম বা টাকার অঙ্ক না।</p>
        </div>
      )}

      <StickyNext show={mode !== "sign" && !resultVisible} title={<><strong>৳{amountFigures(cheque.amount)}</strong> · {possessive(giver)} কাছে</>} sub={chequeLine(cheque)} href="#result" label={mode === "make" ? "চেক পাঠাও" : "ছবিটা দেখো"} />

      {mode !== "sign" && (
        <section className="sc-result" id="result" ref={result} aria-labelledby="result-title">
          <div className="sc-result-head">
            <h2 id="result-title">{mode === "make" ? <>চেকটা <em>{toWhom(giver)}</em> পাঠাও</> : signedHere ? <>সই করা চেকটা <em>ফেরত পাঠাও</em></> : <>সই করা চেক, <em>সবাইকে দেখাও</em></>}</h2>
            <p>{chequeLine(cheque)}</p>
          </div>
          <div className="sc-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`${cardTitle(cheque)} ${amountFigures(cheque.amount)} টাকার সালামির চেক। ${chequeLine(cheque)}`} />
              {previewError && <p className="kit-status" role="alert">চেকের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="sc-controls">
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="salami-chek.png" makeImage={() => cardBlob(cheque, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint={mode === "make" ? `লিংক খুললে ${giver} এক চাপে সই করে তোমাকে ফেরত পাঠাতে পারবে।` : signedHere ? "লিংক খুললে সে দেখবে তোমার সই আর ‘অনুমোদিত’ সিল।" : ""} />
              {mode === "done" && (
                <div className="sc-turn">
                  <p><strong>এবার তোমার পালা।</strong> তুমিও কারও কাছে সালামি চাও।</p>
                  <button type="button" className="kit-secondary" onClick={makeOwn}>নিজের চেক বানাও</button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
