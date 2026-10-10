"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { DEFAULT_HISAB, LIMITS, amountText, bn, caption, cleanLabel, compute, currencies, currencyLabel, parseShareHash, perDayChoices, quickAmounts, readNumber, shareHash, units, validAmount, validPrice, validRate, type CurrencyId, type Hisab, type Prices, type UnitId } from "../lib/hisab";
import { towerLayout } from "../lib/tower";

const TOOL = "cha-mudra";
const foreignQuick = [1, 10, 100, 1_000] as const;
const field = (value: number) => bn(value).replace(/,/g, "");

function Tower({ drawn, each }: { drawn: number; each: number }) {
  const cups = towerLayout(drawn, { x: 8, y: 34, width: 344, height: 196 }, 56);
  const top = cups.at(-1);
  return <svg className="cm-tower" viewBox="0 0 360 250" aria-hidden="true">
    <rect className="cm-shelf" x="4" y="232" width="352" height="12" rx="2" />
    <g key={`${drawn}-${each}`}>
      {cups.map((cup, index) => <g className="cm-cup" key={index} style={{ animationDelay: `${Math.min(index * 14, 700)}ms` }}>
        <path className="cm-clay" d={cup.body} />
        <path className="cm-band" d={cup.band} />
        <ellipse className="cm-rim" {...cup.rim} />
        <ellipse className="cm-tea" {...cup.tea} />
      </g>)}
    </g>
    {top && <g className="cm-steam">{[-0.45, 0, 0.45].map(offset => {
      const x = top.rim.cx + offset * top.rim.rx, y = top.rim.cy - top.rim.rx * 0.25, h = top.rim.rx * 1.5;
      return <path key={offset} d={`M${x} ${y}C${x - top.rim.rx * 0.3} ${y - h * 0.45} ${x + top.rim.rx * 0.3} ${y - h * 0.6} ${x} ${y - h}`} />;
    })}</g>}
  </svg>;
}

