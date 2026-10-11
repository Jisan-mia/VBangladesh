"use client";
// IP: what we avoided — no names, logos, characters, sounds or look from any sports brand or other tipcat app; never "গুলি" on its own and no gun imagery; every figure is drawn fresh from plain shapes.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, fitCanvas, MAX_NAME, newSeed, useBest, useGameLoop, useSlowMode } from "../../../shared/game-kit";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, makeScene, react, resizeScene, strikeFeel, updateScene } from "../lib/draw-scene";
import { newGame, step, tap, tokenOf, totalOf, type Phase } from "../lib/game";
import { bn, caption, cardHash, HITS, friendBanner, friendNote, hitLabel, hitNews, humanLine, ordinal, parseCard, versusLine, type Card } from "../lib/result";

const TOOL = "danguli";

let audio: AudioContext | null = null;
/** A short wooden knock, synthesised (no audio files). Only ever called when sound is switched on. */
function knock(kind: "flick" | "hit", strength = 1) {
  try {
    audio ??= new AudioContext();
    const now = audio.currentTime, tone = audio.createOscillator(), gain = audio.createGain();
    tone.type = kind === "flick" ? "triangle" : "square";
    tone.frequency.setValueAtTime(kind === "flick" ? 620 : 150 + 200 * strength, now);
    tone.frequency.exponentialRampToValueAtTime(kind === "flick" ? 1100 : 70, now + 0.08);
    gain.gain.setValueAtTime(kind === "flick" ? 0.12 : 0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (kind === "flick" ? 0.07 : 0.16));
    tone.connect(gain).connect(audio.destination);
    tone.start(now); tone.stop(now + 0.2);
  } catch { /* no WebAudio: silence is fine */ }
}

