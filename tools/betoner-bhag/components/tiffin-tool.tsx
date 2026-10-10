"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { biggest, bn, caption, categories, cleanName, crowdAverage, FLEX_INDEX, flexOptions, labels, MAX_NAME, monthHash, monthLine, monthTitle, parseMonth, possessive, sample, SAVE_INDEX, setShare, splitText, tallyItems, type FlexId, type Month } from "../lib/bhag";
import { cardBlob, drawCard, drawScene, LIVE_HEIGHT, SCENE_WIDTH } from "../lib/draw-carrier";

const TOOL = "betoner-bhag";
// Averages from a handful of people are noise; below this we only say how many have counted.
const CROWD_MIN = 100;
const LIVE_SCALE = 2;

export function TiffinTool() {
  // `month.name` keeps the name exactly as typed; everything drawn or shared uses the cleaned copy.
  const [month, setMonth] = useState<Month>(sample);
  const clean: Month = { ...month, name: cleanName(month.name) };
  const [shared, setShared] = useState<Month | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [fontsReady, setFontsReady] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const live = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const firstSlider = useRef<HTMLInputElement>(null);
  const resultVisible = useInView(result);
  // One drag is computed from the split it started on, so sliding back to the start restores every bowl exactly.
  const drag = useRef<{ index: number; from: number[] } | null>(null);
  const shown = useRef<number[]>(sample.shares.slice());
  const state = monthHash(clean);
  const names = labels(month.flex);
  const top = biggest(clean);

  useEffect(() => {
    // In-page anchors (#result) also change the hash; only a real shared split replaces this one.
    const open = () => { const opened = parseMonth(window.location.hash); if (opened) { setMonth(opened); setShared(opened); } };
    open();
    window.addEventListener("hashchange", open);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    loadCardFonts("বেতনের ভাগ ৩৫%").then(() => setFontsReady(true), () => setPreviewError(true));
    return () => window.removeEventListener("hashchange", open);
  }, []);

  // The live carrier eases each bowl toward its new size; reduced motion jumps straight there.
  const sharesKey = month.shares.join(",");
  useEffect(() => {
    const canvas = live.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    const paint = () => {
      let moving = false;
      shown.current = shown.current.map((size, index) => {
        const target = month.shares[index];
        const next = still ? target : size + (target - size) * 0.28;
        if (Math.abs(target - next) < 0.05) return target;
        moving = true;
        return next;
      });
      context.setTransform(1, 0, 0, 1, 0, 0);
      drawScene(context, { sizes: shown.current, values: month.shares, labels: names, name: clean.name }, 0, 0, LIVE_SCALE, LIVE_HEIGHT);
      if (moving) frame = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(frame);
  }, [sharesKey, month.flex, clean.name, fontsReady]); // `sharesKey` stands in for the shares array

  useEffect(() => {
    if (!fontsReady || !preview.current) return;
    try { drawCard(preview.current, clean, format, site); setPreviewError(false); }
    catch { setPreviewError(true); }
  }, [state, format, site, fontsReady]); // `state` encodes the whole month

  function update(shares: number[]) {
    setMonth(current => ({ ...current, shares }));
    // A changed split makes the old comparison stale; let them compare again.
    setCompared(current => current === "done" ? "idle" : current);
  }
  function slide(index: number, value: number) {
    const from = drag.current?.index === index ? drag.current.from : month.shares;
    drag.current = { index, from };
    update(setShare(from, index, value));
  }
  const endSlide = () => { drag.current = null; };
  function nudge(index: number, delta: number) {
    drag.current = null;
    update(setShare(month.shares, index, month.shares[index] + delta));
  }

  function yourTurn() {
    setShared(null);
    setMonth(sample);
    setCompared("idle");
    firstSlider.current?.focus();
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, tallyItems(clean));
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const rentCrowd = everyone ? crowdAverage(everyone.counts, "rent") : null;
  const crowd = compared === "done" && everyone ? categories(clean.flex).map((category, index) => ({ label: names[index], mine: clean.shares[index], crowd: crowdAverage(everyone.counts, category) })) : [];
  const hint = month.shares[SAVE_INDEX] > 0
    ? "কোনো বাটি বাড়ালে জায়গা আসে জমা থেকে, কমালে জমায় ফেরে। মোট সবসময় ১০০%।"
    : "জমার বাটি ফাঁকা, তাই এখন বাড়ালে বাকি বাটিগুলো থেকে একটু একটু কাটবে।";

  return (
    <div className="bb">
      {shared && (
        <div className="bb-shared" role="note">
          <p><strong>{shared.name ? possessive(shared.name) : "এক বন্ধুর"} মাস তোমার কাছে এসেছে।</strong> সবচেয়ে বড় বাটি {biggest(shared).label}, {bn(biggest(shared).share)}%। নিচে ওর টিফিন ক্যারিয়ার বসানো আছে।</p>
          <button type="button" className="kit-secondary" onClick={yourTurn}>এবার আমারটা ভাগ করি</button>
        </div>
      )}

      <div className="bb-kitchen">
        <figure className="bb-desk">
          <canvas ref={live} width={SCENE_WIDTH * LIVE_SCALE} height={LIVE_HEIGHT * LIVE_SCALE} role="img" aria-label={`টিফিন ক্যারিয়ারের ছয় বাটি: ${splitText(clean)}`} />
        </figure>

        <div className="bb-panel">
          <ul className="bb-rows">
            {names.map((label, index) => {
              const value = month.shares[index];
              return (
                <li key={index} className="bb-row" data-top={index === top.index || undefined}>
                  <div className="bb-row-head">
                    {index === FLEX_INDEX ? (
                      <label className="bb-flex">
                        <span className="bb-sr">চতুর্থ বাটিতে কী রাখবে</span>
                        <select value={month.flex} onChange={event => setMonth(current => ({ ...current, flex: event.target.value as FlexId }))}>
                          {flexOptions.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
                        </select>
                      </label>
                    ) : <span className="bb-name">{label}</span>}
                    <output className="bb-value" aria-hidden="true">{bn(value)}%</output>
                  </div>
                  <div className="bb-row-control">
                    <button type="button" className="bb-step" onClick={() => nudge(index, -1)} disabled={value <= 0} aria-label={`${label} ১% কমাও`}>−</button>
                    <input ref={index === 0 ? firstSlider : undefined} type="range" className="bb-range" min={0} max={100} step={1} value={value} aria-label={label} aria-valuetext={`${bn(value)} শতাংশ`} style={{ "--fill": value } as CSSProperties}
                      onChange={event => slide(index, Number(event.target.value))} onPointerUp={endSlide} onPointerCancel={endSlide} onBlur={endSlide} />
                    <button type="button" className="bb-step" onClick={() => nudge(index, 1)} disabled={value >= 100} aria-label={`${label} ১% বাড়াও`}>+</button>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="bb-hint" aria-live="polite">{hint}</p>
          {rentCrowd && rentCrowd.people >= CROWD_MIN && <p className="bb-proof">যারা ভাগ করেছে, গড়ে বাসা ভাড়া <strong>প্রায় {bn(rentCrowd.average)}%</strong></p>}
          <button type="button" className="kit-link bb-reset" onClick={() => update(sample.shares)} hidden={sharesKey === sample.shares.join(",")}>শুরুর ভাগে ফিরে যাও</button>
        </div>
      </div>

      <StickyNext show={!resultVisible} title={<strong>{top.label} {bn(top.share)}%</strong>} sub="সবচেয়ে বড় বাটি" href="#result" label="কার্ডটা দেখো" />

      <section className="bb-result" id="result" ref={result} aria-labelledby="result-title">
        <h2 id="result-title">{monthTitle(clean.name)}, <span>এক টিফিন ক্যারিয়ারে</span></h2>
        <p className="bb-line">{monthLine(clean)}</p>
        <div className="bb-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`${monthTitle(clean.name)}: ${splitText(clean)}। ${monthLine(clean)}`} />
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="bb-controls">
            <label className="bb-name-field">
              <span>নাম <small>না দিলেও চলবে · সবচেয়ে বড় বাটিতে খোদাই হবে</small></span>
              <input value={month.name} maxLength={MAX_NAME} onChange={event => setMonth(current => ({ ...current, name: event.target.value }))} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="betoner-bhag.png" makeImage={() => cardBlob(clean, format, site)} imageKey={`${state}|${format}`} caption={caption(clean)} state={state} hint="লিংক খুললে এই ছয়টা ভাগই বসানো থাকবে। টাকার অঙ্ক কোথাও নেই।" />
          </div>
        </div>

        <div className="bb-crowd">
          <h3>যারা ভাগ করেছে, তাদের সাথে মেলাবে?</h3>
          {compared !== "done" || !everyone ? <>
            <p>শুধু প্রতিটা বাটির মোটামুটি ঘর গোনা হবে, যেমন ‘বাসা ভাড়া ৩৫–৩৯%’। নাম যাবে না। এটা জরিপ না, যারা এখানে ভাগ করেছে শুধু তাদের গোনা।</p>
            <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
            {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : everyone.total < CROWD_MIN ? (
            <p className="kit-status">তুমিসহ এখন পর্যন্ত {bn(everyone.total)} জন ভাগ করেছে। {bn(CROWD_MIN)} জন হলে গড় দেখাব; বন্ধুদের লিংক পাঠাও!</p>
          ) : <>
            <p>যারা ভাগ করেছে ({bn(everyone.total)} জন), তাদের গড়ের পাশে তোমার ভাগ। গড়টা মোটামুটি, কারণ ঘর ধরে গোনা।</p>
            <ul className="bb-bars">
              {crowd.map(row => (
                <li key={row.label}>
                  <span>{row.label}</span>
                  {row.crowd && row.crowd.people >= CROWD_MIN ? <>
                    <i style={{ "--mine": `${row.mine}%`, "--crowd": `${row.crowd.average}%` } as CSSProperties} aria-hidden="true" />
                    <b>তোমার {bn(row.mine)}% · গড়ে প্রায় {bn(row.crowd.average)}%</b>
                  </> : <b className="bb-counting">গোনা চলছে… ({bn(row.crowd?.people ?? 0)} জন)</b>}
                </li>
              ))}
            </ul>
          </>}
        </div>
      </section>
    </div>
  );
}
