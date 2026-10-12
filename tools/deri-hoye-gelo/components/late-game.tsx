"use client";
// IP: what we avoided — no famous runner game's name, look, camera or characters: no three-lane chase from behind, no rails, trains, guards, temples or coins, no "run"/"surf" in the title; ours is a side-on village lane drawn from scratch, a kid in a plain school shirt with a satchel, and our own rule numbers.

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { cleanName, newSeed, useBest, useGameLoop, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene, makeScene, paintGate, popup, setKid, tickScene, type Scene } from "../lib/draw-scene";
import { bn, bumpLine, caption, compareLine, headline, humanLine, parseShareHash, shareHash, type Shared } from "../lib/result";
import { createRun, girlFor, pressDuck, pressJump, releaseDuck, releaseJump, stepRun, SLOW_CAP, TOP, type Run } from "../lib/road";

const TOOL = "deri-hoye-gelo";
/** Slow mode runs the road at this speed (and SLOW_CAP stops it getting faster). */
const SLOW_TIME = 0.7;
/** After "চালিয়ে যাও" the road waits this long, so nothing jumps out at a thumb still on the button. */
const RESUME_GRACE = 0.7;
/** A finger that moves this far down (CSS pixels) is a swipe: duck. */
const SWIPE = 22;
type Phase = "ready" | "playing" | "paused" | "over";
type Result = Shared & { kind: number; record: boolean };

export function LateGame() {
  const [phase, setPhase] = useState<Phase>("ready");
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL);
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

  const card: Shared | null = result ? { seed: result.seed, meters: result.meters, name: cleanName(name) } : null;
  const state = card ? shareHash(card) : "";

  function start() {
    const seed = friend ? friend.seed : newSeed();
    run.current = createRun(seed, slow ? SLOW_CAP : TOP);
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
    const record = submitBest(played.meters) && played.meters > 0;
    overAt.current = performance.now();
    setResult({ seed: played.seed, meters: played.meters, name: "", kind: played.hitKind, record });
    setPhase("over");
  }

  const step = (dt: number) => {
    const played = run.current;
    if (phase === "playing" && played && !played.over) {
      if (grace.current > 0) grace.current -= dt;
      else {
        played.cap = slow ? SLOW_CAP : TOP;
        const hadTiffin = played.tiffin;
        stepRun(played, slow ? dt * SLOW_TIME : dt);
        if (played.tiffin !== hadTiffin && !slow && "vibrate" in navigator) navigator.vibrate(10);
        if (played.over) finish(played);
      }
    }
    if (scene.current) tickScene(scene.current, slow ? dt * SLOW_TIME : dt, phase === "ready");
  };
  const draw = () => { if (scene.current) drawScene(scene.current, phase === "ready" ? null : run.current, slow, friend); };
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
      else if (phase === "over" && performance.now() - overAt.current > 600 && document.activeElement === document.body) { event.preventDefault(); start(); }
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
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setCardError(false);
    }).catch(() => { if (!cancelled) setCardError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

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

      <div className="dh-stage" ref={stage} data-phase={phase} tabIndex={-1}
        onPointerDown={onStageDown} onPointerMove={onStageMove} onPointerUp={onStageUp} onPointerCancel={onStageUp}>
        <canvas ref={canvas} role="img" aria-label="গ্রামের রাস্তা ধরে স্কুলের পথে এক বাচ্চা, পিঠে ব্যাগ। চাপ দিলে লাফ, নিচে টানলে মাথা নিচু। স্পেস বা ওপরের তীরে লাফ, নিচের তীরে নিচু।" />
        {phase === "ready" && (
          <div className="dh-overlay dh-ready">
            <p className="dh-how">চাপ দিলে লাফ</p>
            <p className="dh-sub">নিচে টানলে মাথা নিচু · ১০০০ মিটারে গেট</p>
            <button type="button" className="kit-primary dh-go" onPointerDown={keepTap} onClick={start}>শুরু করো</button>
          </div>
        )}
        {phase === "paused" && (
          <div className="dh-overlay dh-dim">
            <p className="dh-how">খেলা থেমে আছে</p>
            <button type="button" className="kit-primary dh-go" onPointerDown={keepTap} onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
        <p className="screen-reader-only" aria-live="polite">{phase === "over" && result ? `খেলা শেষ। ${bn(result.meters)} মিটার গেলে। ${result.record ? " এই ফোনে নতুন রেকর্ড!" : ""}` : ""}</p>
        {phase === "over" && result && (
          <div className="dh-overlay dh-bump">
            <p className="dh-kicker">{bumpLine(result.kind)}</p>
            <p className="dh-headline">{headline(result.meters)}</p>
          </div>
        )}
      </div>

      {phase === "over" && result ? (
        <div className="dh-over">
          <p className="dh-score"><b>{bn(result.meters)} মিটার</b><span>{result.record ? "এই ফোনে নতুন রেকর্ড!" : best !== null ? `এই ফোনে সেরা: ${bn(best)} মিটার` : ""}</span></p>
          {friend && <p className="dh-versus">{compareLine(result.meters, friend.meters, friendName)}</p>}
          <div className="dh-over-actions">
            <button type="button" ref={again} className="kit-primary dh-again" onClick={restart}>আরেকবার</button>
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

      {card && result && (
        <section className="dh-result" id="result" aria-labelledby="dh-result-title">
          <div className="dh-result-head">
            <h2 id="dh-result-title">স্কুলের পথে <em>{bn(card.meters)} মিটার</em></h2>
            <p>{friend ? `${compareLine(card.meters, friend.meters, friendName)} ${humanLine(card.meters)}` : humanLine(card.meters)}</p>
          </div>
          <div className="dh-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="dh-card-summary" />
              <figcaption id="dh-card-summary" className="dh-sr">দেরি হয়ে গেল!{card.name && ` · ${card.name}`}: {bn(card.meters)} মিটার। {humanLine(card.meters)}</figcaption>
              {cardError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="dh-controls">
              <label className="dh-name">
                <span>তোমার নাম <small>ছবিতে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="deri-hoye-gelo.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="বন্ধু লিংক খুললে ঠিক এই রাস্তাটাই পাবে, তোমার পতাকাসহ।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
