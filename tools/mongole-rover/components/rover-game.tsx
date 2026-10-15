"use client";
// IP: what we avoided — no NASA logos, mission names or look-alikes of real rovers (our rover is a round box with one camera eye), and no ScratchJr, Code.org or Lightbot block art; arrows, rocks and craters are our own SVG.

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { loadCardFonts, renderCard } from "../../../shared/card-canvas";
import { confetti, sfx, totalStars, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, useKidsSession } from "../../../shared/kids-kit";
import { ARROW, CRATER, REPEAT, ROVER, SAMPLE, TURN } from "../lib/art";
import { drawCard, loadPictures } from "../lib/draw-card";
import { SOURCE, factFor } from "../lib/facts";
import { BEST, LEVEL_COUNT, levelOf } from "../lib/levels";
import { blockText, bn, cardTitle, endTitle, levelLabel, methodLine, noteFor, tipFor, type Today } from "../lib/lines";
import { DIRS, MAX_BLOCKS, MAX_TIMES, addBlock, pathOf, removeBlock, repeatLast, runPlan, showHint, starsOf, type Block, type Cell, type Dir, type Run } from "../lib/rover";
import { bump, gotSample, motor, startChirp } from "../lib/sound";

const TOOL = "mongole-rover";
/** `#og` opens a finished demo of this level with the card showing, for the preview image. It saves nothing. */
const OG_LEVEL = 12;
const PAD: Dir[] = ["L", "U", "D", "R"];

type Phase = "plan" | "run" | "won" | "idle";
type Result = { stars: number; blocks: number; runs: number; repeat: boolean };

function Art({ svg, className, turn }: { svg: string; className?: string; turn?: number }) {
  return <svg className={className} viewBox="0 0 64 64" aria-hidden="true" style={turn ? { transform: `rotate(${turn}deg)` } : undefined} dangerouslySetInnerHTML={{ __html: svg }} />;
}

function Finger() {
  return <span className="mr-ghost-at" aria-hidden="true"><svg className="mr-ghost" viewBox="0 0 40 52"><path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#2d1f1a" strokeWidth="2.6" strokeLinejoin="round" /></svg></span>;
}

function CardCanvas({ today }: { today: Today }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      await loadCardFonts(`${cardTitle(today)} আমার প্ল্যান লেভেল বার`);
      const pictures = await loadPictures();
      if (!live || !ref.current) return;
      drawCard(ref.current, today, pictures, location.host);
      ref.current.dataset.drawn = "1";
    })();
    return () => { live = false; };
  }, [today]);
  return <canvas ref={ref} width={1080} height={1350} role="img" aria-label={cardTitle(today)} />;
}

const same = (a: Cell | null, b: Cell) => !!a && a.x === b.x && a.y === b.y;

