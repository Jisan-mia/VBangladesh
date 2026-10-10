"use client";

import { memo, useEffect, useRef, useState, type RefObject } from "react";
import { SaveView } from "../../../shared/art-downloads";
import { isInAppBrowser, saveBlob, svgPngBlob } from "../../../shared/art-export";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { useHistory } from "../../../shared/use-history";
import { BRUSH_DARK, BRUSH_WHITE, bn, cardText, MAX_NAME_LENGTH, occasions, parseShareHash, possessive, shareState, type AlpanaDoc, type OccasionId, type Shared } from "../lib/card";
import { cardBlob, drawCard, svgImage } from "../lib/draw-card";
import { addDrawingStroke, MAX_STROKES } from "../lib/drawing";
import { defaultSettings, densities, describePattern, layouts, motifs, palettes, presets, printLayout, symmetries, type PatternSettings } from "../lib/pattern";
import { AlpanaDrawing } from "./alpana-drawing";
import { AlpanaPattern, MotifDrawing } from "./alpana-pattern";
import { DrawingCanvas } from "./drawing-canvas";

const TOOL = "alpana";
const CARD_ART = 1000;
const sameSettings = (left: PatternSettings, right: PatternSettings) => (Object.keys(left) as Array<keyof PatternSettings>).every(key => left[key] === right[key]);
// Preset settings objects never change, so the eight thumbnails render once.
const PresetArt = memo(function PresetArt({ settings }: { settings: PatternSettings }) { return <AlpanaPattern settings={settings} />; });

function Art({ doc, svgRef }: { doc: AlpanaDoc; svgRef: RefObject<SVGSVGElement | null> }) {
  return doc.mode === "draw" ? <AlpanaDrawing settings={doc.settings} strokes={doc.strokes} svgRef={svgRef} /> : <AlpanaPattern settings={doc.settings} svgRef={svgRef} />;
}

