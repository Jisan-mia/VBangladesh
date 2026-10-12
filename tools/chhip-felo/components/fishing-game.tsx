"use client";
// IP: what we avoided — no fishing game's name, mascot, lure shop, reel UI or fish art; our own bamboo rod, শোলার ফাতনা, Bangladeshi fish drawn in code, and sounds made in code. No hooks shown in a fish's mouth, no gore.

import { useEffect, useReducer, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, fitCanvas, newSeed, sfx, shake, totalStars, useBest, useGameLoop, useLevels, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { drawFish, drawScene, floatAt, newCache, ripple, VH, VW, type SceneCache } from "../lib/draw";
import { cardBlob, drawCard } from "../lib/draw-card";
import { addCatch, albumCount, parseAlbum, placeOpen, FISH, PLACES, RARITY, type Album } from "../lib/fish";
import {
  basket, biggest, flick, lastLevelOf, newTrip, placeOf, press, release, starsOf, step, LEVEL_COUNT, SHOW_CATCH, type Event, type Miss, type Trip,
} from "../lib/game";
import {
  bannerNote, bn, caption, castsLabel, clearLine, compareLine, feat, humanLine, levelLabel, nearMissLine, parseShared, sharedHash, weightText, HUSH_LINE, MISS_LINES,
  type Shared,
} from "../lib/link";
import * as sound from "../lib/sound";

const TOOL = "chhip-felo";
const ALBUM_KEY = `ektukhani-album-${TOOL}`;
const MISSES = new Set<Event>(["early", "nibble", "late", "snap", "slip"]);
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;
const readStore = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const writeStore = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: the album lives for this visit */ } };

type Result = { stars: number; grams: number; catches: number; big: number; record: boolean; previous: number | null };
type Show = { fish: number; grams: number; isNew: boolean; record: boolean; key: number };

/** A fish drawn once into a small canvas; unknown ones are a dark shape. */
function FishPic({ index, known, size }: { index: number; known: boolean; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const height = Math.round(size * 0.56), c = fitCanvas(element, size, height);
    c.clearRect(0, 0, size, height);
    drawFish(c, size / 2, height / 2, size * 0.84, FISH[index], known ? undefined : "#2c4a43");
  }, [index, known, size]);
  return <canvas ref={ref} className="cf-pic" style={{ width: size, height: Math.round(size * 0.56) }} aria-hidden="true" />;
}

/** The furthest playable level that isn't three-starred yet (or the furthest one). */
function startLevel(stars: Record<number, number>, unlocked: number) {
  for (let level = unlocked; level >= 1; level--) if ((stars[level] ?? 0) < 3) return level;
  return unlocked;
}