export function RoverGame() {
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const [n, setN] = useState(1);
  const [plan, setPlan] = useState<Block[]>([]);
  const [phase, setPhase] = useState<Phase>("plan");
  const [at, setAt] = useState<Cell>(levelOf(1).start);
  const [face, setFace] = useState<1 | -1>(1);
  const [taken, setTaken] = useState<number[]>([]);
  const [active, setActive] = useState<{ block: number; turn: number } | null>(null);
  const [fail, setFail] = useState<Run | null>(null);
  const [empty, setEmpty] = useState(false);
  const [misses, setMisses] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [today, setToday] = useState<Today>({ levels: 0, samples: 0, last: null });
  const [showing, setShowing] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const runs = useRef(0);
  const chosen = useRef(false);
  const top = useRef<HTMLDivElement>(null);

  const level = levelOf(n), best = BEST[level.n - 1];
  const running = phase === "run";

  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => stop, []);

  function reset(start = level.start) {
    setAt(start); setFace(1); setTaken([]); setActive(null); setFail(null); setEmpty(false);
  }

  function open(next: number, byPlayer = true) {
    if (byPlayer) chosen.current = true;
    stop();
    runs.current = 0;
    setN(next); setPlan([]); setMisses(0); setResult(null); setPhase("plan");
    reset(levelOf(next).start);
  }

  // Open where this phone left off, once its stars load, unless a tap or #og already chose.
  useEffect(() => {
    if (!levels.loaded || chosen.current) return;
    const glow = Array.from({ length: levels.unlocked }, (_, i) => i + 1).find(l => !levels.stars[l]);
    open(glow ?? levels.unlocked, false);
  }, [levels.loaded]);

  useEffect(() => {
    if (location.hash !== "#og") return;
    chosen.current = true;
    const demo = levelOf(OG_LEVEL), demoPlan = BEST[OG_LEVEL - 1].plan;
    setN(OG_LEVEL); setPlan(demoPlan); setAt(pathOf(demo, demoPlan).at(-1)!);
    setResult({ stars: 3, blocks: demoPlan.length, runs: 1, repeat: true });
    setToday({ levels: 1, samples: demo.samples.length, last: { n: OG_LEVEL, plan: demoPlan, stars: 3 } });
    setPhase("won"); setShowing(true);
  }, []);

  /** Any change to the plan puts the rover back at the start, so the next run is always fresh. */
  function edit(next: Block[]) {
    if (running) return;
    if (fail || at !== level.start || taken.length) reset();
    setEmpty(false);
    setPlan(next);
  }

  const tapArrow = (dir: Dir) => { if (running) return; sfx.pick(); edit(addBlock(plan, dir)); };
  const tapRepeat = () => { if (running || !plan.length) return; sfx.combo(plan.at(-1)!.times); edit(repeatLast(plan)); };
  const back = () => { if (running || !plan.length) return; sfx.drop(); edit(plan.slice(0, -1)); };
  const removeAt = (index: number) => { if (running) return; sfx.drop(); edit(removeBlock(plan, index)); };

  function go() {
    if (running) return;
    if (!plan.length) { sfx.tap(); setEmpty(true); return; }
    reset();
    startChirp();
    setPhase("run");
    runs.current += 1;
    const run = runPlan(level, plan), ms = slow ? 850 : 520, lead = 300;
    run.steps.forEach((step, i) => timers.current.push(setTimeout(() => {
      const dir = plan[step.block].dir;
      setActive({ block: step.block, turn: step.turn });
      setAt(step.at);
      if (dir === "L" || dir === "R") setFace(dir === "L" ? -1 : 1);
      if (step.got !== null) { gotSample(); setTaken(list => [...list, step.got!]); } else motor(i);
    }, lead + ms * i)));
    timers.current.push(setTimeout(() => (run.end === "win" ? win() : stopped(run)), lead + ms * run.steps.length + (run.end === "win" ? 250 : 0)));
  }

  function stopped(run: Run) {
    if (run.failBlock !== null) { setActive({ block: run.failBlock, turn: 0 }); bump(); }
    else { setActive(null); sfx.drop(); }
    setFail(run);
    setMisses(count => count + 1);
    setPhase("plan");
  }

  function win() {
    const blocks = plan.length, stars = starsOf(blocks, best.blocks);
    const wasAll = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).every(l => levels.stars[l]);
    const nowAll = Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1).every(l => l === level.n || levels.stars[l]);
    levels.record(level.n, stars);
    setResult({ stars, blocks, runs: runs.current, repeat: plan.some(block => block.times > 1) });
    setToday(day => ({ levels: day.levels + 1, samples: day.samples + level.samples.length, last: { n: level.n, plan, stars } }));
    if (!wasAll && nowAll) { sfx.levelUp(); confetti({ colors: ["#b8461f", "#ffd166", "#4f7fd0", "#7b5b8f", "#f6f2ea"] }); } else sfx.win();
    setActive(null);
    setPhase("won");
    top.current?.scrollIntoView({ block: "nearest" });
    // Only here, after a level is over: the daily limit never cuts a run midway.
    atBreak();
  }

  const halt = () => { sfx.tap(); stop(); reset(); setPhase("plan"); };

  const fresh = (l: number) => levels.loaded && !levels.stars[l] && level.n === l && phase === "plan" && !fail;
  const ghost: string | null = fresh(1) ? (plan.length ? "go" : best.arrows[0].dir)
    : fresh(10) ? (!plan.length ? "U" : plan.length === 1 && plan[0].times === 1 ? "repeat" : null) : null;
  const hint = showHint(misses) && phase !== "won" ? pathOf(level, best.plan).slice(1) : [];
  const note = empty ? noteFor(level, runPlan(level, []), 0) : fail ? noteFor(level, fail, plan.length) : null;
  const say = note ? `${note.title} ${note.why}` : tipFor(level, plan);
  const full = plan.length >= MAX_BLOCKS;
  const repeatOff = !plan.length || plan.at(-1)!.times >= MAX_TIMES;
  const bumpAt = fail?.bump ?? null;
  const total = totalStars(levels.stars);
  const fact = factFor(level.n);

  const cell = (c: Cell): CSSProperties => ({ left: `${(c.x * 100) / level.w}%`, top: `${(c.y * 100) / level.h}%` });
  const boardStyle = { "--cols": level.w, "--rows": level.h } as CSSProperties;
  const nudge = bumpAt ? ({ "--bx": bumpAt.x - at.x, "--by": bumpAt.y - at.y } as CSSProperties) : undefined;

  return <div className={`mr${slow ? " mr-slow" : ""}`} ref={top}>
    <div className="mr-hud">
      <p className="mr-level"><b>{levelLabel(level.n)}</b><span>{level.title}</span></p>
      <p className="mr-count" aria-label={`${bn(level.samples.length)}টার মধ্যে ${bn(taken.length)}টা পাথর তোলা হয়েছে`}>
        <Art svg={SAMPLE} className="mr-count-icon" />{bn(taken.length)}/{bn(level.samples.length)}
      </p>
      <button type="button" className="mr-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
      <SoundToggle compact />
    </div>

    {phase !== "won" && phase !== "idle" && <>
      <div className="mr-board" style={boardStyle} role="img"
        aria-label={`মঙ্গলের ম্যাপ, ${bn(level.w)} ঘর চওড়া, ${bn(level.h)} ঘর লম্বা। ${bn(level.samples.length)}টা পাথর, ${bn(level.craters.length)}টা গর্ত।`}>
        {level.craters.map((c, i) => <span key={`c${i}`} className={`mr-thing mr-crater${same(bumpAt, c) ? " hit" : ""}`} style={cell(c)}><Art svg={CRATER} /></span>)}
        {hint.map((c, i) => <span key={`h${i}`} className="mr-thing mr-dot" style={cell(c)} />)}
        <span className="mr-thing mr-start" style={cell(level.start)} />
        {level.samples.map((s, i) => <span key={`s${i}`} className={`mr-thing mr-sample${taken.includes(i) ? " taken" : ""}`} style={cell(s)}><Art svg={SAMPLE} /></span>)}
        <span className="mr-rover" style={{ transform: `translate(${at.x * 100}%, ${at.y * 100}%)` }}>
          <span className={`mr-nudge${bumpAt ? " bump" : ""}`} style={nudge}><Art svg={ROVER} className={face < 0 ? "flip" : ""} /></span>
        </span>
      </div>

      <div className="mr-say" role="status" aria-live="polite">
        <p className={note ? "mr-oops" : ""}>{note ? <><b>{note.title}</b> {note.why}</> : say}</p>
        <SpeakButton text={say} />
      </div>

      <ol className="mr-plan" aria-label={`প্ল্যান: ${bn(plan.length)}টা ব্লক`}>
        {plan.length ? plan.map((block, i) => {
          const now = active?.block === i;
          return <li key={i}>
            <button type="button" className={`mr-block${now ? (fail ? " oops" : " now") : ""}`} onClick={() => removeAt(i)}
              aria-label={`${bn(i + 1)} নম্বর ব্লক: ${blockText(block)}। মুছতে চাপো`}>
              {block.times > 1 && <b>{now && running ? `${bn(active.turn + 1)}/${bn(block.times)}` : `${bn(block.times)} বার`}</b>}
              <Art svg={ARROW} turn={TURN[block.dir]} />
            </button>
          </li>;
        }) : <li className="mr-empty">তীরগুলো এখানে জমবে</li>}
      </ol>

      <div className="mr-pad">
        {PAD.map(dir => <button type="button" key={dir} data-cmd={dir} className="mr-arrow" disabled={running || full} onClick={() => tapArrow(dir)} aria-label={`${DIRS[dir].bn} এক ঘর`}>
          <Art svg={ARROW} turn={TURN[dir]} />{ghost === dir && <Finger />}
        </button>)}
      </div>
      <div className="mr-actions">
        {level.repeat && <button type="button" data-cmd="repeat" className="mr-repeat" disabled={running || repeatOff} onClick={tapRepeat} aria-label="শেষ ব্লকটা আরেক বার">
          <Art svg={REPEAT} /><span>আরেক বার</span>{ghost === "repeat" && <Finger />}
        </button>}
        <button type="button" className="mr-back" disabled={running || !plan.length} onClick={back} aria-label="শেষ ব্লকটা মুছো"><span aria-hidden="true">⌫</span><span>মুছো</span></button>
        {running
          ? <button type="button" className="kit-secondary mr-go" onClick={halt}>থামাও</button>
          : <button type="button" className="kit-primary mr-go" onClick={go}>চালাও <span aria-hidden="true">▶</span>{ghost === "go" && <Finger />}</button>}
      </div>
    </>}

    {phase === "won" && result && <div className="mr-done">
      <StarReveal count={result.stars} />
      <h2>{endTitle(result.blocks)}</h2>
      <p className="mr-method">{methodLine(result.blocks, best.blocks, result.runs, result.repeat)}</p>
      <div className="mr-fact">
        <p><b>মঙ্গলের কথা</b>{fact}</p>
        <SpeakButton text={fact} />
      </div>
      {level.n < LEVEL_COUNT && <button type="button" className="kit-primary mr-next" onClick={() => { sfx.pop(); open(level.n + 1); }}>পরের লেভেল <span aria-hidden="true">→</span></button>}
      <div className="mr-pair">
        <button type="button" className="kit-secondary" onClick={() => { sfx.pop(); open(level.n); }}>আবার খেলো</button>
        <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("idle"); }}>শেষ</button>
      </div>
      <ShowParentButton onClick={() => setShowing(true)} />
    </div>}

    {phase === "idle" && <div className="mr-done mr-idle">
      <p>আজকের মতো হলো। আবার চালাতে চাইলে একটা লেভেল বেছে নাও।</p>
      <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level.n} onPick={open} />
      {today.last && <ShowParentButton onClick={() => setShowing(true)} />}
    </div>}

    {phase !== "idle" && <details className="mr-drawer">
      <summary>সব লেভেল <span>★ {bn(total)}/{bn(LEVEL_COUNT * 3)}</span></summary>
      <p className="mr-stages">ছোট প্ল্যান ১–৩ · লম্বা প্ল্যান ৪–৬ · অনেক পাথর ৭–৯ · লুপ ১০–১১ · চ্যালেঞ্জ ১২</p>
      <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={levels.unlocked} current={level.n} onPick={pick => { open(pick); top.current?.scrollIntoView({ block: "nearest" }); }} />
    </details>}

    {today.last && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{
      fileName: `mongole-rover-${today.last.n}.png`,
      make: async () => { const pictures = await loadPictures(); return renderCard(canvas => drawCard(canvas, today, pictures, location.host)); },
    }}>
      <div className="kit-card"><CardCanvas today={today} /></div>
      <p className="mr-parent-line"><b>বড়দের জন্য:</b> প্ল্যান বানানো, চালিয়ে দেখা, ভুল ব্লক খুঁজে ঠিক করা: কোডিংয়ের গোড়ার কাজ এই তিনটাই। {today.last.plan.some(b => b.times > 1) ? "“৩ বার ↑” হলো লুপ, একই কাজ বার বার করানোর ছোট উপায়। " : ""}<small>মঙ্গলের তথ্য: {SOURCE}</small></p>
    </ShowParent>}
    {resting && <RestScreen onExtend={extend} />}

    <div className="mr-gate">
      <ParentGate><ShareToolLink title="মঙ্গলে রোভার" text="তীর সাজিয়ে মঙ্গলে রোভার চালানোর খেলা। ছোটদের কোডিংয়ের প্রথম পাঠ, সাথে মঙ্গলের তথ্য।" /></ParentGate>
    </div>
  </div>;
}
