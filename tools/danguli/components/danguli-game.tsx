"use client";
// IP: what we avoided — no names, logos, characters, sounds or look from any sports brand or other tipcat app; never "গুলি" on its own and no gun imagery; every figure is drawn fresh from plain shapes.

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, confetti, fitCanvas, hiss, MAX_NAME, newSeed, readLevels, sfx, tone, totalStars, unlockedLevel, useBest, useGameLoop, useLevels, useSlowMode, buzz } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, makeScene, react, resizeScene, strikeFeel, updateScene } from "../lib/draw-scene";
import { LEVEL_COUNT, LEVELS, migrateBest, newGame, nextMark, starsOf, step, tap, tokenOf, totalOf, type Phase } from "../lib/game";
import { bn, caption, cardHash, HITS, friendBanner, friendNote, hitLabel, hitNews, humanLine, matchLine, ordinal, parseCard, versusLine, type Card } from "../lib/result";

const TOOL = "danguli";
const stored = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
/** When each won star pops in on the result, in seconds (the CSS delay and the sound share it). */
const starAt = (index: number) => 0.3 + index * 0.28;

/** The flick: a light wooden tick as the কাঠি jumps. */
const flick = () => tone(620, 0.07, 0.12, "triangle", 0, 1100);
/** The ডাং meets the কাঠি: a wooden knock, deeper and louder for a cleaner hit. */
const knock = (quality: number) => tone(150 + 200 * quality, 0.16, 0.2, "square", 0, 70);
/** The kids on the side go "ওওও" for a big hit. */
const crowd = () => { [196, 247, 294, 349].forEach((frequency, index) => tone(frequency, 0.8, 0.035, "triangle", index * 0.02, frequency * 1.3)); hiss(0.7, 0.04, 900); };

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
  const [level, setLevel] = useState(1);
  // Level 1 keeps the key the one-field game used, so the old best stays level 1's best.
  const [best, submitBest] = useBest(level === 1 ? TOOL : `${TOOL}-${level}`);
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [record, setRecord] = useState(false);
  const [previousBest, setPreviousBest] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  const [news, setNews] = useState("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const shots = game.current.shots;
  const over = phase === "over";
  const revealed = phase === "rest" || over ? hit + 1 : hit;
  const total = totalOf(shots.slice(0, revealed));
  const card: Card | null = over ? { seed: game.current.seed, total, hits: shots.map(tokenOf), name: cleanName(name), level } : null;
  const state = card ? cardHash(card) : "";
  const rival = friend && friend.seed === game.current.seed && friend.level === level ? friend : null;
  const versus = rival && card ? versusLine(card.total, rival.total, rival.name) : "";
  const match = LEVELS[level - 1];
  const earned = starsOf(total, level), mark = nextMark(total, level);
  const open = Math.max(levels.unlocked, friend?.level ?? 1);
  const allStars = totalStars(levels.stars);

  const draw = () => { if (context.current) drawScene(context.current, scene.current, game.current); };

  /** Mirrors the game's phase into React only when it changes, never every frame. */
  function sync() {
    const now = game.current, last = seen.current;
    if (now.phase === last.phase && now.hit === last.hit) return;
    last.phase = now.phase; last.hit = now.hit;
    setPhase(now.phase); setHit(now.hit);
    if (now.phase === "rest") {
      const shot = now.shots[now.hit], sum = totalOf(now.shots), rivalScore = LEVELS[now.level - 1].score;
      react(scene.current, shot); setNews(hitNews(shot));
      if (shot.kind === "pond") sfx.splash();
      else if (shot.kind === "caught" || shot.kind === "ground" || shot.kind === "whiff") {
        if (shot.kind === "caught") sfx.wrong(); else sfx.drop();
        if (!slow) stage.current?.animate?.([{ transform: "translateX(0)" }, { transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "translateX(0)" }], { duration: 200, easing: "ease-out" });
      } else if (shot.distance >= 25) crowd();
      else sfx.thud();
      // The hit that takes the total past the rival wins the match.
      if (sum > rivalScore && sum - shot.distance <= rivalScore) sfx.levelUp();
    }
    if (now.phase === "over") finish(totalOf(now.shots));
  }

  function finish(sum: number) {
    const at = game.current.level, stars = starsOf(sum, at), beaten = submitBest(sum) && best !== null;
    if (stars) levels.record(at, stars);
    setPreviousBest(best);
    setRecord(beaten);
    setNews(`খেলা শেষ! তিন মারে ${bn(sum)} ডাং। ${matchLine(sum, at)}${stars ? ` ${bn(stars)} তারা।` : ""}`);
    const later = (seconds: number, play: () => void) => timers.current.push(window.setTimeout(play, seconds * 1000));
    for (let star = 0; star < stars; star++) later(starAt(star), () => sfx.star(star));
    if (stars === 3 || beaten) later(starAt(stars), () => { sfx.win(); confetti(); });
    else if (stars > 0) later(starAt(stars), sfx.good);
  }

  function press() {
    if (paused) { setPaused(false); return; }
    const now = game.current, before = now.phase;
    if (!tap(now)) return;
    if (before === "aim") flick();
    if (before === "pop") {
      const shot = now.shots[now.hit];
      if (shot.kind === "whiff") sfx.whoosh();
      else {
        strikeFeel(scene.current, shot);
        knock(shot.quality);
        if (!slow) buzz(12);
      }
    }
    sync();
  }

  function start(seed: number, nextLevel: number) {
    game.current = newGame(seed, nextLevel);
    seen.current = { phase: "aim", hit: 0 };
    timers.current.forEach(clearTimeout); timers.current = [];
    setLevel(nextLevel); setPhase("aim"); setHit(0); setPaused(false); setRecord(false); setNews("");
    scene.current.mood = "idle"; scene.current.shoutTime = 0;
  }

  function play(nextLevel: number, seed = newSeed()) {
    start(seed, nextLevel);
    if ((stage.current?.getBoundingClientRect().top ?? 0) < 0) stage.current?.scrollIntoView({ block: "center", behavior: slow ? "auto" : "smooth" });
  }
  function again(fresh = false) {
    if (fresh && friend) { setFriend(null); history.replaceState(null, "", window.location.pathname); }
    play(level, rival && !fresh ? rival.seed : newSeed());
  }
  const won = over && earned > 0;
  const proceed = () => won && level < LEVEL_COUNT ? play(level + 1) : again();

  useGameLoop(dt => {
    step(game.current, dt, slow);
    updateScene(scene.current, game.current, dt, slow);
    sync();
  }, draw, !paused && !over);

  useEffect(() => {
    // In-page anchors (#result) also change the hash: only a real challenge link starts a friend's field.
    const read = () => { const shared = parseCard(window.location.hash); if (shared) { setFriend(shared); start(shared.seed, shared.level); } return shared; };
    let saved = readLevels(stored(`ektukhani-levels-${TOOL}`), LEVEL_COUNT);
    const migrated = migrateBest(saved, stored(`ektukhani-best-${TOOL}`));
    if (migrated) { levels.record(1, migrated); saved = { 1: migrated }; }
    if (!read()) start(newSeed(), unlockedLevel(saved, LEVEL_COUNT));
    const onHash = () => { read(); };
    window.addEventListener("hashchange", onHash);
    setSite(window.location.host);
    return () => { window.removeEventListener("hashchange", onHash); timers.current.forEach(clearTimeout); };
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
      if (event.key === " " || event.key === "Enter" || event.key === "ArrowUp") { event.preventDefault(); if (over) proceed(); else press(); }
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

  // The near miss, with the exact gap: to beating the rival or the next star, or (at three stars) to this phone's best.
  const nearLine = !over ? "" : mark ? `আর ${bn(mark - total)} ডাং হলেই ${earned ? `${bn(earned + 1)} তারা` : "জিততে"}।`
    : previousBest !== null && !record ? `আর ${bn(previousBest - total + 1)} ডাং হলেই নতুন সেরা।` : "";
  const shot = shots[hit];
  const hint = paused ? "থামানো আছে। চাপলেই আবার চলবে।"
    : phase === "aim" ? (hit === 0 ? `${match.rival} মেরেছে ${bn(match.score)} ডাং। একবার চাপো, কাঠি লাফাবে। নামার সময় আবার চাপো।` : `${ordinal(hit)} মার। চাপো, কাঠি তোলো।`)
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

        <p className="dg-level"><span><b>লেভেল {bn(level)}</b> · {match.rival}, {bn(match.score)} ডাং</span> <span className="dg-level-stars" aria-label={`মোট ${bn(allStars)}টা তারা`}>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></p>
        <div className="dg-hud">
          <ol className="dg-hits" aria-label="তিন মার">
            {[0, 1, 2].map(index => (
              <li key={index} data-now={index === hit && !over && phase !== "rest"} data-done={index < revealed}>
                <span>{ordinal(index)}</span><b>{index < revealed && shots[index] ? hitLabel(tokenOf(shots[index])) : "—"}</b>
              </li>
            ))}
          </ol>
          <p className="dg-total">মোট <b key={earned} data-won={earned > 0}>{bn(total)}</b> ডাং{rival && <small> · লক্ষ্য {bn(rival.total)}</small>}</p>
        </div>

        <div className="dg-stage" ref={stage}>
          <canvas ref={canvas} onPointerDown={onStage} aria-hidden="true" />
          {paused && <button type="button" className="kit-primary dg-resume" onClick={() => setPaused(false)}>চালিয়ে যাও</button>}
        </div>
        <p className="dg-hint">{hint}</p>
        <p className="dg-sr" aria-live="polite">{news}</p>

        {over ? (
          <div className="dg-over">
            <p className="dg-over-kicker">{matchLine(total, level)}</p>
            <p className="gx-stars dg-over-stars" role="img" aria-label={`৩টার মধ্যে ${bn(earned)}টা তারা`}>
              {[0, 1, 2].map(star => <span key={star} className={star < earned ? "on gx-pop" : ""} style={{ animationDelay: `${starAt(star)}s` }}>★</span>)}
            </p>
            <p className="dg-score"><b>{bn(total)}</b> ডাং</p>
            {nearLine && <p className="dg-near">{nearLine}</p>}
            <p className="dg-best">{record ? "নতুন রেকর্ড! এই ফোনে এটাই সেরা।" : best !== null ? `এই ফোনে এই লেভেলের সেরা: ${bn(best)} ডাং` : ""}</p>
            {versus && <p className="dg-versus">{versus}</p>}
            <div className="dg-over-actions">
              {won && level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => play(level + 1)}>পরের লেভেল</button>}
              <button type="button" className={won && level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={() => again()}>{won ? "আবার খেলো" : "আরেকবার"}</button>
            </div>
            {friend && <button type="button" className="kit-link" onClick={() => again(true)}>নতুন মাঠে খেলো</button>}
          </div>
        ) : (
          <button type="button" className="kit-primary dg-tap" data-phase={phase} disabled={phase === "fly" && !paused} onPointerDown={onButtonDown} onClick={onButtonClick}>{paused ? "চালিয়ে যাও" : label}</button>
        )}

        <div className="dg-toggles">
          <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          <SoundToggle />
          {!over && <button type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "চালাও" : "থামাও"}</button>}
        </div>

        <details className="dg-levels">
          <summary>সব লেভেল <span>★ {bn(allStars)}/{bn(LEVEL_COUNT * 3)}</span></summary>
          <p>পাড়ার ১০ জনের সঙ্গে ম্যাচ। যার সঙ্গে খেলবে, তার ডাং পার হলেই জিত, পরের জন খোলে। পরের মাঠে বাতাস বেশি, কাঠি নামে জোরে, ফিল্ডারও বাড়ে।</p>
          <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={open} current={level} onPick={next => play(next)} />
        </details>
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
