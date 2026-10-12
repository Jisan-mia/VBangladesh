"use client";
// IP: what we avoided — no magazine's or app's name, layout, mascot or pictures; every scene is our own drawing of a Bangladeshi bazaar, village, ghat or lane, composed in code, with our own sounds.

import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, fitCanvas, sfx, totalStars, useBest, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { drawScene } from "../lib/draw";
import { diffCount, hintFor, makePuzzle, startLevel, starsFor, tapAt, LEVEL_COUNT } from "../lib/game";
import { bannerNote, bn, caption, cardLine, clearLine, clockText, compareLine, feat, levelLabel, nearMiss, parseShared, sharedHash, timeText, type Shared } from "../lib/link";
import { SCENE_H, SCENE_W } from "../lib/shapes";
import { allFound, circled, nothingHere } from "../lib/sound";

const TOOL = "bhul-kothay";
const ARROWS: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;

type Phase = "ready" | "playing" | "paused" | "done";
type Result = { seconds: number; wrong: number; hinted: boolean };
type Miss = { id: number; side: 0 | 1; x: number; y: number };

export function SpotGame() {
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<Phase>("ready");
  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState(0);
  const [misses, setMisses] = useState<Miss[]>([]);
  const [hint, setHint] = useState(-1);
  const [hinted, setHinted] = useState(false);
  const [status, setStatus] = useState("");
  const [shake, setShake] = useState(-1);
  const [now, setNow] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [record, setRecord] = useState(false);
  const [cursor, setCursor] = useState<{ side: 0 | 1; x: number; y: number } | null>(null);
  const [width, setWidth] = useState(358);
  const [fontsReady, setFontsReady] = useState(0);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [best, submitBest] = useBest(`${TOOL}-l${level}`, false);
  const puzzle = useMemo(() => makePuzzle(level), [level]);
  const total = diffCount(level);

  const state = useRef({ phase, found, wrong, hinted });
  state.current = { phase, found, wrong, hinted };
  const clock = useRef<{ since: number | null; spent: number }>({ since: null, spent: 0 });
  const streak = useRef(0);
  const missId = useRef(0);
  const press = useRef<{ id: number; x: number; y: number; at: number } | null>(null);
  const timers = useRef<number[]>([]);
  const chosen = useRef(false);
  const wrap = useRef<HTMLDivElement>(null);
  const canvases = [useRef<HTMLCanvasElement>(null), useRef<HTMLCanvasElement>(null)];
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);

  const earned = result ? starsFor(level, result.seconds, result.wrong, result.hinted) : 0;
  const rival = friend && friend.level === level ? friend : null;
  const shared: Shared | null = result ? { level, ...result, name } : null;
  const shareState = shared ? sharedHash(shared) : "";
  const pictureH = Math.round((width * SCENE_H) / SCENE_W);

  const later = (ms: number, run: () => void) => { timers.current.push(window.setTimeout(run, ms)); };
  function clearTimers() { timers.current.forEach(window.clearTimeout); timers.current = []; }
  const elapsed = () => clock.current.spent + (clock.current.since === null ? 0 : performance.now() - clock.current.since);
  function stopClock() { clock.current.spent = elapsed(); clock.current.since = null; }

  function goLevel(next: number, play: boolean, byPlayer = true) {
    if (byPlayer) chosen.current = true;
    clearTimers();
    streak.current = 0;
    clock.current = { since: play ? performance.now() : null, spent: 0 };
    setLevel(next); setFound([]); setWrong(0); setMisses([]); setHint(-1); setHinted(false); setResult(null); setRecord(false); setCursor(null); setNow(0);
    setPhase(play ? "playing" : "ready");
    setStatus(play ? `${bn(diffCount(next))}টা অমিল। যেকোনো ছবিতে চাপ দাও।` : "");
  }

  function start() {
    if (state.current.phase === "ready") {
      clock.current = { since: performance.now(), spent: 0 };
      setPhase("playing");
      setStatus(`${bn(total)}টা অমিল। যেকোনো ছবিতে চাপ দাও।`);
    } else if (state.current.phase === "paused") {
      clock.current.since = performance.now();
      setPhase("playing");
      setStatus("চলছে আবার।");
    }
  }

  function finish(allIn: number[]) {
    stopClock();
    const seconds = Math.max(1, Math.round(clock.current.spent / 1000)), { wrong: misses, hinted: helped } = state.current;
    const stars = starsFor(level, seconds, misses, helped), firstClear = !levels.stars[level];
    levels.record(level, stars);
    const hadBest = best !== null, beaten = submitBest(seconds);
    setRecord(hadBest && beaten);
    setResult({ seconds, wrong: misses, hinted: helped });
    setPhase("done"); setHint(-1); setCursor(null);
    setStatus(`সব ${bn(allIn.length)}টা অমিল পেয়েছ।`);
    allFound();
    if (stars === 3 || (hadBest && beaten) || (firstClear && level % 10 === 0)) later(1000, () => confetti({ colors: ["#d6332a", "#f2a900", "#2f8f4e", "#2f6fb2", "#e8964a"] }));
  }

  /** A tap at scene point (x, y) on one picture. */
  function tap(side: 0 | 1, x: number, y: number) {
    const { phase: now, found: have } = state.current;
    if (now === "ready" || now === "paused") { start(); return; }
    if (now !== "playing") return;
    const landed = tapAt(puzzle, have, x, y);
    if (landed.kind === "found") {
      const next = [...have, landed.index];
      state.current.found = next;
      setFound(next);
      circled(streak.current);
      streak.current++;
      if (hint === landed.index) setHint(-1);
      const left = total - next.length, diff = puzzle.diffs[landed.index];
      if (!left) { finish(next); return; }
      setStatus(`পেয়েছ: ${diff.name}।${streak.current >= 3 ? ` পরপর ${bn(streak.current)}টা!` : ""} ${left === 1 ? "আর ১টা!" : `আর ${bn(left)}টা।`}`);
    } else if (landed.kind === "again") {
      sfx.tap();
      setStatus(`${puzzle.diffs[landed.index].name} তো আগেই পেয়েছ।`);
    } else {
      streak.current = 0;
      state.current.wrong += 1;
      setWrong(state.current.wrong);
      nothingHere();
      const id = ++missId.current;
      setMisses(list => [...list.slice(-4), { id, side, x, y }]);
      later(900, () => setMisses(list => list.filter(miss => miss.id !== id)));
      setStatus("ওখানে দুই ছবি একই।");
      if (!slow) { setShake(side); later(220, () => setShake(-1)); }
    }
  }

  function showHint() {
    const { phase: now, found: have } = state.current;
    if (now !== "playing") return;
    const index = hintFor(puzzle, have);
    if (index < 0) return;
    sfx.pick();
    setHint(index); setHinted(true);
    setStatus("হলুদ দাগের ভেতরে খোঁজো। হিন্ট নিলে বড়জোর ২ তারা।");
  }

  function onDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    press.current = { id: event.pointerId, x: event.clientX, y: event.clientY, at: performance.now() };
  }

  // A tap, not a scroll: the finger lifts close to where it went down, quickly.
  function onUp(event: ReactPointerEvent<HTMLDivElement>, side: 0 | 1) {
    const down = press.current;
    press.current = null;
    if (!down || down.id !== event.pointerId || Math.hypot(event.clientX - down.x, event.clientY - down.y) > 14 || performance.now() - down.at > 700) return;
    const box = event.currentTarget.getBoundingClientRect();
    tap(side, ((event.clientX - box.left) / box.width) * SCENE_W, ((event.clientY - box.top) / box.height) * SCENE_H);
  }

  function onPictureKey(event: ReactKeyboardEvent<HTMLDivElement>, side: 0 | 1) {
    const step = ARROWS[event.key];
    const at = cursor && cursor.side === side ? cursor : { side, x: SCENE_W / 2, y: SCENE_H / 2 };
    if (step) {
      event.preventDefault();
      setCursor({ side, x: Math.min(SCENE_W - 4, Math.max(4, at.x + step[0] * 12)), y: Math.min(SCENE_H - 4, Math.max(4, at.y + step[1] * 12)) });
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      if (state.current.phase !== "playing") start();
      else { setCursor(at); tap(side, at.x, at.y); }
    }
  }

  // Open where you left off once this phone's stars load, unless a link or a tap already chose.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    const next = startLevel(levels.stars, levels.unlocked);
    if (next !== level) goLevel(next, false, false);
  }, [levels.loaded]);

  useEffect(() => {
    const readFriend = () => {
      const found = parseShared(window.location.hash);
      if (!found) return;
      setFriend(found);
      goLevel(found.level, false);
    };
    setSite(window.location.host);
    readFriend();
    loadCardFonts("মায়ের দোয়া ফল ভান্ডার খালেক টি স্টল কদমতলী ঘাট ৳৪০").then(() => setFontsReady(1)).catch(() => {});
    const hide = () => {
      if (!document.hidden || state.current.phase !== "playing") return;
      stopClock(); press.current = null;
      setPhase("paused");
    };
    const box = wrap.current;
    const watch = box ? new ResizeObserver(([entry]) => setWidth(Math.min(480, Math.round(entry.contentRect.width)))) : null;
    if (box) { watch!.observe(box); setWidth(Math.min(480, Math.round(box.getBoundingClientRect().width))); }
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
      watch?.disconnect();
      clearTimers();
    };
  }, []);

  // The pictures only change with the level or the width, so they're drawn once each time, not every frame.
  useEffect(() => {
    canvases.forEach((ref, side) => {
      const canvas = ref.current;
      if (!canvas) return;
      drawScene(fitCanvas(canvas, width, pictureH), puzzle, side as 0 | 1, 0, 0, width / SCENE_W);
    });
  }, [puzzle, width, fontsReady]);

  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => setNow(Math.floor(elapsed() / 1000)), 500);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(`ভুল কোথায়? লেভেল ১২৩ টা অমিলই পেয়েছি রাফি ${name}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `shareState` encodes everything the card draws.
  }, [shareState, format, site]);

  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (event.key === "h" || event.key === "H") { showHint(); return; }
    if ((event.key === "Enter" || event.key === " ") && !target?.closest?.("button, a, summary, [role=application]")) {
      if (phase === "ready" || phase === "paused") { event.preventDefault(); start(); }
      else if (phase === "done" && level < LEVEL_COUNT) { event.preventDefault(); goLevel(level + 1, true); }
    }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const stars = totalStars(levels.stars);
  const seconds = phase === "done" && result ? result.seconds : now;

  return (
    <div className="bk" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="bk-friend" aria-labelledby="bk-friend-title">
          <h2 id="bk-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend)}</p>
        </section>
      )}

      <div className="bk-hud">
        <p className="bk-level">{levelLabel(level)}</p>
        <p className="bk-goal">★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</p>
      </div>
      <div className="bk-bar">
        <p className="bk-dots" role="img" aria-label={`${bn(total)}টার মধ্যে ${bn(found.length)}টা অমিল পেয়েছ`}>
          {puzzle.diffs.map((_, index) => <span key={index} className={index < found.length ? "on" : ""} />)}
        </p>
        <p className="bk-clock" aria-label={`সময় ${timeText(seconds)}`}>{clockText(seconds)}</p>
      </div>

      <div className="bk-pics" style={{ ["--pic-h" as string]: `${pictureH}px` }}>
        {([0, 1] as const).map(side => (
          <div key={side} className="bk-pic" data-shake={shake === side || undefined} role="application" tabIndex={0}
            aria-label={`ছবি ${bn(side + 1)}। তীরচিহ্ন দিয়ে দাগ সরাও, এন্টার চাপলে সেখানে চাপ পড়বে।`}
            onPointerDown={onDown} onPointerUp={event => onUp(event, side)} onPointerCancel={() => { press.current = null; }}
            onKeyDown={event => onPictureKey(event, side)} onBlur={() => setCursor(current => current?.side === side ? null : current)}>
            <canvas ref={canvases[side]} aria-hidden="true" />
            <svg className="bk-marks" viewBox={`0 0 ${SCENE_W} ${SCENE_H}`} aria-hidden="true">
              {found.map(index => {
                const { region } = puzzle.diffs[index];
                return <ellipse key={`${level}-${index}`} className="bk-ring" pathLength={1}
                  cx={region.x + region.w / 2} cy={region.y + region.h / 2} rx={region.w / 2 + 1} ry={region.h / 2 + 1} />;
              })}
              {hint >= 0 && phase === "playing" && (() => {
                const { region } = puzzle.diffs[hint];
                return <rect className="bk-hint" x={region.x} y={region.y} width={region.w} height={region.h} rx={10} />;
              })()}
              {misses.filter(miss => miss.side === side).map(miss => <path key={miss.id} className="bk-miss" d={`M${miss.x - 6} ${miss.y - 6} L${miss.x + 6} ${miss.y + 6} M${miss.x + 6} ${miss.y - 6} L${miss.x - 6} ${miss.y + 6}`} />)}
              {cursor?.side === side && <g className="bk-cursor"><circle cx={cursor.x} cy={cursor.y} r={9} /><path d={`M${cursor.x - 14} ${cursor.y} L${cursor.x - 4} ${cursor.y} M${cursor.x + 4} ${cursor.y} L${cursor.x + 14} ${cursor.y} M${cursor.x} ${cursor.y - 14} L${cursor.x} ${cursor.y - 4} M${cursor.x} ${cursor.y + 4} L${cursor.x} ${cursor.y + 14}`} /></g>}
            </svg>
          </div>
        ))}
        {(phase === "ready" || phase === "paused") && (
          <button type="button" className="bk-veil" onClick={start}>
            <span className="bk-veil-text">{phase === "paused" ? "থেমে আছে, ঘড়িও থেমে আছে" : `দুই ছবিতে ${bn(total)}টা অমিল`}</span>
            <span className="kit-primary bk-veil-go">{phase === "paused" ? "চালিয়ে যাও" : "শুরু করো"}</span>
          </button>
        )}
      </div>

      {phase === "done" && result ? (
        <div className="bk-clear" role="status">
          <StarReveal count={earned} />
          <p className="bk-clear-line">{clearLine(level)}</p>
          <p className="bk-clear-note">
            {timeText(result.seconds)}, {result.wrong ? `ভুল চাপ ${bn(result.wrong)}টা` : "একটাও ভুল চাপ নেই"}।{" "}
            {rival ? compareLine(result.seconds, rival.seconds, rival.name) : record ? "এই লেভেলে তোমার নতুন রেকর্ড!" : nearMiss(level, result.seconds, result.wrong, result.hinted)}
          </p>
          <ul className="bk-found" aria-label="যে অমিলগুলো ছিল">{puzzle.diffs.map((diff, index) => <li key={index}>{diff.name}</li>)}</ul>
          <div className="bk-clear-actions">
            {level < LEVEL_COUNT && <button type="button" className="kit-primary" onClick={() => goLevel(level + 1, true)}>পরের লেভেল</button>}
            <button type="button" className={level < LEVEL_COUNT ? "kit-secondary" : "kit-primary"} onClick={() => goLevel(level, true)}>আবার খেলো</button>
          </div>
          <button type="button" className="kit-link bk-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : (
        <>
          <p className="bk-status" role="status" aria-live="polite">{status || "একই রকম দুটো ছবি। কিন্তু পুরো এক না।"}</p>
          <div className="bk-tools">
            <button type="button" className="bk-tool" onClick={showHint} disabled={phase !== "playing" || hint >= 0}>একটা দেখাও</button>
            <button type="button" className="bk-tool" onClick={() => goLevel(level, true)} disabled={phase !== "playing" || (!found.length && !wrong)}>শুরু থেকে</button>
          </div>
        </>
      )}

      <div className="bk-prefs">
        <button type="button" className="bk-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle />
      </div>

      <details className="bk-drawer">
        <summary>সব লেভেল <span>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level}
          onPick={next => { goLevel(next, true); wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }} />
      </details>

      <section className="bk-result" id="result" ref={resultBox} aria-labelledby="bk-result-title">
        <h2 id="bk-result-title">{shared ? <>লেভেল {bn(level)}: <em>{bn(total)}টা অমিলই</em> পেয়েছ</> : "সব অমিল পেলে তোমার কার্ড"}</h2>
        <p>{shared ? cardLine(shared) : "শেষ অমিলটা পেলেই কার্ডটা এখানে আসবে। বন্ধুকে পাঠালে সে একই দুটো ছবি পাবে।"}</p>
        {shared && (
          <div className="bk-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img"
                aria-label={`ভুল কোথায়?-এর কার্ড: ${levelLabel(level)}, ${timeText(shared.seconds)}, ${bn(earned)} তারা।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="bk-share">
              <label className="bk-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="bhul-kothay.png" makeImage={() => cardBlob(shared, format, site)} imageKey={`${shareState}|${format}`} caption={caption(shared)} state={shareState}
                hint="বন্ধু লিংক খুললে একই দুটো ছবি পাবে। সময় আর ভুল চাপের হিসাবটা তোমার ফোনের।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
