"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { dateLine, dhakaToday, nextDate, occasionById, sources as dateSources } from "../../koto-din-baki/lib/countdown";
import { cardBlob, drawCard } from "../lib/draw-card";
import { bn, bowlLine, bowls, cleanName, convertLength, cowHash, cowTitle, inputText, kgText, lbText, limits, MAX_NAME, MAX_PART, MEAT_LIMITS, meatText, monText, packetLabel, packetSizes, packetText, parseAmount, parseCow, possessive, sample, shareEquation, splitMeat, toInches, unitLabel, weightLine, weightOf, type CardKind, type Cow, type Split, type Unit } from "../lib/ojon";
import { CowArt } from "./cow-art";

const TOOL = "gorur-ojon";

type FieldProps = { id: string; label: string; hint: string; unit: string; value: number; min: number; max: number; onChange: (value: number) => void; inputRef?: RefObject<HTMLInputElement | null> };

/** A tailor's-tape number box: − and + for tapping, typing for exact numbers (Bangla or English digits). */
function TapeField({ id, label, hint, unit, value, min, max, onChange, inputRef }: FieldProps) {
  const [text, setText] = useState(() => inputText(value));
  useEffect(() => { setText(current => parseAmount(current) === value ? current : inputText(value)); }, [value]);
  const typed = parseAmount(text);
  const valid = typed !== null && typed >= min && typed <= max;
  const set = (next: number) => onChange(Math.min(max, Math.max(min, Math.round(next * 10) / 10)));
  return (
    <div className="ojon-field">
      <label htmlFor={id}>{label}</label>
      <div className="ojon-tape" data-invalid={!valid}>
        <button type="button" onClick={() => set(Math.ceil(value) - 1)} disabled={value <= min} aria-label={`${label} ১ ${unit} কমাও`}>−</button>
        <input id={id} ref={inputRef} value={text} inputMode="decimal" autoComplete="off" enterKeyHint="done" maxLength={6} aria-invalid={!valid} aria-describedby={`${id}-hint`}
          onChange={event => { setText(event.target.value); const next = parseAmount(event.target.value); if (next !== null && next >= min && next <= max) set(next); }} />
        <span className="ojon-unit" aria-hidden="true">{unit}</span>
        <button type="button" onClick={() => set(Math.floor(value) + 1)} disabled={value >= max} aria-label={`${label} ১ ${unit} বাড়াও`}>+</button>
      </div>
      <p id={`${id}-hint`} className="ojon-hint" data-invalid={!valid} role={valid ? undefined : "alert"}>{valid ? hint : `${bn(min)} থেকে ${bn(max)} ${unit}-এর মধ্যে লেখো`}</p>
    </div>
  );
}

