"use client";
// IP: what we avoided — no Meena or Sisimpur look-alikes, no soap or toothpaste brands, no textbook or poster art; every hand, mouth and germ is our own flat SVG, and the steps are paraphrased from WHO's handwashing guide.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadCardFonts, renderCard } from "../../../shared/card-canvas";
import { confetti, sfx, useLevels, useSlowMode } from "../../../shared/game-kit";
import { SoundToggle, StarReveal, Stars } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, bn, useKidsSession } from "../../../shared/kids-kit";
import { SCENES, mouth } from "../lib/art";
import { BRUSH_TIP, cardData } from "../lib/card-data";
import { cardSvgs, drawCard, loadPictures, type CardData } from "../lib/draw-card";
import { FACTS } from "../lib/facts";
import { QUESTIONS, starsOf } from "../lib/quiz";
import { BRUSH_ZONES, GERMS_EACH, MODES, WASH_STEPS, cardTitle, isBedtime, modeFromHash, modeOf, type ModeId } from "../lib/routines";
import { Icon, Quiz } from "./quiz";
import { Routine } from "./routine";

const TOOL = "hat-dhui";
type Phase = "play" | "done" | "idle";

function CardCanvas({ data }: { data: CardData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      await loadCardFonts(`${data.label} ${data.title} ${data.tiles.map(tile => tile.text).join(" ")}`);
      const pictures = await loadPictures(cardSvgs(data));
      if (live && ref.current) drawCard(ref.current, data, pictures, location.host);
    })();
    return () => { live = false; };
  }, [data]);
  return <canvas ref={ref} width={1080} height={1350} aria-label={data.title} />;
}

function Picture({ svg, box = 200, className }: { svg: string; box?: number; className: string }) {
  return <svg className={className} viewBox={`0 0 ${box} ${box}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function HatDhuiGame() {
  const [mode, setMode] = useState<ModeId>("hat");
  const [phase, setPhase] = useState<Phase>("play");
  const [round, setRound] = useState(0);
  const [result, setResult] = useState({ stars: 0, bedtime: false });
  const [showing, setShowing] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const levels = useLevels(TOOL, MODES.length);
  const board = useRef<HTMLDivElement>(null);
  const level = modeOf(mode).level;

  const open = useCallback((id: ModeId) => { setMode(id); setPhase("play"); setRound(n => n + 1); }, []);
  useEffect(() => {
    const fromHash = () => { const id = modeFromHash(location.hash); if (id) open(id); };
    fromHash();
    addEventListener("hashchange", fromHash);
    return () => removeEventListener("hashchange", fromHash);
  }, [open]);

  const pick = (id: ModeId) => {
    sfx.tap();
    history.replaceState(null, "", `#m=${id}`);
    open(id);
    board.current?.scrollIntoView({ block: "nearest" });
  };

  const finish = (stars: number, bedtime = false) => {
    const before = levels.stars, wasComplete = MODES.every(item => before[item.level]);
    levels.record(level, stars);
    if (!wasComplete && MODES.every(item => item.level === level || before[item.level])) confetti(); else sfx.win();
    setResult({ stars, bedtime });
    setPhase("done");
    // Only here, after a routine is over: the daily limit never cuts a wash or a brush midway.
    atBreak();
  };

  const card = useMemo(() => cardData(mode, result.stars, result.bedtime, bn), [mode, result]);
  const ghost = levels.loaded && !levels.stars[level];
  const fact = FACTS[mode];

  return <div className={`hd${slow ? " hd-slow" : ""}`}>
    <div className="hd-bar">
      <ul className="hd-tabs">
        {MODES.map(item => <li key={item.id}>
          <button type="button" aria-pressed={item.id === mode} onClick={() => pick(item.id)}>
            <Icon id={`tab-${item.id}`} /><span>{item.bn}</span>
          </button>
        </li>)}
      </ul>
      <div className="hd-tools">
        <button type="button" className="hd-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
        <SoundToggle compact />
      </div>
    </div>

    <div className="hd-board" ref={board}>
      {phase === "play" && (mode === "kokhon"
        ? <Quiz key={round} ghost={ghost} onDone={firstTry => finish(starsOf(firstTry))} />
        : <Routine key={`${mode}-${round}`} wash={mode === "hat"} ghost={ghost} onDone={() => finish(3, mode === "dat" && isBedtime(new Date()))} />)}

      {phase === "done" && <div className="hd-done">
        <StarReveal count={result.stars} />
        <h2>{cardTitle(mode, bn, QUESTIONS.length)}</h2>
        {mode === "hat" && <>
          <p className="hd-method">{bn(WASH_STEPS.length)}টা ধাপই হলো। নখ আর কবজিও বাদ পড়েনি। {bn(WASH_STEPS.length * GERMS_EACH)}টা জীবাণু পালাল।</p>
          <ul className="hd-after-steps">
            <li><Picture svg={SCENES.rinse} className="hd-pic" /><span>এবার পানিতে ধুয়ে ফেলো</span></li>
            <li><Picture svg={SCENES.dry} className="hd-pic" /><span>গামছায় মুছে নাও</span></li>
          </ul>
        </>}
        {mode === "dat" && <>
          <Picture svg={mouth(null)} className="hd-pic hd-smile" />
          <p className="hd-method">ওপরে-নিচে, ভেতরে-বাইরে, জিভও। {bn(BRUSH_ZONES.length * GERMS_EACH)}টা জীবাণু বিদায় নিল। এবার পেস্টটা থু করে ফেলো।</p>
          {result.bedtime && <p className="hd-badge"><Icon id="raat" /><span>রাতের ব্রাশের তারা। এবার ঘুম।</span></p>}
          <p className="hd-tip"><Icon id="mishti" /><span>{BRUSH_TIP}।</span></p>
        </>}
        {mode === "kokhon" && <ul className="hd-times">{QUESTIONS.map(q => <li key={q.id}><Icon id={q.id} /><span>{q.right.bn}</span></li>)}</ul>}
        <div className="hd-pair">
          <button type="button" className="kit-primary" onClick={() => { sfx.pop(); open(mode); }}>আবার খেলো</button>
          <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("idle"); }}>শেষ</button>
        </div>
        <ShowParentButton onClick={() => setShowing(true)} />
      </div>}

      {phase === "idle" && <div className="hd-idle">
        <p>আজকের মতো হলো। আবার করতে চাইলে ওপরে একটা ছবি চাপো।</p>
        <ul className="hd-record">{MODES.map(item => <li key={item.id}><Icon id={`tab-${item.id}`} /><span>{item.bn}</span><Stars count={levels.stars[item.level] ?? 0} /></li>)}</ul>
      </div>}
    </div>

    <ShowParent open={showing} onClose={() => setShowing(false)} picture={{
      fileName: `hat-dhui-${mode}.png`,
      make: async () => { const pictures = await loadPictures(cardSvgs(card)); return renderCard(canvas => drawCard(canvas, card, pictures, location.host)); },
    }}>
      <div className="kit-card"><CardCanvas data={card} /></div>
      <p className="hd-parent-line"><b>বড়দের জন্য:</b> {fact.fact} {fact.action} <small>সূত্র: {fact.source}</small></p>
    </ShowParent>
    {resting && <RestScreen onExtend={extend} />}

    <div className="hd-gate">
      <ParentGate><ShareToolLink title="হাত ধুই, দাঁত মাজি" text="২০ সেকেন্ডে হাত ধোয়া আর ২ মিনিটে দাঁত মাজা, বেসিনের পাশে ফোন রেখে ছোটদের খেলা।" /></ParentGate>
    </div>
  </div>;
}
