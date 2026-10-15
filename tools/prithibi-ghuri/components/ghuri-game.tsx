"use client";
// IP: what we avoided — no geography app's or atlas's look, no airline or passport-office branding, no tourism-board photos; every picture, flag and the map are our own flat SVG, and flags that can't be drawn exactly (dragons, script, seals) are left out.

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { loadCardFonts, renderCard } from "../../../shared/card-canvas";
import { confetti, makeRng, newSeed, sfx, shake, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, bn, useKidsSession } from "../../../shared/kids-kit";
import { FLAGS, INK, LAKE_PATH, LAND_PATH, PICS, PLANE, WORLD, project } from "../lib/art";
import { COUNTRIES, DHAKA, TRIPS, countryOf, type Country } from "../lib/countries";
import { drawCard, loadPictures, type CardData } from "../lib/draw-card";
import {
  CARDS, LEVEL_COUNT, OG_DEMO, angleAt, cardTitle, choiceCount, choicesFor, dotCount, flightOf, helloLine, inside, isOgHash, levelOf, of, pointAt,
  questionOf, starsOf, tripCountries, tripOf, tripView, whyLine,
} from "../lib/game";

const TOOL = "prithibi-ghuri";
const FLY_MS = 1800;
const PINS = ["#d9480f", "#1971c2", "#7048e8"];
type Phase = "map" | "fly" | "visit" | "ask" | "stamp" | "done" | "idle";
type Visit = { id: string; card: number; choices: Country[]; wrong: string[]; solved: boolean };
type Result = { level: number; stars: number; ids: string[]; clean: boolean };

function Pic({ k, className = "pg-pic" }: { k: string; className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true">
    <g stroke={INK} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" dangerouslySetInnerHTML={{ __html: PICS[k] ?? "" }} />
  </svg>;
}

function Flag({ id, className = "pg-flag" }: { id: string; className?: string }) {
  const flag = FLAGS[id];
  if (!flag) return null;
  return <svg className={className} viewBox={`0 0 ${flag.w} ${flag.h}`} preserveAspectRatio="none" style={{ aspectRatio: `${flag.w} / ${flag.h}` }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: flag.svg }} />;
}

/** The country's badge: its flag if we draw one, otherwise its animal. */
const Badge = ({ id }: { id: string }) => FLAGS[id] ? <Flag id={id} className="pg-badge-flag" /> : <Pic k={`${id}:animal`} className="pg-badge-pic" />;

/** The ghost finger that shows the first tap, so a child who can't read yet knows where to press. */
function Finger() {
  return <span className="pg-ghost-at" aria-hidden="true"><svg className="pg-ghost" viewBox="0 0 40 52"><path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#23303a" strokeWidth="2.6" strokeLinejoin="round" /></svg></span>;
}