export function OjonTool() {
  // `draft` keeps the name exactly as typed; everything drawn or shared uses the cleaned `cow`.
  const [draft, setCow] = useState<Cow>(sample);
  const cow: Cow = { ...draft, name: cleanName(draft.name) };
  const [shared, setShared] = useState<Cow | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [eid, setEid] = useState<string | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const girthInput = useRef<HTMLInputElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const weight = weightOf(cow);
  const state = cowHash(cow);
  const unit = unitLabel[cow.unit];

  useEffect(() => {
    // In-page anchors (#result) also change the hash; only a real shared cow replaces this one.
    const open = () => { const opened = parseCow(window.location.hash); if (opened) { setCow(opened); setShared(opened); } };
    open();
    window.addEventListener("hashchange", open);
    setSite(window.location.host);
    // shortcut: the date table in koto-din-baki runs to 2028; it gets its yearly update there.
    setEid(nextDate(occasionById("eid-adha"), dhakaToday(new Date())));
    loadCardFonts("গরুর ওজন প্রায় ৪ মণ").then(() => setFontsReady(true), () => setPreviewError(true));
    return () => window.removeEventListener("hashchange", open);
  }, []);

  useEffect(() => {
    if (!fontsReady || !preview.current) return;
    try { drawCard(preview.current, cow, format, site); setPreviewError(false); }
    catch { setPreviewError(true); }
  }, [state, format, site, fontsReady]); // `state` encodes the whole cow

  // The card follows what you touched last: the tape makes a weight card, the bowls a share card.
  const measure = (patch: Partial<Cow>) => setCow(current => ({ ...current, ...patch, card: "ojon" }));
  const divide = (patch: Partial<Cow>) => setCow(current => ({ ...current, ...patch, card: "bhag" }));
  const switchUnit = (next: Unit) => setCow(current => ({ ...current, unit: next, girth: convertLength(current.girth, current.unit, next, "girth"), length: convertLength(current.length, current.unit, next, "length") }));
  const setPart = (index: number, delta: number) => divide({ split: cow.split.map((part, i) => i === index ? Math.min(MAX_PART, Math.max(0, part + delta)) : part) as Split });
  const parts = splitMeat(cow.meat, cow.split);
  const partsTotal = cow.split[0] + cow.split[1] + cow.split[2];

  function yourTurn() {
    setShared(null);
    setCow(current => ({ ...current, name: "", card: "ojon" }));
    girthInput.current?.focus();
    girthInput.current?.select();
  }

  const caption = cow.card === "bhag"
    ? `${shareEquation(cow)}${packetText(cow) ? ` · ${packetText(cow)}` : ""}। ঈদ মোবারক! তোমাদের ভাগের হিসাবও করে দেখো:`
    : `${cowTitle(cow.name)}, ফিতার হিসাবে প্রায় ${monText(weight.mon)} মণ (${kgText(weight.kg)} কেজি)! তোমাদের গরু কত মণ, মেপে দেখো:`;
  const sharedWeight = shared ? weightOf(shared) : null;

  return (
    <div className="ojon">
      {shared && sharedWeight && (
        <div className="ojon-shared" role="note">
          <p><strong>তোমাকে একটা {shared.card === "bhag" ? "ভাগের হিসাব" : "গরুর মাপ"} পাঠানো হয়েছে।</strong> {shared.card === "bhag" ? shareEquation(shared) : `${shared.name ? possessive(shared.name) : "এই গরুর"} ওজন প্রায় ${monText(sharedWeight.mon)} মণ।`}</p>
          <button type="button" className="kit-secondary" onClick={yourTurn}>এবার আমাদের গরু মাপি</button>
        </div>
      )}

      <div className="ojon-hat">
        <figure className="ojon-stage">
          <CowArt girthIn={toInches(cow.girth, cow.unit)} lengthIn={toInches(cow.length, cow.unit)} girthLabel={`বুকের বেড় ${bn(cow.girth)} ${unit}`} lengthLabel={`দৈর্ঘ্য ${bn(cow.length)} ${unit}`} name={cow.name} />
          <figcaption className="ojon-readout" aria-live="polite">
            <span className="ojon-about">আনুমানিক</span>
            <strong>প্রায় {monText(weight.mon)} মণ</strong>
            <span>{kgText(weight.kg)} কেজি · {lbText(weight.lb)} পাউন্ড</span>
          </figcaption>
        </figure>

        <div className="ojon-sheet">
          <div className="ojon-fields">
            <TapeField id="ojon-girth" label="বুকের বেড়" hint="সামনের পায়ের ঠিক পেছনে, বুক ঘুরিয়ে" unit={unit} value={cow.girth} min={limits[cow.unit].girth[0]} max={limits[cow.unit].girth[1]} onChange={girth => measure({ girth })} inputRef={girthInput} />
            <TapeField id="ojon-length" label="দৈর্ঘ্য" hint="কাঁধের হাড় থেকে পিন বোন পর্যন্ত" unit={unit} value={cow.length} min={limits[cow.unit].length[0]} max={limits[cow.unit].length[1]} onChange={length => measure({ length })} />
          </div>
          <fieldset className="kit-chips ojon-units">
            <legend>ফিতায় কোন মাপ?</legend>
            {(["in", "cm"] as const).map(id => <button type="button" key={id} aria-pressed={cow.unit === id} onClick={() => switchUnit(id)}>{id === "in" ? "ইঞ্চি" : "সেন্টিমিটার"}</button>)}
          </fieldset>
          <p className="ojon-note"><strong>আনুমানিক, ১০–২০% কমবেশি হতে পারে।</strong> শেফারের সূত্র: বেড়² × দৈর্ঘ্য ÷ ৩০০ (ইঞ্চিতে মাপলে পাউন্ড), ১ মণ = ৪০ কেজি ধরে। এটা দাম বা মাংসের হিসাব না। <a href="#source">সূত্র দেখো</a></p>
        </div>
      </div>

      <section className="ojon-bhag" aria-labelledby="bhag-title">
        <h2 id="bhag-title">ঈদের দিন: মাংসের ভাগ <small>চাইলে</small></h2>
        {eid && <p className="ojon-eid">সম্ভাব্য ঈদুল আজহা {dateLine(eid)}। চাঁদ দেখার ওপর নির্ভর করে, <a href={dateSources.moon.url} rel="external">ঠিক দিন জানাবে জাতীয় চাঁদ দেখা কমিটি</a>।</p>}
        <div className="ojon-bhag-top">
          <TapeField id="ojon-meat" label="মাংস মেপে কত কেজি হলো?" hint="গরুর ওজন থেকে মাংস কত হবে, আমরা আন্দাজ করি না। মেপে যা পেলে, তাই লেখো।" unit="কেজি" value={cow.meat} min={MEAT_LIMITS[0]} max={MEAT_LIMITS[1]} onChange={meat => divide({ meat })} />
        </div>
        <p className="ojon-rite">তিন ভাগ: <strong>প্রচলিত রীতি, বাধ্যতামূলক নয়।</strong> কোন ভাগে কতটা যাবে, − আর + দিয়ে নিজের মতো বদলাও।</p>
        <ul className="ojon-bowls">
          {bowls.map((bowl, index) => (
            <li key={bowl.id} data-empty={parts[index] === 0 || undefined}>
              <strong>{meatText(parts[index])} <small>কেজি</small></strong>
              <span>{bowl.label}</span>
              <div className="ojon-part">
                <button type="button" onClick={() => setPart(index, -1)} disabled={cow.split[index] === 0 || partsTotal <= 1 && cow.split[index] === 1} aria-label={`${bowl.label}: এক ভাগ কমাও`}>−</button>
                <b aria-live="polite">{bn(cow.split[index])} ভাগ</b>
                <button type="button" onClick={() => setPart(index, 1)} disabled={cow.split[index] >= MAX_PART} aria-label={`${bowl.label}: এক ভাগ বাড়াও`}>+</button>
              </div>
            </li>
          ))}
        </ul>
        <fieldset className="kit-chips ojon-packets">
          <legend>আত্মীয় আর অভাবীদের প্যাকেট কত করে?</legend>
          {packetSizes.map(size => <button type="button" key={size} aria-pressed={cow.packet === size} onClick={() => divide({ packet: size })}>{packetLabel[size]}</button>)}
        </fieldset>
        <p className="ojon-bhag-sum"><strong>{shareEquation(cow)}</strong>{packetText(cow) && <> · {packetText(cow)}</>}</p>
      </section>

      <StickyNext show={!resultVisible} title={<strong>প্রায় {monText(weight.mon)} মণ</strong>} sub={`${kgText(weight.kg)} কেজি · আনুমানিক`} href="#result" label="কার্ডটা দেখো" />

      <section className="ojon-result" id="result" ref={result} aria-labelledby="result-title">
        <h2 id="result-title">{cow.card === "bhag" ? <>ভাগের হিসাব, <span>কার্ডে তোলা</span></> : <>{cowTitle(cow.name)}, <span>প্রায় {monText(weight.mon)} মণ</span></>}</h2>
        <p className="ojon-line">{cow.card === "bhag" ? bowlLine(cow) : weightLine(weight.mon, cow.name)}</p>
        <div className="ojon-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={cow.card === "bhag" ? `মাংসের ভাগ: ${shareEquation(cow)}। ${packetText(cow)}` : `${cowTitle(cow.name)}: আনুমানিক ${monText(weight.mon)} মণ, ${kgText(weight.kg)} কেজি। বুকের বেড় ${bn(cow.girth)} ${unit}, দৈর্ঘ্য ${bn(cow.length)} ${unit}।`} />
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="ojon-controls">
            <label className="ojon-name-field">
              <span>গরুর নাম <small>না দিলেও চলবে · কার্ড আর লিংকে যাবে</small></span>
              <input value={draft.name} maxLength={MAX_NAME} onChange={event => setCow(current => ({ ...current, name: event.target.value }))} placeholder="যেমন: লালু" autoComplete="off" />
            </label>
            <fieldset className="kit-chips">
              <legend>কোন কার্ড?</legend>
              {(["ojon", "bhag"] as CardKind[]).map(kind => <button type="button" key={kind} aria-pressed={cow.card === kind} onClick={() => setCow(current => ({ ...current, card: kind }))}>{kind === "ojon" ? "গরুর ওজন" : "মাংসের ভাগ"}</button>)}
            </fieldset>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="gorur-ojon.png" makeImage={() => cardBlob(cow, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint="লিংক খুললে এই মাপ আর ভাগটাই বসানো থাকবে।" />
          </div>
        </div>
      </section>
    </div>
  );
}
