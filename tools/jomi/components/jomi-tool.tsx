"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, drawStage, STAGE } from "../lib/draw-card";
import { conversions, equation, labels, labelText, parsePlot, pitchLine, plotHash, plotLine, sample, sizeText, sqftOf, titleText, type LabelId, type Plot } from "../lib/plot";
import { amountText, bn, checked, inputText, parseAmount, PITCH, PITCH_SQFT, PITCH_SQM, units, type UnitId } from "../lib/units";

const TOOL = "jomi";

export function JomiTool() {
  const [plot, setPlot] = useState<Plot>(sample);
  const [text, setText] = useState(() => inputText(sample.value));
  const [shared, setShared] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [fontsReady, setFontsReady] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const stage = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const shownRatio = useRef<number | null>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const valid = parseAmount(text) !== null;
  const state = plotHash(plot);
  const list = useMemo(() => conversions(plot), [plot]);

  useEffect(() => {
    const open = (first: boolean) => {
      // In-page anchors (#result, #source) also change the hash; only a real shared size replaces the plot.
      const opened = parsePlot(window.location.hash);
      if (!opened) return;
      setPlot(opened);
      setText(inputText(opened.value));
      if (first) setShared(true);
    };
    open(true);
    const follow = () => open(false);
    window.addEventListener("hashchange", follow);
    setSite(window.location.host);
    loadCardFonts("১৪,৪০০ বর্গফুট শতাংশ বিঘা").then(() => setFontsReady(true), () => setPreviewError(true));
    return () => window.removeEventListener("hashchange", follow);
  }, []);

  // The plot grows or shrinks on the pitch instead of jumping; the tween runs in log scale so 1 কাঠা → 1 একর still looks smooth.
  useEffect(() => {
    const canvas = stage.current;
    if (!canvas || !fontsReady) return;
    const target = sqftOf(plot) / PITCH_SQFT;
    const from = shownRatio.current ?? target;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const t = still ? 1 : Math.min(1, (now - start) / 420);
      const ratio = Math.exp(Math.log(from) + (Math.log(target) - Math.log(from)) * (1 - (1 - t) ** 3));
      shownRatio.current = ratio;
      drawStage(canvas, ratio, plot.label, sizeText(plot));
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [plot, fontsReady]);

  useEffect(() => {
    if (!fontsReady || !preview.current) return;
    try { drawCard(preview.current, plot, format, site); setPreviewError(false); }
    catch { setPreviewError(true); }
  }, [plot, format, site, fontsReady]);

  function type(next: string) {
    setText(next);
    setShared(false);
    const value = parseAmount(next);
    if (value !== null) setPlot(current => ({ ...current, value }));
  }

  function pickUnit(unit: UnitId) { setPlot(current => ({ ...current, unit })); setShared(false); }
  function pickLabel(label: LabelId) { setPlot(current => ({ ...current, label: current.label === label ? "" : label })); }
  function yourTurn() {
    setShared(false);
    input.current?.focus();
    input.current?.select();
  }

  const help = !text.trim() ? "একটা মাপ লেখো, যেমন ১ বা ২.৫" : "শুধু অঙ্ক লেখো, যেমন ২.৫ বা 2.5। শূন্যের বেশি, ৭ অঙ্কের মধ্যে।";
  const caption = `${plot.label ? `${labelText(plot.label)}: ` : ""}${equation(plot)}। ${pitchLine(plot)}! তোমার বাড়ির উঠোন কত শতাংশ, মেপে দেখো:`;

  return (
    <div className="jomi">
      {shared && (
        <div className="jomi-shared" role="note">
          <p><strong>তোমাকে একটা জমির মাপ পাঠানো হয়েছে।</strong> {plot.label ? `${labelText(plot.label)}: ` : ""}{equation(plot)}।</p>
          <button type="button" className="kit-secondary" onClick={yourTurn}>এবার আমার জমির মাপ লিখি</button>
        </div>
      )}

      <div className="jomi-plot">
        <div className="jomi-sheet">
          <div className="jomi-amount">
            <label htmlFor="jomi-amount">কত জমি? <small>বাংলা বা ইংরেজি অঙ্কে</small></label>
            <div className="jomi-amount-row" data-invalid={!valid}>
              <input ref={input} id="jomi-amount" value={text} onChange={event => type(event.target.value)} inputMode="decimal" autoComplete="off" enterKeyHint="done" maxLength={16} placeholder="যেমন ২.৫" aria-invalid={!valid} aria-describedby={valid ? undefined : "jomi-help"} />
              <select value={plot.unit} onChange={event => pickUnit(event.target.value as UnitId)} aria-label="কোন এককে">
                {units.map(unit => <option key={unit.id} value={unit.id}>{unit.label}</option>)}
              </select>
            </div>
            {!valid && <p id="jomi-help" className="jomi-help" role="alert">{help}</p>}
          </div>

          <ul className="jomi-list" data-stale={!valid} aria-label={`${sizeText(plot)} সমান`}>
            {list.map(item => <li key={item.id}><strong data-long={item.text.length > 10 ? 2 : item.text.length > 7 ? 1 : undefined}>{item.text}</strong><span>{item.label}</span></li>)}
          </ul>
          <p className="jomi-sr" aria-live="polite">{valid ? equation(plot) : ""}</p>
          <p className="jomi-note">সরকারি মান, ভূমি মন্ত্রণালয়ের তালিকা থেকে · যাচাই {checked} · তোমার এলাকায় কাঠা-বিঘা আলাদা হতে পারে। <a href="#source">সূত্র দেখো</a></p>
        </div>

        <figure className="jomi-stage">
          <canvas ref={stage} width={STAGE.width} height={STAGE.height} role="img" aria-label={`ওপর থেকে দেখা ${titleText(plot)} আর একটা ফুটবল মাঠ, একই মাপে আঁকা। ${pitchLine(plot)}।`} />
          <figcaption>
            <strong>{titleText(plot)}: {pitchLine(plot)}</strong>
            <span>মাঠ ধরা হয়েছে ফিফার সুপারিশ করা {bn(PITCH.length)} × {bn(PITCH.width)} মিটার, মানে {bn(PITCH_SQM)} বর্গমিটার (প্রায় {amountText(PITCH_SQFT)} বর্গফুট)।</span>
          </figcaption>
          <fieldset className="kit-chips jomi-labels">
            <legend>জমিটা কিসের? <small>না বাছলেও চলবে</small></legend>
            {labels.map(label => <button type="button" key={label.id} aria-pressed={plot.label === label.id} onClick={() => pickLabel(label.id)}>{label.label}</button>)}
          </fieldset>
        </figure>
      </div>

      <StickyNext show={valid && !resultVisible} title={<strong>{sizeText(plot)}</strong>} sub={pitchLine(plot)} href="#result" label="কার্ডটা দেখো" />

      <section className="jomi-result" id="result" ref={result} aria-labelledby="result-title">
        <h2 id="result-title">মাপটা কার্ডে তুলে রাখো,<br /><span>পরিবারের গ্রুপেও পাঠাও</span></h2>
        <p className="jomi-line">{plotLine(plot)}</p>
        <div className="jomi-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`${plot.label ? `${labelText(plot.label)}: ` : ""}${equation(plot)}। ${pitchLine(plot)}। ${plotLine(plot)}`} />
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="jomi-controls">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="jomir-map.png" makeImage={() => cardBlob(plot, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} disabled={!valid} hint="লিংক খুললে এই মাপটাই বসানো থাকবে।" />
            <p className="jomi-fine">এটা শুধু এককের হিসাব, জমি মাপা বা দলিলের কাজ না। কেনাবেচার আগে আমিন বা ভূমি অফিসে মিলিয়ে নিও।</p>
          </div>
        </div>
      </section>
    </div>
  );
}
