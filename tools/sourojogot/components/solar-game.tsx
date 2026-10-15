"use client";
// IP: what we avoided — no NASA, ESA or textbook images and no planet app's look; every planet, the rocket and the football are our own SVG, and facts are re-said in our words from NASA's fact pages.

import { useCallback, useEffect, useRef, useState } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { confetti, newSeed, sfx, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, useKidsSession } from "../../../shared/kids-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  BOARD, choiceCount, doneLine, farChoices, farHint, farReveal, FRESH_PACE, LEVEL_COUNT, levelOf, nextPace, orbitRadius, placeOn, planetsOf, rightThing, rightZone,
  shouldGlow, shuffledSlots, sizeChoices, sizeHint, sizeReveal, spot, starsOf, tourHint, type Pace,
} from "../lib/levels";
import { bn, FIELD_M, footballScale, PLANETS, type Thing, type Zone } from "../lib/planets";
import { Football, GhostFinger, PlanetArt, Rocket, ThingArt, ZoneArt } from "./art";
import { PrintSheet } from "./print-sheet";

const TOOL = "sourojogot";
type Say = { title?: string; text: string; hint?: boolean };

const soft = () => tone(330, 0.12, 0.06, "sine");
const pct = (value: number, of: number) => `${(value / of) * 100}%`;

function introOf(level: number): Say {
  const { mode } = levelOf(level);
  if (mode === "tour") return { text: "রকেট সূর্যের পাশে। সবচেয়ে কাছের গ্রহে চাপো, তারপর একটা একটা করে বাইরে যাও।" };
  if (mode === "sort") return { text: "গ্রহগুলো জায়গা বদলে ফেলেছে। সূর্যের সবচেয়ে কাছেরটা আগে চাপো।" };
  return { text: "" };
}

