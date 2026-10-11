"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { appliances, applianceOf, bn, bnDecimal, clampCount, clampWatts, defaultUse, homeHash, hoursText, MAX_COUNT, MAX_NAME, MAX_WATTS, meterReading, noteOf, parseHome, parseNumber, presetHome, previewTitle, sortUses, stepHours, taka, takaExact, whoseHome, type ApplianceId, type Home, type Use } from "../lib/meter";
import { SANCTIONED_LOADS, tariff, tariffInfo, toNextStep } from "../lib/tariff";
import { MeterFace } from "./meter-face";

const TOOL = "bidyut-bill";
// Below this, "৩ জন জানিয়েছে" reads as an empty room, and percentages from a handful of homes are noise.
const COMPARE_MIN = 20;
const rate = (paisa: number) => takaExact(paisa);

function Icon({ id }: { id: ApplianceId }) {
  return <svg className="bb-icon" viewBox="0 0 48 48" aria-hidden="true"><path d={applianceOf(id).drawing} /></svg>;
}

type StepperProps = { label: string; value: string; onStep: (direction: 1 | -1) => void; canDown: boolean; canUp: boolean; what: string };
function Stepper({ label, value, onStep, canDown, canUp, what }: StepperProps) {
  return (
    <div className="bb-step" role="group" aria-label={`${what}: ${label}`}>
      <span>{label}</span>
      <div>
        <button type="button" onClick={() => onStep(-1)} disabled={!canDown} aria-label={`${what}: ${label} কমাও`}>−</button>
        <output aria-live="polite">{value}</output>
        <button type="button" onClick={() => onStep(1)} disabled={!canUp} aria-label={`${what}: ${label} বাড়াও`}>+</button>
      </div>
    </div>
  );
}

function WattField({ use, onChange }: { use: Use; onChange: (watts: number) => void }) {
  const item = applianceOf(use.id);
  const [text, setText] = useState(() => bn(use.watts));
  const typed = parseNumber(text);
  const valid = typed !== null && typed >= 1 && typed <= MAX_WATTS;
  const id = `bb-watt-${use.id}`;
  return (
    <div className="bb-watt-edit">
      <label htmlFor={id}>{item.label} কত ওয়াট?</label>
      <div>
        <input id={id} value={text} inputMode="numeric" maxLength={5} autoComplete="off" enterKeyHint="done" aria-invalid={!valid} aria-describedby={`${id}-hint`}
          onChange={event => { setText(event.target.value); const next = parseNumber(event.target.value); if (next !== null && next >= 1 && next <= MAX_WATTS) onChange(clampWatts(next)); }} />
        <span>ওয়াট</span>
        {use.watts !== item.watts && <button type="button" className="kit-link" onClick={() => { setText(bn(item.watts)); onChange(item.watts); }}>সাধারণ মানে ফেরো</button>}
      </div>
      <p id={`${id}-hint`} data-invalid={!valid} role={valid ? undefined : "alert"}>{valid ? `যন্ত্রের গায়ের লেবেলে আসল ওয়াট লেখা থাকে। সাধারণ মান ${bn(item.watts)} ওয়াট${noteOf(item) ? ` (${noteOf(item)})` : ""}।` : `১ থেকে ${bn(MAX_WATTS)}-এর মধ্যে লেখো`}</p>
    </div>
  );
}

