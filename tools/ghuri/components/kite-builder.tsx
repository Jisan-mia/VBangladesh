"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, drawKite, drawLantern } from "../lib/draw-card";
import { banglaYear, bn, caption, cleanText, colors, headline, humanLine, parseShareHash, patternOf, patterns, stateOf, wishes, DEFAULT, MAX_TEXT, type Ghuri, type Mode } from "../lib/ghuri";

const TOOL = "ghuri";
// Percentages from a handful of people are noise ("১০০% মানুষের প্রিয় টেক্কা" after one vote).
const COMPARE_MIN = 20;
const STAGE = 400;

function drawStage(canvas: HTMLCanvasElement, ghuri: Ghuri) {
  const context = canvas.getContext("2d");
  if (!context) return;
  context.clearRect(0, 0, STAGE, STAGE);
  if (ghuri.mode === "fanush") { drawLantern(context, ghuri, 292, 190, 112); return; }
  // The canvas swings from its bottom-left corner, where the string meets the নাটাই.
  context.strokeStyle = "rgba(255,248,230,.9)"; context.lineWidth = 2;
  context.beginPath(); context.moveTo(266, 166); context.quadraticCurveTo(170, 340, 0, STAGE); context.stroke();
  drawKite(context, ghuri, 262, 140, 116);
}

const summary = (ghuri: Ghuri) => `‘${headline(ghuri)}’। ${humanLine(ghuri)}`;