/** Dhaka, the trip's three countries, trails to the ones already stamped, and the plane on its dotted line. */
function WorldMap({ level, done, flying, slow, onLanded }: { level: number; done: string[]; flying: string | null; slow: boolean; onLanded: () => void }) {
  const view = tripView(level), countries = tripCountries(level);
  const unit = view.w / 60;
  const [t, setT] = useState(0);
  const landed = useRef(onLanded);
  landed.current = onLanded;
  useEffect(() => {
    if (!flying) { setT(0); return; }
    if (slow) { setT(1); const timer = setTimeout(() => landed.current(), 500); return () => clearTimeout(timer); }
    let frame = 0, timer: ReturnType<typeof setTimeout> | undefined;
    const start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / FLY_MS);
      setT(k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2);
      if (k < 1) frame = requestAnimationFrame(tick);
      else timer = setTimeout(() => landed.current(), 260);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); clearTimeout(timer); };
  }, [flying, slow]);
  const [hx, hy] = project(DHAKA.lon, DHAKA.lat);
  const trail = (country: Country, upTo: number, className: string) => {
    const f = flightOf(country), n = dotCount(f, view);
    return Array.from({ length: n + 1 }, (_, i) => i / n).filter(k => k <= upTo + 1e-6).map(k => { const p = pointAt(f, k); return <circle key={k} className={className} cx={p.x} cy={p.y} r={unit * 0.32} />; });
  };
  const target = flying ? countryOf(flying) : null;
  const plane = target && pointAt(flightOf(target), t);
  return <svg className="pg-map" viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`} role="img" aria-label={`মানচিত্র: ঢাকা আর ${countries.map(c => c.name).join(", ")}${target ? `। প্লেন যাচ্ছে ${target.name}` : ""}`}>
    <rect x={0} y={0} width={WORLD.width} height={WORLD.height} fill="#bfe3ee" />
    <path d={LAND_PATH} fill="#e8dcb4" stroke="#b8a77a" strokeWidth={unit * 0.12} strokeLinejoin="round" />
    <path d={LAKE_PATH} fill="#bfe3ee" stroke="#b8a77a" strokeWidth={unit * 0.12} />
    {countries.filter(c => done.includes(c.id)).map(c => <g key={c.id}>{trail(c, 1, "pg-trail")}</g>)}
    {target && trail(target, t, "pg-route")}
    {countries.map((c, i) => {
      const [x, y] = project(c.lon, c.lat);
      return <g key={c.id} className={c.id === flying ? "pg-pin now" : "pg-pin"}>
        <circle cx={x} cy={y} r={unit * 1.3} fill={PINS[i]} stroke="#fff" strokeWidth={unit * 0.35} />
        {done.includes(c.id) && <path d={`M${x - unit * 0.6} ${y}l${unit * 0.45} ${unit * 0.5} ${unit * 0.8}-${unit * 0.95}`} fill="none" stroke="#fff" strokeWidth={unit * 0.35} strokeLinecap="round" />}
      </g>;
    })}
    <circle cx={hx} cy={hy} r={unit * 1.1} fill="#006a4e" stroke="#fff" strokeWidth={unit * 0.3} />
    <circle cx={hx - unit * 0.1} cy={hy} r={unit * 0.5} fill="#f42a41" />
    <text x={hx} y={hy + unit * 3.2} className="pg-map-label" fontSize={unit * 2.3} textAnchor="middle">ঢাকা</text>
    {target && t > 0.85 && (() => { const [x, y] = project(target.lon, target.lat); return <text x={x} y={y - unit * 2} className="pg-map-label" fontSize={unit * 2.3} textAnchor="middle">{target.name}</text>; })()}
    {plane && <g transform={`translate(${plane.x} ${plane.y}) rotate(${angleAt(flightOf(target!), Math.min(t, 0.999))}) scale(${unit * 2.2})`} fill="#fff" stroke={INK} strokeWidth={0.08} strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: PLANE }} />}
  </svg>;
}

function CardCanvas({ data }: { data: CardData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      const names = data.ids.map(id => { const c = countryOf(id)!; return `${c.name} ${c.hello.word} ${helloLine(c)} ${c.food.name} ${c.place.name}`; }).join(" ");
      await loadCardFonts(`${data.label} ${data.title} ${data.trip} ${names}`);
      const pictures = await loadPictures(data.ids);
      if (live && ref.current) drawCard(ref.current, data, pictures, location.host);
    })();
    return () => { live = false; };
  }, [data]);
  return <canvas ref={ref} width={1080} height={1350} aria-label={data.title} />;
}

/** The header on every visit screen: flag, name, continent and capital. */
function Where({ country }: { country: Country }) {
  return <header className="pg-where">
    <Flag id={country.id} />
    <div><h2>{country.name}</h2><p>{country.continent} · রাজধানী {country.capital}</p></div>
  </header>;
}

function Postcard({ country, card }: { country: Country; card: number }) {
  const kind = CARDS[card];
  if (kind === "hello") return <div className="pg-card pg-hello">
    <p className="pg-tag">হ্যালো বলো</p>
    <p className="pg-word">{country.hello.word} <SpeakButton text={country.hello.word} /></p>
    <p className="pg-note">{helloLine(country)}।</p>
  </div>;
  if (kind === "like") return <div className="pg-card pg-like">
    <p className="pg-tag">আমাদের মতোই</p>
    <div className="pg-pair-flags"><Flag id="bd" /><span aria-hidden="true">↔</span><Badge id={country.id} /></div>
    <p className="pg-note pg-big">{country.like}</p>
    {country.probash && <p className="pg-note">{inside(country.name)} অনেক বাংলাদেশি থাকেন, কাজ করেন। তোমার কোনো আত্মীয় আছেন? আম্মুকে জিজ্ঞেস করো।</p>}
  </div>;
  const item = country[kind], tag = { food: "খাবার", place: "দেখার জায়গা", animal: "প্রাণী" }[kind];
  return <div className="pg-card">
    <p className="pg-tag">{tag}</p>
    <Pic k={`${country.id}:${kind}`} className="pg-pic pg-pic-big" />
    <h3>{item.name}</h3>
    <p className="pg-note">{item.note}</p>
  </div>;
}

export function GhuriGame() {
  const [phase, setPhase] = useState<Phase>("map");
  const [level, setLevel] = useState(1);
  const [done, setDone] = useState<string[]>([]);
  const [firstTry, setFirstTry] = useState(0);
  const [visit, setVisit] = useState<Visit | null>(null);
  const [why, setWhy] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [showing, setShowing] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const rng = useRef<() => number>(makeRng(1));
  const runs = useRef({ miss: 0, right: 0 });
  const picked = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // On return, open the first trip without stars, unless the child already chose one.
  useEffect(() => {
    if (!levels.loaded || picked.current) return;
    const open = Array.from({ length: levels.unlocked }, (_, i) => i + 1);
    setLevel(open.find(n => !levels.stars[n]) ?? levels.unlocked);
  }, [levels.loaded, levels.unlocked, levels.stars]);

  // `#og`: the site's preview image only. A fixed result, the parent card open; nothing saved, no daily-limit check.
  useEffect(() => {
    if (!isOgHash(location.hash)) return;
    picked.current = true;
    setLevel(OG_DEMO.level);
    setResult({ level: OG_DEMO.level, stars: OG_DEMO.stars, ids: [...tripOf(OG_DEMO.level).ids], clean: true });
    setPhase("done");
    setShowing(true);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const startTrip = (next: number) => {
    picked.current = true;
    clearTimeout(timer.current);
    rng.current = makeRng(newSeed());
    setLevel(levelOf(next).level); setDone([]); setFirstTry(0); setVisit(null); setWhy(""); setResult(null);
    setPhase("map");
  };

  const fly = (country: Country) => {
    if (phase !== "map" || done.includes(country.id)) return;
    picked.current = true;
    sfx.whoosh();
    setVisit({ id: country.id, card: 0, choices: [], wrong: [], solved: false });
    setPhase("fly");
  };

  const landed = () => { sfx.drop(); setPhase("visit"); };

  const nextCard = () => {
    if (!visit) return;
    if (visit.card + 1 < CARDS.length) { sfx.tap(); setVisit({ ...visit, card: visit.card + 1 }); return; }
    sfx.pick();
    const count = choiceCount(levelOf(level).choices, runs.current.miss, runs.current.right);
    setVisit({ ...visit, choices: choicesFor(countryOf(visit.id)!, count, rng.current) });
    setWhy("");
    setPhase("ask");
  };

  const choose = (choice: Country, element: Element) => {
    if (!visit || visit.solved) return;
    const target = countryOf(visit.id)!;
    if (choice.id !== target.id) {
      if (visit.wrong.includes(choice.id)) return;
      sfx.drop();
      shake(element);
      setWhy(whyLine(choice, target.ask));
      setVisit({ ...visit, wrong: [...visit.wrong, choice.id] });
      return;
    }
    const first = visit.wrong.length === 0;
    runs.current = first ? { miss: 0, right: runs.current.right + 1 } : { miss: runs.current.miss + 1, right: 0 };
    sfx.good();
    setWhy("");
    setVisit({ ...visit, solved: true });
    if (first) setFirstTry(n => n + 1);
    timer.current = setTimeout(() => { sfx.thud(); setDone(list => [...list, visit.id]); setPhase("stamp"); }, 700);
  };

  const finish = () => {
    const ids = [...tripOf(level).ids], stars = starsOf(firstTry), before = levels.stars;
    const wasComplete = Object.keys(before).length >= LEVEL_COUNT;
    levels.record(level, stars);
    // Confetti only once every trip has its first stamp set; otherwise a short chime.
    if (!wasComplete && Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).every(n => n === level || before[n])) confetti(); else sfx.win();
    setResult({ level, stars, ids, clean: firstTry === ids.length });
    setPhase("done");
    atBreak();
  };

  const afterStamp = () => { if (done.length >= tripOf(level).ids.length) finish(); else { sfx.tap(); setVisit(null); setPhase("map"); } };

  const card = useMemo<CardData | null>(() => result && {
    label: `পৃথিবী ঘুরি · সফর ${bn(result.level)}`, title: cardTitle(result.ids.length, bn), trip: result.ids.map(id => countryOf(id)!.name).join(" · "), stars: result.stars, ids: result.ids,
  }, [result]);

  const fresh = levels.loaded && Object.keys(levels.stars).length === 0;
  const country = visit ? countryOf(visit.id)! : null;
  const countries = tripCountries(level);
  const stamped = useMemo(() => COUNTRIES.filter(c => TRIPS.some((trip, i) => levels.stars[i + 1] && trip.ids.includes(c.id))), [levels.stars]);
  const hint = !!visit && !visit.solved && visit.wrong.length >= Math.min(2, visit.choices.length - 1);
  const lastVisited = result ? countryOf(result.ids.at(-1)!) : null;

  return <div className={`pg${slow ? " pg-slow" : ""}`}>
    <div className="pg-stage">
      <div className="pg-tools">
        <button type="button" className="pg-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
        <SoundToggle compact />
      </div>

      {(phase === "map" || phase === "fly") && <>
        <p className="pg-trip"><b>সফর {bn(level)}</b> {tripOf(level).title}</p>
        <div className="pg-window"><WorldMap level={level} done={done} flying={phase === "fly" ? visit?.id ?? null : null} slow={slow} onLanded={landed} /></div>
        <p className="pg-say" role="status" aria-live="polite">{phase === "fly" ? `${country?.name} যাচ্ছি…` : done.length ? "পরের দেশটা বেছে নাও।" : "কোন দেশে যাবে? একটা চাপো।"}</p>
        <ul className="pg-go-list">
          {countries.map((c, i) => {
            const was = done.includes(c.id);
            return <li key={c.id}><button type="button" className={`pg-go${was ? " was" : ""}`} disabled={was || phase === "fly"} onClick={() => fly(c)} aria-label={was ? `${c.name}, সিল পেয়েছ` : `${c.name} যাও`}>
              <span className="pg-pin-dot" style={{ background: PINS[i] }} aria-hidden="true">{was ? "✓" : ""}</span>
              <Badge id={c.id} />
              <span className="pg-go-name">{c.name}</span>
              {fresh && phase === "map" && !done.length && i === 0 && <Finger />}
            </button></li>;
          })}
        </ul>
      </>}

      {phase === "visit" && country && visit && <div className="pg-visit">
        <Where country={country} />
        <div className="pg-card-wrap" key={visit.card}><Postcard country={country} card={visit.card} /></div>
        <ol className="pg-dots" aria-label={`${bn(CARDS.length)}টার মধ্যে ${bn(visit.card + 1)} নম্বর`}>{CARDS.map((k, i) => <li key={k} className={i < visit.card ? "done" : i === visit.card ? "now" : ""} />)}</ol>
        <button type="button" className="kit-primary pg-next" onClick={nextCard}>
          {visit.card + 1 < CARDS.length ? "পরেরটা" : "সিলের প্রশ্ন"}
          {fresh && !done.length && visit.card === 0 && <Finger />}
        </button>
      </div>}

      {phase === "ask" && country && visit && <div className="pg-visit">
        <Where country={country} />
        <p className="pg-q">{questionOf(country)} <SpeakButton text={questionOf(country)} /></p>
        <ul className={`pg-choices n${visit.choices.length}`}>
          {visit.choices.map(choice => {
            const right = choice.id === country.id;
            const state = visit.solved && right ? "right" : visit.wrong.includes(choice.id) ? "wrong" : hint && right ? "hint" : "";
            const label = country.ask === "flag" ? `${of(choice.name)} পতাকা` : choice[country.ask].name;
            return <li key={choice.id}><button type="button" className={`pg-choice ${state}`} aria-label={label} data-ok={right ? "1" : undefined}
              disabled={visit.solved && !right} onClick={event => choose(choice, event.currentTarget)}>
              {country.ask === "flag" ? <Flag id={choice.id} className="pg-choice-flag" /> : <Pic k={`${choice.id}:${country.ask}`} />}
            </button></li>;
          })}
        </ul>
        <p className="pg-why" role="status" aria-live="polite">{why}</p>
      </div>}

      {phase === "stamp" && country && <div className="pg-stamp-page">
        <div className="pg-stamp" style={{ "--ink": country.ink } as CSSProperties}>
          <Pic k={`${country.id}:animal`} className="pg-pic" />
          <span>{country.name}</span>
        </div>
        <p className="pg-say">{of(country.name)} সিল পেলে। পাসপোর্টে {bn(done.length)}টা হলো।</p>
        <button type="button" className="kit-primary pg-next" onClick={afterStamp}>{done.length >= countries.length ? "সফর শেষ" : "পরের দেশে চলো"}</button>
      </div>}

      {phase === "done" && result && <div className="pg-done">
        <StarReveal count={result.stars} />
        <h2>{cardTitle(result.ids.length, bn)}।</h2>
        {result.clean && <p className="pg-method">তিনটা প্রশ্নই প্রথমবারে। মন দিয়ে দেখেছ বলেই মনে ছিল।</p>}
        <ul className="pg-mini-stamps">{result.ids.map(id => { const c = countryOf(id)!; return <li key={id} style={{ "--ink": c.ink } as CSSProperties}><Pic k={`${id}:animal`} /><span>{c.name}</span><small>{c.hello.word}</small></li>; })}</ul>
        <div className="pg-pair">
          <button type="button" className="kit-primary" onClick={() => { sfx.pop(); startTrip(result.level); }}>আবার খেলো</button>
          <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("idle"); }}>শেষ</button>
        </div>
        <ShowParentButton onClick={() => setShowing(true)} />
      </div>}

      {phase === "idle" && <p className="pg-idle">আজকের মতো হলো।<br />{lastVisited ? `এবার আম্মুকে শোনাও, ${inside(lastVisited.name)} কীভাবে হ্যালো বলে।` : "এবার আম্মুকে একটা দেশের গল্প বলো।"}</p>}
    </div>

    <div className="pg-levels">
      <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={phase === "done" || phase === "idle" ? undefined : level} onPick={startTrip} noun="সফর" />
    </div>

    <details className="pg-passport">
      <summary>আমার পাসপোর্ট <span>{bn(stamped.length)}/{bn(COUNTRIES.length)} সিল</span></summary>
      <ul>{COUNTRIES.map(c => { const has = stamped.includes(c); return <li key={c.id} className={has ? "has" : ""} style={{ "--ink": c.ink } as CSSProperties}>
        {has ? <><Pic k={`${c.id}:animal`} /><span>{c.name}</span></> : <span className="pg-empty" aria-label="এখনো সিল নেই">?</span>}
      </li>; })}</ul>
      <p className="pg-small">সিলগুলো শুধু এই ফোনের ব্রাউজারে থাকে।</p>
    </details>

    {card && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{
      fileName: `prithibi-ghuri-sofor-${result!.level}.png`,
      make: async () => { const pictures = await loadPictures(card.ids); return renderCard(canvas => drawCard(canvas, card, pictures, location.host)); },
    }}>
      <div className="kit-card"><CardCanvas data={card} /></div>
      <p className="pg-parent-line"><b>বড়দের জন্য:</b> {lastVisited ? `জিজ্ঞেস করো, ${inside(lastVisited.name)} কীভাবে হ্যালো বলে? ` : ""}রাতে মোবাইলের ম্যাপ বা গ্লোব খুলে দেশগুলো ঢাকা থেকে কোন দিকে, একসাথে খুঁজে দেখো।</p>
    </ShowParent>}
    {resting && <RestScreen onExtend={extend} />}

    <div className="pg-gate">
      <ParentGate><ShareToolLink title="পৃথিবী ঘুরি" text="ঢাকা থেকে উড়ে ১৮টা দেশ ঘুরে আসার খেলা: হ্যালো, খাবার, প্রাণী আর পাসপোর্টে সিল। ৬–১২ বছরের জন্য।" /></ParentGate>
    </div>
  </div>;
}
