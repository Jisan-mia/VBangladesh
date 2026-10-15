"use client";
// IP: what we avoided — no Chrome Music Lab, Song Maker or Incredibox look, layout or sounds; no known tunes (no rhymes set to music, never the anthem); instruments are our own SVG and synthesized tones.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { loadCardFonts, renderCard } from "../../../shared/card-canvas";
import { confetti, sfx, soundOn, totalStars, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, useKidsSession } from "../../../shared/kids-kit";
import { FINGER, SOUND_ART } from "../lib/art";
import { drawCard } from "../lib/draw-card";
import {
  DEMO, LEVEL_COUNT, NOTES, ROWS, ROW_COLORS, SOUNDS, STEPS_NARROW, STEPS_WIDE, TEMPOS, addSaved, bn, cardTitle, checkLine, compare,
  emptyTune, has, levelTune, methodLine, noteCount, readSaved, rowsAt, showHint, starsOf, toggle, type Saved, type Today, type Tune,
} from "../lib/music";
import { playBeat, playNote } from "../lib/sound";

const TOOL = "sur-banai";
const SAVED_KEY = "ektukhani-sur-banai-tunes";
const ROW_ORDER = Array.from({ length: ROWS }, (_, i) => ROWS - 1 - i);

type Mode = "free" | "match";
type Phase = "play" | "saved" | "won" | "idle";

function Art({ svg, className }: { svg: string; className?: string }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Finger() {
  return <span className="sb-ghost-at" aria-hidden="true"><svg className="sb-ghost" viewBox="0 0 40 52" dangerouslySetInnerHTML={{ __html: FINGER }} /></span>;
}

/** A tune as a small picture: the label of a saved tune, and the picture on the end screens. */
function MiniTune({ tune, className = "sb-mini" }: { tune: Tune; className?: string }) {
  return <svg className={className} viewBox={`0 0 ${tune.length * 10} ${ROWS * 10}`} aria-hidden="true">
    {ROW_ORDER.map((row, y) => tune.map((_, step) => <rect key={`${row}-${step}`} x={step * 10 + 1} y={y * 10 + 1} width="8" height="8" rx="2" fill={has(tune, step, row) ? ROW_COLORS[row] : "#ecdcc8"} />))}
  </svg>;
}

function CardCanvas({ today }: { today: Today }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      await loadCardFonts(`${cardTitle(today)} সুর বানাই সা রে গা পা ধা`);
      if (!live || !ref.current) return;
      drawCard(ref.current, today, location.host);
      ref.current.dataset.drawn = "1";
    })();
    return () => { live = false; };
  }, [today]);
  return <canvas ref={ref} width={1080} height={1350} role="img" aria-label={cardTitle(today)} />;
}

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: the tune just isn't kept */ } };

