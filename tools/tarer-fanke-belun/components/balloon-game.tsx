"use client";
// IP: what we avoided — no bird, no green pipes, no pixel art, no tap-to-flap sounds, no medal screen or any famous flappy game's name or look; a balloon, drooping Dhaka wires, poles, crows and shop signs, all drawn fresh.

import { useCallback, useEffect, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, fitCanvas, MAX_NAME, newSeed, useBest, useGameLoop, useSlowMode } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, newCache, type SceneCache } from "../lib/draw";
import { BX, VH, VW, newRun, puff, stepRun } from "../lib/game";
import { bn, caption, cardHash, friendBanner, friendNote, humanLine, parseCard, versusLine, type Card } from "../lib/result";

const TOOL = "tarer-fanke-belun";
// A tap that was already on its way when the balloon popped must not skip the score.
const AGAIN_GUARD_MS = 400;

export function BalloonGame() {
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL);
  const [big, setBig] = useState(false);
  const run = useRef(newRun(1));
  const [, bump] = useReducer((count: number) => count + 1, 0);
  const [paused, setPaused] = useState(false);
  const [friend, setFriend] = useState<Card | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const slowUsed = useRef(false);
  const overAt = useRef(0);
  const clock = useRef(0);
  const scene = useRef<{ context: CanvasRenderingContext2D; cache: SceneCache } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cardCanvas = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const inView = useInView(stage, 0.4);

  const current = run.current;
  const { phase, score } = current;
  const done = phase === "over";
  const card: Card | null = done ? { seed: current.seed, score, name: cleanName(name), big: current.big, slow: slowUsed.current } : null;
  const state = card ? cardHash(card) : "";

  const begin = useCallback((seed: number, withBig: boolean) => {
    run.current = newRun(seed, withBig);
    slowUsed.current = false;
    setPaused(false); setNewBest(false);
    bump();
  }, []);

  useEffect(() => {
    const read = () => {
      const shared = parseCard(window.location.hash);
      if (shared) { setFriend(shared); setBig(shared.big); begin(shared.seed, shared.big); }
      return Boolean(shared);
    };
    if (!read()) begin(newSeed(), false);
    setSite(window.location.host);
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [begin]);

  const step = (dt: number) => {
    clock.current += dt;
    const live = run.current;
    if (live.phase === "playing" && slow) slowUsed.current = true;
    if (!stepRun(live, dt, slow)) return;
    if (live.phase === "over") { overAt.current = performance.now(); setNewBest(submitBest(live.score)); }
    bump();
  };
  const draw = () => { if (scene.current) drawScene(scene.current.context, scene.current.cache, run.current, slow, clock.current); };
  const drawLatest = useRef(draw);
  drawLatest.current = draw;
  const running = !paused && !done;
  useGameLoop(step, draw, running);
  useEffect(() => { if (!running) draw(); });

  useEffect(() => {
    const box = stage.current, element = canvas.current;
    if (!box || !element) return;
    const fit = () => {
      const width = box.clientWidth;
      if (!width) return; // hidden or detached: keep the last good size
      const context = fitCanvas(element, width, Math.round(width * VH / VW));
      scene.current = { context, cache: newCache(element.width / VW) };
      drawLatest.current();
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    // The shop signs are Bangla text baked into the background; repaint them once the font is in.
    document.fonts?.ready.then(fit);
    return () => observer.disconnect();
  }, []);

  // Hidden tab or a stage scrolled out of sight: stop, and wait for "চালিয়ে যাও".
  useEffect(() => {
    const hidden = () => { if (document.hidden && run.current.phase === "playing") setPaused(true); };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);
  useEffect(() => { if (!inView && run.current.phase === "playing") setPaused(true); }, [inView]);

  function press() {
    const live = run.current;
    if (paused) { live.vy = Math.min(live.vy, 0); setPaused(false); return; }
    const started = live.phase === "ready";
    if (!puff(live)) return;
    if (!slow) navigator.vibrate?.(8);
    if (started) bump();
  }

  function again() {
    if (performance.now() - overAt.current < AGAIN_GUARD_MS) return;
    begin(friend ? friend.seed : newSeed(), big);
  }

  function toggleBig() {
    const next = !big;
    setBig(next);
    // Before the first puff the change applies at once; mid-run it waits for the next round, so a score never mixes both.
    if (run.current.phase === "ready") begin(run.current.seed, next);
  }

  const pointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button > 0 || (event.target as HTMLElement).closest("button, a")) return;
    if (run.current.phase === "over" || run.current.phase === "pop") return;
    event.preventDefault();
    press();
  };

  // Space, Enter or the up arrow puffs, while the game is on screen and nothing else has focus.
  useEffect(() => {
    const busy = (target: EventTarget | null) => (target as HTMLElement | null)?.closest?.("input, textarea, select, a, button, [contenteditable]");
    const down = (event: KeyboardEvent) => {
      if (![" ", "Enter", "ArrowUp"].includes(event.key) || event.ctrlKey || event.metaKey || event.altKey || busy(event.target) || !inView) return;
      event.preventDefault();
      if (event.repeat) return;
      if (run.current.phase === "over") again();
      else if (run.current.phase !== "pop") press();
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  useEffect(() => {
    if (!card && !friend) return;
    let cancelled = false;
    loadCardFonts("তারের ফাঁকে বেলুন ৩৭টা").then(() => {
      if (cancelled) return;
      if (card && cardCanvas.current) drawCard(cardCanvas.current, card, format, site);
      if (friend && friendCanvas.current) drawCard(friendCanvas.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  const said = paused ? "খেলা থেমে আছে। চালিয়ে যাও চাপো।"
    : done ? `ফটাস! ${bn(score)}টা ফাঁক পার করেছ।`
    : phase === "ready" ? "চাপ দিলে বেলুন একটু ওঠে। তারে লাগলেই ফটাস।" : "";

  return (
    <div className="tb" data-slow={slow}>
      {friend && (
        <section className="tb-friend" aria-labelledby="tb-friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${bn(friend.score)}টা ফাঁক`} />
          <div>
            <h2 id="tb-friend-title">{friendBanner(friend)}</h2>
            <p>{friendNote(friend)}</p>
          </div>
        </section>
      )}

      <div className="tb-stage" ref={stage} data-phase={phase} onPointerDown={pointerDown} onContextMenu={event => event.preventDefault()}>
        <canvas ref={canvas} width={VW * 2} height={VH * 2} aria-hidden="true" />
        {(phase === "playing" || phase === "pop") && <p className="tb-score" key={score} aria-hidden="true">{bn(score)}</p>}
        {phase === "ready" && !paused && <p className="tb-tip">চাপ দাও, বেলুন উঠবে<small>দুই তারের ফাঁক দিয়ে নিয়ে যাও</small></p>}
        {phase === "pop" && <p className="tb-pop" style={{ left: `${(BX / VW) * 100}%`, top: `${(current.y / VH) * 100}%` }} aria-hidden="true">ফটাস!</p>}
        {paused && (
          <div className="tb-cover">
            <p>থেমে আছে। বেলুন যেখানে ছিল, সেখানেই আছে।</p>
            <button type="button" className="tb-big" onClick={() => press()}>চালিয়ে যাও</button>
          </div>
        )}
        {done && !paused && (
          <div className="tb-cover tb-over">
            <p className="tb-kicker">{current.popped === "street" ? "রাস্তায় পড়ে ফটাস!" : "তারে লেগে ফটাস!"}</p>
            <strong>{bn(score)}<small>টা ফাঁক</small></strong>
            <p>{newBest && score > 0 ? "এই ফোনে নতুন রেকর্ড!" : best !== null ? `এই ফোনে সেরা ${bn(best)}টা` : ""}</p>
            {friend && <p className="tb-vs">{versusLine(score, friend.score, friend.name)}</p>}
            <button type="button" className="tb-big" onClick={again}>আরেকবার</button>
            {friend && <button type="button" className="kit-link" onClick={() => { setFriend(null); history.replaceState(null, "", location.pathname); begin(newSeed(), big); }}>নতুন তারের জটে খেলো</button>}
          </div>
        )}
      </div>
      <p className="tb-sr" aria-live="polite">{said}</p>

      <div className="tb-controls">
        <button type="button" className="tb-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}><i aria-hidden="true" />ধীরে খেলো</button>
        <button type="button" className="tb-toggle" aria-pressed={big} onClick={toggleBig}><i aria-hidden="true" />বড় ফাঁক</button>
        <p className="tb-hint">{phase === "playing" && big !== current.big ? `পরের বার থেকে ${big ? "বড় ফাঁক" : "সাধারণ ফাঁক"}` : <>যেখানে খুশি চাপো<span> · কিবোর্ডে Space</span></>}</p>
      </div>

      {card && (
        <section className="tb-result" id="result" aria-labelledby="tb-result-title">
          <h2 id="tb-result-title">{friend ? versusLine(score, friend.score, friend.name) : humanLine(score)}</h2>
          <figure className="kit-card" data-format={format}>
            <canvas ref={cardCanvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="tb-card-summary" />
            <figcaption id="tb-card-summary" className="tb-sr">{card.name && `${card.name}, `}তারের ফাঁকে বেলুন, {bn(score)}টা ফাঁক। {humanLine(score)}</figcaption>
            {cardError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="tb-share">
            <label className="tb-name">
              <span>নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="tarer-fanke-belun.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই তারের জটই পাবে।" />
          </div>
        </section>
      )}
    </div>
  );
}