export function FishingGame() {
  const [slow, setSlow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [album, setAlbum] = useState<Album>({});
  const [albumLoaded, setAlbumLoaded] = useState(false);
  const trip = useRef<Trip>(newTrip(1, 1));
  const [, bump] = useReducer((count: number) => count + 1, 0);
  const level = trip.current.spec.level;
  const [best, submitBest] = useBest(`${TOOL}-l${level}`);
  const [paused, setPaused] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [show, setShow] = useState<Show | null>(null);
  const [note, setNote] = useState<{ text: string; miss: boolean } | null>(null);
  const [news, setNews] = useState("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);

  const friendRef = useRef<Shared | null>(null);
  // Links and saved progress start trips from mount-time handlers; this keeps them on the current slow setting.
  const slowRef = useRef(slow);
  slowRef.current = slow;
  const chosen = useRef(false);
  const clock = useRef(0);
  const lastDraw = useRef(0);
  const hum = useRef<ReturnType<typeof sound.reelHum> | null>(null);
  const down = useRef<{ id: number; y: number; at: number } | null>(null);
  const overAt = useRef(0);
  const scene = useRef<{ context: CanvasRenderingContext2D; cache: SceneCache } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const actionButton = useRef<HTMLButtonElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);

  const current = trip.current, { spec, phase } = current;
  const count = albumCount(album);
  const openPlace = placeOpen(2, count) ? 2 : placeOpen(1, count) ? 1 : 0;
  const unlocked = Math.min(levels.unlocked, lastLevelOf(openPlace));
  const rival = friend && friend.level === level && friend.seed === current.seed ? friend : null;
  const shared: Shared | null = result ? { level, seed: current.seed, grams: result.grams, catches: result.catches, big: result.big, name } : null;
  const state = shared ? sharedHash(shared) : "";
  const total = totalStars(levels.stars);

  const stopHum = () => { hum.current?.stop(); hum.current = null; };

  function begin(nextLevel: number, seed: number) {
    stopHum();
    trip.current = newTrip(nextLevel, seed, slowRef.current);
    down.current = null;
    setResult(null); setShow(null); setNote(null); setNews(""); setPaused(false);
    bump();
  }
  const seedFor = (nextLevel: number) => friendRef.current && friendRef.current.level === nextLevel ? friendRef.current.seed : newSeed();

  // ---- what each moment of the trip sounds and looks like ----
  function onEvent(event: Event) {
    if (!event) return;
    const live = trip.current, cache = scene.current?.cache;
    const at = floatAt(live, { x: 132, y: 168 });
    switch (event) {
      case "charge": sfx.tap(); break;
      case "cast": sound.swish(live.power); break;
      case "land": sound.plop(); if (cache) ripple(cache, at.x, at.y, 1); break;
      case "nibble": sound.nibble(); if (cache) ripple(cache, at.x, at.y, 0.35); break;
      case "dip": sound.dip(); if (cache) { ripple(cache, at.x, at.y, 1.4); ripple(cache, at.x, at.y, 0.8); } break;
      case "hush": sfx.tap(); setNote({ text: HUSH_LINE, miss: false }); return;
      case "hook": sound.strike(); stopHum(); hum.current = sound.reelHum(); setNote(null); break;
      case "surge": sound.thrash(); return;
      case "caught": caught(); break;
      case "next": setShow(null); setNote(null); break;
      case "done": setShow(null); finish(); break;
      default:
        if (MISSES.has(event)) {
          stopHum();
          if (event === "snap") { sound.snap(); shake(stage.current); }
          else if (event === "slip") sound.slip();
          else sfx.drop();
          setNote({ text: MISS_LINES[event as Miss], miss: true });
        }
    }
    bump();
  }

  function caught() {
    stopHum();
    const live = trip.current, fish = live.fish, grams = live.grams, rare = FISH[fish].rarity === 2;
    sound.caught(rare);
    const before = parseAlbum(readStore(ALBUM_KEY)), added = addCatch(before, fish, grams);
    writeStore(ALBUM_KEY, JSON.stringify(added.album));
    setAlbum(added.album);
    setShow({ fish, grams, isNew: added.isNew, record: added.isRecord, key: live.cast });
    if (live.streak >= 2) window.setTimeout(() => sfx.combo(live.streak - 2), 600);
    const was = albumCount(before), now = albumCount(added.album);
    const opened = PLACES.findIndex((place, index) => index > 0 && was < place.need && now >= place.need);
    if (opened > 0) {
      setNews(`${PLACES[opened].name} খুলে গেছে! অ্যালবামে ${bn(now)} রকম মাছ।`);
      window.setTimeout(() => { sfx.levelUp(); confetti(); }, 700);
    } else if (added.isNew && rare) window.setTimeout(() => { sfx.win(); confetti({ count: 60 }); }, 700);
    else if (added.isNew) window.setTimeout(sfx.coin, 700);
  }

  function finish() {
    stopHum();
    const live = trip.current, stars = starsOf(live.catches.length, live.spec), grams = basket(live), big = biggest(live)?.fish ?? -1;
    const previous = best, record = live.catches.length > 0 && submitBest(grams) && previous !== null;
    if (stars) levels.record(live.spec.level, stars);
    overAt.current = performance.now();
    setResult({ stars, grams, catches: live.catches.length, big, record, previous });
    const party = stars === 3 || record || (stars > 0 && live.spec.level === LEVEL_COUNT);
    window.setTimeout(() => {
      if (party) { sfx.levelUp(); confetti({ colors: ["#d6352b", "#ffd166", "#3fae5a", "#ffffff", "#4f8f78"] }); }
      else if (stars) sfx.good();
      else sfx.lose();
    }, stars ? 950 : 250);
  }

  // ---- the loop ----
  const running = !paused && phase !== "done";
  useGameLoop(dt => {
    clock.current += dt;
    const live = trip.current, event = step(live, dt);
    if (live.phase === "reel") hum.current?.follow(live.tension);
    onEvent(event);
  }, () => {
    const now = performance.now(), dt = lastDraw.current ? Math.min(0.1, (now - lastDraw.current) / 1000) : 0;
    lastDraw.current = now;
    if (scene.current) drawScene(scene.current.context, scene.current.cache, trip.current, clock.current, slow, running ? dt : 0);
  }, running);

  useEffect(() => { trip.current.slow = slow; }, [slow]);

  useEffect(() => {
    const box = stage.current, element = canvas.current;
    if (!box || !element) return;
    const cache = newCache();
    const fit = () => {
      const width = box.clientWidth;
      if (!width) return;
      const context = fitCanvas(element, width, Math.round(width * VH / VW));
      context.scale(width / VW, width / VW);
      cache.ratio = element.width / VW; cache.place = -1;
      scene.current = { context, cache };
      drawScene(context, cache, trip.current, clock.current, slow, 0);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // ---- links, saved progress, pausing ----
  useEffect(() => {
    const readFriend = () => {
      const found = parseShared(window.location.hash);
      if (!found) return false;
      friendRef.current = found; chosen.current = true;
      setFriend(found);
      begin(found.level, found.seed);
      return true;
    };
    if (!readFriend()) begin(1, newSeed());
    setSite(window.location.host);
    setAlbum(parseAlbum(readStore(ALBUM_KEY)));
    setAlbumLoaded(true);
    const hide = () => {
      if (!document.hidden) return;
      const live = trip.current;
      live.charging = false; live.holding = false; down.current = null;
      if (live.phase === "fly" || live.phase === "wait" || live.phase === "reel") { stopHum(); setPaused(true); }
    };
    window.addEventListener("hashchange", readFriend);
    document.addEventListener("visibilitychange", hide);
    return () => {
      window.removeEventListener("hashchange", readFriend);
      document.removeEventListener("visibilitychange", hide);
      stopHum();
    };
  }, []);

  // Open where the player left off once this phone's stars and album load, unless a link or a pick already chose.
  useEffect(() => {
    if (!levels.loaded || !albumLoaded || chosen.current) return;
    const live = trip.current;
    if (live.cast > 0 || live.phase !== "aim" || live.charging) return;
    begin(startLevel(levels.stars, unlocked), newSeed());
  }, [levels.loaded, albumLoaded]);

  function resume() {
    setPaused(false);
    if (trip.current.phase === "reel") hum.current = sound.reelHum();
  }

  // ---- input: one finger (or Space) does everything ----
  function onDown(event: ReactPointerEvent<HTMLElement>) {
    if (event.button > 0 || down.current) return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* synthetic or already-gone pointer */ }
    if (paused) { resume(); return; }
    if (trip.current.phase === "done") return;
    down.current = { id: event.pointerId, y: event.clientY, at: performance.now() };
    onEvent(press(trip.current));
  }
  function onUp(event: ReactPointerEvent<HTMLElement>) {
    const held = down.current;
    if (!held || held.id !== event.pointerId) return;
    down.current = null;
    const live = trip.current, dy = event.clientY - held.y, ms = performance.now() - held.at;
    // A quick upward flick casts at once: the faster the flick, the further the float goes.
    if (event.type === "pointerup" && live.phase === "aim" && live.charging && dy < -40 && ms < 350) onEvent(flick(live, Math.min(1, Math.max(0.08, -dy / ms / 2.2))));
    else onEvent(release(live));
  }

  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    if (event.key !== " " && event.key !== "Enter") return;
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    if (target?.closest?.("button, a, summary") && target !== actionButton.current) return;
    // Space still scrolls the page when the pond is off screen.
    const box = stage.current?.getBoundingClientRect();
    if (!box || box.bottom < 0 || box.top > innerHeight) return;
    event.preventDefault();
    if (event.type === "keyup") { if (trip.current.phase !== "done") onEvent(release(trip.current)); return; }
    if (event.repeat) return;
    if (paused) { resume(); return; }
    if (trip.current.phase === "done") primary();
    else onEvent(press(trip.current));
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    window.addEventListener("keyup", listen);
    return () => { window.removeEventListener("keydown", listen); window.removeEventListener("keyup", listen); };
  }, []);

  // ---- after the trip ----
  const nextLevel = result && result.stars && level < LEVEL_COUNT ? level + 1 : 0;
  const nextOpen = nextLevel > 0 && placeOpen(placeOf(nextLevel), count);
  function primary() {
    if (performance.now() - overAt.current < 600) return;
    chosen.current = true;
    if (nextLevel && nextOpen) begin(nextLevel, seedFor(nextLevel));
    else begin(level, seedFor(level));
  }
  const again = () => { if (performance.now() - overAt.current >= 600) { chosen.current = true; begin(level, seedFor(level)); } };

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    loadCardFonts(`ছিপ ফেলো লেভেল ১২৩ রাফির ঝুড়িতে কেজি গ্রাম ${humanLine(shared)}`).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site]);

  // ---- words on screen ----
  function statusLine() {
    if (note) return note.text;
    if (phase === "aim") return current.charging ? "বৃত্তটা বুদবুদের ওপর এলে ছেড়ে দাও।" : "আঙুল চেপে ধরো, ছাড়লেই ছিপ পড়বে। বুদবুদের কাছে ফেলো।";
    if (phase === "fly") return "ছিপ পড়ছে…";
    if (phase === "wait") return current.t / (current.slow ? 1.6 : 1) >= current.biteAt ? "ডুবেছে! এখনই টান দাও।" : spec.fakes ? "ছোট ঠোকরে না, ফাতনা পুরো ডুবলে চাপো।" : "ফাতনায় চোখ রাখো। পুরো ডুবলেই চাপো।";
    if (phase === "reel") return "চেপে ধরলে গোটাবে, ছাড়লে ঢিল। দাগটা সবুজে রাখো।";
    return "";
  }
  const action = phase === "aim" ? (current.charging ? "ছেড়ে দাও!" : "চেপে ধরো, ছেড়ে দাও") : phase === "fly" ? "ছিপ পড়ছে" : phase === "wait" ? "টান দাও" : phase === "reel" ? "চেপে ধরে গোটাও" : "পরের বার";
  const gateNote = nextLevel && !nextOpen ? `${PLACES[placeOf(nextLevel)].name} খুলবে অ্যালবামে ${bn(PLACES[placeOf(nextLevel)].need)} রকম মাছ হলে। এখন ${bn(count)} রকম, আগের লেভেলে আরও খোঁজো।` : "";
  const seeCard = () => resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const toTop = () => wrap.current?.scrollIntoView({ behavior: smooth(), block: "start" });
  const fishLeft = spec.casts - current.results.length;

  return (
    <div className="cf" data-slow={slow} ref={wrap}>
      {friend && (
        <section className="cf-friend" aria-labelledby="cf-friend-title">
          <h2 id="cf-friend-title">{feat(friend)}।</h2>
          <p>{bannerNote(friend)}</p>
        </section>
      )}

      <div className="cf-hud">
        <p className="cf-level"><b>{levelLabel(level)}</b><span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)} · {bn(spec.need)}টা মাছ লাগবে</span></p>
        <ol className="cf-casts" aria-label={`${bn(spec.casts)} বারের মধ্যে ${bn(current.catches.length)}টা মাছ, বাকি ${bn(fishLeft)} বার`}>
          {Array.from({ length: spec.casts }, (_, index) => <li key={index} data-r={current.results[index] === "caught" ? "fish" : current.results[index] ? "miss" : index === current.cast && phase !== "done" ? "now" : undefined} />)}
        </ol>
        <p className="cf-basket" aria-label={`ঝুড়িতে ${weightText(basket(current))}`}><span className="cf-basket-ico" aria-hidden="true" /><b key={current.catches.length} className={current.catches.length ? "gx-pop" : ""}>{weightText(basket(current))}</b></p>
      </div>

      <div className="cf-stage-wrap">
        <div className="cf-stage" ref={stage} onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onContextMenu={event => event.preventDefault()}
          role="img" aria-label={`${PLACES[spec.place].name}, ছিপ আর ফাতনা। ${statusLine()}`}>
          <canvas ref={canvas} />
          {show && (
            <div key={show.key} className="cf-catch" style={{ "--show": `${SHOW_CATCH}s` } as CSSProperties} aria-hidden="true">
              <p className="cf-catch-head">ধরা পড়ল!</p>
              <FishPic index={show.fish} known size={220} />
              <p className="cf-catch-name"><b>{FISH[show.fish].name}</b> · {weightText(show.grams)}</p>
              <p className="cf-catch-tag" data-rare={FISH[show.fish].rarity === 2 || undefined}>{show.isNew ? "অ্যালবামে নতুন!" : show.record ? "এই মাছের নতুন রেকর্ড!" : RARITY[FISH[show.fish].rarity]}</p>
            </div>
          )}
        </div>
        {paused && (
          <div className="cf-overlay">
            <p>থেমে আছে। মাছও অপেক্ষা করছে।</p>
            <button type="button" className="kit-primary" onClick={resume}>চালিয়ে যাও</button>
          </div>
        )}
      </div>

      {show ? <p className="cf-status" role="status">{FISH[show.fish].name} ধরা পড়ল, {weightText(show.grams)}।{show.isNew ? " অ্যালবামে নতুন।" : ""}</p> : null}
      {news && phase !== "done" && <p className="cf-news" role="status">{news}</p>}

      {phase === "done" && result ? (
        <div className="cf-clear" role="status">
          {result.stars ? <StarReveal count={result.stars} /> : null}
          <p className="cf-clear-line">{result.stars ? clearLine(level) : `ঝুড়িতে ${bn(result.catches)}টা মাছ। ${nearMissLine(level, result.catches)}`}</p>
          <p className="cf-clear-note">
            {castsLabel(level, result.catches)}{result.catches ? `, মোট ${weightText(result.grams)}` : ""}।{" "}
            {rival ? compareLine(result.grams, rival.grams, rival.name)
              : result.record && result.previous !== null ? `এই লেভেলে নতুন রেকর্ড! আগে ছিল ${weightText(result.previous)}।`
              : result.stars ? nearMissLine(level, result.catches) : ""}
          </p>
          {news && <p className="cf-news">{news}</p>}
          {gateNote && <p className="cf-gate">{gateNote}</p>}
          <div className="cf-actions">
            <button type="button" className="kit-primary" onClick={primary}>{nextLevel && nextOpen ? "পরের লেভেল" : result.stars ? "আবার খেলো" : "আরেকবার"}</button>
            {nextLevel && nextOpen ? <button type="button" className="kit-secondary" onClick={again}>আবার খেলো</button> : null}
          </div>
          <button type="button" className="kit-link cf-see" onClick={seeCard}>কার্ড দেখো ↓</button>
        </div>
      ) : (
        <>
          {!show && <p className={`cf-status${note?.miss ? " cf-miss" : ""}`} role="status" aria-live="polite">{statusLine()}</p>}
          <button type="button" ref={actionButton} className="cf-action" data-phase={phase} data-held={current.charging || current.holding || undefined}
            onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onContextMenu={event => event.preventDefault()} disabled={paused || phase === "fly"}>
            {action}
          </button>
        </>
      )}

      <div className="cf-prefs">
        <button type="button" className="cf-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact onChange={on => { if (!on) hum.current = null; else if (trip.current.phase === "reel" && !paused) hum.current = sound.reelHum(); }} />
      </div>

      <details className="cf-drawer">
        <summary>মাছের অ্যালবাম <span>{bn(count)}/{bn(FISH.length)}</span></summary>
        <ul className="cf-album">
          {FISH.map((fish, index) => {
            const caughtGrams = album[fish.id];
            return (
              <li key={fish.id} data-known={Boolean(caughtGrams) || undefined}>
                <FishPic index={index} known={Boolean(caughtGrams)} size={88} />
                <b>{caughtGrams ? fish.name : "???"}</b>
                <small>{caughtGrams ? `সবচেয়ে বড় ${weightText(caughtGrams)}` : `${fish.places.map(place => PLACES[place].at).join(", ")} থাকে`}</small>
                {caughtGrams ? <small className="cf-note">{fish.note}</small> : null}
              </li>
            );
          })}
        </ul>
      </details>

      <details className="cf-drawer">
        <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p className="cf-worlds">{PLACES.map((place, index) => `${bn(index * 5 + 1)}–${bn(index * 5 + 5)} ${place.name}${place.need ? ` (অ্যালবামে ${bn(place.need)} রকম মাছ লাগে)` : ""}`).join(" · ")}</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={Math.max(unlocked, friend?.level ?? 1)} current={level} onPick={pick => { chosen.current = true; begin(pick, seedFor(pick)); toTop(); }} />
      </details>

      <section className="cf-result" id="result" ref={resultBox} aria-labelledby="cf-result-title">
        <h2 id="cf-result-title">{shared ? <>ঝুড়িতে <em>{shared.catches ? weightText(shared.grams) : "আজ কিছু নেই"}</em></> : "ঝুড়ি ভরলে তোমার কার্ড"}</h2>
        <p>{shared ? humanLine(shared) : "সব বার ছিপ ফেলা হলে কার্ডটা এখানে আসবে। বন্ধু লিংক খুললে একই ঘাট, একই বুদবুদ পাবে।"}</p>
        {shared && result && (
          <div className="cf-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`ছিপ ফেলোর কার্ড: ${levelLabel(level)}, ${castsLabel(level, shared.catches)}, ${weightText(shared.grams)}।`} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="cf-share">
              <label className="cf-name">
                <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`chhip-felo-level-${level}.png`} makeImage={() => cardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={caption(shared)} state={state}
                hint="বন্ধু লিংক খুললে একই ঘাট, একই বুদবুদ পাবে। ওজনটা তোমার ফোনের হিসাব।" />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