export function SolarGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow, setSlow] = useSlowMode();
  const session = useKidsSession();
  const [print, setPrint] = useState(false);
  const [level, setLevel] = useState(1);
  const [phase, setPhase] = useState<"play" | "done" | "menu">("play");
  const [step, setStep] = useState(0);
  const [slots, setSlots] = useState<number[]>([]);
  const [rocketAt, setRocketAt] = useState(-1);
  const [mistakes, setMistakes] = useState(0);
  const [tries, setTries] = useState(0);
  const [pace, setPace] = useState<Pace>(FRESH_PACE);
  const [say, setSay] = useState<Say>(introOf(1));
  const [tapped, setTapped] = useState(false);
  const [wobble, setWobble] = useState<{ key: string; n: number } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [wrongPicks, setWrongPicks] = useState<string[]>([]);
  const [seed, setSeed] = useState(1);
  const [showParent, setShowParent] = useState(false);
  const card = useRef<HTMLCanvasElement>(null);
  const started = useRef(false);

  const spec = levelOf(level), planets = planetsOf(level), count = spec.count;
  const quiz = spec.mode === "size" || spec.mode === "far";
  const current = planets[Math.min(step, count - 1)];
  const glow = shouldGlow(pace, tries);

  useEffect(() => { setPrint(new URLSearchParams(location.search).has("print")); }, []);

  const begin = useCallback((next: number) => {
    const fresh = levelOf(next);
    setLevel(next); setPhase("play"); setStep(0); setRocketAt(-1); setMistakes(0); setTries(0); setPace(FRESH_PACE);
    setRevealed(false); setWrongPicks([]); setWobble(null); setTapped(false); setShowParent(false);
    setSlots(fresh.mode === "sort" ? shuffledSlots(fresh.count, newSeed()) : Array.from({ length: fresh.count }, (_, index) => index));
    setSeed(newSeed());
    setSay(introOf(next));
  }, []);

  // Open where the child left off: the first open level without stars.
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    const open = Array.from({ length: levels.unlocked }, (_, index) => index + 1).find(lv => !levels.stars[lv]) ?? 1;
    begin(open);
  }, [levels.loaded, levels.unlocked, levels.stars, begin]);

  useEffect(() => {
    if (!showParent || !card.current) return;
    let live = true;
    loadCardFonts(`${doneLine(level)} সৌরজগতের সফর ${PLANETS.map(planet => planet.name).join(" ")}`).catch(() => undefined).then(() => {
      if (live && card.current) drawCard(card.current, level, mistakes, location.host);
    });
    return () => { live = false; };
  }, [showParent, level, mistakes]);

  function finish(slips: number) {
    const stars = starsOf(slips);
    levels.record(level, stars);
    sfx.win();
    if (level === LEVEL_COUNT) confetti();
    setPhase("done");
    session.atBreak();
  }

  function slip(key: string, hint: string, title?: string) {
    soft();
    setMistakes(value => value + 1);
    setTries(value => value + 1);
    setPace(value => nextPace(value, false));
    setWobble(value => ({ key, n: (value?.n ?? 0) + 1 }));
    setSay({ title, text: hint, hint: true });
  }

  function right() {
    setPace(value => nextPace(value, true));
    setTries(0);
  }

  /** Tour and sort: tap the planet that comes next from the Sun. */
  function tapPlanet(index: number) {
    if (phase !== "play") return;
    setTapped(true);
    const planet = planets[index];
    if (index < step) { sfx.tap(); setSay({ title: planet.name, text: planet.fact }); return; }
    if (index !== step) { slip(planet.id, tourHint(planet.id, planets[step])); return; }
    sfx.note(index);
    right();
    if (spec.mode === "tour") setRocketAt(index);
    else setSlots(value => placeOn(value, index, index));
    setSay({ title: planet.name, text: planet.fact });
    setStep(index + 1);
    if (index + 1 === count) finish(mistakes);
  }

  /** Size and far: pick a thing or a place for the current planet. */
  function choose(id: string, ok: boolean, hint: string) {
    if (phase !== "play" || revealed) return;
    setTapped(true);
    if (!ok) { setWrongPicks(value => [...value, id]); slip(id, hint); return; }
    sfx.good();
    right();
    setRevealed(true);
    setSay({ title: current.name, text: spec.mode === "size" ? sizeReveal(current) : farReveal(current) });
  }

  function nextPlanet() {
    sfx.tap();
    setRevealed(false); setWrongPicks([]); setWobble(null); setSeed(newSeed());
    if (step + 1 >= count) { setStep(count); finish(mistakes); return; }
    setStep(step + 1);
    setSay({ text: "" });
  }

  if (print) return <PrintSheet />;

  const wobbleClass = (key: string) => wobble?.key === key && !slow ? ` sj-wobble sj-w${wobble.n % 2}` : "";
  const ghostTarget = !tapped && phase === "play" && !quiz && step === 0 ? spot(slots.indexOf(0) < 0 ? 0 : slots.indexOf(0), count) : null;
  const rocket = rocketAt < 0 ? { x: 62, y: 60 } : (() => { const at = spot(rocketAt, count), r = planets[rocketAt].drawR; return { x: at.x + r * 0.7 + 12, y: at.y - r * 0.7 - 12 }; })();
  const question = spec.mode === "size" ? `সূর্য যদি একটা ফুটবল হয়, ${current.name} কত বড় হতো?` : `ফুটবল-সূর্য মাঠের এক মাথায়। ${current.name} কোথায় থাকত?`;

  return (
    <div className="sj" data-slow={slow}>
      <div className="sj-top">
        <p className="sj-level"><b>লেভেল {bn(level)}</b> <span>{spec.title}</span></p>
        <ol className="sj-dots" aria-label={`${bn(count)}টার মধ্যে ${bn(Math.min(step, count))}টা হয়েছে`}>
          {planets.map((planet, index) => <li key={planet.id} className={index < step ? "on" : index === step && phase === "play" ? "now" : ""} />)}
        </ol>
      </div>

      {!quiz ? (
        <div className="sj-board" style={{ aspectRatio: `${BOARD.width} / ${BOARD.height}` }}>
          <svg className="sj-sky" viewBox={`0 0 ${BOARD.width} ${BOARD.height}`} aria-hidden="true" focusable="false">
            <defs><radialGradient id="sj-sun" cx="0" cy="0" r="1"><stop offset=".2" stopColor="#fff3b0" /><stop offset=".7" stopColor="#ffc93c" /><stop offset="1" stopColor="#f28c28" /></radialGradient></defs>
            {Array.from({ length: 26 }, (_, i) => <circle key={i} cx={(i * 137) % BOARD.width} cy={(i * 89) % BOARD.height} r={i % 4 ? 1 : 1.6} fill="#fff" opacity=".55" />)}
            {planets.map((planet, index) => <circle key={planet.id} r={orbitRadius(index, count)} cx="0" cy="0" fill="none" stroke="#9fb0ff" strokeOpacity={spec.mode === "sort" && index >= step ? 0.55 : 0.28} strokeDasharray={spec.mode === "sort" ? "5 6" : undefined} />)}
            <circle cx="0" cy="0" r={BOARD.sunR} fill="url(#sj-sun)" />
          </svg>
          {planets.map((planet, index) => {
            const at = spot(spec.mode === "sort" ? slots.indexOf(index) : index, count), done = index < step;
            return <button key={planet.id} type="button" data-planet={planet.id} className={`sj-planet${done ? " done" : ""}${glow && index === step && phase === "play" ? " sj-glow" : ""}${wobbleClass(planet.id)}`}
              style={{ left: pct(at.x, BOARD.width), top: pct(at.y, BOARD.height) }}
              aria-label={done ? `${planet.name}, হয়ে গেছে` : planet.name} onClick={() => tapPlanet(index)}>
              <PlanetArt planet={planet} />
              {done && <span className="sj-name">{planet.name}</span>}
            </button>;
          })}
          {spec.mode === "tour" && <span className="sj-rocket" style={{ left: pct(rocket.x, BOARD.width), top: pct(rocket.y, BOARD.height) }}><Rocket /></span>}
          {ghostTarget && <span className="sj-ghost" style={{ left: pct(ghostTarget.x + 8, BOARD.width), top: pct(ghostTarget.y + 10, BOARD.height) }}><GhostFinger /></span>}
          {phase === "done" && <EndScreen level={level} mistakes={mistakes} onAgain={() => { sfx.tap(); begin(level); }} onEnd={() => { sfx.tap(); setPhase("menu"); }} onShow={() => setShowParent(true)} />}
          {phase === "menu" && <Menu levels={levels} level={level} onPick={begin} />}
        </div>
      ) : (
        <div className="sj-board sj-quiz">
          <ScaleView mode={spec.mode as "size" | "far"} step={step} revealed={revealed} />
          {phase === "play" && <>
            <p className="sj-question">{question}</p>
            {spec.mode === "size" ? (
              <div className="sj-choices" data-count={choiceCount(pace)}>
                {sizeChoices(current, choiceCount(pace), seed).map((thing: Thing) => {
                  const ok = thing.id === rightThing(current).id;
                  return <button key={thing.id} type="button" data-choice={thing.id} disabled={wrongPicks.includes(thing.id) || (revealed && !ok)}
                    className={`sj-choice${ok && (revealed || glow) ? " sj-glow" : ""}${wobbleClass(thing.id)}`} onClick={() => choose(thing.id, ok, sizeHint(thing, current))}>
                    <span className="sj-icon"><ThingArt thing={thing} /></span><span>{thing.name}</span>
                  </button>;
                })}
                {!tapped && step === 0 && <span className="sj-ghost sj-sweep"><GhostFinger /></span>}
              </div>
            ) : (
              <div className="sj-choices sj-rows">
                {farChoices().map((zone: Zone) => {
                  const ok = zone.id === rightZone(current).id;
                  return <button key={zone.id} type="button" data-choice={zone.id} disabled={wrongPicks.includes(zone.id) || (revealed && !ok)}
                    className={`sj-choice${ok && (revealed || glow) ? " sj-glow" : ""}${wobbleClass(zone.id)}`} onClick={() => choose(zone.id, ok, farHint(zone, current))}>
                    <span className="sj-icon"><ZoneArt zone={zone.id} /></span><span>{zone.name}</span>
                  </button>;
                })}
                {!tapped && step === 0 && <span className="sj-ghost sj-sweep"><GhostFinger /></span>}
              </div>
            )}
            {revealed && <button type="button" className="kit-primary sj-next" onClick={nextPlanet}>{step + 1 >= count ? "শেষ দেখো" : "পরের গ্রহ"}</button>}
          </>}
          {phase === "done" && <EndScreen level={level} mistakes={mistakes} onAgain={() => { sfx.tap(); begin(level); }} onEnd={() => { sfx.tap(); setPhase("menu"); }} onShow={() => setShowParent(true)} />}
          {phase === "menu" && <Menu levels={levels} level={level} onPick={begin} />}
        </div>
      )}

      <div className={`sj-say${say.hint ? " hint" : ""}${say.text ? "" : " empty"}`} role="status" aria-live="polite">
        {say.title && <p className="sj-say-title">{say.title}</p>}
        {say.text && <p>{say.text}</p>}
        {say.title && !say.hint && <SpeakButton text={`${say.title}। ${say.text}`} />}
      </div>

      <div className="sj-controls">
        <button type="button" className="sj-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact />
        <details className="sj-drawer">
          <summary>সব লেভেল</summary>
          <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level} onPick={begin} />
        </details>
      </div>

      <div className="sj-parent">
        <ParentGate label="বড়দের জন্য">
          <ShareToolLink title="সৌরজগতের সফর" text="ছোটদের জন্য গ্রহের নাম আর ক্রম শেখার খেলা। ফ্রি, বিজ্ঞাপন নেই।" />
          <a className="kit-secondary" href="/sourojogot?print">গ্রহের কাট-আউট প্রিন্ট করো</a>
        </ParentGate>
      </div>

      <ShowParent open={showParent} onClose={() => setShowParent(false)} picture={{ fileName: `sourojogot-level-${level}.png`, make: () => cardBlob(level, mistakes, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`সৌরজগতের সফরের কার্ড: ${doneLine(level)}।`} /></figure>
        <p>{doneLine(level)}।</p>
      </ShowParent>
      {session.resting && <RestScreen onExtend={session.extend} />}
    </div>
  );
}