export function ChaBuilder() {
  const [amountField, setAmountField] = useState(field(DEFAULT_HISAB.amount));
  const [currency, setCurrency] = useState<CurrencyId>("bdt");
  const [rateField, setRateField] = useState("");
  const [prices, setPrices] = useState<Prices>(DEFAULT_HISAB.prices);
  const [priceFields, setPriceFields] = useState<Record<UnitId, string>>(() => ({ cha: field(DEFAULT_HISAB.prices.cha), singara: field(DEFAULT_HISAB.prices.singara), riksha: field(DEFAULT_HISAB.prices.riksha) }));
  const [perDay, setPerDay] = useState(DEFAULT_HISAB.perDay);
  const [label, setLabel] = useState("");
  const [friend, setFriend] = useState<Hisab | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const amountInput = useRef<HTMLInputElement>(null);
  const rateInput = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const resultVisible = useInView(resultRef);

  const amount = readNumber(amountField);
  const rateRead = readNumber(rateField);
  const rate = currency === "bdt" || !validRate(rateRead) ? null : rateRead;
  const hisab = useMemo<Hisab>(() => ({ amount, currency, rate, prices, perDay, label: cleanLabel(label) }), [amount, currency, rate, prices, perDay, label]);
  const result = useMemo(() => compute(hisab), [hisab]);
  const ready = Boolean(result && result.cups > 0);
  const state = result ? shareHash(hisab).slice(1) : "";

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared hisab replaces the inputs.
    const readLink = () => {
      const link = parseShareHash(window.location.hash);
      if (!link) return;
      setFriend(link);
      setAmountField(field(link.amount)); setCurrency(link.currency); setRateField(link.rate ? field(link.rate) : "");
      setPrices(link.prices); setPriceFields({ cha: field(link.prices.cha), singara: field(link.prices.singara), riksha: field(link.prices.riksha) });
      setPerDay(link.perDay); setLabel(link.label);
    };
    readLink();
    setSite(window.location.host);
    window.addEventListener("hashchange", readLink);
    return () => window.removeEventListener("hashchange", readLink);
  }, []);

  useEffect(() => {
    if (!result) return;
    let cancelled = false;
    loadCardFonts("৫০০ কাপ চা").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, hisab, result, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [hisab, result, format, site]);

  function pickCurrency(id: CurrencyId) {
    setCurrency(id);
    // A rate starts empty on purpose: we never guess today's rate. Put the cursor where it's needed.
    if (id !== "bdt" && !rateField) requestAnimationFrame(() => rateInput.current?.focus());
  }

  function typePrice(id: UnitId, text: string) {
    setPriceFields(current => ({ ...current, [id]: text }));
    const value = readNumber(text);
    if (validPrice(value)) setPrices(current => ({ ...current, [id]: value }));
  }

  function startOwn() {
    setFriend(null); setLabel("");
    amountInput.current?.focus(); amountInput.current?.select();
  }

  const unitName = currencyLabel(currency);
  const amountOk = validAmount(amount, currency);
  const problem = !amountField.trim() ? "ওপরে একটা দাম লেখো, কত কাপ চা হয় দেখাব।"
    : !amountOk ? (amount > 0 ? `${bn(currency === "bdt" ? LIMITS.taka : LIMITS.foreign)} ${unitName}-এর মধ্যে লেখো।` : "শুধু অঙ্ক লেখো, যেমন ৫০০০ বা ৪.৫০")
    : currency !== "bdt" && !rate ? `১ ${unitName} এখন কত টাকা? রেটটা বসাও, তবেই কাপে বদলাবে।` : "";
  const quick = currency === "bdt" ? quickAmounts : foreignQuick;
  const chaPrice = bn(prices.cha);

  return (
    <div className="cm">
      {friend && <div className="cm-friend" role="status">
        <p><span>বন্ধুর হিসাব</span><strong>{friend.label || amountText(friend, compute(friend))} = {bn(compute(friend)?.cups ?? 0)} কাপ চা</strong></p>
        <button type="button" className="kit-primary" onClick={startOwn}>এবার আমারটা বসাই</button>
      </div>}

      <div className="cm-stall">
        <div className="cm-ask">
          <label htmlFor="cm-amount">কোন দামটা চায়ে মাপবে?</label>
          <div className="cm-input">
            <input id="cm-amount" ref={amountInput} value={amountField} onChange={event => setAmountField(event.target.value)} onFocus={event => event.currentTarget.select()} inputMode="decimal" autoComplete="off" enterKeyHint="done" maxLength={16} aria-invalid={!amountOk} aria-describedby="cm-problem" />
            <span>{unitName}</span>
          </div>
          <div className="cm-quick" role="group" aria-label="চটজলদি অঙ্ক">
            {quick.map(value => <button type="button" key={value} aria-pressed={amount === value} onClick={() => setAmountField(field(value))}>{bn(value)}</button>)}
          </div>
          <div className="cm-money" role="group" aria-labelledby="cm-money-label">
            <span id="cm-money-label">কোন টাকায়?</span>
            {currencies.map(item => <button type="button" key={item.id} aria-pressed={currency === item.id} onClick={() => pickCurrency(item.id)}>{item.label}</button>)}
          </div>
          {currency !== "bdt" && <label className="cm-rate">
            <span>১ {unitName} =</span>
            <input ref={rateInput} value={rateField} onChange={event => setRateField(event.target.value)} inputMode="decimal" autoComplete="off" maxLength={9} placeholder="রেট" aria-invalid={!rate} aria-label={`১ ${unitName} কত টাকা`} />
            <span>টাকা</span>
            <small>আজকের রেট নিজে বসাও। আমরা কোনো রেট আনি না।</small>
          </label>}
        </div>

        <div className="cm-answer" aria-live="polite">
          {problem || !result ? <p id="cm-problem" className="cm-problem">{problem}</p> : <>
            <p className="cm-headline"><span>{amountText(hisab, result)} =</span> <strong>{bn(result.cups)} কাপ চা</strong></p>
            <Tower drawn={result.drawn} each={result.each} />
            <p className="cm-scale">{result.each > 1 ? `এক ভাঁড় = ${bn(result.each)} কাপ` : "এক ভাঁড় = এক কাপ"}</p>
            <ul className="cm-others">{result.others.map(other => <li key={other.id}>{other.text}</li>)}</ul>
            <p className="cm-line">{result.line}</p>
          </>}
        </div>
      </div>

      <details className="cm-math" open>
        <summary>হিসাবটা যেভাবে <small>দাম বদলাতে পারো</small></summary>
        <fieldset className="cm-prices">
          <legend>তোমার এলাকার দাম বসাও</legend>
          {units.map(unit => {
            const ok = validPrice(readNumber(priceFields[unit.id]));
            return <label key={unit.id} data-bad={!ok || undefined}>
              <span>{unit.label}</span>
              <input value={priceFields[unit.id]} onChange={event => typePrice(unit.id, event.target.value)} onFocus={event => event.currentTarget.select()} inputMode="numeric" autoComplete="off" maxLength={7} aria-invalid={!ok} />
              <span>টাকা</span>
            </label>;
          })}
        </fieldset>
        <fieldset className="cm-days">
          <legend>দিনে কয় কাপ খাও?</legend>
          {perDayChoices.map(value => <button type="button" key={value} aria-pressed={perDay === value} onClick={() => setPerDay(value)}>{bn(value)} কাপ</button>)}
        </fieldset>
        {result && <ol className="cm-steps">
          {currency !== "bdt" && <li>{bn(hisab.amount)} {unitName} × {bn(rate!)} = <b>{bn(Math.round(result.taka))} টাকা</b></li>}
          <li>{bn(Math.round(result.taka))} ÷ {chaPrice} = <b>{bn(result.cups)} কাপ চা</b> <small>(ভাঙতি বাদ)</small></li>
          <li>{bn(result.cups)} কাপ ÷ দিনে {bn(perDay)} কাপ = <b>{bn(result.days)} দিন</b></li>
          <li>উল্টো দিকে: দিনে {bn(perDay)} কাপ × {chaPrice} টাকা × ৩৬৫ = <b>বছরে {bn(result.yearly)} টাকা চায়ে</b></li>
        </ol>}
        <p className="cm-note">দামগুলো শুধু উদাহরণ, জায়গা ভেদে আলাদা। এটা মজার হিসাব, বাজারদর বা টাকা পাঠানোর পরামর্শ না।</p>
      </details>

      <StickyNext show={ready && !resultVisible} title={<><strong>{bn(result?.cups ?? 0)} কাপ</strong> চা</>} sub={result?.line} href="#result" label="কার্ডটা দেখো" />

      <section className="cm-result" id="result" ref={resultRef} aria-labelledby="cm-result-title">
        <h2 id="cm-result-title">তোমার চায়ের কার্ড</h2>
        <div className="cm-result-body">
          <figure className="kit-card" data-format={format}>
            {result ? <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={caption(hisab, result)} /> : <p className="cm-problem">ওপরে দাম ঠিক করলে কার্ড এখানে দেখাবে।</p>}
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="cm-controls">
            <label className="cm-label">
              <span>কিসের দাম? <small>না দিলেও চলবে, কার্ডের ওপরে বসবে</small></span>
              <input value={label} maxLength={LIMITS.label} onChange={event => setLabel(event.target.value)} placeholder="যেমন: নতুন ফোন" autoComplete="off" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="cha-mudra.png" makeImage={() => cardBlob(hisab, result!, format, site)} imageKey={`${state}|${format}`} caption={result ? caption(hisab, result) : ""} state={state} disabled={!ready} hint="লিংক পেলে বন্ধু তোমার হিসাবটা দেখবে, তারপর নিজের শখের জিনিস বসাবে।" />
          </div>
        </div>
      </section>
    </div>
  );
}
