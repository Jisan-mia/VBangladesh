"use client";
// IP: what we avoided — no colour-shifting gradient blocks, slicing or look of the famous stacking app; real rice and jute sacks on a painted truck instead, a plumb-line lean rule instead of trimming, and every figure drawn fresh from plain shapes.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, fitCanvas, MAX_NAME, newSeed, useBest, useGameLoop, useSlowMode } from "../../../shared/game-kit";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, makeScene, onLand, onMiss, paint, resizeScene, restartScene, updateScene } from "../lib/draw-scene";
import { leanOf, newGame, scoreOf, step, tap, type Phase } from "../lib/game";
import { MAX_SACKS, bn, caption, cardHash, dropNews, friendBanner, friendNote, humanLine, missReason, parseCard, sacksLabel, versusLine, type Card } from "../lib/result";

const TOOL = "bostar-pahar";

let audio: AudioContext | null = null;
/** A soft thump for a landing (a brighter one for ঠিক মাঝে), synthesised: no audio files. Only called when sound is on. */
function thump(kind: "land" | "perfect" | "miss") {
  try {
    audio ??= new AudioContext();
    const now = audio.currentTime, tone = audio.createOscillator(), gain = audio.createGain();
    tone.type = kind === "perfect" ? "triangle" : "sine";
    tone.frequency.setValueAtTime(kind === "perfect" ? 520 : kind === "miss" ? 220 : 140, now);
    tone.frequency.exponentialRampToValueAtTime(kind === "perfect" ? 880 : kind === "miss" ? 90 : 60, now + (kind === "miss" ? 0.3 : 0.12));
    gain.gain.setValueAtTime(kind === "perfect" ? 0.1 : 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (kind === "miss" ? 0.35 : 0.18));
    tone.connect(gain).connect(audio.destination);
    tone.start(now); tone.stop(now + 0.4);
  } catch { /* no WebAudio: silence is fine */ }
}