export function SurGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [mode, setMode] = useState<Mode>("free");
  const [phase, setPhase] = useState<Phase>("play");
  const [steps, setSteps] = useState(STEPS_NARROW);
  const [tune, setTune] = useState<Tune>(() => emptyTune(STEPS_NARROW));
  const [sound, setSound] = useState(0);
  const [tempo, setTempo] = useState(1);
  const [saved, setSaved] = useState<Saved[]>([]);
  const [n, setN] = useState(1);
  const [guess, setGuess] = useState<Tune>(() => emptyTune(STEPS_NARROW));
  const [heard, setHeard] = useState(false);
  const [tries, setTries] = useState(0);
  const [msg, setMsg] = useState("");
  const [wobble, setWobble] = useState<Tune | null>(null);
  const [head, setHead] = useState(-1);
  const [playing, setPlaying] = useState<"free" | "target" | null>(null);
  const [played, setPlayed] = useState(false);
  const [today, setToday] = useState<Today>({ made: 0, matched: 0, last: null });
  const [result, setResult] = useState({ stars: 0, tries: 0 });
  const [showing, setShowing] = useState(false);
  const [audible, setAudible] = useState(true);
  const [slow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const chosen = useRef(false);
  const top = useRef<HTMLDivElement>(null);
  // The loop reads these each beat, so edits, instrument and tempo changes are heard while it plays.
  const live = useRef({ tune, guess, sound, ms: TEMPOS[tempo].ms as number });
  live.current = { tune, guess, sound, ms: TEMPOS[tempo].ms };

  const target = levelTune(n);

  function stopPlay() {
    clearTimeout(timer.current);
    timer.current = undefined;
    setPlaying(null); setHead(-1);
  }

  function startPlay(kind: "free" | "target", getTune: () => Tune, onEnd?: () => void) {
    clearTimeout(timer.current);
    setPlaying(kind);
    let step = 0;
    const beat = () => {
      const now = getTune();
      if (step >= now.length) {
        if (onEnd) { stopPlay(); onEnd(); return; }
        step = 0;
      }
      setHead(step);
      playBeat(rowsAt(now[step]), live.current.sound);
      step++;
      timer.current = setTimeout(beat, live.current.ms);
    };
    beat();
  }

  useEffect(() => {
    setAudible(soundOn());
    setSaved(readSaved(read(SAVED_KEY)));
    // An empty grid follows the screen (turning a tablet); a tune already started keeps its beats.
    const wide = matchMedia("(min-width: 720px)");
    const fit = () => { const next = wide.matches ? STEPS_WIDE : STEPS_NARROW; setSteps(next); setTune(old => (noteCount(old) || old.length === next ? old : emptyTune(next))); };
    fit();
    addEventListener("resize", fit);
    const hidden = () => { if (document.hidden) stopPlay(); };
    document.addEventListener("visibilitychange", hidden);
    if (location.hash === "#og") {
      chosen.current = true;
      setTune(DEMO.tune); setToday({ made: 1, matched: 0, last: DEMO }); setPhase("saved"); setShowing(true);
    }
    return () => { clearTimeout(timer.current); removeEventListener("resize", fit); document.removeEventListener("visibilitychange", hidden); };
  }, []);

  function openLevel(next: number) {
    stopPlay();
    setN(next); setGuess(emptyTune(STEPS_NARROW)); setHeard(false); setTries(0); setMsg(""); setWobble(null); setPhase("play");
  }

  // সুরটা মেলাও opens where this phone left off: the first tune without stars.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    const glow = Array.from({ length: levels.unlocked }, (_, i) => i + 1).find(l => !levels.stars[l]);
    setN(glow ?? levels.unlocked);
  }, [levels.loaded]);

  function switchMode(next: Mode) {
    if (next === mode && phase === "play") return;
    sfx.tap(); stopPlay(); setMode(next); setPhase("play");
    if (next === "match") openLevel(n);
  }

  function tapCell(step: number, row: number) {
    if (mode === "free") {
      // From the ref, so two quick taps before a re-render both count.
      const next = toggle(live.current.tune, step, row);
      live.current.tune = next; setTune(next);
      if (has(next, step, row)) playNote(row, sound); else sfx.tap();
      return;
    }
    if (!heard || playing === "target") return;
    const next = toggle(live.current.guess, step, row);
    live.current.guess = next; setGuess(next); setWobble(null); setMsg("");
    if (has(next, step, row)) playNote(row, sound); else sfx.tap();
  }

  function playFree() {
    if (playing) { sfx.tap(); stopPlay(); atBreak(); return; }
    setPlayed(true);
    startPlay("free", () => live.current.tune);
  }

  function clear() {
    sfx.drop();
    if (mode === "free") setTune(emptyTune(steps));
    else { setGuess(emptyTune(STEPS_NARROW)); setWobble(null); setMsg(""); }
  }

  function save() {
    if (!noteCount(tune)) return;
    stopPlay();
    const item = { tune: [...tune], sound };
    const next = addSaved(saved, item);
    setSaved(next); write(SAVED_KEY, JSON.stringify(next));
    setToday(day => ({ ...day, made: day.made + 1, last: item }));
    sfx.good();
    setPhase("saved");
    top.current?.scrollIntoView({ block: "nearest" });
    atBreak();
  }

  function load(item: Saved) {
    sfx.pick();
    setTune([...item.tune]); setSound(item.sound);
  }

  function listen() {
    if (playing === "target") return;
    stopPlay();
    startPlay("target", () => target, () => setHeard(true));
  }

  function check() {
    if (playing) stopPlay();
    const turn = tries + 1;
    setTries(turn);
    const { done } = compare(target, guess);
    if (!done) {
      sfx.drop();
      setMsg(checkLine(target, guess));
      setWobble(guess.map((mask, i) => mask & ~target[i]));
      return;
    }
    const stars = starsOf(turn);
    const wasAll = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).every(l => levels.stars[l]);
    const nowAll = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).every(l => l === n || levels.stars[l]);
    levels.record(n, stars);
    setResult({ stars, tries: turn });
    setToday(day => ({ ...day, matched: day.matched + 1, last: { tune: target, sound } }));
    if (!wasAll && nowAll) { sfx.levelUp(); confetti({ colors: ROW_COLORS }); } else sfx.win();
    setPhase("won");
    top.current?.scrollIntoView({ block: "nearest" });
    // Only at the end of a round: the daily limit never cuts a tune midway.
    atBreak();
  }

  const shown = mode === "free" ? tune : guess;
  const hint = mode === "match" && showHint(tries);
  const ghost = mode === "free"
    ? (!noteCount(tune) && !played ? "cell" : noteCount(tune) && !played ? "play" : null)
    : !heard ? "listen" : n === 1 && !noteCount(guess) && !tries ? "first" : null;
  const firstTarget = target.findIndex(mask => mask);
  const ghostCell = ghost === "cell" ? { step: 1, row: 2 } : ghost === "first" ? { step: firstTarget, row: rowsAt(target[firstTarget])[0] } : null;
  const say = mode === "free"
    ? (noteCount(tune) ? (playing ? "বাজতে বাজতেও ঘর বদলানো যায়।" : "বাজাও চাপো, সুরটা ঘুরে ঘুরে বাজবে।") : "যেকোনো ঘরে চাপো। এখানে কোনো সুরই ভুল না।")
    : !heard ? "আগে শোনো আর দেখো, কোন ঘরে আলো জ্বলে।"
      : msg || (playing === "target" ? "দেখো, কোন ঘরে আলো জ্বলছে।" : "এবার ঠিক ওই ঘরগুলোতে চাপো, তারপর মিলিয়ে দেখো।");
  const total = totalStars(levels.stars);
  const gridStyle = { "--steps": shown.length } as CSSProperties;

  return <div className={`sb${slow ? " sb-slow" : ""}`} ref={top}>
    <div className="sb-modes">
      <button type="button" aria-pressed={mode === "free"} onClick={() => switchMode("free")}>আমার সুর</button>
      <button type="button" aria-pressed={mode === "match"} onClick={() => switchMode("match")}>সুরটা মেলাও</button>
      <SoundToggle compact onChange={setAudible} />
    </div>

    {phase === "play" && <>
      {mode === "match" && <p className="sb-level"><b>সুর {bn(n)}</b><span>{bn(noteCount(target))}টা নোট</span></p>}
      <div className="sb-grid" style={gridStyle} role="group" aria-label={`সুরের ঘর: ${bn(shown.length)}টা তাল, ${bn(ROWS)}টা নোট`}>
        {ROW_ORDER.map(row => shown.map((_, step) => {
          const on = has(shown, step, row);
          const lit = playing === "target" ? head === step && has(target, step, row) : on && head === step;
          const cls = ["sb-cell", on && "on", head === step && "head", lit && "ping",
            hint && has(target, step, row) && !on && "hint", wobble && has(wobble, step, row) && "wobble"].filter(Boolean).join(" ");
          return <button type="button" key={`${row}-${step}`} className={cls} style={{ "--c": ROW_COLORS[row] } as CSSProperties}
            aria-pressed={on} aria-label={`${NOTES[row]}, ${bn(step + 1)} নম্বর তাল`} onClick={() => tapCell(step, row)}>
            <span aria-hidden="true">{NOTES[row]}</span>
            {ghostCell && ghostCell.step === step && ghostCell.row === row && <Finger />}
          </button>;
        }))}
      </div>

      <div className="sb-say" role="status" aria-live="polite"><p>{say}</p><SpeakButton text={say} /></div>

      <div className="sb-actions">
        {mode === "free"
          ? <button type="button" className={`kit-primary sb-go${playing ? " on" : ""}`} onClick={playFree}>
            {playing ? <>থামাও <span aria-hidden="true">■</span></> : <>বাজাও <span aria-hidden="true">▶</span></>}{ghost === "play" && <Finger />}
          </button>
          : <button type="button" className={`${heard ? "kit-secondary" : "kit-primary"} sb-go`} disabled={playing === "target"} onClick={listen}>
            {heard ? "আবার শোনো" : <>শোনো <span aria-hidden="true">▶</span></>}{ghost === "listen" && <Finger />}
          </button>}
        <button type="button" className="sb-small" disabled={!noteCount(shown)} onClick={clear}><span aria-hidden="true">⌫</span>মুছো</button>
        {mode === "free"
          ? <button type="button" className="sb-small sb-keep" disabled={!noteCount(tune)} onClick={save}><span aria-hidden="true">♥</span>রাখো</button>
          : <button type="button" className="kit-primary sb-check" disabled={!heard || playing === "target"} onClick={check}>মিলিয়ে দেখো</button>}
      </div>

      {!audible && <p className="sb-mute">শব্দ বন্ধ, তাই শুধু আলো জ্বলবে। সুরও শুনতে চাইলে ওপরের স্পিকারে চাপো।</p>}

      <div className="sb-sounds" role="group" aria-label="কোন বাজনা">
        {SOUNDS.map((item, i) => <button type="button" key={item.name} aria-pressed={sound === i} onClick={() => { setSound(i); playNote(2, i); }}>
          <Art svg={SOUND_ART[i]} /><span>{item.name}</span>
        </button>)}
      </div>

      <div className="sb-tempo">
        <input type="range" min={0} max={TEMPOS.length - 1} step={1} value={tempo} aria-label="তাল" aria-valuetext={TEMPOS[tempo].name}
          onChange={event => { setTempo(Number(event.target.value)); sfx.tick(); }} />
        <div>{TEMPOS.map((item, i) => <button type="button" key={item.name} aria-pressed={tempo === i} onClick={() => { setTempo(i); sfx.tick(); }}>{item.name}</button>)}</div>
      </div>

      {mode === "free" && saved.length > 0 && <div className="sb-shelf">
        <p>রাখা সুর <small>· ৬টার বেশি হলে সবচেয়ে পুরোনোটা সরে যায়</small></p>
        <ul>{saved.map((item, i) => <li key={`${i}-${item.tune.join(".")}`}>
          <button type="button" onClick={() => load(item)} aria-label={`রাখা সুর ${bn(i + 1)}, ${bn(noteCount(item.tune))}টা নোট`}><MiniTune tune={item.tune} /></button>
        </li>)}</ul>
      </div>}

      {mode === "match" && <details className="sb-drawer">
        <summary>সব সুর <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
        <p className="sb-stages">১–২: চারটা নোট · ৩–৬: পাঁচ-ছয়টা · ৭–১০: একসাথে দুটো নোটও বাজে</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={n} noun="সুর" onPick={pick => { chosen.current = true; openLevel(pick); top.current?.scrollIntoView({ block: "nearest" }); }} />
      </details>}
    </>}

    {phase === "saved" && today.last && <div className="sb-done">
      <MiniTune tune={today.last.tune} className="sb-big" />
      <h2>সুরটা এই ফোনে রাখা হলো</h2>
      <p className="sb-method">{bn(noteCount(today.last.tune))}টা নোট, {SOUNDS[today.last.sound].at}। রাখা সুরের সারিতে ছোট ছবি হয়ে থাকবে।</p>
      <div className="sb-pair">
        <button type="button" className="kit-secondary" onClick={() => { sfx.pop(); setTune(emptyTune(steps)); setPhase("play"); }}>আবার খেলো</button>
        <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("idle"); }}>শেষ</button>
      </div>
      <ShowParentButton onClick={() => setShowing(true)} />
    </div>}

    {phase === "won" && <div className="sb-done">
      <StarReveal count={result.stars} />
      <h2>সুরটা মিলেছে</h2>
      <MiniTune tune={target} className="sb-big" />
      <p className="sb-method">{methodLine(result.tries, noteCount(target))}</p>
      {n < LEVEL_COUNT && <button type="button" className="kit-primary sb-next" onClick={() => { sfx.pop(); chosen.current = true; openLevel(n + 1); }}>পরের সুর <span aria-hidden="true">→</span></button>}
      <div className="sb-pair">
        <button type="button" className="kit-secondary" onClick={() => { sfx.pop(); openLevel(n); }}>আবার খেলো</button>
        <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("idle"); }}>শেষ</button>
      </div>
      <ShowParentButton onClick={() => setShowing(true)} />
    </div>}

    {phase === "idle" && <div className="sb-done sb-idle">
      <p>আজকের মতো হলো। আবার বাজাতে চাইলে ওপরে একটা খেলা বেছে নাও।</p>
      {today.last && <ShowParentButton onClick={() => setShowing(true)} />}
    </div>}

    {today.last && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{
      fileName: "sur-banai.png",
      make: () => renderCard(canvas => drawCard(canvas, today, location.host)),
    }}>
      <div className="kit-card"><CardCanvas today={today} /></div>
      <p className="sb-parent-line"><b>বড়দের জন্য:</b> সা রে গা পা ধা, এই পাঁচ নোট যেভাবেই সাজানো হোক, শুনতে ভালো লাগে। ছবির প্রতিটা রঙিন ঘর একটা নোট, বাম থেকে ডানে বাজে। জিজ্ঞেস করো, সবচেয়ে উঁচু সুর কোন সারিতে।</p>
    </ShowParent>}
    {resting && <RestScreen onExtend={extend} />}

    <div className="sb-gate">
      <ParentGate>
        <ShareToolLink title="সুর বানাই" text="ঘরে চেপে চেপে সুর বানানোর খেলা, ছোটদের জন্য। শব্দ বন্ধ রাখলেও আলো জ্বলে।" />
        {saved.length > 0 && <button type="button" className="kit-secondary" onClick={() => { setSaved([]); write(SAVED_KEY, "[]"); }}>রাখা সুরগুলো মুছে ফেলো</button>}
      </ParentGate>
    </div>
  </div>;
}
