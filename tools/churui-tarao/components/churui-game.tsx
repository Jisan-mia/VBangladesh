"use client";
// IP: what we avoided — no light-gun duck game's dog, ducks, laughing gag, zapper or crosshair, and no gun at all: sparrows are shooed with a clap
// (a ripple and "হুশ!"), never hurt. Our own paddy field, sparrows and clay-pot কাকতাড়ুয়া, drawn from scratch, with our own rule numbers.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, hiss, newSeed, readLevels, sfx, shake, tone, totalStars, unlockedLevel, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { addRipple, drawScene, makeScene, tickScene, type Scene } from "../lib/draw-scene";
import {
  bn, caption, cleanName, compareLine, createGame, humanLine, migrateBest, nearLine, nextBird, parseShareHash, shareHash, shoo, starsOf, stepGame,
  FIELD, H, LEVEL_COUNT, LEVELS, W, type Game, type Shared,
} from "../lib/game";

const TOOL = "churui-tarao";
/** Slow mode runs the afternoon at this speed: sparrows land and nibble slower. */
const SLOW_TIME = 0.65;
type Phase = "ready" | "playing" | "paused" | "over";
type Result = Shared & { reason: 1 | 2; record: boolean; stars: number; before: number | null };
const stored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };

/** The signature sound: a sparrow's double "চিক-চিক" as it lands. */
const chirp = () => { tone(3400, 0.05, 0.035, "sine", 0, 4300); tone(3700, 0.06, 0.035, "sine", 0.08, 4700); };
/** A clap of the hands: a dry slap of noise over a low knock. */
const clapSound = () => { hiss(0.06, 0.24, 1700, "highpass"); tone(200, 0.05, 0.07, "triangle"); };
/** Wings beating away. */
const flutter = () => hiss(0.22, 0.09, 3200, "bandpass", 0.03);
/** A beak in the grain: very quiet, so it nags only a little. */
const peck = () => tone(2600, 0.015, 0.018, "square");
export function ChuruiGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [slow, setSlow] = useSlowMode();
  const [level, setLevel] = useState(1);
  // Level 1 keeps the key the one-field game used, so the old best stays level 1's best.
  const [best, submitBest] = useBest(level === 1 ? TOOL : `${TOOL}-${level}`);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [cardError, setCardError] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const again = useRef<HTMLButtonElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const scene = useRef<Scene | null>(null);
  const game = useRef<Game | null>(null);
  const finished = useRef(false);
  const streak = useRef({ count: 0, at: -9 });
  const timers = useRef<number[]>([]);

  const card: Shared | null = result ? { seed: result.seed, saved: result.saved, shooed: result.shooed, name: cleanName(name), level: result.level } : null;
  const state = card ? shareHash(card) : "";
  const field = LEVELS[level - 1];
  const allStars = totalStars(levels.stars);
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const rival = friend && friend.level === level ? friend : null;

  /** A fresh afternoon on a field: the friend's when it's their field, a new one otherwise. Waits on the ready screen. */
  function setUp(nextLevel: number, seed = rival && nextLevel === level ? rival.seed : newSeed()) {
    timers.current.forEach(clearTimeout); timers.current = [];
    game.current = createGame(seed, nextLevel);
    finished.current = false;
    streak.current.count = 0;
    setLevel(nextLevel);
    setResult(null);
    setPhase("ready");
  }

  /** From the ready screen the waiting game just starts; after a round a fresh one does (the friend's field again, if any). */
  function start() {
    if (phase !== "ready" || !game.current) game.current = createGame(rival ? rival.seed : newSeed(), level);
    finished.current = false;
    streak.current.count = 0;
    setResult(null);
    setPhase("playing");
  }

  function pick(nextLevel: number) {
    setUp(nextLevel, friend && friend.level === nextLevel ? friend.seed : newSeed());
    if ((stage.current?.getBoundingClientRect().top ?? 0) < 0) stage.current?.scrollIntoView({ block: "center", behavior: slow ? "auto" : "smooth" });
  }

  function pause() { setPhase(current => current === "playing" ? "paused" : current); }

  function finish(played: Game) {
    if (finished.current) return;
    finished.current = true;
    const record = submitBest(played.grain) && played.grain > 0 && best !== null;
    const stars = starsOf(played.grain, played.level);
    if (stars) levels.record(played.level, stars);
    setResult({ seed: played.seed, saved: played.grain, shooed: played.shooed, name: "", level: played.level, reason: played.over === 2 ? 2 : 1, record, stars, before: best });
    setPhase("over");
    // The stars chime in one by one (StarReveal); the fanfare comes after them, confetti only for 3 stars or a new best.
    const after = (stars + 1) * 260;
    if (played.over === 2) { sfx.lose(); shake(stage.current); }
    else if (stars === 3 || record) timers.current.push(window.setTimeout(() => { sfx.levelUp(); confetti(); }, after));
    else if (stars) timers.current.push(window.setTimeout(sfx.good, after));
    else sfx.drop();
  }

  const step = (dt: number) => {
    const played = game.current;
    if (!played) return;
    const time = slow ? dt * SLOW_TIME : dt;
    // On the ready screen the first sparrow flies in and lands; the clock then waits at 0 for the first tap.
    if (phase === "ready" && played.t < 0) stepGame(played, Math.min(time, -played.t));
    else if (phase === "playing" && !played.over) {
      const before = played.t, grain = played.grain;
      stepGame(played, time);
      // One chirp per landing moment and one peck per lost grain moment, never more than one each a frame.
      if (played.birds.some(bird => bird.land > before && bird.land <= played.t)) chirp();
      if (played.grain < grain && played.grain > 0) peck();
      if (played.over) finish(played);
    }
    if (scene.current) tickScene(scene.current, dt, played);
  };
  const draw = () => { if (scene.current && game.current) drawScene(scene.current, game.current, slow); };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  useGameLoop(step, draw, phase === "playing" || phase === "ready");

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const build = () => { if (element.clientWidth > 0) { scene.current = makeScene(element, element.clientWidth, scene.current); drawRef.current(); } };
    build();
    loadCardFonts("চড়ুই হুশ ০১২৩৪৫৬৭৮৯%").then(() => drawRef.current()).catch(() => { /* the system font draws the numbers instead */ });
    const observer = new ResizeObserver(build);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // In-page anchors also change the hash, so only a real challenge counts.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return false;
      setFriend(shared);
      if (phaseRef.current === "playing") return true;
      game.current = createGame(shared.seed, shared.level);
      finished.current = false;
      setLevel(shared.level);
      setResult(null);
      setPhase("ready");
      return true;
    };
    // Before levels this phone kept one best %; it becomes level 1's stars once.
    let saved = readLevels(stored(`ektukhani-levels-${TOOL}`), LEVEL_COUNT);
    const moved = migrateBest(saved, stored(`ektukhani-best-${TOOL}`));
    if (moved) { levels.record(1, moved); saved = { 1: moved }; }
    if (!readFriend()) {
      const first = unlockedLevel(saved, LEVEL_COUNT);
      game.current = createGame(newSeed(), first);
      setLevel(first);
    }
    setSite(window.location.host);
    const hide = () => { if (document.hidden) pauseRef.current(); };
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", readFriend); document.removeEventListener("visibilitychange", hide); timers.current.forEach(clearTimeout); };
  }, []);

  function clap(x: number, y: number) {
    const played = game.current;
    if (!played) return;
    const hit = shoo(played, x, y) >= 0;
    if (scene.current) addRipple(scene.current, x, y, hit);
    clapSound();
    if (!hit) return;
    flutter();
    if (!slow) navigator.vibrate?.(8);
    // Quick shoos in a row climb in pitch.
    const run = streak.current;
    run.count = played.t - run.at < 1.6 ? run.count + 1 : 0;
    run.at = played.t;
    if (run.count) sfx.combo(run.count - 1);
  }

  useEffect(() => {
    const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const down = (event: KeyboardEvent) => {
      if (typing(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
      const here = document.activeElement === document.body || Boolean(stage.current?.contains(document.activeElement));
      const arrow = arrows[event.key], view = scene.current, played = game.current;
      if (arrow && view && played && (phase === "playing" || (phase === "ready" && here))) {
        // Arrows hop the hand to the sparrow they point at; Space or Enter claps there.
        event.preventDefault();
        if (phase === "ready") start();
        const index = nextBird(played, view.handX, view.handY, arrow[0], arrow[1]);
        if (index >= 0) { view.handX = played.birds[index].x; view.handY = played.birds[index].y; }
        else { view.handX = Math.min(FIELD.right, Math.max(FIELD.left, view.handX + arrow[0] * 40)); view.handY = Math.min(FIELD.bottom, Math.max(FIELD.top, view.handY + arrow[1] * 40)); }
        view.handShown = true;
      } else if (phase === "playing" && here && (event.key === " " || event.key === "Enter")) {
        event.preventDefault();
        if (view && !event.repeat) { view.handShown = true; clap(view.handX, view.handY); }
      } else if (phase === "playing" && (event.key === "p" || event.key === "Escape")) { event.preventDefault(); pause(); }
      else if ((event.key === " " || event.key === "Enter") && here && document.activeElement === document.body) {
        if (phase === "paused") { event.preventDefault(); setPhase("playing"); }
        else { event.preventDefault(); start(); }
      }
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  });

  useEffect(() => { if (phase === "over") again.current?.focus({ preventScroll: true }); }, [phase]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("চড়ুই তাড়াও ধান বাঁচল ০১২৩৪৫৬৭৮৯%").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button > 0 || phase === "over" || phase === "paused") return;
    if (phase === "ready") start();
    const rect = canvas.current!.getBoundingClientRect();
    clap((event.clientX - rect.left) / rect.width * W, (event.clientY - rect.top) / rect.height * H);
  }

  const goToCard = () => document.getElementById("result")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  const keepTap = (event: ReactPointerEvent) => event.stopPropagation();
  const friendName = friend?.name || "";
  const won = Boolean(result && result.stars > 0);
  const hasNext = won && level < LEVEL_COUNT;
  const near = result ? nearLine(result.saved, result.level, result.before) : "";

  return (
    <div className="ct">
      {friend && (
        <section className="ct-friend" aria-labelledby="ct-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName || "বন্ধুর"} ছবি: লেভেল ${bn(friend.level)}, ${bn(friend.saved)}% ধান বাঁচল, ${bn(friend.shooed)}টা চড়ুই`} />
          <div>
            <p className="ct-friend-kicker">তোমার জন্য একটা চ্যালেঞ্জ</p>
            <h2 id="ct-friend-title">{friendName || "তোমার বন্ধু"} {bn(friend.saved)}% ধান বাঁচিয়েছে। <span>একই ক্ষেত, এবার তোমার পালা।</span></h2>
            <p>{friendName ? possessive(friendName) : "বন্ধুর"} নিজের ফোনের স্কোর, {bn(friend.shooed)}টা চড়ুই তাড়িয়েছে।</p>
          </div>
        </section>
      )}

      <p className="ct-level"><span><b>লেভেল {bn(level)}</b> · {field.name}</span><span aria-label={`মোট ${bn(allStars)}টা তারা`}>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></p>
      <div className="ct-stage" ref={stage} data-phase={phase} tabIndex={-1} onPointerDown={onPointerDown}>
        <canvas ref={canvas} role="img" aria-label="সোনালি বিকেলের পাকা ধানক্ষেত, এক পাশে কাকতাড়ুয়া। চড়ুই এসে ধানে বসে খায়। চড়ুইয়ের ওপর বা কাছে চাপলে হুশ করে উড়ে যায়। কিবোর্ডে তীর দিয়ে হাত সরাও, স্পেসে তালি দাও।" />
        {phase === "ready" && (
          <div className="ct-overlay ct-ready">
            <p className="ct-how">{level === 1 ? "চড়ুই বসলেই চাপো, হুশ!" : `লেভেল ${bn(level)} · ${field.name}`}</p>
            <button type="button" className="kit-primary ct-go" onPointerDown={keepTap} onClick={start}>শুরু করো</button>
            <p className="ct-sub">{level === 1 ? "যত তাড়াতাড়ি তাড়াবে, তত ধান বাঁচবে" : `${field.note} পার হতে ${bn(field.pass)}% ধান বাঁচাও।`}</p>
          </div>
        )}
        {phase === "paused" && (
          <div className="ct-overlay ct-dim">
            <p className="ct-how">খেলা থেমে আছে</p>
            <button type="button" className="kit-primary ct-go" onPointerDown={keepTap} onClick={() => setPhase("playing")}>চালিয়ে যাও</button>
          </div>
        )}
        <p className="screen-reader-only" aria-live="polite">{phase === "over" && result ? `খেলা শেষ। ${bn(result.saved)}% ধান বাঁচল, ${bn(result.shooed)}টা চড়ুই তাড়ালে। ${result.stars ? `${bn(result.stars)} তারা।` : ""} ${near} ${result.record ? " এই ফোনে নতুন রেকর্ড!" : ""}` : ""}</p>
        {phase === "over" && result && (
          <div className="ct-overlay ct-dim ct-over">
            <p className="ct-kicker">{result.reason === 2 ? "সব ধান খেয়ে ফেলল!" : "সন্ধ্যা নামল, চড়ুইরা বাসায় ফিরল।"}</p>
            {result.stars > 0 && <StarReveal count={result.stars} />}
            <p className="ct-big"><b>{bn(result.saved)}% ধান</b><span>বাঁচল, {bn(result.shooed)}টা চড়ুই হুশ!</span></p>
            {near && <p className="ct-near">{near}</p>}
            <p className="ct-best">{result.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null ? `এই ক্ষেতে সেরা: ${bn(best)}%` : ""}</p>
            {rival && rival.seed === result.seed && <p className="ct-versus">{compareLine(result, rival, friendName)}</p>}
            <div className="ct-actions">
              {hasNext && <button type="button" ref={again} className="kit-primary ct-go" onPointerDown={keepTap} onClick={() => pick(level + 1)}>পরের লেভেল</button>}
              <button type="button" ref={hasNext ? undefined : again} className={hasNext ? "kit-secondary" : "kit-primary ct-go"} onPointerDown={keepTap} onClick={start}>{won ? "আবার খেলো" : "আরেকবার"}</button>
            </div>
            <button type="button" className="ct-to-card" onPointerDown={keepTap} onClick={goToCard}>ছবি বানাও, বন্ধুকে পাঠাও ↓</button>
          </div>
        )}
      </div>

      <div className="ct-bar">
        <button type="button" className="ct-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}>
          <i aria-hidden="true" />ধীরে খেলো<small>নড়াচড়া কম</small>
        </button>
        <SoundToggle compact />
        <button type="button" className="ct-pause" onClick={phase === "paused" ? () => setPhase("playing") : pause} disabled={phase !== "playing" && phase !== "paused"}>
          {phase === "paused" ? "চালিয়ে যাও" : "থামাও"}
        </button>
      </div>

      <details className="ct-levels">
        <summary>সব লেভেল <span>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p>দশটা ক্ষেত। প্রতিটায় চড়ুই একটু বেশি, নয়তো একটু দ্রুত। পার হলে পরেরটা খোলে, খোলা ক্ষেত খোলাই থাকে।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level} onPick={pick} />
      </details>

      {card && result && (
        <section className="ct-result" id="result" aria-labelledby="ct-result-title">
          <div className="ct-result-head">
            <h2 id="ct-result-title"><em>{bn(card.saved)}% ধান</em> বাঁচল, {bn(card.shooed)}টা চড়ুই হুশ!</h2>
            <p>{rival && rival.seed === card.seed ? `${compareLine(card, rival, friendName)} ${humanLine(card.saved)}` : humanLine(card.saved)}</p>
          </div>
          <div className="ct-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ct-card-summary" />
              <figcaption id="ct-card-summary" className="ct-sr">চড়ুই তাড়াও{card.name && ` · ${card.name}`}, লেভেল {bn(card.level)}: {bn(card.saved)}% ধান বাঁচল, {bn(card.shooed)}টা চড়ুই তাড়ানো হলো। {humanLine(card.saved)}</figcaption>
              {cardError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="ct-controls">
              <label className="ct-name">
                <span>তোমার নাম <small>ছবিতে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="churui-tarao.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই ক্ষেতটাই পাবে, একই চড়ুই একই জায়গায়।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