export function MeterTool() {
  const [home, setHome] = useState<Home>(presetHome);
  const [shared, setShared] = useState<Home | null>(null);
  const [editing, setEditing] = useState<ApplianceId | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [fontsReady, setFontsReady] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const reading = useMemo(() => meterReading(home), [home]);
  const state = homeHash(home);
  const top = reading.shares[0];
  const topName = top ? applianceOf(top.use.id).name : "";
  const active = new Set(home.uses.map(use => use.id));
  const percentOf = (id: ApplianceId) => reading.shares.find(share => share.use.id === id);
  const next = toNextStep(reading.units);
  const nextStep = reading.bill.step ? tariff.steps.find(step => step.from === reading.bill.step!.upTo + 1) ?? null : null;

  useEffect(() => {
    // In-page anchors (#result) also change the hash; only a real shared home replaces this one.
    const open = () => { const opened = parseHome(window.location.hash); if (opened) { setHome(opened); setShared(opened); } };
    open();
    window.addEventListener("hashchange", open);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    loadCardFonts("এ মাসে এসি খেল ৬২%").then(() => setFontsReady(true), () => setPreviewError(true));
    return () => window.removeEventListener("hashchange", open);
  }, []);

  useEffect(() => {
    if (!fontsReady || !preview.current) return;
    try { drawCard(preview.current, home, reading, format, site); setPreviewError(false); }
    catch { setPreviewError(true); }
  }, [state, format, site, fontsReady]); // `state` encodes the whole home

  const change = (update: (current: Home) => Home) => {
    setHome(update);
    // A changed home makes the old comparison stale; let them add again.
    setCompared(current => current === "done" ? "idle" : current);
  };
  const patch = (id: ApplianceId, values: Partial<Use>) => change(current => ({ ...current, uses: current.uses.map(use => use.id === id ? { ...use, ...values } : use) }));
  const add = (id: ApplianceId) => change(current => ({ ...current, uses: sortUses([...current.uses, defaultUse(id)]) }));
  const remove = (id: ApplianceId) => { change(current => ({ ...current, uses: current.uses.filter(use => use.id !== id) })); if (editing === id) setEditing(null); };

  function yourTurn() {
    setShared(null);
    setEditing(null);
    change(() => presetHome());
    document.getElementById("bb-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function compareWithEveryone() {
    if (!top) return;
    setCompared("sending");
    const tally = await addToTally(TOOL, [top.use.id]);
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const caption = top
    ? `${whoseHome(home.name)} এ মাসে প্রায় ${bn(reading.units)} ইউনিট, সবচেয়ে বেশি খায় ${topName} (${bn(top.percent)}%)! তোমার বাসায় কোন যন্ত্র সবচেয়ে বেশি খায়? হিসাব করে দেখো:`
    : "কোন যন্ত্রে কত বিল আসে? হিসাব করে দেখো:";
  const crowd = everyone && everyone.total >= COMPARE_MIN
    ? appliances.map(item => ({ item, percent: Math.round(((everyone.counts[item.id] ?? 0) / everyone.total) * 100) })).filter(row => row.percent > 0).sort((a, b) => b.percent - a.percent)
    : [];

  return (
    <div className="bb">
      {shared && (
        <div className="bb-shared" role="note">
          <p><strong>কেউ তোমাকে একটা মিটারের হিসাব পাঠিয়েছে।</strong> {previewTitle(shared).replace(/। তোমার বাসায়\?$/, "।")}</p>
          <button type="button" className="kit-secondary" onClick={yourTurn}>এবার আমার বাসার হিসাব</button>
        </div>
      )}

      <figure className="bb-board">
        <MeterFace units={reading.units} watts={reading.watts} />
        <figcaption className="bb-slip" aria-live="polite">
          <span className="bb-slip-kicker">এ মাসের বিল</span>
          <strong>প্রায় {taka(reading.bill.total)} টাকা</strong>
          <span className="bb-slip-units"><span>{bn(reading.units)} ইউনিট</span>{top ? <> · <span>{topName} খেল {bn(top.percent)}%</span></> : null}</span>
          <span className="bb-slip-note">আনুমানিক, তোমার মিটারের বিলই আসল</span>
        </figcaption>
      </figure>

      <section className="bb-list-wrap" id="bb-list" aria-labelledby="bb-list-title">
        <h2 id="bb-list-title">বাসায় কী কী চলে? <small>সংখ্যা আর দিনে কত ঘণ্টা, ঠিক করে দাও</small></h2>
        {home.uses.length ? (
          <ul className="bb-list">
            {home.uses.map(use => {
              const item = applianceOf(use.id);
              const share = percentOf(use.id);
              return (
                <li key={use.id} className="bb-row" data-top={share === top || undefined}>
                  <div className="bb-row-head">
                    <Icon id={use.id} />
                    <button type="button" className="bb-row-name" aria-expanded={editing === use.id} aria-controls={editing === use.id ? `bb-watt-${use.id}` : undefined} onClick={() => setEditing(current => current === use.id ? null : use.id)}>
                      <strong>{item.label}</strong>
                      <span>{bn(use.watts)} ওয়াট · {use.watts === item.watts ? "সাধারণ মান" : "তোমার দেওয়া"} <span aria-hidden="true">✎</span></span>
                    </button>
                    <p className="bb-row-pct"><b>{bn(share?.percent ?? 0)}%</b><span>{bn(share?.units ?? 0)} ইউনিট</span></p>
                    <button type="button" className="bb-remove" onClick={() => remove(use.id)} aria-label={`${item.label} বাদ দাও`}>×</button>
                  </div>
                  <i className="bb-row-bar" style={{ width: `${share?.percent ?? 0}%` }} />
                  <div className="bb-steps">
                    <Stepper what={item.label} label="কয়টা" value={`${bn(use.count)}টা`} canDown={use.count > 1} canUp={use.count < MAX_COUNT} onStep={direction => patch(use.id, { count: clampCount(use.count + direction) })} />
                    <Stepper what={item.label} label="দিনে কত ঘণ্টা" value={`${hoursText(use.hours)} ঘণ্টা`} canDown={use.hours > 0.5} canUp={use.hours < 24} onStep={direction => patch(use.id, { hours: stepHours(use.hours, direction) })} />
                  </div>
                  {editing === use.id && <WattField use={use} onChange={watts => patch(use.id, { watts })} />}
                </li>
              );
            })}
          </ul>
        ) : <p className="bb-empty">সব যন্ত্র বাদ গেছে, মিটার থেমে আছে। নিচ থেকে একটা যোগ করো।</p>}

        {active.size < appliances.length && (
          <fieldset className="bb-add">
            <legend>আরও যন্ত্র আছে? যোগ করো</legend>
            <div>
              {appliances.filter(item => !active.has(item.id)).map(item => (
                <button type="button" key={item.id} onClick={() => add(item.id)}><Icon id={item.id} /><span>{item.label}</span><b aria-hidden="true">+</b></button>
              ))}
            </div>
          </fieldset>
        )}
        <p className="bb-honest">ওয়াটগুলো সাধারণ মান, যন্ত্রভেদে কমবেশি হয়। ওয়াটে চাপ দিয়ে নিজের যন্ত্রেরটা বসাতে পারো। মাস ধরা হয়েছে {bn(30)} দিনে।</p>
      </section>

      <StickyNext show={!resultVisible && reading.units > 0} title={<strong>প্রায় {bn(reading.units)} ইউনিট</strong>} sub={`আনুমানিক ${taka(reading.bill.total)} টাকা${top ? ` · ${topName} খেল ${bn(top.percent)}%` : ""}`} href="#result" label="কার্ডটা দেখো" />

      <section className="bb-result" id="result" ref={result} aria-labelledby="result-title">
        <h2 id="result-title">{top ? <>এ মাসে <em>{topName}</em> খেল {bn(top.percent)}%</> : "মিটার এখন থেমে আছে"}</h2>
        <p className="bb-line">{reading.line}</p>
        <div className="bb-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img"
              aria-label={`${whoseHome(home.name)} এ মাসে প্রায় ${bn(reading.units)} ইউনিট, আনুমানিক ${taka(reading.bill.total)} টাকা। ${reading.shares.slice(0, 4).map(share => `${applianceOf(share.use.id).name} ${bn(share.percent)}%`).join(", ")}।`} />
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="bb-controls">
            <label className="bb-name">
              <span>নাম <small>না দিলেও চলবে · কার্ড আর লিংকে যাবে</small></span>
              <input value={home.name} maxLength={MAX_NAME} onChange={event => { const name = event.target.value; setHome(current => ({ ...current, name })); }} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="bidyut-bill.png" makeImage={() => cardBlob(home, reading, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} disabled={!top} hint={top ? "বন্ধুকে পাঠাও। সে এই যন্ত্র আর ঘণ্টাগুলোই দেখবে, তারপর নিজেরটা করতে পারবে।" : ""} />
          </div>
        </div>
      </section>

      <section className="bb-bill" aria-labelledby="bb-bill-title">
        <h2 id="bb-bill-title">বিলটা যেভাবে হিসাব হলো</h2>
        <table>
          <caption className="bb-sr">ধাপে ধাপে বিদ্যুৎ বিলের হিসাব</caption>
          <tbody>
            {reading.bill.lines.map(line => <tr key={line.label}><th scope="row">{line.label}: {bn(line.units)} ইউনিট × {rate(line.rate)}</th><td>{takaExact(line.paisa)}</td></tr>)}
            <tr><th scope="row">ডিমান্ড চার্জ: {bn(home.load)} কি.ও. × {rate(tariff.demandPerKw)}</th><td>{takaExact(reading.bill.demand)}</td></tr>
            <tr><th scope="row">ভ্যাট {bn(tariff.vat * 100)}%</th><td>{takaExact(reading.bill.vat)}</td></tr>
          </tbody>
          <tfoot><tr><th scope="row">মোট, আনুমানিক</th><td>{takaExact(reading.bill.total)}</td></tr></tfoot>
        </table>
        <p className="bb-next">
          {reading.bill.lifeline
            ? `মাসে ${bn(tariff.lifeline.upTo)} ইউনিটের মধ্যে থাকলে পুরোটা লাইফলাইন দরে (${rate(tariff.lifeline.rate)} টাকা)। ${bn(tariff.lifeline.upTo)} পেরোলে পুরো বিল ধাপ ধরে হিসাব হয়।`
            : next !== null && nextStep
              ? `আর ${bn(next)} ইউনিট বেশি হলে বাড়তি ইউনিটগুলো ধরবে ${nextStep.label}ে, প্রতি ইউনিট ${rate(nextStep.rate)} টাকা।`
              : `${bn(600)} ইউনিটের পরের প্রতিটা ইউনিট ${rate(tariff.steps[tariff.steps.length - 1].rate)} টাকা।`}
        </p>
        <fieldset className="kit-chips bb-load">
          <legend>অনুমোদিত লোড কত? <small>বিলের কাগজে বা প্রিপেইড কার্ডে লেখা থাকে</small></legend>
          {SANCTIONED_LOADS.map(load => <button type="button" key={load} aria-pressed={home.load === load} onClick={() => change(current => ({ ...current, load }))}>{bn(load)} কি.ও.</button>)}
        </fieldset>
        <p className="bb-fine">{tariffInfo.short} ধরে। মিটার ভাড়া (থাকলে), বকেয়া আর প্রিপেইডের {bnDecimal(tariff.prepaidRebate * 100)}% রিবেট এখানে ধরা হয়নি। <a href="#tariff">দাম আর সূত্র দেখো</a></p>
      </section>

      {top && (
        <section className="bb-everyone" aria-labelledby="bb-everyone-title">
          <h2 id="bb-everyone-title">অন্যদের বাসায় কোনটা সবচেয়ে বেশি খায়?</h2>
          {compared !== "done" || !everyone ? <>
            <p>তোমার বাসায় সবচেয়ে বেশি খায় <strong>{topName}</strong>। চাইলে শুধু এই যন্ত্রের নামটা গোনায় যোগ করো, তারপর দেখো অন্যদের বাসায় কোনটা। নাম, ঘণ্টা বা বিল যাবে না।</p>
            <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "যোগ হচ্ছে…" : `‘${topName}’ যোগ করো`}</button>
            {compared === "failed" && <p className="kit-status" role="alert">এখন যোগ করা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : everyone.total < COMPARE_MIN ? (
            <p className="kit-status">যোগ হয়েছে! এখনো খুব কম বাসা জানিয়েছে ({bn(everyone.total)}টা), তাই ভাগটা এখনই দেখানো যাচ্ছে না। বন্ধুদের লিংক পাঠাও।</p>
          ) : <>
            <p>{bn(everyone.total)}টা বাসার মধ্যে, সবচেয়ে বেশি খায়:</p>
            <ul className="bb-crowd">{crowd.map(({ item, percent }) => <li key={item.id} data-mine={item.id === top.use.id || undefined}><span>{item.name}</span><i style={{ width: `${percent}%` }} /><b>{bn(percent)}%</b></li>)}</ul>
            <p className="bb-fine">যারা নিজে থেকে জানিয়েছে, শুধু তাদের হিসাব।</p>
          </>}
        </section>
      )}
    </div>
  );
}
