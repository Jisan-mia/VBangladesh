"use client";
// IP: what we avoided — no famous runner game's name, look, camera or characters: no three-lane chase from behind, no rails, trains, guards, temples or coins, no "run"/"surf" in the title; ours is a side-on village lane drawn from scratch, a kid in a plain school shirt with a satchel, and our own rule numbers.

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, cleanName, confetti, hiss, newSeed, sfx, tone, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, makeScene, paintGate, popup, setKid, tickScene, type Scene } from "../lib/draw-scene";
import { bn, bumpLine, caption, compareLine, headline, humanLine, migrateLevels, nearMiss, parseShareHash, shareHash, type Shared } from "../lib/result";
import {
  createRun, dayOf, dayStars, gateOf, girlFor, pressDuck, pressJump, releaseDuck, releaseJump, stepRun,
  CRASH, DAY_COUNT, GATE, GOT_PAGE, GOT_TIFFIN, JUMPED, LANDED, MILESTONE, PAGES, PUDDLE, SAVED, SLOW_CAP, TOP, type Run,
} from "../lib/road";

const TOOL = "deri-hoye-gelo";
/** Slow mode runs the road at this speed (and SLOW_CAP stops it getting faster). */
const SLOW_TIME = 0.7;
/** After "চালিয়ে যাও" the road waits this long, so nothing jumps out at a thumb still on the button. */
const RESUME_GRACE = 0.7;
/** A finger that moves this far down (CSS pixels) is a swipe: duck. */
const SWIPE = 22;
const LEVELS_KEY = `ektukhani-levels-${TOOL}`, BEST_KEY = `ektukhani-best-${TOOL}`;
type Phase = "ready" | "playing" | "paused" | "over";
type Result = Shared & { kind: number; record: boolean; day: number; stars: number; pages: number; best: number | null };

// The road's sounds, all made in code: soft footsteps, a hop, a landing, the ছপাৎ of a puddle, a bump, a page caught, and the school bell at the gate.
const footstep = (left: boolean) => tone(left ? 150 : 135, 0.05, 0.035, "sine", 0, 80);
const hop = () => tone(380, 0.09, 0.05, "triangle", 0, 620);
const land = () => tone(120, 0.06, 0.06, "sine", 0, 70);
const bump = () => { sfx.thud(); tone(196, 0.16, 0.06, "square", 0.05, 150); };
const schoolBell = () => { for (let ring = 0; ring < 3; ring++) { tone(880, 0.9, 0.1, "triangle", ring * 0.38); tone(1320, 0.6, 0.045, "sine", ring * 0.38); tone(2210, 0.35, 0.025, "sine", ring * 0.38); } buzz([20, 40, 20]); };

