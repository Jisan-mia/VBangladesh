"use client";
// IP: what we avoided — no film, toy or museum dinosaur designs and no "Jurassic" look; every dinosaur, bone and the myna are our own round, smiling drawings, and the facts are re-said in our words from the Natural History Museum's Dino Directory.

import { useCallback, useEffect, useRef, useState } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { buzz, confetti, hiss, newSeed, sfx, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, useKidsSession } from "../../../shared/kids-kit";
import { BOX, boneShapes, dinoShapes, type BoneKind } from "../lib/art";
import { brush, buryBones, DIG, FOUND_AT, freshSand, uncovered, type Buried, type Sand } from "../lib/dig";
import { bn, DIET_NAME, DIET_WORD, DINOS, teethHint, type Diet } from "../lib/dinos";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  addToBook, BOOK_KEY, boneName, bonesFor, dinosOf, doneLine, FRESH_PACE, LEVEL_COUNT, nearestSlot, nextPace, placeHint, readBook, shouldGlow, starsOf, type Pace,
} from "../lib/levels";
import { Book } from "./book";
import { BoneArt, DinoArt, FactCard, Leaf, Meat, Mouth, Shapes } from "./pieces";
import { SandLayer } from "./sand";

const TOOL = "dinosaur";
type Phase = "dig" | "build" | "meet" | "facts" | "done" | "menu";
type Say = { title?: string; text: string; hint?: boolean };

const DIG_LINE = "বালুর নিচে হাড় লুকানো। আঙুল দিয়ে বালু সরাও, বা টোকা দাও।";
const BUILD_LINE = "একটা হাড় বেছে নাও, তারপর কঙ্কালের ঠিক জায়গায় চাপো।";
const soft = () => tone(330, 0.12, 0.06, "sine");
const hum = () => { tone(196, 0.32, 0.1, "triangle", 0, 294); tone(294, 0.26, 0.08, "triangle", 0.22, 247); buzz(14); };
const pct = (value: number, of: number) => `${(value / of) * 100}%`;
const store = { read: (key: string) => { try { return localStorage.getItem(key); } catch { return null; } }, write: (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode */ } } };

