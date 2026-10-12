"use client";
// IP: what we avoided — no specific বর্ণ পরিচয় book's text, layout, illustrations or cover, and no falling-letter app's look; our picture words are the common primer pairs plus our own picks, every drawing is new code art (a round green অজগর with a smile, not a scary snake), and the tree, fruit and cane basket are our own.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, fitCanvas, newSeed, sfx, shake, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { drawBasket, drawFruit, drawPicture, drawScene, fruitFont } from "../lib/art";
import { cardBlob, cardFontSample, drawCard } from "../lib/draw-card";
import {
  aim, errorsOf, makeGame, starsOf, step,
  BOUNCE, CAUGHT, CATCH_Y, EV_CATCH, EV_DONE, EV_MISS, EV_NEAR, EV_WRONG, FALL, FREE, H, HANG, LANES, W, type Game,
} from "../lib/game";
import { levelOf, LEVEL_COUNT, LEVELS } from "../lib/levels";
import {
  bannerNote, bn, caption, clearLine, compareLine, feat, humanLine, levelLabel, lookLine, missLine, nearMissLine, newsLine, parseShared, sharedHash, tallyLine, wrongLine,
  type Shared,
} from "../lib/link";
import { boing, chime, thump } from "../lib/sound";

const TOOL = "o-te-ojogor";
const MAX_WIDTH = 480;
const SLOW = 0.6;
const POP_FONT = '800 20px "Display", "Bangla"';

type Phase = "ready" | "play" | "won";
type Result = { errors: number; stars: number; improved: boolean; best: boolean };
/** The line beside the picture: the last picture word, or what just went wrong. */
type Show = { kind: "pic"; pic: string; text: string } | { kind: "note"; text: string } | null;

/** Everything the canvas loop reads and writes, kept out of React state so a frame never re-renders or allocates. */
function makeLive() {
  return {
    context: null as CanvasRenderingContext2D | null, scale: 1,
    background: null as HTMLCanvasElement | null,
    game: makeGame(1, 1) as Game, phase: "ready" as Phase,
    paused: false, calm: false, reduced: false, clock: 0,
    fonts: new Map<string, string>(),
    popT: 9, popText: "", popX: 0,
  };
}