export function LateGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [slow, setSlow] = useSlowMode();
  // Before the level store is read: an old phone's best on the endless road opens the days it passed (once).
  useEffect(() => {
    try {
      const moved = migrateLevels(localStorage.getItem(LEVELS_KEY), localStorage.getItem(BEST_KEY));
      if (moved) localStorage.setItem(LEVELS_KEY, moved);
    } catch { /* storage blocked: nothing to move */ }
  }, []);
  const levels = useLevels(TOOL, DAY_COUNT);
  const [best, submitBest] = useBest(TOOL);
  // The day being played or about to be (1..DAY_COUNT), or 0 for the endless road.
  const [day, setDay] = useState(1);
  const chosen = useRef(false);
  const heard = useRef({ events: 0, step: 0 });
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
  const run = useRef<Run | null>(null);
  const fonts = useRef(false);
  const grace = useRef(0);
  const overAt = useRef(0);
  const finished = useRef(false);
  const pointer = useRef({ id: -1, x: 0, y: 0, ducked: false });

  const card: Shared | null = result ? { seed: result.seed, meters: result.meters, name: cleanName(name), ...(result.day ? { day: result.day } : {}) } : null;
  const state = card ? shareHash(card) : "";
  const friendFits = (forDay: number) => Boolean(friend) && (friend!.day ?? 0) === forDay;

  function start(forDay = day) {
    const seed = friendFits(forDay) ? friend!.seed : newSeed();
    run.current = createRun(seed, slow ? SLOW_CAP : TOP, forDay);
    heard.current = { events: 0, step: 0 };
    setDay(forDay);
    if (scene.current) setKid(scene.current, girlFor(seed));
    grace.current = 0;
    finished.current = false;
    pointer.current.id = -1;
    setResult(null);
    setPhase("playing");
  }

  function letGo() {
    const current = run.current;
    if (current) { releaseJump(current); releaseDuck(current); }
    pointer.current.id = -1;
  }

  function pause() { letGo(); setPhase(current => current === "playing" ? "paused" : current); }
  function resume() {
    grace.current = RESUME_GRACE;
    if (scene.current && run.current) popup(scene.current, run.current.t, "চলো!", "#ffffff");
    setPhase("playing");
  }

  function finish(played: Run) {
    if (finished.current) return;
    finished.current = true;
    letGo();
    const stars = dayStars(played);
    if (stars) levels.record(played.day, stars);
    const before = best, record = !played.day && submitBest(played.meters) && played.meters > 0;
    overAt.current = performance.now();
    setResult({ seed: played.seed, meters: played.meters, name: "", kind: played.hitKind, record, day: played.day, stars, pages: played.pages, best: before });
    setPhase("over");
    // Confetti only for three stars, the last day, or a new best on the endless road; a plain day gets the stars' own notes and the bell.
    const party = stars === 3 || (stars > 0 && played.day === DAY_COUNT) || record;
    window.setTimeout(() => { if (party) { if (record) sfx.win(); else sfx.levelUp(); confetti(); } else if (stars) sfx.good(); }, stars ? 1500 : 500);
  }

  /** Sounds for what just happened on the road (events are rare), plus a soft footstep every stride on the ground. */
  function listen(played: Run) {
    const ear = heard.current;
    for (; ear.events < played.eventCount; ear.events++) {
      const event = played.events[ear.events % played.events.length];
      if (event.type === JUMPED) hop();
      else if (event.type === LANDED) land();
      else if (event.type === GOT_TIFFIN) sfx.coin();
      else if (event.type === GOT_PAGE) { sfx.pick(); sfx.combo(played.pages + 1); }
      else if (event.type === SAVED) { sfx.pop(); hiss(0.2, 0.12, 900); }
      else if (event.type === MILESTONE) sfx.tick();
      else if (event.type === GATE) schoolBell();
      else if (event.type === CRASH) { if (played.hitKind === PUDDLE) { sfx.splash(); buzz(40); } else bump(); }
    }
    const stride = Math.floor(played.d / 36);
    if (stride !== ear.step) { ear.step = stride; if (played.air < 0 && !played.ducking && !played.over) footstep(stride % 2 === 0); }
  }

  const step = (dt: number) => {
    const played = run.current;
    if (phase === "playing" && played && !played.over) {
      if (grace.current > 0) grace.current -= dt;
      else {
        played.cap = slow ? SLOW_CAP : TOP;
        const hadTiffin = played.tiffin;
        stepRun(played, slow ? dt * SLOW_TIME : dt);
        if (played.tiffin !== hadTiffin) buzz(10);
        listen(played);
        if (played.over) finish(played);
      }
    }
    if (scene.current) tickScene(scene.current, slow ? dt * SLOW_TIME : dt, phase === "ready");
  };
  const draw = () => { if (scene.current) drawScene(scene.current, phase === "ready" ? null : run.current, slow, friend && friendFits(day) ? friend : null, gateOf(day)); };
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const pauseRef = useRef(pause);
  pauseRef.current = pause;
  // On the ready screen the kid already runs in place (not in slow mode); the loop stops when paused or over.
  useGameLoop(step, draw, phase === "playing" || (phase === "ready" && !slow));

  useEffect(() => {
    const element = canvas.current;
    if (!element) return;
    const build = () => {
      if (element.clientWidth <= 0) return;
      const girl = run.current ? girlFor(run.current.seed) : scene.current?.girl ?? false;
      scene.current = makeScene(element, element.clientWidth, girl, scene.current);
      if (fonts.current) paintGate(scene.current);
      drawRef.current();
    };
    build();
    loadCardFonts("দেরি হয়ে গেল স্কুল গেট ০১২৩৪৫৬৭৮৯").then(() => {
      fonts.current = true;
      if (scene.current) paintGate(scene.current);
      drawRef.current();
    }).catch(() => { /* the system font draws the numbers instead */ });
    const observer = new ResizeObserver(build);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    // In-page anchors also change the hash, so only a real challenge counts.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      chosen.current = true;
      setDay(shared.day ?? 0);
      if (scene.current) { setKid(scene.current, girlFor(shared.seed)); drawRef.current(); }
      setPhase(current => current === "playing" ? current : "ready");
    };
    readFriend();
    setSite(window.location.host);
    const hide = () => { if (document.hidden) pauseRef.current(); };
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", readFriend); document.removeEventListener("visibilitychange", hide); };
  }, []);

  useEffect(() => {
    const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName));
    const isJump = (key: string) => key === " " || key === "ArrowUp" || key === "w" || key === "W";
    const isDuck = (key: string) => key === "ArrowDown" || key === "s" || key === "S";
    const down = (event: KeyboardEvent) => {
      if (typing(event.target) || event.altKey || event.ctrlKey || event.metaKey) return;
      const here = document.activeElement === document.body || Boolean(stage.current?.contains(document.activeElement));
      const current = run.current;
      if (phase === "playing" && current) {
        if (isJump(event.key) || isDuck(event.key)) {
          event.preventDefault();
          if (!event.repeat) { if (isJump(event.key)) pressJump(current); else pressDuck(current); }
        } else if (event.key === "p" || event.key === "P" || event.key === "Escape") { event.preventDefault(); pause(); }
        return;
      }
      if (!here || !(isJump(event.key) || event.key === "Enter")) return;
      if (phase === "ready") { event.preventDefault(); start(); }
      else if (phase === "paused") { event.preventDefault(); resume(); }
      else if (phase === "over" && performance.now() - overAt.current > 600 && document.activeElement === document.body) { event.preventDefault(); primary(); }
    };
    const up = (event: KeyboardEvent) => {
      const current = run.current;
      if (!current) return;
      // Space on a focused button would also "click" it on keyup: during play the key belongs to the game.
      if (phase === "playing" && (isJump(event.key) || isDuck(event.key)) && !typing(event.target)) event.preventDefault();
      if (isJump(event.key)) releaseJump(current);
      else if (isDuck(event.key)) releaseDuck(current);
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  });

  // Saved stars load after the first paint: open the furthest day reached, unless the player or a friend's link chose one.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    chosen.current = true;
    setDay(current => phase === "ready" ? levels.unlocked : current);
  }, [levels.loaded]);

  // "আরেকবার" takes focus a moment after a bump, so a jump pressed at the instant of the bump doesn't restart at once.
  useEffect(() => {
    if (phase !== "over") return;
    const timer = window.setTimeout(() => again.current?.focus({ preventScroll: true }), 600);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("দেরি হয়ে গেল মিটার ০১২৩৪৫৬৭৮৯").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site, result?.stars ?? 0);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend, result?.stars]);

  function onStageDown(event: ReactPointerEvent<HTMLDivElement>) {
    const control = pointer.current;
    if (event.button > 0 || control.id !== -1 || phase === "over" || phase === "paused") return;
    if (phase === "ready") start();
    else if (run.current) pressJump(run.current);
    Object.assign(control, { id: event.pointerId, x: event.clientX, y: event.clientY, ducked: false });
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* the pointer is already gone */ }
  }

  function onStageMove(event: ReactPointerEvent<HTMLDivElement>) {
    const control = pointer.current, current = run.current;
    if (event.pointerId !== control.id || control.ducked || !current) return;
    const dy = event.clientY - control.y, dx = event.clientX - control.x;
    if (dy > SWIPE && dy > Math.abs(dx)) { control.ducked = true; pressDuck(current); }
  }

  function onStageUp(event: ReactPointerEvent<HTMLDivElement>) {
    const control = pointer.current, current = run.current;
    if (event.pointerId !== control.id) return;
    if (current) { if (control.ducked) releaseDuck(current); else releaseJump(current); }
    control.id = -1;
  }

  // The two big buttons: press and hold work by touch; a keyboard "click" (detail 0) is a quick tap.
  function buttonDown(event: ReactPointerEvent<HTMLButtonElement>, duck: boolean) {
    if (event.button > 0) return;
    if (phase === "ready") { start(); return; }
    const current = run.current;
    if (phase !== "playing" || !current) return;
    if (duck) pressDuck(current); else pressJump(current);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* fine */ }
  }
  function buttonUp(duck: boolean) {
    const current = run.current;
    if (current) { if (duck) releaseDuck(current); else releaseJump(current); }
  }
  function buttonClick(event: ReactMouseEvent<HTMLButtonElement>, duck: boolean) {
    if (event.detail !== 0) return;
    if (phase === "ready") { start(); return; }
    const current = run.current;
    if (phase !== "playing" || !current) return;
    if (duck) { pressDuck(current); releaseDuck(current); } else { pressJump(current); releaseJump(current); }
  }

  function restart() { if (performance.now() - overAt.current > 450) start(); }
  const nextDay = result && result.stars && result.day < DAY_COUNT ? result.day + 1 : 0;
  /** After a day: the next one when this one is done, else the same day again. */
  function primary() { if (performance.now() - overAt.current > 450) start(nextDay || day); }
  /** A day from the grid, or the endless road: back to the ready screen. */
  function choose(to: number) {
    chosen.current = true;
    setDay(to); setResult(null); setPhase("ready");
    stage.current?.scrollIntoView({ behavior: slow ? "auto" : "smooth", block: "center" });
  }
  const gate = gateOf(day), miss = result ? nearMiss({ day: result.day, meters: result.meters, stars: result.stars, pages: result.pages, best: result.best }) : "";

  const goToCard = () => document.getElementById("result")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  const keepTap = (event: ReactPointerEvent) => event.stopPropagation();
  const friendName = friend?.name || "";

  return (
    <div className="dh">
      {friend && (
        <section className="dh-friend" aria-labelledby="dh-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName || "বন্ধুর"} ছবি: ${bn(friend.meters)} মিটার`} />
          <div>
            <p className="dh-friend-kicker">তোমার জন্য একটা চ্যালেঞ্জ</p>
            <h2 id="dh-friend-title">{friendName || "তোমার বন্ধু"} {bn(friend.meters)} মিটার গেছে। <span>একই রাস্তা, এবার তোমার পালা।</span></h2>
            <p>{friendName ? possessive(friendName) : "বন্ধুর"} নিজের ফোনের স্কোর। রাস্তার পাশে পতাকা দেখলেই বুঝবে, ওখানেই থেমেছিল।</p>
          </div>
        </section>
      )}

      <div className="dh-top">
        <p className="dh-where">{day ? <>{dayOf(day).name} <span>· {bn(gate)} মিটারে গেট · ★ {bn(totalStars(levels.stars))}/{bn(DAY_COUNT * 3)}</span></> : <>যত দূর পারো <span>· শেষ নেই{best !== null ? `, সেরা ${bn(best)} মি` : ""}</span></>}</p>
        <SoundToggle compact />
      </div>

      <div className="dh-stage" ref={stage} data-phase={phase} tabIndex={-1}
        onPointerDown={onStageDown} onPointerMove={onStageMove} onPointerUp={onStageUp} onPointerCancel={onStageUp}>
        <canvas ref={canvas} role="img" aria-label="গ্রামের রাস্তা ধরে স্কুলের পথে এক বাচ্চা, পিঠে ব্যাগ। চাপ দিলে লাফ, নিচে টানলে মাথা নিচু। স্পেস বা ওপরের তীরে লাফ, নিচের তীরে নিচু।" />
        {phase === "ready" && (
          <div className="dh-overlay dh-ready">
            <p className="dh-how">চাপ দিলে লাফ</p>
            <p className="dh-sub">নিচে টানলে মাথা নিচু · {bn(gate)} মিটারে গেট</p>
            {day > 0 && <p className="dh-target">খাতার পাতা কুড়াও: ২টায় <b>★★</b>, {bn(PAGES)}টায় <b>★★★</b></p>}
            <button type="button" className="kit-primary dh-go" onPointerDown={keepTap} onClick={() => start()}>শুরু করো</button>
          </div>
        )}
        {phase === "paused" && (
          <div className="dh-overlay dh-dim">
            <p className="dh-how">খেলা থেমে আছে</p>
            <button type="button" className="kit-primary dh-go" onPointerDown={keepTap} onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
        <p className="screen-reader-only" aria-live="polite">{phase === "over" && result ? `খেলা শেষ। ${bn(result.meters)} মিটার গেলে। ${result.stars ? `${dayOf(result.day).name}ের গেটে, ${bn(result.stars)} তারা।` : ""}${result.record ? " এই ফোনে নতুন রেকর্ড!" : ""} ${miss}` : ""}</p>
        {phase === "over" && result && (
          <div className="dh-overlay dh-bump">
            <p className="dh-kicker">{result.stars ? `${dayOf(result.day).name}ের গেটে! ঘণ্টা পড়ার আগেই।` : bumpLine(result.kind)}</p>
            {result.stars > 0 ? <StarReveal count={result.stars} /> : <p className="dh-headline">{headline(result.meters, gateOf(result.day))}</p>}
          </div>
        )}
      </div>

      {phase === "over" && result ? (
        <div className="dh-over">
          <p className="dh-score"><b>{bn(result.meters)} মিটার</b><span>{result.day ? `খাতার পাতা ${bn(result.pages)}/${bn(PAGES)}` : result.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null ? `এই ফোনে সেরা: ${bn(best)} মিটার` : ""}</span></p>
          {miss && <p className="dh-miss">{miss}</p>}
          {friend && friendFits(result.day) && <p className="dh-versus">{compareLine(result.meters, friend.meters, friendName)}</p>}
          <div className="dh-over-actions" data-two={nextDay > 0}>
            <button type="button" ref={again} className="kit-primary dh-again" onClick={nextDay ? primary : restart}>{nextDay ? "পরের দিন" : "আরেকবার"}</button>
            {nextDay > 0 && <button type="button" className="dh-to-card" onClick={restart}>আবার খেলো</button>}
            <button type="button" className="dh-to-card" onClick={goToCard}>ছবি বানাও ↓</button>
          </div>
        </div>
      ) : (
        <div className="dh-pad" aria-label="লাফ আর নিচু হওয়ার বোতাম">
          <button type="button" className="dh-duck" disabled={phase === "paused"}
            onPointerDown={event => buttonDown(event, true)} onPointerUp={() => buttonUp(true)} onPointerCancel={() => buttonUp(true)} onClick={event => buttonClick(event, true)}>
            <span aria-hidden="true">↓</span>নিচু হও
          </button>
          <button type="button" className="dh-jump" disabled={phase === "paused"}
            onPointerDown={event => buttonDown(event, false)} onPointerUp={() => buttonUp(false)} onPointerCancel={() => buttonUp(false)} onClick={event => buttonClick(event, false)}>
            <span aria-hidden="true">↑</span>লাফ দাও
          </button>
        </div>
      )}

      <div className="dh-bar">
        <button type="button" className="dh-toggle" aria-pressed={slow} onClick={() => setSlow(!slow)}>
          <i aria-hidden="true" />ধীরে খেলো<small>গতি কম, ঝাঁকুনি নেই</small>
        </button>
        <button type="button" className="dh-pause" onClick={phase === "paused" ? resume : pause} disabled={phase !== "playing" && phase !== "paused"}>
          {phase === "paused" ? "চালিয়ে যাও" : "থামাও"}
        </button>
      </div>

      <details className="dh-levels">
        <summary>সপ্তাহের সব দিন <span>★ {bn(totalStars(levels.stars))}/{bn(DAY_COUNT * 3)}</span></summary>
        <LevelGrid count={DAY_COUNT} stars={levels.stars} unlocked={Math.max(levels.unlocked, friend?.day ?? 1)} current={day || undefined} onPick={choose} noun="দিন" />
        <p>শনিবার থেকে বৃহস্পতিবার: প্রতিদিন গেট একটু দূরে, রাস্তায় নতুন কিছু। গেটে পৌঁছালে ১ তারা। খাতার ২টা পাতা কুড়ালে ২, ৩টাই কুড়ালে ৩ তারা।</p>
        <button type="button" className="dh-endless" aria-pressed={day === 0} onClick={() => choose(0)}>
          যত দূর পারো<small>১০০০ মিটারে গেট, তারপরও রাস্তা চলে{best !== null ? ` · সেরা ${bn(best)} মি` : ""}</small>
        </button>
      </details>

      {card && result && (
        <section className="dh-result" id="result" aria-labelledby="dh-result-title">
          <div className="dh-result-head">
            <h2 id="dh-result-title">স্কুলের পথে <em>{bn(card.meters)} মিটার</em></h2>
            <p>{friend && friendFits(result.day) ? `${compareLine(card.meters, friend.meters, friendName)} ${humanLine(card.meters, gateOf(result.day))}` : humanLine(card.meters, gateOf(result.day))}</p>
          </div>
          <div className="dh-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="dh-card-summary" />
              <figcaption id="dh-card-summary" className="dh-sr">দেরি হয়ে গেল!{card.day ? ` · ${dayOf(card.day).name}` : ""}{card.name && ` · ${card.name}`}: {bn(card.meters)} মিটার{result.stars ? `, ${bn(result.stars)} তারা` : ""}। {humanLine(card.meters, gateOf(result.day))}</figcaption>
              {cardError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="dh-controls">
              <label className="dh-name">
                <span>তোমার নাম <small>ছবিতে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="deri-hoye-gelo.png" makeImage={() => cardBlob(card, format, site, result.stars)} imageKey={`${state}|${format}|${result.stars}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই রাস্তাটাই পাবে, তোমার পতাকাসহ।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