export function DanguliGame() {
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const context = useRef<CanvasRenderingContext2D | null>(null);
  const game = useRef(newGame(1));
  const scene = useRef(makeScene());
  const seen = useRef<{ phase: Phase; hit: number }>({ phase: "aim", hit: 0 });
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("aim");
  const [hit, setHit] = useState(0);
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

  const shots = game.current.shots;
  const over = phase === "over";
  const revealed = phase === "rest" || over ? hit + 1 : hit;
  const total = totalOf(shots.slice(0, revealed));
  const card: Card | null = over ? { seed: game.current.seed, total, hits: shots.map(tokenOf), name: cleanName(name) } : null;
  const state = card ? cardHash(card) : "";
  const versus = friend && card && friend.seed === card.seed ? versusLine(card.total, friend.total, friend.name) : "";

  const draw = () => { if (context.current) drawScene(context.current, scene.current, game.current); };

  /** Mirrors the game's phase into React only when it changes, never every frame. */
  function sync() {
    const now = game.current, last = seen.current;
    if (now.phase === last.phase && now.hit === last.hit) return;
    last.phase = now.phase; last.hit = now.hit;
    setPhase(now.phase); setHit(now.hit);
    if (now.phase === "rest") { const shot = now.shots[now.hit]; react(scene.current, shot); setNews(hitNews(shot)); }
    if (now.phase === "over") {
      const sum = totalOf(now.shots);
      setRecord(submitBest(sum) && best !== null);
      setNews(`খেলা শেষ! তিন মারে ${bn(sum)} ডাং।`);
    }
  }

  function press() {
    if (paused) { setPaused(false); return; }
    const now = game.current, before = now.phase;
    if (!tap(now)) return;
    if (before === "aim" && sound) knock("flick");
    if (before === "pop") {
      const shot = now.shots[now.hit];
      if (shot.kind !== "whiff") {
        strikeFeel(scene.current, shot);
        if (sound) knock("hit", shot.quality);
        if (!slow) navigator.vibrate?.(12);
      }
    }
    sync();
  }

  function start(seed: number) {
    game.current = newGame(seed);
    seen.current = { phase: "aim", hit: 0 };
    setPhase("aim"); setHit(0); setPaused(false); setRecord(false); setNews("");
    scene.current.mood = "idle"; scene.current.shoutTime = 0;
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
  }, draw, !paused && !over);

  useEffect(() => {
    // In-page anchors (#result) also change the hash: only a real challenge link starts a friend's field.
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
    loadCardFonts("ডাংগুলি ১২ ডাং বাতাস").then(draw).catch(() => {});
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden && ["pop", "fly", "rest"].includes(game.current.phase)) setPaused(true); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Space, Enter or ↑ plays; P or Esc pauses. Typing a name and pressing focused buttons are left alone.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if ((event.target as HTMLElement).closest?.("input, textarea, select, button, a, summary, [contenteditable]")) return;
      if (event.key === " " || event.key === "Enter" || event.key === "ArrowUp") { event.preventDefault(); press(); }
      else if ((event.key === "p" || event.key === "P" || event.key === "Escape") && !over) setPaused(value => !value);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (!card && !friend) return;
    let cancelled = false;
    loadCardFonts("ডাংগুলি ৩৭ ডাং").then(() => {
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
    press();
  }
  // Taps act on pointer-down (no finger-lift delay); keyboard presses arrive as clicks with detail 0.
  function onButtonDown(event: PointerEvent<HTMLButtonElement>) { if (event.isPrimary) { event.preventDefault(); press(); } }
  function onButtonClick(event: MouseEvent<HTMLButtonElement>) { if (event.detail === 0) press(); }

  const shot = shots[hit];
  const hint = paused ? "থামানো আছে। চাপলেই আবার চলবে।"
    : phase === "aim" ? (hit === 0 ? "একবার চাপো, কাঠি লাফাবে। নামার সময় আবার চাপো!" : `${ordinal(hit)} মার। চাপো, কাঠি তোলো।`)
    : phase === "pop" ? "নামার সময় হলুদ দাগে এলেই মারো!"
    : phase === "fly" ? "দেখো, কদ্দূর যায়…"
    : phase === "rest" && shot ? hitNews(shot)
    : humanLine(total);
  const label = phase === "aim" ? "কাঠি তোলো" : phase === "pop" ? "মারো!" : phase === "fly" ? "উড়ছে…" : hit + 1 < HITS ? "পরের মার" : "ফল দেখো";

  return (
    <div className="dg">
      <div className="dg-play">
        {friend && (
          <section className="dg-friend" aria-labelledby="dg-friend-title">
            <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} কার্ড: তিন মারে ${bn(friend.total)} ডাং`} />
            <div>
              <p className="dg-kicker">তোমার জন্য একটা চ্যালেঞ্জ</p>
              <h2 id="dg-friend-title">{friendBanner(friend)}</h2>
              <p>{friendNote(friend)}</p>
            </div>
          </section>
        )}

        <div className="dg-hud">
          <ol className="dg-hits" aria-label="তিন মার">
            {[0, 1, 2].map(index => (
              <li key={index} data-now={index === hit && !over && phase !== "rest"} data-done={index < revealed}>
                <span>{ordinal(index)}</span><b>{index < revealed && shots[index] ? hitLabel(tokenOf(shots[index])) : "—"}</b>
              </li>
            ))}
          </ol>
          <p className="dg-total">মোট <b>{bn(total)}</b> ডাং{friend && <small> · লক্ষ্য {bn(friend.total)}</small>}</p>
        </div>

        <div className="dg-stage" ref={stage}>
          <canvas ref={canvas} onPointerDown={onStage} aria-hidden="true" />
          {paused && <button type="button" className="kit-primary dg-resume" onClick={() => setPaused(false)}>চালিয়ে যাও</button>}
        </div>
        <p className="dg-hint">{hint}</p>
        <p className="dg-sr" aria-live="polite">{news}</p>

        {over ? (
          <div className="dg-over">
            <p className="dg-score"><b>{bn(total)}</b> ডাং</p>
            <p className="dg-best">{record ? "নতুন রেকর্ড! এই ফোনে এটাই সেরা।" : best !== null ? `এই ফোনে সেরা: ${bn(best)} ডাং` : ""}</p>
            {versus && <p className="dg-versus">{versus}</p>}
            <button type="button" className="kit-primary dg-again" onClick={() => again()}>আরেকবার</button>
            {friend && <button type="button" className="kit-link" onClick={() => again(true)}>নতুন মাঠে খেলো</button>}
          </div>
        ) : (
          <button type="button" className="kit-primary dg-tap" data-phase={phase} disabled={phase === "fly" && !paused} onPointerDown={onButtonDown} onClick={onButtonClick}>{paused ? "চালিয়ে যাও" : label}</button>
        )}

        <div className="dg-toggles">
          <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          <button type="button" aria-pressed={sound} onClick={() => setSound(!sound)}>{sound ? "শব্দ চালু" : "শব্দ বন্ধ"}</button>
          {!over && <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "চালাও" : "থামাও"}</button>}
        </div>
      </div>

      {card && (
        <section className="dg-result" id="result" aria-labelledby="dg-result-title">
          <h2 id="dg-result-title">তিন মারে <em>{bn(card.total)} ডাং</em></h2>
          <p>{versus || humanLine(card.total)}</p>
          <div className="dg-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="dg-card-summary" />
              <figcaption id="dg-card-summary" className="dg-sr">ডাংগুলি{card.name && `, ${card.name}`}: তিন মারে {bn(card.total)} ডাং। {card.hits.map((token, index) => `${ordinal(index)} ${hitLabel(token)}`).join(", ")}। {humanLine(card.total)}</figcaption>
              {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="dg-controls">
              <label className="dg-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="danguli.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="লিংক পেলে বন্ধু একই মাঠে খেলবে: একই বাতাস, একই পুকুর, একই ফিল্ডার।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
