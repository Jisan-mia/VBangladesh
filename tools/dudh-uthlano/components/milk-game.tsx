"use client";
// IP: what we avoided — no famous cooking or timing game's name, chef characters, kitchen-timer look, logo or music; the pots, stoves, foam and আম্মু's lines are our own.

import { useCallback, useEffect, useReducer, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, fitCanvas, newSeed, useBest, useGameLoop, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, newCache, VH, VW, type SceneCache } from "../lib/draw";
import {
  ammuLine, bn, caption, friendBanner, humanLine, liftPot, newRound, ordinal, parseShare, potWord, shareHash, startPot, stepRound, stoveName, totalOf, vesselName, versusLine,
  HOLD_MS, POTS, type Shared,
} from "../lib/dudh";

const TOOL = "dudh-uthlano";
// The round's last pot can end while a finger is still down; its release must not restart before the score is seen.
const AGAIN_GUARD_MS = 600;

export function MilkGame() {
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL);
  const round = useRef(newRound(1));
  const [, bump] = useReducer((count: number) => count + 1, 0);
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [newBest, setNewBest] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const hold = useRef<{ id: number; at: number } | null>(null);
  const slowUsed = useRef(false);
  const overAt = useRef(0);
  const clock = useRef(0);
  const scene = useRef<{ context: CanvasRenderingContext2D; cache: SceneCache } | null>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const cardCanvas = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const playArea = useRef<HTMLDivElement>(null);
  const inView = useInView(playArea, 0.3);

  const current = round.current;
  const { phase } = current;
  const done = phase === "over";
  const pot = current.pots[current.index];
  const total = totalOf(current.scores);
  const card: Shared | null = done ? { seed: current.seed, total, scores: current.scores, spills: current.spills, name: cleanName(name), slow: slowUsed.current } : null;
  const state = card ? shareHash(card) : "";

  const begin = useCallback((seed: number) => {
    round.current = newRound(seed);
    hold.current = null;
    slowUsed.current = false;
    setHolding(false); setPaused(false); setNewBest(false);
    bump();
  }, []);

  useEffect(() => {
    const read = () => {
      const shared = parseShare(window.location.hash);
      if (shared) { setFriend(shared); begin(shared.seed); }
      return Boolean(shared);
    };
    if (!read()) begin(newSeed());
    setSite(window.location.host);
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [begin]);

  const step = (dt: number) => {
    clock.current += dt;
    const live = round.current;
    if (live.phase === "rising" && slow) slowUsed.current = true;
    if (!stepRound(live, dt, slow)) return;
    if (live.phase === "result" && live.spills[live.spills.length - 1]) { hold.current = null; setHolding(false); }
    if (live.phase === "over") { overAt.current = performance.now(); setNewBest(submitBest(totalOf(live.scores))); }
    bump();
  };
  const draw = () => { if (scene.current) drawScene(scene.current.context, scene.current.cache, round.current, slow, clock.current); };
  const drawLatest = useRef(draw);
  drawLatest.current = draw;
  const running = !paused && !done;
  useGameLoop(step, draw, running);
  // A still frame still has to follow the slow toggle and the last pot.
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
    // Canvas text waits for the Bangla fonts; redraw once they are in.
    document.fonts?.ready.then(() => drawLatest.current());
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const hidden = () => {
      if (!document.hidden || round.current.phase !== "rising") return;
      hold.current = null;
      setHolding(false);
      setPaused(true);
    };
    document.addEventListener("visibilitychange", hidden);
    return () => document.removeEventListener("visibilitychange", hidden);
  }, []);

  function liftNow() {
    if (!liftPot(round.current)) return;
    hold.current = null;
    setHolding(false);
    if (!slow) navigator.vibrate?.(12);
    bump();
  }

  function again() {
    if (performance.now() - overAt.current < AGAIN_GUARD_MS) return;
    begin(friend ? friend.seed : newSeed());
  }

  function press(id: number) {
    const live = round.current;
    if (paused) { setPaused(false); return; }
    if (hold.current) return;
    if (live.phase === "waiting") {
      startPot(live);
      hold.current = { id, at: performance.now() };
      setHolding(true);
      bump();
    } else if (live.phase === "rising") liftNow();
  }

  function release(id: number) {
    const started = hold.current;
    if (!started || started.id !== id) return;
    hold.current = null;
    setHolding(false);
    // A short tap leaves the milk heating; a real hold lifts the pot the moment it ends.
    if (round.current.phase === "rising" && performance.now() - started.at >= HOLD_MS) liftNow();
  }

  const pointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button > 0) return;
    if (round.current.phase === "over" && !paused) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone: release still arrives on the element */ }
    press(event.pointerId);
  };
  const pointerUp = (event: ReactPointerEvent<HTMLElement>) => release(event.pointerId);

  // Space or Enter works like the big button (hold or tap), while the game is on screen and nothing else has focus.
  useEffect(() => {
    const busy = (target: EventTarget | null) => (target as HTMLElement | null)?.closest?.("input, textarea, select, a, button:not(.du-press), [contenteditable]");
    const down = (event: KeyboardEvent) => {
      if ((event.key !== " " && event.key !== "Enter") || event.ctrlKey || event.metaKey || event.altKey || busy(event.target) || !inView) return;
      event.preventDefault();
      if (event.repeat) return;
      if (round.current.phase === "over" && !paused) again();
      else press(-1);
    };
    const up = (event: KeyboardEvent) => {
      if ((event.key !== " " && event.key !== "Enter") || busy(event.target)) return;
      event.preventDefault();
      release(-1);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  useEffect(() => {
    if (!card && !friend) return;
    let cancelled = false;
    loadCardFonts("দুধ উথলানোর আগে ৯১%").then(() => {
      if (cancelled) return;
      if (card && cardCanvas.current) drawCard(cardCanvas.current, card, format, site);
      if (friend && friendCanvas.current) drawCard(friendCanvas.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  const lastAt = current.scores.length - 1;
  const lastScore = current.scores[lastAt] ?? 0, lastSpilled = current.spills[lastAt] ?? false;
  const ammu = paused || done ? "" : ammuLine(current);
  const [label, sub] = paused ? ["চালিয়ে যাও", "দুধ চুলায় অপেক্ষা করছে"]
    : done ? ["আরেকবার", friend ? "একই পাঁচটা পাতিল" : "নতুন পাঁচটা পাতিল"]
    : phase === "result" ? ["পরের পাতিল আসছে…", ""]
    : phase === "rising" ? (holding ? ["ধরে রাখো…", "ছাড়লেই পাতিল নামবে"] : ["নামাও!", "চাপলেই পাতিল নামবে"])
    : ["চেপে ধরো", "উথলানোর ঠিক আগে ছেড়ে দাও"];
  const said = paused ? "খেলা থেমে আছে। চালিয়ে যাও চাপো।"
    : done ? `শেষ! পাঁচ পাতিলের গড় ${bn(total)}%।`
    : phase === "result" ? (lastSpilled ? "উথলে গেল!" : `${bn(lastScore)}%, ${potWord(lastScore, false)}`)
    : phase === "waiting" ? `${ordinal(current.index)} পাতিল চুলায়। চেপে ধরো।` : "";

  return (
    <div className="du" data-slow={slow}>
      {friend && (
        <section className="du-friend" aria-labelledby="du-friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${bn(friend.total)}%`} />
          <div>
            <h2 id="du-friend-title">{friendBanner(friend)}</h2>
            <p>{possessive(friend.name || "বন্ধু")} নিজের ফোনের স্কোর{friend.slow ? ", ধীরে খেলায়" : ""}</p>
          </div>
        </section>
      )}

      <div className="du-play" ref={playArea}>
        <div className="du-stage" ref={stage} onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={pointerUp} onContextMenu={event => event.preventDefault()}>
          <canvas ref={canvas} width={VW * 2} height={VH * 2} aria-hidden="true" />
          {phase === "waiting" && current.index === 0 && !paused && <p className="du-tip">চেপে ধরো, উথলানোর ঠিক আগে ছাড়ো</p>}
          {ammu && <p className="du-ammu" key={`${current.index}-${phase}`}><small>আম্মু, পাশের ঘর থেকে</small>{ammu}</p>}
          {phase === "result" && (
            <p className="du-pop" data-spill={lastSpilled} key={lastAt}>
              {lastSpilled ? <b>উথলে গেল!</b> : <><b>{bn(lastScore)}%</b><span>{potWord(lastScore, false)}</span></>}
            </p>
          )}
          {paused && <p className="du-pause">থেমে আছে। নিচের বোতাম চাপলে আবার চলবে।</p>}
          {done && (
            <div className="du-over">
              <p>পাঁচ পাতিলের গড়</p>
              <strong>{bn(total)}%</strong>
              <p>{newBest ? "এই ফোনে নতুন রেকর্ড!" : best !== null ? `এই ফোনে সেরা ${bn(best)}%` : ""}</p>
              {friend && <p className="du-vs">{versusLine(total, friend.total, friend.name)}</p>}
            </div>
          )}
        </div>
        <p className="du-sr" aria-live="polite">{said}</p>

        <div className="du-controls">
          <div className="du-row">
            <p className="du-now">{done ? "পাঁচটা পাতিলই শেষ" : <>{ordinal(current.index)} পাতিল · {stoveName[pot.stove]} {vesselName[pot.vessel]}</>}</p>
            <button type="button" className="du-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}><i aria-hidden="true" />ধীরে খেলো</button>
          </div>
          <ol className="du-pots" aria-label="পাঁচটা পাতিলের স্কোর">
            {current.pots.map((_, index) => {
              const scored = index < current.scores.length, spilled = current.spills[index];
              return (
                <li key={index} data-now={index === current.index && !done} data-state={scored ? (spilled ? "spill" : "ok") : "todo"}>
                  <span>{bn(index + 1)}</span>
                  <b>{scored ? (spilled ? "উথলেছে" : `${bn(current.scores[index])}%`) : "—"}</b>
                </li>
              );
            })}
          </ol>
          <button
            type="button" className="du-press" data-phase={paused ? "paused" : phase} data-holding={holding}
            disabled={phase === "result" && !paused}
            onPointerDown={pointerDown} onPointerUp={pointerUp} onPointerCancel={pointerUp} onLostPointerCapture={pointerUp}
            onClick={() => { if (done && !paused) again(); }} onContextMenu={event => event.preventDefault()}
          >
            <b>{label}</b>{sub && <small>{sub}</small>}
          </button>
          <p className="du-hint">চেপে না ধরেও হয়: এক চাপে জ্বালাও, আরেক চাপে নামাও<span> · কিবোর্ডে Space</span></p>
          {done && friend && <button type="button" className="kit-link du-fresh" onClick={() => { setFriend(null); begin(newSeed()); history.replaceState(null, "", location.pathname); }}>নতুন পাঁচটা পাতিলে খেলো</button>}
        </div>
      </div>

      {card && (
        <section className="du-result" id="result" aria-labelledby="du-result-title">
          <h2 id="du-result-title">{friend ? versusLine(total, friend.total, friend.name) : humanLine(card.scores, card.spills)}</h2>
          <figure className="kit-card" data-format={format}>
            <canvas ref={cardCanvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="du-card-summary" />
            <figcaption id="du-card-summary" className="du-sr">{card.name && `${card.name}, `}দুধ উথলানোর আগে, গড় {bn(total)}%। {humanLine(card.scores, card.spills)}</figcaption>
            {cardError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="du-share">
            <label className="du-name">
              <span>নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="dudh-uthlano.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint={`লিংক পেলে বন্ধু একই ${bn(POTS)}টা পাতিল পাবে।`} />
          </div>
        </section>
      )}
    </div>
  );
}