function EndScreen({ level, mistakes, onAgain, onEnd, onShow }: { level: number; mistakes: number; onAgain: () => void; onEnd: () => void; onShow: () => void }) {
  const { mode } = levelOf(level);
  const method = mistakes ? `${bn(mistakes)}বার আবার ভেবেছ, তারপর ঠিকটা পেয়েছ।` : mode === "tour" || mode === "sort" ? "সূর্য থেকে গুনে গুনে গেছ, তাই একবারও আটকাওনি।" : "একবারও আটকাওনি।";
  return <div className="sj-end" role="status">
    <StarReveal count={starsOf(mistakes)} />
    <p className="sj-end-line">{doneLine(level)}।</p>
    <p className="sj-end-note">{method}</p>
    <div className="sj-end-actions">
      <button type="button" className="kit-primary" onClick={onAgain}>আবার খেলো</button>
      <button type="button" className="kit-primary sj-quiet" onClick={onEnd}>শেষ</button>
    </div>
    <ShowParentButton onClick={onShow} />
  </div>;
}

function Menu({ levels, level, onPick }: { levels: ReturnType<typeof useLevels>; level: number; onPick: (level: number) => void }) {
  return <div className="sj-end sj-menu">
    <p className="sj-end-line">আরেকটা খেলবে? একটা বেছে নাও।</p>
    <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level} onPick={onPick} />
  </div>;
}