export function AlpanaStudio() {
  const history = useHistory<AlpanaDoc>({ settings: defaultSettings, mode: "motif", strokes: [] });
  const doc = history.value;
  const { settings, mode, strokes } = doc;
  const [drawing, setDrawing] = useState(false);
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [brushColor, setBrushColor] = useState<"ink" | "detail" | "white" | "dark">("ink");
  const [mirrored, setMirrored] = useState(true);
  const [notice, setNotice] = useState("");
  const [occasion, setOccasion] = useState<OccasionId | "">("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [pngView, setPngView] = useState("");
  const [pngStatus, setPngStatus] = useState("");
  const svgRef = useRef<SVGSVGElement>(null);
  const friendSvg = useRef<SVGSVGElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const palette = palettes.find(item => item.id === settings.palette)!;
  const colors = [
    { id: "ink", label: "মূল রং", value: palette.ink },
    { id: "detail", label: "সাজের রং", value: palette.detail },
    { id: "white", label: "সাদা", value: BRUSH_WHITE },
    { id: "dark", label: "কালো", value: BRUSH_DARK },
  ] as const;
  const shared: Shared = { ...doc, occasion, name };
  const text = cardText(shared);
  const { state, sent } = shareState(shared);
  const empty = mode === "draw" && !strokes.length;

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared alpana replaces the friend's.
    const readFriend = () => { const found = parseShareHash(window.location.hash); if (found) setFriend(found); };
    readFriend();
    setSite(window.location.host);
    window.addEventListener("hashchange", readFriend);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadCardFonts(text.title + text.line), svgRef.current ? svgImage(svgRef.current, CARD_ART) : Promise.reject()]).then(([, art]) => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, art, settings, text, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [doc, occasion, name, format, site]);

  useEffect(() => {
    if (!friend) return;
    let cancelled = false;
    Promise.all([loadCardFonts(), friendSvg.current ? svgImage(friendSvg.current, CARD_ART) : Promise.reject()]).then(([, art]) => {
      if (!cancelled && friendPreview.current) drawCard(friendPreview.current, art, friend.settings, cardText(friend), "feed", site);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [friend, site]);

  function changeSetting<Key extends keyof PatternSettings>(key: Key, value: PatternSettings[Key]) {
    history.commit(current => ({ ...current, settings: { ...current.settings, [key]: value } }));
  }

  function startFromFriend() {
    if (!friend) return;
    history.commit({ settings: friend.settings, mode: friend.mode, strokes: friend.strokes });
    document.getElementById("alpana-stage")?.scrollIntoView({ behavior: "smooth" });
  }

  function clearDrawing() {
    if (!strokes.length || !window.confirm("হাতে আঁকা সব রেখা মুছে দেবে? পরে ‘এক ধাপ পেছাও’ চাপলে আবার পাবে।")) return;
    history.commit(current => ({ ...current, strokes: [] }));
    setNotice("হাতে আঁকা রেখাগুলো মুছে গেছে।");
  }

  async function downloadPng() {
    if (!svgRef.current) return;
    setPngStatus("ছবি বানানো হচ্ছে…");
    try {
      const blob = await svgPngBlob(svgRef.current);
      if (isInAppBrowser()) { setPngView(URL.createObjectURL(blob)); setPngStatus(""); }
      else { saveBlob(blob, "alpana-design.png"); setPngStatus("নকশার ছবি নেমে গেছে। গ্যালারি বা ডাউনলোড ফোল্ডারে দেখো।"); }
    } catch { setPngStatus("ছবিটা বানানো গেল না। আরেকবার চেষ্টা করো।"); }
  }

  async function printGuide() {
    await document.fonts.ready;
    window.print();
  }

  const who = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";
  const caption = occasion ? `${occasions.find(item => item.id === occasion)!.label}-এর জন্য একটা আলপনা আঁকলাম! তুমিও একটা আঁকো:` : "উঠোনের জন্য একটা আলপনা আঁকলাম। কেমন হলো? তুমিও একটা আঁকো:";
  const linkHint = mode === "draw" && sent < strokes.length
    ? `লিংকে ${bn(strokes.length)}টার মধ্যে প্রথম ${bn(sent)}টা রেখা যাবে, লিংক এর বেশি নিতে পারে না। পুরোটা দেখাতে ছবিটাও পাঠাও।`
    : mode === "draw" ? "লিংকে তোমার রেখাগুলো একটু সহজ করে যায়, তাই বন্ধুর ফোনে প্রায় একই রকম দেখাবে।" : "লিংক পেলে বন্ধু তোমার আলপনাটা দেখবে, তারপর নিজেও একটা আঁকবে।";

  return <>
    <div className="alp-screen">
      {friend && <section className="alp-friend" aria-labelledby="friend-title">
        <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${who} আঁকা আলপনা`} />
        <div>
          <p className="alp-friend-kicker">তোমার জন্য একটা আলপনা এসেছে</p>
          <h2 id="friend-title">{who} আঁকা আলপনা।<br /><span>তুমিও একটা আঁকো!</span></h2>
          <a className="kit-primary" href="#alpana-stage">আমিও আঁকি</a>
          <button type="button" className="kit-link" onClick={startFromFriend}>এই নকশা থেকেই শুরু করি</button>
        </div>
        <div hidden><Art doc={friend} svgRef={friendSvg} /></div>
      </section>}

      <div className="alp-stage" id="alpana-stage">
        <div className="alp-floor" data-floor={settings.palette}>
          {mode === "draw"
            ? <DrawingCanvas settings={settings} strokes={strokes} brush={{ color: colors.find(color => color.id === brushColor)!.value, width: strokeWidth, mirrored }} svgRef={svgRef}
                onStroke={stroke => history.commit(current => ({ ...current, strokes: addDrawingStroke(current.strokes, stroke) }))}
                onBusyChange={setDrawing} onNotice={setNotice} />
            : <AlpanaPattern settings={settings} svgRef={svgRef} />}
        </div>
        <p className="alp-caption" role="status">{notice || (mode === "draw"
          ? <>বৃত্তের ভেতরে আঙুল টানো, প্রতিটা রেখা {bn(settings.symmetry)} ভাগে ঘুরে যাবে। <span id="alpana-drawing-help">কিবোর্ডে বানাতে চাইলে ‘তৈরি ডিজাইন’ বেছে নাও। {bn(strokes.length)} / {bn(MAX_STROKES)}টা রেখা।</span></>
          : describePattern(settings))}</p>
      </div>

      <div className="alp-presets" role="group" aria-label="তৈরি ডিজাইন">
        {presets.map(preset => <button type="button" key={preset.id} disabled={drawing} aria-pressed={mode === "motif" && sameSettings(settings, preset.settings)} onClick={() => history.commit(current => ({ ...current, mode: "motif", settings: preset.settings }))}>
          <span aria-hidden="true"><PresetArt settings={preset.settings} /></span>{preset.label}
        </button>)}
      </div>

      <div className="alp-toolbar">
        <div role="group" aria-label="কীভাবে বানাবে">
          <button type="button" disabled={drawing} aria-pressed={mode === "motif"} onClick={() => history.commit(current => ({ ...current, mode: "motif" }))}>তৈরি ডিজাইন</button>
          <button type="button" disabled={drawing} aria-pressed={mode === "draw"} onClick={() => history.commit(current => ({ ...current, mode: "draw" }))}>নিজে আঁকো</button>
        </div>
        <div role="group" aria-label="আগের অবস্থায় ফেরা">
          <button type="button" onClick={history.undo} disabled={drawing || !history.canUndo}>এক ধাপ পেছাও</button>
          <button type="button" onClick={history.redo} disabled={drawing || !history.canRedo}>এক ধাপ এগোও</button>
        </div>
      </div>

      <fieldset className="alp-controls" disabled={drawing}>
        <legend className="alp-sr">{mode === "draw" ? "আঁকার কলম" : "নকশা বদলাও"}</legend>
        {mode === "draw" ? <>
          <fieldset><legend>রেখার রং</legend><div className="alp-chips">{colors.map(color => <button type="button" key={color.id} aria-pressed={brushColor === color.id} onClick={() => setBrushColor(color.id)}><i style={{ background: color.value }} aria-hidden="true" />{color.label}</button>)}</div></fieldset>
          <fieldset><legend>রেখা কতটা মোটা?</legend><div className="alp-chips">{[{ value: 2, label: "সরু" }, { value: 4, label: "মাঝারি" }, { value: 8, label: "মোটা" }].map(width => <button type="button" key={width.value} aria-pressed={strokeWidth === width.value} onClick={() => setStrokeWidth(width.value)}>{width.label}</button>)}</div></fieldset>
          <label className="alp-mirror"><input type="checkbox" checked={mirrored} onChange={event => setMirrored(event.target.checked)} /><span>আয়নার মতো উল্টো পাশেও আঁকো</span></label>
          <p className="alp-help">রং, ভাগ বা মোটা-সরু বদলালে শুধু নতুন রেখায় লাগবে।</p>
        </> : <>
          <fieldset><legend>কিসের নকশা?</legend><div className="alp-chips alp-motifs">{motifs.map(item => <button type="button" key={item.id} aria-pressed={settings.motif === item.id} onClick={() => changeSetting("motif", item.id)}><svg viewBox="-38 -69 76 76" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><MotifDrawing motif={item.id} /></svg>{item.label}</button>)}</div></fieldset>
          <fieldset><legend>গোল, না পাড়সহ?</legend><div className="alp-chips">{layouts.map(item => <button type="button" key={item.id} aria-pressed={settings.layout === item.id} onClick={() => changeSetting("layout", item.id)}>{item.label}</button>)}</div></fieldset>
          <fieldset><legend>কতটা ভরা?</legend><div className="alp-chips">{densities.map(item => <button type="button" key={item.id} aria-pressed={settings.density === item.id} onClick={() => changeSetting("density", item.id)}>{item.label}</button>)}</div></fieldset>
        </>}
        <fieldset><legend>কোথায় আঁকবে?</legend><div className="alp-chips alp-floors">{palettes.map(item => <button type="button" key={item.id} aria-pressed={settings.palette === item.id} onClick={() => changeSetting("palette", item.id)}><i style={{ background: item.background, borderColor: item.ink }} aria-hidden="true" />{item.label}</button>)}</div></fieldset>
        <fieldset><legend>কত ভাগে ঘুরবে?</legend><div className="alp-chips">{symmetries.map(count => <button type="button" key={count} aria-pressed={settings.symmetry === count} onClick={() => changeSetting("symmetry", count)}>{bn(count)} ভাগ</button>)}</div></fieldset>
        {mode === "draw" && <button type="button" className="kit-link" disabled={!strokes.length} onClick={clearDrawing}>হাতে আঁকা মুছে দাও</button>}
      </fieldset>

      <StickyNext show={history.canUndo && !empty && !resultVisible && !drawing} title={<><strong>আলপনা</strong> তৈরি</>} sub="উপলক্ষ বেছে ছবি বানাও" href="#result" label="ছবি বানাও" />

      <section className="alp-result" id="result" ref={result} aria-labelledby="result-title">
        <h2 id="result-title">উঠোনের ছবিটা বানাও</h2>
        <p className="alp-result-lead">উপলক্ষ আর নাম দিলে ছবিতে বসে যাবে। তারপর শেয়ার করো।</p>
        <div className="alp-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="alpana-card-summary" />
            <figcaption id="alpana-card-summary" className="alp-sr">{text.title}। {text.line} {text.signature}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="alp-result-controls">
            <fieldset className="alp-chips alp-occasions">
              <legend>কোন উপলক্ষে?</legend>
              {occasions.map(item => <button type="button" key={item.id} aria-pressed={occasion === item.id} onClick={() => setOccasion(current => current === item.id ? "" : item.id)}>{item.label}</button>)}
              <button type="button" aria-pressed={occasion === ""} onClick={() => setOccasion("")}>কিছু না</button>
            </fieldset>
            <label className="alp-field">
              <span>কে আঁকল? <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="alpana.png" makeImage={async () => cardBlob(await svgImage(svgRef.current!, CARD_ART), settings, text, format, site)} imageKey={`${state}|${strokes.length}|${format}`} caption={caption} state={state} disabled={empty || drawing} hint={empty ? "আগে বৃত্তের ভেতরে কয়েকটা রেখা আঁকো।" : linkHint} />
            <div className="alp-more">
              <p><strong>শুধু নকশাটা চাও?</strong> লেখা ছাড়া আলপনার ছবি নাও, নয়তো কালো রেখায় প্রিন্ট করে দেখে দেখে আঁকো।</p>
              <div>
                <button type="button" className="kit-secondary" disabled={empty || drawing} onClick={downloadPng}>নকশার PNG নামাও</button>
                <button type="button" className="kit-secondary" disabled={empty || drawing} onClick={printGuide}>আঁকার গাইড প্রিন্ট করো</button>
              </div>
              <p className="kit-status" role="status">{pngStatus}</p>
            </div>
          </div>
        </div>
      </section>
      {pngView && <SaveView src={pngView} alt="তোমার আলপনার নকশা" onClose={() => setPngView("")} />}
    </div>

    <section className="alp-print-sheet" aria-label="প্রিন্ট করার আঁকার গাইড">
      <div className="alp-print-heading"><strong>আলপনা আঁকি</strong><span>দেখে আঁকা আর ট্রেস করার গাইড</span></div>
      <h2>তোমার আলপনার রেখা</h2>
      <p className="alp-print-caption">{mode === "draw" ? "হাতে আঁকা আলপনা · " + bn(strokes.length) + "টা রেখা" : describePattern(settings)}</p>
      <div className="alp-print-art" style={{ width: printLayout.artworkMm + "mm", height: printLayout.artworkMm + "mm" }}>{mode === "draw" ? <AlpanaDrawing settings={settings} strokes={strokes} trace /> : <AlpanaPattern settings={settings} appearance="trace" />}</div>
      <div className="alp-calibration"><span style={{ width: printLayout.calibrationMm + "mm" }} /><p>এই দাগটা ঠিক ৫ সেমি হওয়ার কথা। রুলার দিয়ে মেপে দেখো।</p></div>
      <p className="alp-print-instructions">এ৪ কাগজে ১০০% স্কেলে প্রিন্ট করো। নকশাটা ১৮ × ১৮ সেমি। হেডার-ফুটার বন্ধ রেখো। এটা কেটে রং দেওয়ার স্টেনসিল না।</p>
    </section>
  </>;
}