export function OjogorGame() {
  const [level, setLevel] = useState(1);
  const [seed, setSeed] = useState(1);
  const [phase, setPhaseState] = useState<Phase>("ready");
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState(0);
  const [show, setShow] = useState<Show>(null);
  const [showKey, setShowKey] = useState(0);
  const [paused, setPaused] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-${level}`, false);
  const [live] = useState(makeLive);

  const slowRef = useRef(slow);
  slowRef.current = slow;
  live.calm = slow || live.reduced;
  const chosen = useRef(false);
  const demoRef = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const picture = useRef<HTMLCanvasElement>(null);
  const chip = useRef<HTMLParagraphElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const boardInView = useInView(board);

  const spec = levelOf(level);
  const items = spec.items;
  const want = items[Math.min(index, items.length - 1)];
  const wordAt = items.slice(index).find(item => item.word)?.word ?? "";
  const rival = friend && friend.level === level && friend.seed === seed ? friend : null;
  const shared: Shared | null = result && phase === "won" ? { level, seed, errors: result.errors, name } : null;
  const state = shared ? sharedHash(shared) : "";

  function setPhase(next: Phase) { live.phase = next; setPhaseState(next); }
  function say(next: Show) { setShow(next); setShowKey(key => key + 1); }

  function fontFor(text: string) {
    let font = live.fonts.get(text);
    if (!font && live.context) { font = fruitFont(live.context, text); live.fonts.set(text, font); }
    return font ?? POP_FONT;
  }

  function paint() {
    const ratio = Math.min(2, window.devicePixelRatio || 1), k = live.scale * ratio;
    const background = live.background ??= document.createElement("canvas");
    background.width = Math.round(W * k); background.height = Math.round(H * k);
    const b = background.getContext("2d");
    if (!b) return;
    b.setTransform(k, 0, 0, k, 0, 0);
    drawScene(b);
  }

  /** A fresh level. `play` skips the start screen (for আবার খেলো); otherwise it waits on শুরু করো. */
  function startLevel(next: number, levelSeed = newSeed(), play = false, byPlayer = true) {
    if (byPlayer) chosen.current = true;
    live.game = makeGame(next, levelSeed);
    live.paused = false; live.popT = 9;
    setLevel(next); setSeed(levelSeed); setIndex(0); setErrors(0); say(null); setResult(null); setPaused(false);
    demoRef.current = false;
    setPhase(play ? "play" : "ready");
    if (play) sfx.tap();
    draw();
  }

  function begin() {
    if (live.phase !== "ready") return;
    chosen.current = true;
    sfx.tap();
    setPhase("play");
  }

  function finish() {
    const g = live.game, made = errorsOf(g), stars = starsOf(g.level, made);
    const before = levels.stars[g.level] ?? 0;
    levels.record(g.level, stars);
    const beaten = submitBest(made);
    setResult({ errors: made, stars, improved: before > 0 && stars > before, best: beaten && before > 0 });
    setPhase("won");
    const colors = ["#ffd447", "#ffb38a", "#c9ec8f", "#d9c8ff", "#2f7d32"];
    if (g.spec.milestone) { sfx.levelUp(); confetti({ colors }); }
    else if (stars === 3) { sfx.win(); confetti({ colors }); }
    else sfx.good();
  }

  /** Preview images only (`&og=1` on a link): shows the friend's level as finished so the card draws. Saves nothing on the phone. */
  function demo(found: Shared) {
    demoRef.current = true;
    const g = live.game;
    g.index = g.spec.items.length; g.over = true;
    setIndex(g.index); setErrors(found.errors);
    setResult({ errors: found.errors, stars: starsOf(found.level, found.errors), improved: false, best: false });
    setPhase("won");
    draw();
  }

  function tick(dt: number) {
    live.clock += dt;
    if (live.popT < 9) live.popT += dt;
    if (live.paused || live.phase !== "play") return;
    const g = live.game;
    step(g, dt * (slowRef.current ? SLOW : 1));
    const happened = g.events;
    if (!happened) return;
    const target = g.spec.items[Math.min(g.index, g.spec.items.length - 1)];
    if (happened & EV_CATCH) {
      const item = g.spec.items[g.caught];
      if (g.streak >= 3) { sfx.combo(g.streak - 3); live.popText = `টানা ${bn(g.streak)}`; live.popT = 0; live.popX = g.basketX; }
      else sfx.pop();
      if (item.label) { chime(); say({ kind: "pic", pic: item.pic, text: item.label }); }
      else if (show?.kind === "note") say(null);
      setIndex(g.index);
    }
    if (happened & EV_WRONG) {
      boing();
      shake(chip.current);
      say({ kind: "note", text: wrongLine(g.fruits[g.hit].text, target.text) });
      setErrors(errorsOf(g));
    }
    if (happened & EV_MISS) {
      thump();
      say({ kind: "note", text: missLine(target.text, (happened & EV_NEAR) !== 0) });
      setErrors(errorsOf(g));
    }
    if (happened & EV_DONE) finish();
  }

  function draw() {
    const c = live.context, background = live.background;
    if (!c || !background) return;
    const g = live.game, calm = live.calm, world = g.spec.world, t = g.t;
    c.save();
    c.scale(live.scale, live.scale);
    c.drawImage(background, 0, 0, W, H);
    for (const fruit of g.fruits) {
      const s = fruit.state;
      if (s === FREE || s === CAUGHT) continue;
      if (s === HANG) {
        const grow = Math.min(1, (t - fruit.born) / 0.25), soon = fruit.drop - t < 0.35;
        const sway = calm ? 0 : Math.sin(live.clock * (soon ? 22 : 2.5) + fruit.lane) * (soon ? 0.12 : 0.06);
        drawFruit(c, fruit.x, fruit.y, fruit.text, fontFor(fruit.text), world, calm ? 1 : grow, sway);
      } else if (s === FALL) drawFruit(c, fruit.x, fruit.y, fruit.text, fontFor(fruit.text), world);
      else {
        const fade = (t - fruit.ended) / (s === BOUNCE ? 0.7 : 0.9);
        c.globalAlpha = Math.max(0, 1 - fade);
        drawFruit(c, fruit.x, fruit.y, fruit.text, fontFor(fruit.text), world, 1, s === BOUNCE && !calm ? fade * 3 : 0);
        c.globalAlpha = 1;
      }
    }
    for (const fruit of g.fruits) {
      if (fruit.state !== CAUGHT) continue;
      const k = Math.min(1, (t - fruit.ended) / 0.3);
      drawFruit(c, g.basketX, CATCH_Y + k * 16, fruit.text, fontFor(fruit.text), world, 1 - k * 0.7);
    }
    // After a wrong letter the basket rocks; in slow mode it only leans, without the swing.
    const tilt = g.wobble <= 0 ? 0 : calm ? 0.12 : Math.sin((0.5 - g.wobble) * 34) * g.wobble * 0.5;
    drawBasket(c, g.basketX, tilt);
    if (live.popT < 0.8) {
      c.globalAlpha = 1 - live.popT / 0.8;
      c.font = POP_FONT; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = "#2f5d2a";
      c.fillText(live.popText, live.popX, CATCH_Y - 34 - (calm ? 0 : live.popT * 30));
      c.globalAlpha = 1;
    }
    c.restore();
  }

  const looping = !paused && phase === "play" && boardInView;
  useGameLoop(tick, draw, looping);

  useEffect(() => {
    const box = board.current, element = canvas.current;
    if (!box || !element) return;
    live.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let laidOut = 0;
    const layout = () => {
      const width = Math.min(box.clientWidth, MAX_WIDTH);
      if (!width || width === laidOut) return;
      laidOut = width;
      const scale = width / W, height = Math.round(H * scale);
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      Object.assign(live, { scale, context: fitCanvas(element, width, height) });
      paint();
      draw();
    };
    layout();
    const observer = new ResizeObserver(layout);
    observer.observe(box);
    const sample = LEVELS.flatMap(item => item.items.map(entry => entry.text)).join("") + "টানা০১২৩৪৫৬৭৮৯";
    void loadCardFonts(sample).then(() => { live.fonts.clear(); draw(); }).catch(() => {});
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const readFriend = () => {
      const found = parseShared(window.location.hash);
      if (!found) return;
      setFriend(found);
      startLevel(found.level, found.seed);
      if (new URLSearchParams(window.location.hash.slice(1)).get("og") === "1") demo(found);
    };
    const hide = () => {
      if (document.hidden && live.phase === "play") { live.paused = true; setPaused(true); }
    };
    setSite(window.location.host);
    if (!chosen.current) startLevel(1, newSeed(), false, false);
    readFriend();
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
    };
  }, []);

  // Open at the furthest level this phone has reached, once its stars load, unless a link or a tap already chose.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    startLevel(levels.unlocked, newSeed(), false, false);
  }, [levels.loaded]);

  useEffect(() => { draw(); }, [slow]);

  // The small picture beside the word, redrawn only when it changes.
  useEffect(() => {
    const element = picture.current;
    if (!element) return;
    const c = fitCanvas(element, 56, 56);
    c.clearRect(0, 0, 56, 56);
    const pic = show?.kind === "pic" ? show.pic : "snake";
    drawPicture(c, pic, 28, 30, 52);
  }, [show]);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(cardFontSample(shared)).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  function resume() {
    live.paused = false;
    setPaused(false);
  }

  const retry = () => startLevel(level, rival ? seed : newSeed(), true);
  const nextLevel = () => startLevel(level < LEVEL_COUNT ? level + 1 : level);
  const steer = (x: number) => { if (live.phase === "play" && !live.paused) aim(live.game, x); };
  const hold = () => aim(live.game, live.game.basketX);

  // ---- keys: hold an arrow to move the basket; Space/Enter starts, resumes, plays on ----
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]") || !boardInView) return;
    const key = event.key;
    if (key === "ArrowLeft" || key === "ArrowRight") {
      if (live.phase !== "play" || live.paused) return;
      event.preventDefault();
      if (event.type === "keyup") hold();
      else steer(key === "ArrowLeft" ? LANES[0] : LANES[4]);
      return;
    }
    if (event.type !== "keydown" || (key !== " " && key !== "Enter") || target?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (live.paused) resume();
    else if (live.phase === "ready") begin();
    else if (live.phase === "won") nextLevel();
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    window.addEventListener("keyup", listen);
    return () => { window.removeEventListener("keydown", listen); window.removeEventListener("keyup", listen); };
  }, []);

  const capture = (event: ReactPointerEvent<HTMLElement>) => { try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ } };

  /** Where a finger is on the board, in board units: the basket heads there and follows while it drags. */
  function onBoardPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || (event.target as Element).closest("button")) return;
    if (event.type === "pointerdown") capture(event);
    else if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    steer((event.clientX - rect.left) / live.scale);
  }

  const total = totalStars(levels.stars);
  const unlockedOrFriend = Math.max(levels.unlocked, friend?.level ?? 1);
  const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const toTop = () => wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const done = phase === "won";
  const from = Math.max(0, Math.min(index - 2, items.length - 7));
  const strip = items.slice(from, from + 7);
  const label = show ? show.text : done ? "সব ঝুড়িতে উঠেছে" : wordAt ? `${wordAt} বানাও` : lookLine(want.text);

  /** The word being spelled, with the caught part dark and the next unit marked. */
  function wordChip() {
    const end = items.findIndex((item, i) => i >= index && item.word);
    let first = end;
    while (first > 0 && !items[first - 1].word) first--;
    return items.slice(first, end + 1).map((item, i) => {
      const at = first + i;
      return <span key={at} className={at < index ? "got" : at === index ? "now" : ""}>{item.text}</span>;
    });
  }

  return (
    <div className="oj" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="oj-friend" aria-labelledby="oj-friend-title">
          <h2 id="oj-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend.name)}</p>
        </section>
      )}

      <p className="oj-level"><b>{levelLabel(level)}</b><span>{spec.title}</span><span className="oj-total">★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></p>

      <div className="oj-hud">
        <canvas ref={picture} className="oj-pic" aria-hidden="true" />
        <p key={showKey} className={`oj-say ${show?.kind === "note" ? "oj-note" : ""} ${show ? "gx-pop" : ""}`} role="status" aria-live="polite">{label}</p>
        <p ref={chip} className="oj-next" aria-label={done ? "লেভেল শেষ" : `এবার ধরো ${want.text}`}>
          <small>{done ? "শেষ" : "এবার"}</small>
          {done ? <b>✓</b> : wordAt ? <b className="oj-word">{wordChip()}</b> : <b>{want.text}</b>}
        </p>
      </div>

      <ol className="oj-strip" aria-label={`${bn(items.length)}টার মধ্যে ${bn(index)}টা ধরা হয়েছে`}>
        {strip.map((item, i) => {
          const at = from + i;
          return <li key={at} className={at < index ? "got" : at === index && !done ? "now" : ""}>{item.text}</li>;
        })}
        <li className="oj-count" aria-hidden="true">ভুল {bn(errors)}</li>
      </ol>

      <div className="oj-board" ref={board} data-phase={phase} onPointerDown={onBoardPointer} onPointerMove={onBoardPointer}>
        <canvas ref={canvas} role="img" aria-label={`গাছ থেকে বর্ণ পড়ছে, নিচে ঝুড়ি। এবার লাগবে ${want.text}। ${bn(items.length)}টার মধ্যে ${bn(index)}টা ধরা হয়েছে, ভুল ${bn(errors)}টা।`} />
        {phase === "ready" && (
          <div className="oj-overlay">
            <p className="oj-title">{levelLabel(level)} · {spec.title}</p>
            <p className="oj-news">{newsLine(level)}</p>
            <button type="button" className="kit-primary" onClick={begin}>শুরু করো</button>
            <p className="oj-small">ঝুড়ি সরাতে আঙুল টেনে ধরো, নয়তো নিচের ◀ ▶ চাপো।</p>
          </div>
        )}
        {paused && (
          <div className="oj-overlay">
            <p>খেলা থেমে আছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
        {done && result && (
          <div className="oj-overlay oj-end" role="status">
            <StarReveal count={result.stars} />
            <p className="oj-end-line">{clearLine(level)}</p>
            <p className="oj-end-note">
              {tallyLine({ level, errors: result.errors })}।{" "}
              {rival ? compareLine(result.errors, rival.errors, rival.name)
                : result.improved ? `এই লেভেলে নতুন রেকর্ড, ${bn(result.stars)} তারা!`
                : result.best ? `এই লেভেলে তোমার সবচেয়ে কম ভুল, ${bn(result.errors)}টা!`
                : nearMissLine(level, result.errors)}
            </p>
            {best !== null && !rival && !demoRef.current && <p className="oj-best">এই লেভেলে তোমার সবচেয়ে কম ভুল: {bn(best)}টা</p>}
            <div className="oj-actions">
              {level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={nextLevel}>পরের লেভেল</button>}
              <button type="button" className={level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={retry}>আবার খেলো</button>
            </div>
            {shared && <button type="button" className="kit-link oj-see" onClick={seeCard}>কার্ড দেখো ↓</button>}
          </div>
        )}
      </div>

      <div className="oj-controls">
        <button type="button" className="oj-arrow" aria-label="ঝুড়ি বামে"
          onPointerDown={event => { capture(event); steer(LANES[0]); }} onPointerUp={hold} onPointerCancel={hold}
          onClick={event => { if (event.detail === 0) steer(live.game.basketX - 65); }}>◀</button>
        <button type="button" className="oj-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact />
        <button type="button" className="oj-arrow" aria-label="ঝুড়ি ডানে"
          onPointerDown={event => { capture(event); steer(LANES[4]); }} onPointerUp={hold} onPointerCancel={hold}
          onClick={event => { if (event.detail === 0) steer(live.game.basketX + 65); }}>▶</button>
      </div>

      <details className="oj-drawer">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p className="oj-stages">স্বরবর্ণ ১–৩ · ব্যঞ্জনবর্ণ ৪–১২ · শব্দ ১৩–১৮ · সংখ্যা ১৯–২২</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={unlockedOrFriend} current={level} onPick={pick => { startLevel(pick); toTop(); }} />
      </details>

      <section className="oj-result" id="result" ref={resultBox} aria-labelledby="oj-result-title">
        <h2 id="oj-result-title">{shared ? <>লেভেল {bn(shared.level)}, <em>ভুল {bn(shared.errors)}টা</em></> : "লেভেল শেষ হলে তোমার কার্ড"}</h2>
        <p>{shared ? humanLine(shared) : "একটা লেভেল শেষ করলে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই গাছ পাবে, একই ক্রমে বর্ণ পড়বে।"}</p>
        {shared && result && (
          <div className="oj-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`অ-তে অজগরের কার্ড: ${levelLabel(level)}, ${tallyLine(shared)}, ${bn(result.stars)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="oj-share">
              <label className="oj-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`o-te-ojogor-${level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই গাছ পাবে, একই ক্রমে বর্ণ পড়বে। ভুলের হিসাবটা তোমার ফোনের।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
