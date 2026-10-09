"use client";

import { useRef, useState } from "react";
import { ArtworkDownloads } from "../../../shared/art-downloads";
import { useHistory } from "../../../shared/use-history";
import { addDrawingStroke, MAX_STROKES, type DrawingStroke } from "../lib/drawing";
import { AlpanaDrawing } from "./alpana-drawing";
import { DrawingCanvas } from "./drawing-canvas";
import { defaultSettings, densities, describePattern, layouts, motifs, palettes, printLayout, symmetries, type PatternSettings } from "../lib/pattern";
import { AlpanaPattern, MotifDrawing } from "./alpana-pattern";

const number = new Intl.NumberFormat("bn-BD");
type AlpanaDocument = { settings: PatternSettings; mode: "motif" | "draw"; strokes: DrawingStroke[] };

export function AlpanaStudio() {
  const history = useHistory<AlpanaDocument>({ settings: defaultSettings, mode: "motif", strokes: [] });
  const { settings, mode, strokes } = history.value;
  const [drawing, setDrawing] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [brushColor, setBrushColor] = useState<"ink" | "detail" | "white" | "dark">("ink");
  const [mirrored, setMirrored] = useState(true);
  const palette = palettes.find(item => item.id === settings.palette)!;
  const colors = [
    { id: "ink", label: "মূল রং", value: palette.ink },
    { id: "detail", label: "সাজের রং", value: palette.detail },
    { id: "white", label: "সাদা", value: "#fff5d8" },
    { id: "dark", label: "কালো", value: "#252525" },
  ] as const;
  const selectedColor = colors.find(color => color.id === brushColor)!.value;
  const [printStatus, setPrintStatus] = useState("");
  const [printing, setPrinting] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  function changeSetting<Key extends keyof PatternSettings>(key: Key, value: PatternSettings[Key]) {
    history.commit(current => ({ ...current, settings: { ...current.settings, [key]: value } }));
    setPrintStatus("");
  }

  function clearDrawing() {
    if (!strokes.length || !window.confirm("হাতে আঁকা সব রেখা মুছবেন? চাইলে পরে ‘আগের ধাপ’ দিয়ে ফিরিয়ে আনতে পারবেন।")) return;
    history.commit(current => ({ ...current, strokes: [] }));
    setPrintStatus("হাতে আঁকা রেখা মুছে ফেলা হয়েছে।");
  }

  function reset() {
    if (strokes.length && !window.confirm("আঁকা মুছে শুরুর নকশায় ফিরবেন? চাইলে ‘আগের ধাপ’ দিয়ে ফিরিয়ে আনতে পারবেন।")) return;
    history.commit({ settings: defaultSettings, mode: "motif", strokes: [] });
    setPrintStatus("শুরুর নকশায় ফিরে এসেছে।");
  }

  async function printGuide() {
    setPrinting(true);
    setPrintStatus("আঁকার গাইড তৈরি হচ্ছে…");
    try {
      await document.fonts.ready;
      window.print();
      setPrintStatus("প্রিন্টের উইন্ডোতে এ৪ ও ১০০% স্কেল বেছে নিন। চাইলে পিডিএফ হিসেবে রাখুন।");
    } catch {
      setPrintStatus("প্রিন্টের উইন্ডো খোলা যায়নি। ব্রাউজারের মেনু থেকে প্রিন্ট করুন।");
    } finally {
      setPrinting(false);
    }
  }

  return <>
    <div className="alpana-workbench alpana-screen">
      <div className="alpana-stage" id="pattern-preview">
        <div className="alpana-stage-heading"><span>আপনার আলপনা</span><span>{mode === "draw" ? "টানুন, রেখা চারদিকে ফুটে উঠবে" : "পছন্দ বদলালেই নতুন নকশা"}</span></div>
        <div className="alpana-workspace-toolbar">
          <div className="alpana-mode-switch" role="group" aria-label="আলপনা বানানোর ধরন">
            <button type="button" disabled={drawing} aria-pressed={mode === "motif"} onClick={() => history.commit(current => ({ ...current, mode: "motif" }))}>সাজানো নকশা</button>
            <button type="button" disabled={drawing} aria-pressed={mode === "draw"} onClick={() => history.commit(current => ({ ...current, mode: "draw" }))}>নিজে আঁকুন</button>
          </div>
          <div className="alpana-history" role="group" aria-label="পরিবর্তন ফিরিয়ে আনুন">
            <button type="button" onClick={history.undo} disabled={drawing || !history.canUndo}>আগের ধাপ</button>
            <button type="button" onClick={history.redo} disabled={drawing || !history.canRedo}>পরের ধাপ</button>
          </div>
        </div>
        <div className="alpana-stage-art">{mode === "draw"
          ? <DrawingCanvas settings={settings} strokes={strokes} brush={{ color: selectedColor, width: strokeWidth, mirrored }} svgRef={svgRef}
              onStroke={stroke => history.commit(current => ({ ...current, strokes: addDrawingStroke(current.strokes, stroke) }))}
              onBusyChange={setDrawing} onNotice={setPrintStatus} />
          : <AlpanaPattern settings={settings} svgRef={svgRef} />}</div>
        {mode === "draw" ? <p className="alpana-description" id="alpana-drawing-help">বৃত্তের ভেতরে আঙুল, মাউস বা কলম টানুন। প্রতিটি রেখা {number.format(settings.symmetry)} ভাগে ঘুরবে। কিবোর্ডে নকশা বানাতে ‘সাজানো নকশা’ বেছে নিন। <span role="status">{number.format(strokes.length)} / {number.format(MAX_STROKES)}টি রেখা।</span></p> : <p className="alpana-description" role="status">{describePattern(settings)}</p>}
      </div>
      <form className="alpana-controls" onSubmit={event => event.preventDefault()}>
        <fieldset className="alpana-all-controls" disabled={drawing}>
        <div className="alpana-controls-heading"><span className="eyebrow">নিজের মতো সাজান</span><h3>{mode === "draw" ? "আঁকার কলম" : "কোন নকশা পছন্দ?"}</h3></div>
        {mode === "draw" && <div className="alpana-brush-controls">
          <fieldset><legend>রেখার রং</legend><div className="alpana-brush-colors">{colors.map(color => <button type="button" key={color.id} aria-pressed={brushColor === color.id} onClick={() => setBrushColor(color.id)}><i style={{ background: color.value }} aria-hidden="true" />{color.label}</button>)}</div></fieldset>
          <fieldset><legend>রেখা কতটা মোটা হবে?</legend><div className="alpana-brush-widths">{[{ value: 2, label: "সরু" }, { value: 4, label: "মাঝারি" }, { value: 8, label: "মোটা" }].map(width => <button type="button" key={width.value} aria-pressed={strokeWidth === width.value} onClick={() => setStrokeWidth(width.value)}>{width.label}</button>)}</div></fieldset>
          <label className="alpana-mirror"><input type="checkbox" checked={mirrored} onChange={event => setMirrored(event.target.checked)} /><span>প্রতি ভাগে উল্টো পাশেও একই রেখা</span></label>
          <p className="alpana-help">রং, ভাগ ও মোটা–সরু বদলালে নতুন রেখায় কাজ করবে। আগের রেখা একই থাকবে।</p>
          <button type="button" className="alpana-reset" disabled={!strokes.length} onClick={clearDrawing}>হাতে আঁকা মুছুন</button>
        </div>}
        {mode === "motif" && <fieldset><legend>মোটিফ</legend><div className="alpana-motif-options">
          {motifs.map(item => <label key={item.id} className={settings.motif === item.id ? "selected" : ""}>
            <input type="radio" name="motif" value={item.id} checked={settings.motif === item.id} onChange={() => changeSetting("motif", item.id)} />
            <svg viewBox="-38 -69 76 76" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><MotifDrawing motif={item.id} /></svg><span>{item.label}</span>
          </label>)}
        </div></fieldset>}
        {mode === "motif" && <fieldset><legend>বিন্যাস</legend><div className="alpana-segments">
          {layouts.map(item => <label key={item.id} className={settings.layout === item.id ? "selected" : ""}><input type="radio" name="layout" value={item.id} checked={settings.layout === item.id} onChange={() => changeSetting("layout", item.id)} /><span>{item.label}</span></label>)}
        </div></fieldset>}
        <fieldset><legend>রঙের জুটি</legend><div className="alpana-palettes">
          {palettes.map(item => <label key={item.id} className={settings.palette === item.id ? "selected" : ""}>
            <input type="radio" name="palette" value={item.id} checked={settings.palette === item.id} onChange={() => changeSetting("palette", item.id)} />
            <span className="alpana-swatch" style={{ background: item.background, color: item.ink }} aria-hidden="true"><svg viewBox="0 0 36 36" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 6q11 6 0 12Q7 12 18 6Zm0 24q11-6 0-12Q7 24 18 30ZM6 18q6-11 12 0Q12 29 6 18Zm24 0q-6-11-12 0Q24 29 30 18Z" /></svg></span><span>{item.label}</span>
          </label>)}
        </div></fieldset>
        <fieldset><legend>মাঝের নকশা কত ভাগে ঘুরবে?</legend><div className="alpana-segments">
          {symmetries.map(count => <label key={count} className={settings.symmetry === count ? "selected" : ""}><input type="radio" name="symmetry" value={count} checked={settings.symmetry === count} onChange={() => changeSetting("symmetry", count)} /><span>{number.format(count)} ভাগ</span></label>)}
        </div></fieldset>
        {mode === "motif" && <fieldset><legend>কতটা ভরা হবে?</legend><div className="alpana-segments">
          {densities.map(item => <label key={item.id} className={settings.density === item.id ? "selected" : ""}><input type="radio" name="density" value={item.id} checked={settings.density === item.id} onChange={() => changeSetting("density", item.id)} /><span>{item.label}</span></label>)}
        </div></fieldset>}
        <button type="button" className="alpana-reset" onClick={reset}>শুরুর নকশায় ফিরুন</button>
        <p className="alpana-help">আঁকা ও পছন্দ সাইটে জমা থাকে না। নকশা রেখে দিতে ছবি ডাউনলোড করুন। সর্বশেষ ৫০টি ধাপ ফেরানো যায়।</p>
        </fieldset>
      </form>
      <div className="alpana-save">
        <fieldset className="alpana-download-controls" disabled={drawing}>
        <ArtworkDownloads svgRef={svgRef} filename="আমার-আলপনা.png" />
        <div className="alpana-print-action"><div><strong>কাগজ দেখে আঁকতে চান?</strong><p>এক পাতার কালো রেখার গাইড। কেটে রং দেওয়ার স্টেনসিল নয়।</p></div><button className="button-secondary" type="button" disabled={printing} onClick={printGuide}>{printing ? "প্রস্তুতি চলছে…" : "আঁকার গাইড প্রিন্ট করুন"}</button></div>
        </fieldset>
        <p className="alpana-status" role="status">{printStatus}</p>
      </div>
    </div>
    <section className="alpana-print-sheet" aria-label="প্রিন্ট করার আঁকার গাইড">
      <div className="alpana-print-heading"><strong>আলপনা আঁকি</strong><span>দেখে আঁকা ও ট্রেস করার গাইড</span></div>
      <h2>আপনার আলপনার রেখা</h2>
      <p className="alpana-print-caption">{mode === "draw" ? "হাতে আঁকা আলপনা · " + number.format(strokes.length) + "টি রেখা" : describePattern(settings)}</p>
      <div className="alpana-print-art" style={{ width: printLayout.artworkMm + "mm", height: printLayout.artworkMm + "mm" }}>{mode === "draw" ? <AlpanaDrawing settings={settings} strokes={strokes} trace /> : <AlpanaPattern settings={settings} appearance="trace" />}</div>
      <div className="alpana-calibration"><span style={{ width: printLayout.calibrationMm + "mm" }} /><p>এই রেখার দৈর্ঘ্য ৫ সেমি। রুলার দিয়ে মাপ মিলিয়ে নিন।</p></div>
      <p className="alpana-print-instructions">এ৪ কাগজে ১০০% স্কেলে প্রিন্ট করুন। নকশার ক্ষেত্র ১৮ × ১৮ সেমি। হেডার ও ফুটার বন্ধ রাখুন। এটি কেটে রং দেওয়ার স্টেনসিল নয়।</p>
    </section>
  </>;
}