export function BostarGame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const game = useRef(newGame(1));
  const scene = useRef(makeScene());
  const seen = useRef<{ phase: Phase; count: number; settled: boolean }>({ phase: "ready", count: 1, settled: false });
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("ready");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [leaning, setLeaning] = useState(0);
  const [settled, setSettled] = useState(false);
  const [paused, setPaused] = useState(false);
  const [friend, setFriend] = useState<Card | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL);
  const [record, setRecord] = useState(false);
  const [sound, setSound] = useState(false);
  const [news, setNews] = useState("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const over = phase === "over";
  const sacks = Math.min(MAX_SACKS, score);
  const card: Card | null = over ? { seed: game.current.seed, sacks, perfect: Math.min(sacks, game.current.perfect), streak: Math.min(sacks, game.current.bestCombo), name: cleanName(name) } : null;
  const state = card ? cardHash(card) : "";
  const versus = friend && card && friend.seed === card.seed ? versusLine(card.sacks, friend.sacks, friend.name) : "";

  const draw = () => { if (context.current) drawScene(context.current, scene.current, game.current); };

  /** Mirrors the game into React only when something changes, never every frame. */
  function sync() {
    const now = game.current, last = seen.current, count = now.xs.length;
    if (count > last.count) {
      onLand(scene.current, now);
      if (sound) thump(now.verdict === "perfect" ? "perfect" : "land");
      if (!slow) navigator.vibrate?.(now.verdict === "perfect" ? 18 : 8);
      setScore(count - 1); setCombo(now.combo); setLeaning(Math.abs(leanOf(now)) > 0.55 ? Math.sign(leanOf(now)) : 0);
      setNews(dropNews(now.verdict ?? "good", count - 1));
    }
    last.count = count;
    if (now.phase !== last.phase) {
      if (now.phase === "fall") {
        onMiss(scene.current, now);
        if (sound) thump("miss");
        setCombo(0);
        setNews(dropNews(now.verdict ?? "slip", count - 1));
      }
      if (now.phase === "over") setRecord(submitBest(count - 1) && best !== null);
      last.phase = now.phase;
      setPhase(now.phase);
    }
    if (scene.current.settled !== last.settled) { last.settled = scene.current.settled; setSettled(last.settled); }
  }

  function press() {
    if (paused) { setPaused(false); return; }
    if (tap(game.current)) sync();
  }

  function start(seed: number) {
    game.current = newGame(seed);
    seen.current = { phase: "ready", count: 1, settled: false };
    restartScene(scene.current);
    setPhase("ready"); setScore(0); setCombo(0); setLeaning(0); setSettled(false); setPaused(false); setRecord(false); setNews("");
  }

  function again(fresh = false) {
    if (fresh && friend) { setFriend(null); history.replaceState(null, "", window.location.pathname); }
    start(friend && !fresh ? friend.seed : newSeed());
    if ((stage.current?.getBoundingClientRect().top ?? 0) < 0) stage.current?.scrollIntoView({ block: "center" });
  }

  useGameLoop(dt => {
    step(game.current, dt, slow);
    updateScene(scene.current, game.current, dt, slow);
    sync();
  }, draw, !paused && !settled);

  useEffect(() => {
    // In-page anchors (#result) also change the hash: only a real challenge link starts a friend's swings.
    const read = () => { const shared = parseCard(window.location.hash); if (shared) { setFriend(shared); start(shared.seed); } return shared; };
    if (!read()) start(newSeed());
    const onHash = () => { read(); };
    window.addEventListener("hashchange", onHash);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const box = stage.current, element = canvas.current;
    if (!box || !element) return;
    const fit = () => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      context.current = fitCanvas(element, width, height);
      resizeScene(scene.current, width, height, Math.min(2, window.devicePixelRatio || 1));
      draw();
    };
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    fit();
    // The sacks and the godown carry Bangla words: paint them again once the fonts arrive.
    loadCardFonts("চাল পাট গুদাম নিচের বস্তার ঠিক ওপরে এলেই চাপো").then(() => { paint(scene.current); draw(); }).catch(() => {});
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden && ["swing", "drop", "settle", "fall"].includes(game.current.phase)) setPaused(true); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Space, Enter or ↓ drops; P or Esc pauses. Typing a name and pressing focused buttons are left alone.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if ((event.target as HTMLElement).closest?.("input, textarea, select, button, a, summary, [contenteditable]")) return;
      if (event.key === " " || event.key === "Enter" || event.key === "ArrowDown") { event.preventDefault(); if (over) again(); else press(); }
      else if ((event.key === "p" || event.key === "P" || event.key === "Escape") && !over) setPaused(value => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!card && !friend) return;
    let cancelled = false;
    loadCardFonts("বস্তার পাহাড় ২৮টা বস্তা ঠিক মাঝে").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  function onStage(event: PointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary) return;
    event.preventDefault();
    if (!over) press();
  }
  // Taps act on pointer-down (no finger-lift delay); keyboard presses arrive as clicks with detail 0.
  function onButtonDown(event: PointerEvent<HTMLButtonElement>) { if (event.isPrimary) { event.preventDefault(); press(); } }
  function onButtonClick(event: MouseEvent<HTMLButtonElement>) { if (event.detail === 0) press(); }

  const busy = phase === "drop" || phase === "settle" || phase === "fall";
  const hint = paused ? "থামানো আছে। চাপলেই আবার চলবে।"
    : phase === "ready" ? "দোলটা একবার দেখে নাও, তাড়াহুড়ো নেই।"
    : phase === "fall" || over ? missReason(game.current.verdict)
    : leaning > 0 ? "পাহাড় ডানে হেলে আছে। এবার একটু বাঁয়ে ফেলো।"
    : leaning < 0 ? "পাহাড় বাঁয়ে হেলে আছে। এবার একটু ডানে ফেলো।"
    : combo >= 2 ? "টানা ঠিক মাঝে পড়লে পাহাড় সোজা থাকে।"
    : "ঠিক মাঝে পড়লে পাহাড় একটু সোজা হয়।";

  return (
    <div className="bp">
      <div className="bp-play">
        {friend && (
          <section className="bp-friend" aria-labelledby="bp-friend-title">
            <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: ${sacksLabel(friend.sacks)}`} />
            <div>
              <p className="bp-kicker">তোমার জন্য একটা চ্যালেঞ্জ</p>
              <h2 id="bp-friend-title">{friendBanner(friend)}</h2>
              <p>{friendNote(friend)}</p>
            </div>
          </section>
        )}

        <div className="bp-hud">
          <p className="bp-count"><b>{bn(score)}</b>টা বস্তা</p>
          {combo >= 2 && !over && <p className="bp-combo">ঠিক মাঝে ×{bn(combo)}</p>}
          <p className="bp-goal">{friend ? <>লক্ষ্য <b>{bn(friend.sacks)}</b></> : best !== null ? <>সেরা <b>{bn(best)}</b></> : null}</p>
        </div>

        <div className="bp-stage" ref={stage}>
          <canvas ref={canvas} onPointerDown={onStage} aria-hidden="true" />
          {paused && <button type="button" className="kit-primary bp-resume" onClick={() => setPaused(false)}>চালিয়ে যাও</button>}
        </div>
        <p className="bp-hint">{hint}</p>
        <p className="bp-sr" aria-live="polite">{news}</p>

        {over ? (
          <div className="bp-over">
            <p className="bp-score"><b>{bn(score)}</b>টা বস্তা</p>
            <p className="bp-best">{record ? "নতুন রেকর্ড! এই ফোনে এটাই সেরা।" : best !== null ? `এই ফোনে সেরা: ${sacksLabel(best)}` : ""}</p>
            {versus && <p className="bp-versus">{versus}</p>}
            <button type="button" className="kit-primary bp-again" onClick={() => again()}>আরেকবার</button>
            {friend && <button type="button" className="kit-link" onClick={() => again(true)}>নতুন দোলে খেলো</button>}
          </div>
        ) : (
          <button type="button" className="kit-primary bp-tap" data-busy={busy && !paused} onPointerDown={onButtonDown} onClick={onButtonClick}>{paused ? "চালিয়ে যাও" : "বস্তা ফেলো"}</button>
        )}

        <div className="bp-toggles">
          <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          <button type="button" aria-pressed={sound} onClick={() => setSound(!sound)}>{sound ? "শব্দ চালু" : "শব্দ বন্ধ"}</button>
          {!over && phase !== "ready" && <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "চালাও" : "থামাও"}</button>}
        </div>
      </div>

      {card && (
        <section className="bp-result" id="result" aria-labelledby="bp-result-title">
          <h2 id="bp-result-title">ট্রাকে উঠল <em>{sacksLabel(card.sacks)}</em></h2>
          <p>{versus || humanLine(card.sacks)}</p>
          <div className="bp-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="bp-card-summary" />
              <figcaption id="bp-card-summary" className="bp-sr">বস্তার পাহাড়{card.name && `, ${card.name}`}: {sacksLabel(card.sacks)}। ঠিক মাঝে {bn(card.perfect)} বার, টানা {bn(card.streak)} বার। {humanLine(card.sacks)}</figcaption>
              {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="bp-controls">
              <label className="bp-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="bostar-pahar.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="লিংক পেলে বন্ধু একই দোল পাবে: প্রতিটা বস্তা একই তালে দুলবে।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