export function DinoGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [slow, setSlow] = useSlowMode();
  const session = useKidsSession();
  const [level, setLevel] = useState(1);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("dig");
  const [seed, setSeed] = useState(1);
  const [bones, setBones] = useState<Buried[]>([]);
  const [found, setFound] = useState<BoneKind[]>([]);
  const [placed, setPlaced] = useState<BoneKind[]>([]);
  const [picked, setPicked] = useState<BoneKind | null>(null);
  const [slips, setSlips] = useState(0);
  const [tries, setTries] = useState(0);
  const [pace, setPace] = useState<Pace>(FRESH_PACE);
  const [wrongDiet, setWrongDiet] = useState<Diet[]>([]);
  const [say, setSay] = useState<Say>({ text: DIG_LINE });
  const [touched, setTouched] = useState(false);
  const [wobble, setWobble] = useState<{ key: string; n: number } | null>(null);
  const [book, setBook] = useState<string[]>([]);
  const [bookOpen, setBookOpen] = useState(false);
  const [showParent, setShowParent] = useState(false);
  const sand = useRef<Sand>(freshSand());
  const foundRef = useRef<BoneKind[]>([]);
  const card = useRef<HTMLCanvasElement>(null);
  const started = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastHiss = useRef(0);

  const dinos = dinosOf(level), dino = dinos[Math.min(index, dinos.length - 1)];
  const parts = dino.parts.slice(0, bones.length);
  const glow = shouldGlow(pace, tries);

  useEffect(() => { setBook(readBook(store.read(BOOK_KEY))); return () => clearTimeout(timer.current); }, []);

  const startDig = useCallback((lv: number, at: number, withPace: Pace) => {
    const next = dinosOf(lv)[at], kinds = next.parts.slice(0, bonesFor(lv, withPace)).map(part => part[0]), fresh = newSeed();
    clearTimeout(timer.current);
    sand.current = freshSand(); foundRef.current = [];
    setSeed(fresh); setBones(buryBones(kinds, fresh));
    setFound([]); setPlaced([]); setPicked(null); setTries(0); setWrongDiet([]); setWobble(null); setTouched(false);
    setPhase("dig"); setSay({ text: DIG_LINE });
  }, []);

  const begin = useCallback((lv: number) => {
    setLevel(lv); setIndex(0); setSlips(0); setPace(FRESH_PACE); setShowParent(false);
    startDig(lv, 0, FRESH_PACE);
  }, [startDig]);

  // Open where the child left off: the first open level without stars.
  useEffect(() => {
    if (!levels.loaded || started.current) return;
    started.current = true;
    begin(Array.from({ length: levels.unlocked }, (_, i) => i + 1).find(lv => !levels.stars[lv]) ?? 1);
  }, [levels.loaded, levels.unlocked, levels.stars, begin]);

  useEffect(() => {
    if (!showParent || !card.current) return;
    let live = true;
    loadCardFonts(`${doneLine(level)} ডাইনোসর খুঁজি ${dinos.map(each => each.name).join(" ")} পাখিরা আসলে এখনকার`).catch(() => undefined).then(() => {
      if (live && card.current) drawCard(card.current, level, slips, book.length, location.host);
    });
    return () => { live = false; };
  }, [showParent, level, slips, book.length, dinos]);

  function slip(key: string, hint: string) {
    soft();
    setSlips(value => value + 1);
    setTries(value => value + 1);
    setPace(value => nextPace(value, false));
    setWobble(value => ({ key, n: (value?.n ?? 0) + 1 }));
    setSay({ text: hint, hint: true });
  }
  function right() { setPace(value => nextPace(value, true)); setTries(0); }

  /** The dig: clear the grid, then lift out any bone that is now mostly uncovered. */
  function brushAt(x: number, y: number, r: number) {
    if (phase !== "dig") return;
    setTouched(true);
    sand.current = brush(sand.current, x, y, r);
    const now = performance.now();
    if (now - lastHiss.current > 110) { lastHiss.current = now; hiss(0.09, 0.05, 1800, "bandpass"); }
    const fresh = bones.filter(bone => !foundRef.current.includes(bone.kind) && uncovered(sand.current, bone) >= FOUND_AT);
    if (!fresh.length) return;
    foundRef.current = [...foundRef.current, ...fresh.map(bone => bone.kind)];
    setFound(foundRef.current);
    sfx.pick(); buzz(10);
    if (foundRef.current.length < bones.length) { setSay({ text: `${boneName(fresh[0].kind, dino)} পেলে। আরও খোঁজো।` }); return; }
    setSay({ text: "সব হাড় উঠে এসেছে।" });
    timer.current = setTimeout(() => { setPhase("build"); setTouched(false); setSay({ text: BUILD_LINE }); }, 900);
  }
  function keyBrush() {
    const next = bones.find(bone => !foundRef.current.includes(bone.kind));
    return next ? { x: next.x, y: next.y } : null;
  }

  function pick(kind: BoneKind) {
    if (phase !== "build") return;
    sfx.pick(); setTouched(true);
    setPicked(value => value === kind ? null : kind);
  }
  function placeAt(slot: (typeof parts)[number] | null) {
    if (phase !== "build" || !slot) return;
    if (!picked) { soft(); setWobble(value => ({ key: "tray", n: (value?.n ?? 0) + 1 })); setSay({ text: "আগে নিচ থেকে একটা হাড় বেছে নাও।", hint: true }); return; }
    if (slot[0] !== picked) { slip(slot[0], placeHint(picked, dino)); return; }
    sfx.drop(); right();
    const next = [...placed, picked];
    setPlaced(next); setPicked(null);
    if (next.length < parts.length) { setSay({ text: `${boneName(picked, dino)} বসল।` }); return; }
    setSay({ text: "কঙ্কাল পুরো হলো।" });
    timer.current = setTimeout(() => { hum(); setPhase("meet"); setSay({ title: dino.name, text: "ও কী খেত? মুখটা দেখো।" }); }, 500);
  }
  function boardTap(event: React.MouseEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    placeAt(nearestSlot(parts, (event.clientX - box.left) / box.width * BOX.width, (event.clientY - box.top) / box.height * BOX.height, placed));
  }

  function chooseDiet(diet: Diet) {
    if (phase !== "meet") return;
    if (diet !== dino.diet) { setWrongDiet(value => [...value, diet]); slip(diet, teethHint(dino.teeth)); return; }
    sfx.good(); right();
    const next = addToBook(book, dino.id);
    setBook(next); store.write(BOOK_KEY, JSON.stringify(next));
    setPhase("facts");
    setSay({ text: `মুখ দেখে ধরেছ: ${DIET_WORD[diet]}।` });
  }

  function keep() {
    sfx.pop();
    if (index + 1 < dinos.length) { setIndex(index + 1); startDig(level, index + 1, pace); return; }
    levels.record(level, starsOf(slips));
    sfx.win();
    if (level === LEVEL_COUNT) confetti();
    setPhase("done");
    session.atBreak();
  }

  const wobbleClass = (key: string) => wobble?.key === key && !slow ? ` dn-wobble dn-w${wobble.n % 2}` : "";
  const tray = found.filter(kind => !placed.includes(kind));
  const play = phase === "dig" || phase === "build" || phase === "meet" || phase === "facts";

  return (
    <div className="dn" data-slow={slow}>
      <div className="dn-top">
        <p className="dn-level"><b>লেভেল {bn(level)}</b></p>
        <ol className="dn-dots" aria-label={`${bn(dinos.length)}টার মধ্যে ${bn(index + 1)} নম্বর ডাইনোসর`}>
          {dinos.map((each, i) => <li key={each.id} className={i < index || (i === index && phase === "facts") || phase === "done" ? "on" : i === index && play ? "now" : ""} />)}
        </ol>
        <button type="button" className="dn-book-button" onClick={() => { sfx.tap(); setBookOpen(true); }} aria-label={`খোঁজার বই: ${bn(DINOS.length)}টার ${bn(book.length)}টা পেয়েছ`}>
          <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M4 7Q10 4 16 8Q22 4 28 7V26Q22 23 16 27Q10 23 4 26Z" fill="#fff8e8" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" /><path d="M16 8V27" stroke="currentColor" strokeWidth="2" /></svg>
          <span>{bn(book.length)}/{bn(DINOS.length)}</span>
        </button>
      </div>

      {play && <div className={`dn-board dn-${phase}`}>
        {phase === "dig" && <>
          <svg className="dn-under" viewBox={`0 0 ${DIG.width} ${DIG.height}`} aria-hidden="true" focusable="false">
            <rect width={DIG.width} height={DIG.height} fill="#b98d55" />
            {bones.map(bone => <g key={bone.kind} className={found.includes(bone.kind) ? "dn-found" : ""} transform={`translate(${bone.x} ${bone.y}) rotate(${bone.rot}) scale(1.15)`}>
              <Shapes shapes={boneShapes(bone.kind)} />
            </g>)}
          </svg>
          <SandLayer key={seed} bones={bones} seed={seed} onBrush={brushAt} onKey={keyBrush} />
          {!touched && bones[0] && <span className="dn-ghost dn-swipe" style={{ left: pct(bones[0].x, DIG.width), top: pct(bones[0].y, DIG.height) }}><GhostFinger /></span>}
        </>}
        {phase === "build" && <svg className="dn-skeleton" viewBox={`0 0 ${BOX.width} ${BOX.height}`} onClick={boardTap} role="group" aria-label={`${dino.name}-এর কঙ্কাল`}>
          <rect y={BOX.ground} width={BOX.width} height={BOX.height - BOX.ground} fill="#d9bf86" />
          <g opacity=".22"><Shapes shapes={dinoShapes(dino.look)} tint="#6b5233" /></g>
          {parts.map(([kind, x, y, rot, scale], i) => {
            const done = placed.includes(kind);
            return <g key={kind} data-kind={kind} transform={`translate(${x} ${y})`} className={done ? "dn-placed" : `dn-slot${wobbleClass(kind)}`}
              role={done ? undefined : "button"} tabIndex={done ? undefined : 0} aria-label={done ? undefined : `জায়গা ${bn(i + 1)}`}
              onClick={event => { event.stopPropagation(); placeAt(parts[i]); }}
              onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); placeAt(parts[i]); } }}>
              {!done && picked === kind && glow && <circle r={26 * scale + 6} className="dn-glow" />}
              <g transform={`rotate(${rot}) scale(${scale})`} opacity={done ? 1 : 0.38}><Shapes shapes={boneShapes(kind)} /></g>
            </g>;
          })}
        </svg>}
        {(phase === "meet" || phase === "facts") && <>
          <svg className="dn-scene" viewBox={`0 0 ${BOX.width} ${BOX.height}`} aria-hidden="true" focusable="false">
            <rect y={BOX.ground} width={BOX.width} height={BOX.height - BOX.ground} fill="#9cc76f" />
          </svg>
          <div className="dn-dino" role="img" aria-label={dino.name}><DinoArt dino={dino} /></div>
          {phase === "meet" && <div className="dn-mouth" aria-hidden="true"><Mouth dino={dino} /></div>}
        </>}
      </div>}

      {play && <div className={`dn-say${say.hint ? " hint" : ""}`} role="status" aria-live="polite">
        {say.title && <p className="dn-say-title">{say.title}</p>}
        <p>{say.text}</p>
      </div>}

      {phase === "dig" && <ol className="dn-tally" aria-label={`${bn(bones.length)}টার মধ্যে ${bn(found.length)}টা হাড় পেয়েছ`}>
        {bones.map(bone => <li key={bone.kind} className={found.includes(bone.kind) ? "on" : ""}>{found.includes(bone.kind) && <BoneArt kind={bone.kind} />}</li>)}
      </ol>}
      {phase === "build" && <div className={`dn-tray${wobbleClass("tray")}`}>
        {tray.map((kind, i) => <button key={kind} type="button" data-bone={kind} className={`dn-bone${picked === kind ? " picked" : ""}`} aria-pressed={picked === kind} aria-label={boneName(kind, dino)} onClick={() => pick(kind)}>
          <BoneArt kind={kind} />
          {!touched && i === 0 && <span className="dn-ghost dn-tap"><GhostFinger /></span>}
        </button>)}
      </div>}
      {phase === "meet" && <div className="dn-diet">
        {(["plant", "meat"] as const).map(diet => <button key={diet} type="button" data-diet={diet} disabled={wrongDiet.includes(diet)}
          className={`dn-diet-button${diet === dino.diet && glow ? " dn-glow-box" : ""}${wobbleClass(diet)}`} onClick={() => chooseDiet(diet)}>
          <span className="dn-icon">{diet === "plant" ? <Leaf /> : <Meat />}</span>
          <b>{DIET_NAME[diet]}</b><small>{DIET_WORD[diet]}</small>
        </button>)}
      </div>}
      {phase === "facts" && <FactCard dino={dino}>
        <button type="button" className="kit-primary dn-keep" onClick={keep}>বইয়ে রাখো</button>
      </FactCard>}

      {phase === "done" && <div className="dn-end" role="status">
        <StarReveal count={starsOf(slips)} />
        <div className="dn-end-finds" aria-hidden="true">{dinos.map(each => <span key={each.id}><DinoArt dino={each} /></span>)}</div>
        <p className="dn-end-line">{doneLine(level)}।</p>
        <p className="dn-end-note">{slips ? `${bn(slips)}বার আবার ভেবেছ, তারপর ঠিকটা পেয়েছ।` : "হাড়ের আকার দেখে বসিয়েছ, তাই একবারও আটকাওনি।"}</p>
        <div className="dn-end-actions">
          <button type="button" className="kit-primary" onClick={() => { sfx.tap(); begin(level); }}>আবার খেলো</button>
          <button type="button" className="kit-primary dn-quiet" onClick={() => { sfx.tap(); setPhase("menu"); }}>শেষ</button>
        </div>
        <ShowParentButton onClick={() => setShowParent(true)} />
      </div>}
      {phase === "menu" && <div className="dn-end dn-menu">
        <p className="dn-end-line">আরেকটা খুঁড়বে? একটা বেছে নাও।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level} onPick={begin} />
      </div>}

      <div className="dn-controls">
        <button type="button" className="dn-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
        <SoundToggle compact />
        <details className="dn-drawer">
          <summary>সব লেভেল</summary>
          <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level} onPick={begin} />
        </details>
      </div>

      <div className="dn-parent">
        <ParentGate label="বড়দের জন্য">
          <ShareToolLink title="ডাইনোসর খুঁজি" text="ছোটদের ডাইনোসর গেম: বালু সরিয়ে হাড় খোঁজো, কঙ্কাল জোড়া দাও। ফ্রি, বিজ্ঞাপন নেই।" />
        </ParentGate>
      </div>

      {bookOpen && <Book found={book} onClose={() => { sfx.tap(); setBookOpen(false); }} />}
      <ShowParent open={showParent} onClose={() => setShowParent(false)} picture={{ fileName: `dinosaur-level-${level}.png`, make: () => cardBlob(level, slips, book.length, location.host) }}>
        <figure className="kit-card"><canvas ref={card} width={1080} height={1350} role="img" aria-label={`ডাইনোসর খুঁজির কার্ড: ${doneLine(level)}।`} /></figure>
        <p>{doneLine(level)}: {dinos.map(each => `${each.name} (${DIET_NAME[each.diet]})`).join(", ")}।</p>
      </ShowParent>
      {session.resting && <RestScreen onExtend={session.extend} />}
    </div>
  );
}

/** A pointing finger that shows the first move to children who can't read yet. */
export function GhostFinger() {
  return <svg viewBox="0 0 48 56" width="100%" height="100%" aria-hidden="true" focusable="false">
    <path d="M18 6Q18 1 22.5 1Q27 1 27 6V24L37 26Q44 28 43 35L40 49Q39 54 33 54H20Q15 54 12 49L5 37Q3 33 7 31Q10 30 13 33L18 38Z" fill="#fff" stroke="#3b2a1a" strokeWidth="2.4" strokeLinejoin="round" opacity=".92" />
  </svg>;
}