export function KiteBuilder() {
  const [ghuri, setGhuri] = useState<Ghuri>(DEFAULT);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Ghuri | null>(null);
  const [site, setSite] = useState("");
  const [year, setYear] = useState(0);
  const [flights, setFlights] = useState(0);
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const stage = useRef<HTMLCanvasElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const clean = useMemo(() => ({ ...ghuri, text: cleanText(ghuri.text) }), [ghuri]);
  const state = stateOf(clean);
  const kite = clean.mode === "kite";

  useEffect(() => {
    setYear(banglaYear(new Date()));
    // In-page anchors (#result, #make) also change the hash, so only a real shared kite counts.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(headline(clean)).then(() => {
      if (cancelled) return;
      if (stage.current) drawStage(stage.current, clean);
      if (preview.current) drawCard(preview.current, clean, format, site, friend);
      if (friend && friendCanvas.current) drawCard(friendCanvas.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [clean, format, site, friend, flights]);

  const set = (change: Partial<Ghuri>) => setGhuri(current => ({ ...current, ...change }));

  function fly() {
    setFlights(count => count + 1);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => document.getElementById("result")?.scrollIntoView({ behavior: still ? "auto" : "smooth" }), still ? 0 : 1100);
  }

  async function countMine() {
    setCounted("sending");
    const tally = await addToTally(TOOL, [clean.pattern]);
    if (tally) { setEveryone(tally); setCounted("done"); }
    else setCounted("failed");
  }

  const ranked = everyone ? patterns.map(pattern => ({ pattern, percent: Math.round(((everyone.counts[pattern.id] ?? 0) / Math.max(everyone.total, 1)) * 100) })).sort((a, b) => b.percent - a.percent) : [];

  return (
    <div className="gh">
      {friend && (
        <section className="gh-friend" aria-labelledby="gh-friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={summary(friend)} />
          <div>
            <p className="gh-friend-kicker">বন্ধু তার {friend.mode === "kite" ? "ঘুড়ি" : "ফানুস"} পাঠিয়েছে</p>
            <h2 id="gh-friend-title">{friend.mode === "kite" ? `‘${headline(friend)}’ উড়ছে।` : `ফানুসে লেখা: ‘${headline(friend)}’।`}<br /><span>তোমারটা পাশে ওড়াও।</span></h2>
            <a className="kit-primary" href="#make">আমারটা বানাই</a>
          </div>
        </section>
      )}

      <div className="gh-make" id="make">
        <div className="gh-stage" data-mode={clean.mode}>
          <p className="gh-stage-title"><small>সাকরাইন {year ? bn(year) : ""} · পুরান ঢাকার ছাদ</small><b>‘{headline(clean)}’</b></p>
          <div className="gh-flyer" key={flights} data-launch={flights > 0}>
            <canvas ref={stage} width={STAGE} height={STAGE} role="img" aria-label={summary(clean)} />
          </div>
          <svg className="gh-roofs" viewBox="0 0 390 70" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 70V30h40V18h6v12h34V8h52v22h18V22h10v-8h22v8h8v8h50V12h44v18h20V4h4v26h28V20h54v50z" />
            <rect x="54" y="38" width="7" height="9" /><rect x="100" y="20" width="7" height="9" /><rect x="236" y="24" width="7" height="9" /><rect x="350" y="32" width="7" height="9" />
          </svg>
          <span className="gh-spool" aria-hidden="true" />
        </div>

        <div className="gh-panel">
          <fieldset className="gh-mode">
            <legend className="gh-sr">কী ওড়াবে?</legend>
            {(["kite", "fanush"] as Mode[]).map(mode => <button type="button" key={mode} aria-pressed={clean.mode === mode} onClick={() => set({ mode })}>{mode === "kite" ? "ঘুড়ি" : "ফানুস"}</button>)}
          </fieldset>

          {kite ? (
            <fieldset className="gh-chips">
              <legend>নকশা</legend>
              {patterns.map(pattern => <button type="button" key={pattern.id} aria-pressed={clean.pattern === pattern.id} onClick={() => set({ pattern: pattern.id })}>{pattern.label}</button>)}
            </fieldset>
          ) : (
            <fieldset className="gh-chips">
              <legend>ফানুসে কোন চাওয়া?</legend>
              {wishes.map(wish => <button type="button" key={wish.id} aria-pressed={clean.wish === wish.id} onClick={() => set({ wish: wish.id })}>{wish.label}</button>)}
            </fieldset>
          )}

          <fieldset className="gh-colors">
            <legend>রং</legend>
            {colors.map(color => <button type="button" key={color.id} aria-pressed={clean.color === color.id} onClick={() => set({ color: color.id })} style={{ "--paper": color.paper, "--trim": color.trim } as CSSProperties}><i aria-hidden="true" />{color.label}</button>)}
          </fieldset>

          <label className="gh-text">
            <span>{kite ? "ঘুড়িতে" : "ফানুসে"} কী লিখবে? <small>তোমার নাম বা ছোট্ট একটা কথা</small></span>
            <input value={ghuri.text} maxLength={MAX_TEXT} onChange={event => set({ text: event.target.value })} placeholder={kite ? "যেমন: রাফি, উড়ে যা" : "যেমন: রাফি, আম্মুর জন্য"} autoComplete="off" />
          </label>

          <button type="button" className="kit-primary gh-fly" onClick={fly}>ওড়াও!</button>
          {!kite && <p className="gh-note">এই ফানুস শুধু ছবিতে ভাসে, আগুন লাগে না।</p>}
        </div>
      </div>

      <StickyNext show={!resultVisible} title={<><strong>‘{headline(clean)}’</strong> তৈরি</>} sub={kite ? `${patternOf(clean.pattern)!.label} ঘুড়ি` : humanLine(clean)} href="#result" label="ওড়াও" />

      <section className="gh-result" id="result" ref={result} aria-labelledby="gh-result-title">
        <h2 id="gh-result-title">{kite ? `‘${headline(clean)}’ উড়ছে!` : "তোমার ফানুস ভাসছে!"}</h2>
        <p className="gh-line">{kite ? humanLine(clean) : `ফানুসে লেখা: “${headline(clean)}”`}</p>
        <div className="gh-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="gh-summary" />
            <figcaption id="gh-summary" className="gh-sr">{summary(clean)}{friend ? ` পাশে বন্ধুর ‘${headline(friend)}’।` : ""}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="gh-controls">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="sakrain-ghuri.png" makeImage={() => cardBlob(clean, format, site, friend)} imageKey={`${state}|${format}|${friend ? stateOf(friend) : ""}`} caption={caption(clean)} state={state} hint="বন্ধু নিজেরটা বানালে তার কার্ডে তোমার ঘুড়িও পাশে উড়বে।" />
          </div>
        </div>

        {kite && (
          <div className="gh-everyone">
            <h3>সাকরাইনে কোন ঘুড়ি সবার প্রিয়?</h3>
            {counted !== "done" || !everyone ? <>
              <p>তোমার ‘{patternOf(clean.pattern)!.label}’ গোনায় যোগ করো। শুধু নকশার নামটা গোনা হয়, তোমার লেখা যায় না।</p>
              <button type="button" className="kit-secondary" onClick={countMine} disabled={counted === "sending"}>{counted === "sending" ? "গোনা হচ্ছে…" : "আমার ঘুড়িটাও গোনো"}</button>
              {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : everyone.total < COMPARE_MIN ? (
              <p className="kit-status">গোনা হয়েছে। এখনো মাত্র {bn(everyone.total)} জন যোগ দিয়েছে, তাই হিসাব দেখানো যাচ্ছে না। বন্ধুদের লিংক পাঠাও।</p>
            ) : (
              <ul className="gh-bars">{ranked.map(({ pattern, percent }) => <li key={pattern.id} data-mine={pattern.id === clean.pattern}><span>{pattern.label}</span><i style={{ width: `${percent}%` }} /><b>{bn(percent)}%</b></li>)}</ul>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
