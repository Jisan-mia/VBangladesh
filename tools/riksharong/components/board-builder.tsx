"use client";

import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { boardLine, colorOf, defaultBoard, lineIdeas, motifs, paint, palettes, parseShareHash, plateNumber, possessive, regions, shareHash, swatches, MAX_AREA, MAX_LINE, MAX_NAME, type Board, type RegionId } from "../lib/board";
import { BOARD, cardBlob, colorFor, drawBoard, drawCard, motifThumb, regionAt } from "../lib/draw-board";

const TOOL = "riksharong";
const sameColors = (left: readonly number[], right: readonly number[]) => left.every((value, index) => value === right[index]);

export function BoardBuilder() {
  const [draft, setDraft] = useState<Board>(defaultBoard);
  const [region, setRegion] = useState<RegionId>("motif");
  const [touched, setTouched] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Board | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const boardCanvas = useRef<HTMLCanvasElement>(null);
  const cardCanvas = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  // Inputs keep what's typed (spaces included); everything drawn or shared goes through the same cleaning as a link.
  const state = shareHash(draft).slice(1);
  const board = useMemo(() => parseShareHash(state) ?? defaultBoard, [state]);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared board replaces the friend's.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(board.line || "রিকশার রং").then(() => {
      if (cancelled) return;
      const canvas = boardCanvas.current, context = canvas?.getContext("2d");
      if (canvas && context) { context.clearRect(0, 0, canvas.width, canvas.height); drawBoard(context, board, 0, 0, canvas.width); }
      if (cardCanvas.current) drawCard(cardCanvas.current, board, format, site);
      if (friend && friendCanvas.current) drawCard(friendCanvas.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [board, format, site, friend]);

  function update(change: (current: Board) => Board) {
    setDraft(change);
    setTouched(true);
  }

  function tapBoard(event: MouseEvent<HTMLCanvasElement>) {
    const canvas = event.currentTarget, box = canvas.getBoundingClientRect(), context = canvas.getContext("2d");
    if (!context) return;
    const hit = regionAt(context, board.motif, ((event.clientX - box.left) / box.width) * BOARD.width, ((event.clientY - box.top) / box.height) * BOARD.height);
    if (!hit) return;
    // Every tap on a part moves it to the next enamel colour, like trying paints on a tin board.
    setRegion(hit);
    update(current => paint(current, hit, (current.colors[regions.findIndex(item => item.id === hit)] + 1) % swatches.length));
  }

  const regionIndex = regions.findIndex(item => item.id === region);
  const who = (shared: Board) => shared.name ? possessive(shared.name) : "এক বন্ধুর";
  const caption = board.line ? `রিকশার পেছনের বোর্ডটা নিজে রাঙালাম, পটিতে লিখলাম “${board.line}”। তোমার রিকশার বোর্ডে কী লিখতে?` : "রিকশার পেছনের বোর্ডটা নিজে রাঙালাম! তোমার রিকশার বোর্ডে কী লিখতে?";

  return (
    <div className="rr">
      {friend && (
        <section className="rr-friend" aria-labelledby="friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${who(friend)} রিকশার বোর্ড${friend.line ? `, পটিতে লেখা ${friend.line}` : ""}`} />
          <div>
            <p className="rr-kicker">{who(friend)} রিকশার বোর্ড এসেছে</p>
            <h2 id="friend-title">{friend.line ? <>পটিতে লেখা “{friend.line}”</> : "বোর্ডটা দেখো!"}<br /><span>তোমার রিকশার বোর্ডে কী লিখতে?</span></h2>
            <a className="kit-primary" href="#board">আমারটা রাঙাই</a>
          </div>
        </section>
      )}

      <div className="rr-studio">
        <div className="rr-stage" id="board">
          <canvas ref={boardCanvas} className="rr-board" width={BOARD.width * 2} height={BOARD.height * 2} onClick={tapBoard} role="img" aria-label={`তোমার রিকশার বোর্ড: মাঝে ${motifs.find(motif => motif.id === board.motif)?.label}${board.line ? `, পটিতে লেখা ${board.line}` : ""}`} />
          <p className="rr-tip">বোর্ডের যেকোনো জায়গা ছুঁয়ে দাও, রং বদলাবে</p>
        </div>

        <div className="rr-controls">
          <fieldset className="rr-motifs">
            <legend>মাঝে কী আঁকা থাকবে?</legend>
            {motifs.map(motif => (
              <button type="button" key={motif.id} aria-pressed={board.motif === motif.id} onClick={() => update(current => ({ ...current, motif: motif.id }))}>
                <svg viewBox="100 60 400 260" aria-hidden="true" style={{ background: colorOf(board, "sky") }}>
                  {motifThumb(motif.id).map((shape, index) => <path key={index} d={shape.d} fill={shape.fill ? colorFor(board, shape.fill) : "none"} stroke={shape.stroke ? colorFor(board, shape.stroke) : undefined} strokeWidth={shape.width ?? 3} strokeLinejoin="round" strokeLinecap="round" />)}
                </svg>
                <span>{motif.label}</span>
              </button>
            ))}
          </fieldset>

          <div className="rr-field">
            <label htmlFor="rr-line">পটিতে কী লেখা থাকবে?</label>
            <input id="rr-line" value={draft.line} maxLength={MAX_LINE * 3} onChange={event => update(current => ({ ...current, line: event.target.value }))} placeholder="নিজের একটা কথা লেখো" />
            <div className="rr-ideas" role="group" aria-label="লেখার আইডিয়া">
              {lineIdeas.map(idea => <button type="button" key={idea} aria-pressed={board.line === idea} onClick={() => update(current => ({ ...current, line: idea }))}>{idea}</button>)}
            </div>
          </div>

          <fieldset className="rr-palettes">
            <legend>রঙের সেট</legend>
            {palettes.map(palette => (
              <button type="button" key={palette.label} aria-pressed={sameColors(board.colors, palette.colors)} onClick={() => update(current => ({ ...current, colors: [...palette.colors] }))}>
                <span className="rr-stripes" aria-hidden="true">{palette.colors.map((swatch, index) => <i key={index} style={{ background: swatches[swatch].hex }} />)}</span>
                {palette.label}
              </button>
            ))}
          </fieldset>

          <details className="rr-paint">
            <summary>একটা অংশের রং নিজে বাছো</summary>
            <fieldset className="kit-chips">
              <legend>কোন অংশ?</legend>
              {regions.map(item => <button type="button" key={item.id} aria-pressed={region === item.id} onClick={() => setRegion(item.id)}>{item.label}</button>)}
            </fieldset>
            <fieldset className="rr-swatches">
              <legend>{regions[regionIndex].label}: কোন রং?</legend>
              {swatches.map((swatch, index) => <button type="button" key={swatch.hex} style={{ background: swatch.hex }} aria-label={swatch.label} aria-pressed={board.colors[regionIndex] === index} onClick={() => update(current => paint(current, region, index))} />)}
            </fieldset>
          </details>
        </div>
      </div>

      <StickyNext show={touched && !resultVisible} title={<strong>বোর্ড তৈরি!</strong>} sub="এবার রিকশায় লাগিয়ে দেখো" href="#result" label="রিকশায় লাগাও" />

      <section className="rr-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="rr-result-head">
          <h2 id="result-title">তোমার বোর্ড উঠে গেছে <em>রিকশায়</em></h2>
          <p>{boardLine(board)}</p>
        </div>
        <div className="rr-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={cardCanvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="rr-card-summary" />
            <figcaption id="rr-card-summary" className="rr-sr">ঢাকার রাস্তায় চলবে আমার বোর্ড। রিকশা নং {plateNumber(board)}।{board.line ? ` পটিতে লেখা: ${board.line}।` : ""}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="rr-result-controls">
            <div className="rr-plate-fields">
              <label className="rr-field">
                <span>নাম <small>প্লেটে বসবে, না দিলেও চলবে</small></span>
                <input value={draft.name} maxLength={MAX_NAME * 3} onChange={event => setDraft(current => ({ ...current, name: event.target.value }))} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <label className="rr-field">
                <span>এলাকা <small>চাইলে</small></span>
                <input value={draft.area} maxLength={MAX_AREA * 3} onChange={event => setDraft(current => ({ ...current, area: event.target.value }))} placeholder="যেমন: মিরপুর" />
              </label>
            </div>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="rikshar-board.png" makeImage={() => cardBlob(board, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint="লিংক পেলে বন্ধু তোমার রিকশাটা দেখবে, তারপর নিজের বোর্ড রাঙাবে।" />
          </div>
        </div>
      </section>
    </div>
  );
}