/** The football Sun with the current planet: true size after a right size guess, true place on the field strip for distance. */
function ScaleView({ mode, step, revealed }: { mode: "size" | "far"; step: number; revealed: boolean }) {
  const planet = PLANETS[Math.min(step, 7)], scale = footballScale(planet);
  if (mode === "size") {
    const ballR = 58, dot = Math.max(0.7, ballR * scale.sizeMm / 220);
    return <svg className="sj-scale" viewBox="0 0 360 150" role="img" aria-label={revealed ? `ফুটবলের পাশে ${planet.name}, আসল অনুপাতে` : `ফুটবলের পাশে ${planet.name}`}>
      <Football cx={86} cy={66} r={ballR} />
      <text x="86" y="146" textAnchor="middle" className="sj-svg-label">সূর্য</text>
      {revealed ? <>
        <circle cx="250" cy="75" r={dot} fill={planet.shade} />
        <circle cx="250" cy="75" r="22" fill="none" stroke="#2c3768" strokeDasharray="3 4" />
        <text x="250" y="132" textAnchor="middle" className="sj-svg-label">{planet.name}, এই যে</text>
      </> : <>
        <g transform="translate(222 47)"><svg width="56" height="56"><PlanetArt planet={planet} box={80} r={Math.min(30, planet.drawR)} /></svg></g>
        <text x="250" y="132" textAnchor="middle" className="sj-svg-label">{planet.name}</text>
      </>}
    </svg>;
  }
  // 0–750 m along the strip; the field is the first 100 m.
  const x = (metres: number) => 18 + metres * (342 - 18) / 750;
  return <svg className="sj-scale" viewBox="0 0 360 150" role="img" aria-label={revealed ? `${planet.name} থাকত ${bn(Math.round(scale.distanceM))} মিটার দূরে` : "মাঠের এক মাথায় ফুটবল-সূর্য"}>
    <rect x={x(0)} y="60" width={x(FIELD_M) - x(0)} height="40" rx="3" fill="#69b65a" />
    <text x={(x(0) + x(FIELD_M)) / 2} y="52" textAnchor="middle" className="sj-svg-label">মাঠ</text>
    {[140, 190, 240].map(at => <path key={at} d={`M ${x(at) - 8} 100 V 86 L ${x(at)} 78 L ${x(at) + 8} 86 V 100 Z`} fill="#f2d7a6" stroke="#2c3768" strokeWidth="1.2" />)}
    {[420, 520, 640].map(at => <g key={at}><circle cx={x(at)} cy="84" r="9" fill="#4a9d40" /><rect x={x(at) - 1.2} y="90" width="2.4" height="10" fill="#7a4a24" /></g>)}
    <line x1={x(0)} y1="100" x2={x(750)} y2="100" stroke="#2c3768" strokeWidth="1.5" />
    <circle cx={x(0)} cy="92" r="6" fill="#fff" stroke="#2c3768" strokeWidth="1.5" />
    {PLANETS.slice(0, step + (revealed ? 1 : 0)).map(seen => <circle key={seen.id} cx={x(footballScale(seen).distanceM)} cy="112" r={seen.id === planet.id ? 6 : 4} fill={seen.color} stroke="#2c3768" strokeWidth="1" />)}
    {revealed && <text x={Math.min(300, Math.max(60, x(scale.distanceM)))} y="140" textAnchor="middle" className="sj-svg-label">{planet.name}: {bn(Math.round(scale.distanceM))} মিটার</text>}
    <text x={x(0)} y="140" className="sj-svg-label">সূর্য</text>
  </svg>;
}
