"use client";

import { useEffect, useRef, useState, type PointerEvent, type MouseEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, type Tally } from "../../../shared/share-client";
import { buzz, confetti, hiss, sfx, shake, tone } from "../../../shared/game-sound";
import { SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { bn, bucket, buckets, caption, cleanName, delivery, humanLine, innings, modeOf, modes, outcomeAt, outcomeWord, parseShareHash, positionAt, shareHash, triesText, zones, MAX_NAME, MAX_SEED, type ModeId, type Outcome, type Shared } from "../lib/game";

const TOOL = "shesh-bol";
// Percentages from a handful of people are noise.
const COMPARE_MIN = 20;
const BATTER = { x: 180, y: 168 };
const CENTRE = { x: 180, y: 128 };
const reach: Record<string, number> = { 6: 1.16, 4: 0.97, 2: 0.62, 1: 0.42, 0: 0.18 };
const newSeed = () => 1 + Math.floor(Math.random() * MAX_SEED);

// The bat's crack, then what the shot earned: a bowled stumps, a thump for a dot, a bright ring for a boundary.
function shotSound(outcome: Outcome, wins: boolean) {
  tone(220, 0.07, 0.16, "square", 0, 110); hiss(0.05, 0.14, 3500, "highpass");
  if (wins) return; // the winning shot gets the fanfare below
  if (outcome === "W") sfx.wrong();
  else if (outcome === 6) { sfx.levelUp(); buzz(60); }
  else if (outcome === 4) sfx.good();
  else if (outcome === 0) sfx.drop();
}

function zoneGradient(centre: number) {
  const stops: Array<[string, number, number]> = [
    ["#c42a1c", 0, zones.edge], ["#2f4a5f", zones.edge, centre - zones.one], ["#4f7d5a", centre - zones.one, centre - zones.two],
    ["#7fae5f", centre - zones.two, centre - zones.four], ["#f2a33a", centre - zones.four, centre - zones.six], ["#ffd34d", centre - zones.six, centre + zones.six],
    ["#f2a33a", centre + zones.six, centre + zones.four], ["#7fae5f", centre + zones.four, centre + zones.two], ["#4f7d5a", centre + zones.two, centre + zones.one],
    ["#2f4a5f", centre + zones.one, 1 - zones.edge], ["#c42a1c", 1 - zones.edge, 1],
  ];
  return `linear-gradient(90deg,${stops.map(([color, from, to]) => `${color} ${(from * 100).toFixed(1)}% ${(to * 100).toFixed(1)}%`).join(",")})`;
}

export function LastBall() {
  const [mode, setMode] = useState<ModeId>("last5");
  const [seed, setSeed] = useState(7);
  const [tries, setTries] = useState(1);
  const [balls, setBalls] = useState<Outcome[]>([]);
  const [aiming, setAiming] = useState(true);
  const [frozen, setFrozen] = useState(0);
  const [won, setWon] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [flash, setFlash] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const marker = useRef<HTMLDivElement>(null);
  const ballDot = useRef<SVGCircleElement>(null);
  const sweep = useRef<Animation | null>(null);
  const hitAt = useRef(0);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const info = modeOf(mode);
  const played = innings(mode, balls);
  const ballIndex = aiming ? balls.length : balls.length - 1;
  const ball = delivery(seed, mode, Math.max(0, ballIndex));
  const last = aiming ? null : balls.at(-1)!;
  const card = won ? { ...won, name: cleanName(name) } : null;
  const state = card ? shareHash(card).slice(1) : "";

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared result counts as a challenge.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared); setMode(shared.mode); setSeed(shared.seed); setTries(1); setBalls([]); setAiming(true);
    };
    if (!parseShareHash(window.location.hash)) setSeed(newSeed());
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  // The marker runs on the Web Animations API: smooth on cheap phones, and its clock is the same one tap events use.
  useEffect(() => {
    if (!aiming || !marker.current) return;
    const animation = marker.current.animate([{ transform: "translateX(0)" }, { transform: "translateX(100%)" }], { duration: ball.speed, iterations: Infinity, direction: "alternate", easing: "linear" });
    const now = document.timeline.currentTime;
    if (typeof now === "number") animation.startTime = now;
    sweep.current = animation;
    return () => animation.cancel();
  }, [aiming, ball.speed, tries, balls.length]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("শেষ বলে ছক্কা").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  function flyBall(outcome: Outcome, offset: number) {
    const dot = ballDot.current;
    if (!dot) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const angle = Math.max(-1, Math.min(1, offset / 0.25)) * 1.2;
    const target = outcome === "W" ? { x: BATTER.x, y: BATTER.y + 8 } : { x: CENTRE.x + Math.sin(angle) * 150 * reach[outcome], y: CENTRE.y - Math.cos(angle) * 92 * reach[outcome] };
    const dx = target.x - BATTER.x, dy = target.y - BATTER.y;
    dot.animate([
      { transform: "translate(0,0) scale(1)" },
      { transform: `translate(${dx / 2}px,${dy / 2}px) scale(${outcome === 6 ? 2.6 : 1.2})` },
      { transform: `translate(${dx}px,${dy}px) scale(1)` },
    ], { duration: reduced ? 0 : outcome === 6 ? 850 : 600, easing: "ease-out", fill: "forwards" });
  }

  function hit(timeStamp: number) {
    const animation = sweep.current;
    if (!aiming || !animation) return;
    const start = animation.startTime;
    const elapsed = typeof start === "number" && Number.isFinite(timeStamp) && timeStamp >= start ? timeStamp - start : Number(animation.currentTime ?? 0);
    const position = positionAt(elapsed, ball.speed);
    const outcome = outcomeAt(position, ball.centre);
    const next = [...balls, outcome];
    hitAt.current = performance.now();
    setFrozen(position);
    setBalls(next);
    setAiming(false);
    flyBall(outcome, position - ball.centre);
    const wins = innings(mode, next).state === "won";
    shotSound(outcome, wins);
    if (outcome === "W") shake(document.getElementById("ground"));
    if (outcome === 6) { setFlash(true); setTimeout(() => setFlash(false), 1400); }
    if (wins) {
      setTimeout(() => { sfx.win(); confetti(); }, 450);
      setWon({ mode, seed, tries, name: "", runs: next });
      setCompared("idle");
    }
  }

  function resetBall() {
    ballDot.current?.getAnimations().forEach(animation => animation.cancel());
  }

  function act() {
    // A double tap would skip past the result before it is seen.
    if (aiming || performance.now() - hitAt.current < 450) return;
    resetBall();
    if (played.state === "lost") { setTries(count => count + 1); setBalls([]); }
    setAiming(true);
  }

  function chooseMode(id: ModeId) {
    if (id === mode) return;
    resetBall();
    setMode(id); setTries(1); setBalls([]); setAiming(true);
  }

  function playAgain() {
    resetBall();
    setSeed(newSeed()); setTries(1); setBalls([]); setAiming(true);
    document.getElementById("ground")?.scrollIntoView({ behavior: "smooth" });
  }

  function onPointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (!aiming) return;
    event.preventDefault();
    hit(event.timeStamp);
  }

  // Taps hit on pointer-down (no finger-lift delay); keyboard presses arrive as clicks with detail 0.
  function onClick(event: MouseEvent<HTMLButtonElement>) {
    if (aiming) { if (event.detail === 0) hit(event.timeStamp); }
    else act();
  }

  const callSub = last === null ? "" : played.state === "won" ? (mode === "last5" ? "ম্যাচ জিতলে! গ্যালারি দাঁড়িয়ে গেছে।" : `${bn(played.runs)} রান, ম্যাচ জিতলে!`)
    : played.state === "lost" ? (last === "W" ? "দাগটা লালে ছিল। আরেকবার!" : mode === "last5" ? `দরকার ছিল ৫, হলো ${bn(played.runs)}। আরেকবার!` : `${bn(played.runs)} রানে থেমে গেলে। আরেকবার!`)
    : `আরও ${bn(info.need - played.runs)} রান দরকার, ${bn(info.balls - balls.length)} বল বাকি`;
  const buttonLabel = aiming ? "মারো!" : played.state === "lost" ? "আবার চেষ্টা করো" : "পরের বল";
  const versus = friend && card && friend.mode === card.mode && friend.seed === card.seed
    ? card.tries < friend.tries ? `${friend.name || "বন্ধু"} পেরেছিল ${bn(friend.tries)} বারে, তুমি ${bn(card.tries)} বারে। তুমিই জিতলে!`
      : card.tries === friend.tries ? `${friend.name || "বন্ধু"}ও ঠিক ${bn(friend.tries)} বারে পেরেছিল। টাই!` : `${friend.name || "বন্ধু"} পেরেছিল ${bn(friend.tries)} বারে। আরেকবার খেলে হারিয়ে দাও!`
    : "";
  const modeCounts = everyone ? buckets.map(item => everyone.counts[`${won?.mode}:${item.id}`] ?? 0) : [];
  const modeTotal = modeCounts.reduce((sum, count) => sum + count, 0);

  async function compareWithEveryone() {
    if (!won) return;
    setCompared("sending");
    const tally = await addToTally(TOOL, [`${won.mode}:${bucket(won.tries)}`]);
    if (tally) { setEveryone(tally); setCompared("done"); } else setCompared("failed");
  }

  return (
    <div className="shesh">
      {friend && (
        <section className="shesh-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} প্ল্যাকার্ড: ${modeOf(friend.mode).won} ${triesText(friend.tries)}`} />
          <div>
            <p className="shesh-kicker">তোমার জন্য একটা চ্যালেঞ্জ এসেছে</p>
            <h2 id="friend-title">{friend.name || "তোমার বন্ধু"} পেরেছে {triesText(friend.tries)}। <span>তুমি কয় বারে পারবে?</span></h2>
            <p>একই বল, একই গতি। নিচে খেলো।</p>
          </div>
        </section>
      )}

      <fieldset className="kit-chips shesh-modes">
        <legend className="shesh-sr">কোন ম্যাচ খেলবে?</legend>
        {modes.map(item => <button type="button" key={item.id} aria-pressed={mode === item.id} onClick={() => chooseMode(item.id)}>{item.label}</button>)}
      </fieldset>

      <div className={`shesh-ground${flash ? " shesh-flash" : ""}`} id="ground">
        <div className="shesh-board">
          <p><b>{info.ask}</b>{mode === "over12" && <span> · {bn(played.runs)} রান</span>}</p>
          <SoundToggle compact />
          <p>চেষ্টা <b>{bn(tries)}</b></p>
        </div>
        {mode === "over12" && (
          <ol className="shesh-over" aria-label="এই ওভারের বল">
            {Array.from({ length: info.balls }, (_, index) => <li key={index} data-run={String(balls[index] ?? "")}>{balls[index] === undefined ? "" : balls[index] === "W" ? "আউট" : bn(balls[index] as number)}</li>)}
          </ol>
        )}
        <svg className="shesh-field" viewBox="0 0 360 240" aria-hidden="true">
          <defs>
            <clipPath id="shesh-oval"><ellipse cx="180" cy="128" rx="160" ry="100" /></clipPath>
            <radialGradient id="shesh-glow"><stop offset="0" stopColor="#fff6d6" stopOpacity=".9" /><stop offset=".3" stopColor="#ffe9a6" stopOpacity=".25" /><stop offset="1" stopColor="#ffe9a6" stopOpacity="0" /></radialGradient>
          </defs>
          <ellipse className="shesh-stands" cx="180" cy="128" rx="176" ry="114" />
          <ellipse className="shesh-crowd" cx="180" cy="128" rx="169" ry="107" />
          <g clipPath="url(#shesh-oval)">
            <rect width="360" height="240" fill="#2f7d3b" />
            {[0, 1, 2, 3, 4, 5, 6, 7].map(index => <rect key={index} x={20 + index * 40} width="20" height="240" fill="#348a41" />)}
          </g>
          <ellipse cx="180" cy="128" rx="150" ry="92" fill="none" stroke="#f4f1e8" strokeWidth="2" />
          <ellipse cx="180" cy="128" rx="62" ry="40" fill="none" stroke="#f4f1e880" strokeWidth="1" strokeDasharray="3 4" />
          <rect x="171" y="84" width="18" height="92" rx="2" fill="#d9c38a" />
          <path d="M168 90h24M168 170h24" stroke="#fff" strokeWidth="1.5" />
          <g className="shesh-stumps" data-out={last === "W"}><rect x="176" y="172" width="2" height="6" /><rect x="179" y="172" width="2" height="6" /><rect x="182" y="172" width="2" height="6" /></g>
          <rect x="176" y="82" width="8" height="4" fill="#f4f1e8" />
          <circle cx="180" cy="163" r="5" fill="#1d2b53" stroke="#fff" strokeWidth="1.5" />
          <circle ref={ballDot} className="shesh-ball" cx={BATTER.x} cy={BATTER.y} r="3.4" />
          {[[16, 14], [344, 14], [16, 236], [344, 236]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="46" fill="url(#shesh-glow)" />)}
        </svg>
        <p className="shesh-call" aria-live="assertive" data-run={last === null ? "" : String(last)}>
          {last !== null && <><strong key={balls.length}>{outcomeWord[String(last)]}</strong><span>{callSub}</span></>}
        </p>
      </div>

      <div className="shesh-bar" style={{ backgroundImage: zoneGradient(ball.centre) }}>
        <span className="shesh-six" style={{ left: `${ball.centre * 100}%` }} aria-hidden="true">৬</span>
        <div className="shesh-sweep" ref={marker} style={aiming ? undefined : { transform: `translateX(${frozen * 100}%)` }}><i /></div>
      </div>
      <p className="shesh-hint">দাগটা <b>হলুদে</b> এলেই চাপো। লাল মানে বোল্ড।</p>

      {played.state === "won" && !aiming
        ? <a className="kit-primary shesh-hit" href="#result">প্ল্যাকার্ডটা দেখো</a>
        : <button type="button" className="kit-primary shesh-hit" data-aiming={aiming} onPointerDown={onPointerDown} onClick={onClick}>{buttonLabel}</button>}

      <StickyNext show={Boolean(card) && !resultVisible} title={<><strong>{info.won.replace("!", "")}!</strong></>} sub={card ? triesText(card.tries) : ""} href="#result" label="প্ল্যাকার্ড দেখো" />

      <section className="shesh-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="shesh-result-head">
          <h2 id="result-title">{card ? <>{modeOf(card.mode).won} <em>{triesText(card.tries)}</em></> : "ছক্কা মারলেই প্ল্যাকার্ড তৈরি"}</h2>
          <p>{card ? versus || humanLine(card.tries) : "যত বার লাগুক, পারলেই গ্যালারির প্ল্যাকার্ডে তোমার নাম উঠবে। তারপর বন্ধুকে একই বল খেলতে দাও।"}</p>
        </div>
        {card && (
          <div className="shesh-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
              <figcaption id="card-summary" className="shesh-sr">প্ল্যাকার্ড: {modeOf(card.mode).won} {card.name && `${card.name}, `}{triesText(card.tries)}। {humanLine(card.tries)}</figcaption>
              {previewError && <p className="kit-status" role="alert">প্ল্যাকার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="shesh-controls">
              <label className="shesh-field-label">
                <span>তোমার নাম <small>প্ল্যাকার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="shesh-bol.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="লিংক পেলে বন্ধু একই বল খেলবে, দেখবে কে কম চেষ্টায় পারে।" />
              <button type="button" className="kit-link shesh-again" onClick={playAgain}>নতুন বলে আবার খেলো</button>
            </div>
          </div>
        )}
        {card && (
          <div className="shesh-everyone">
            <h3>সবাই কয় চেষ্টায় পারে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>শুধু তোমার চেষ্টার সংখ্যাটা (কোন ঘরে পড়ে) গোনা হবে। নাম যাবে না।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : modeTotal < COMPARE_MIN
              ? <p className="kit-status">যোগ হয়েছে! এখনো মাত্র {bn(modeTotal)} জন মিলিয়েছে, তাই হিসাবটা এখনই বলা যাবে না। বন্ধুদের লিংক পাঠাও।</p>
              : <ul className="shesh-bars">
                {buckets.map((item, index) => { const value = Math.round(modeCounts[index] / modeTotal * 100); return <li key={item.id} data-mine={bucket(card.tries) === item.id}><span>{item.label}</span><i style={{ width: `${value}%` }} /><b>{bn(value)}%</b></li>; })}
                <li className="shesh-bars-note">{bn(modeTotal)} জনের মধ্যে। তোমার ঘরটা গাঢ় করে দেখানো।</li>
              </ul>}
          </div>
        )}
      </section>
    </div>
  );
}
