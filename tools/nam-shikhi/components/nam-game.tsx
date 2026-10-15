"use client";
// IP: what we avoided — no flashcard app's, textbook's or TV show's pictures, characters or layout; every drawing is our own flat SVG (a Black Bengal goat, a শুশুক, a tin-roof বাড়ি), and the names are plain dictionary words.

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { loadCardFonts, renderCard } from "../../../shared/card-canvas";
import { confetti, makeRng, newSeed, readLevels, sfx, shake, tone, useLevels, useSlowMode } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, ShowParentButton, SpeakButton, bn, speak, useKidsSession } from "../../../shared/kids-kit";
import { BODY, VIEWS, artMarkup, type View } from "../lib/art";
import { drawCard, loadPictures, type CardData } from "../lib/draw-card";
import { LEVEL_TITLE, PACKS, packFromHash, packOf, type Choice, type Item, type PackId } from "../lib/packs";
import { answerOf, spotPercent, cardCell, cardTitle, choiceCount, choicesFor, firstOpenLevel, isSpot, learnedLine, planRound, promptOf, spotAt, starsOf } from "../lib/round";

const TOOL = "nam-shikhi";
const levelKey = (pack: PackId) => `${TOOL}-${pack}`;

type Round = {
  pack: PackId; level: number; targets: Item[]; index: number; choices: Choice[];
  wrong: string[]; solved: boolean; firstTry: number; missRun: number; rightRun: number;
};
type Phase = "play" | "done" | "idle";

function newRound(pack: PackId, level: number, rng: () => number): Round {
  const spec = packOf(pack), mode = spec.levels[level - 1], targets = planRound(spec, mode, rng);
  return { pack, level, targets, index: 0, choices: choicesFor(spec, mode, targets[0], choiceCount(0, 0), rng), wrong: [], solved: false, firstTry: 0, missRun: 0, rightRun: 0 };
}

function Pic({ id, className = "ns-pic" }: { id: string; className?: string }) {
  if (id === "body") return <svg className={className} viewBox={VIEWS.face} aria-hidden="true" dangerouslySetInnerHTML={{ __html: BODY }} />;
  return <svg className={className} viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{ __html: artMarkup(id) }} />;
}

/** The finger that shows the first tap: tip at the centre of whatever it sits in. */
const FINGER = <svg className="ns-ghost" viewBox="0 0 40 52" aria-hidden="true"><path d="M15 4a4 4 0 0 1 8 0v20l10 2a5 5 0 0 1 4 6l-3 14a6 6 0 0 1-6 5H17a6 6 0 0 1-5-3L4 34a4 4 0 0 1 6-5l5 5z" fill="#fff" stroke="#3d2f28" strokeWidth="2.6" strokeLinejoin="round" /></svg>;

/** The child figure (or its face), with rings on parts. Taps go to the nearest part. */
function Figure({ view, rings, onTap, className = "ns-figure", focus }: {
  view: View; rings: { at: [number, number]; kind: "right" | "wrong" | "hint" | "show" }[];
  onTap?: (x: number, y: number) => void; className?: string; focus?: [number, number];
}) {
  const box = focus ? `${focus[0] - 28} ${focus[1] - 28} 56 56` : VIEWS[view];
  const tap = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!onTap || !event.isPrimary) return;
    const matrix = event.currentTarget.getScreenCTM();
    if (!matrix) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse());
    onTap(point.x, point.y);
  };
  return <svg className={className} viewBox={box} onPointerDown={tap} aria-hidden="true">
    <g dangerouslySetInnerHTML={{ __html: BODY }} />
    {rings.map(({ at, kind }, index) => <circle key={`${kind}${index}`} className={`ns-ring ${kind}`} cx={at[0]} cy={at[1]} r={view === "face" && !focus ? 6.5 : 10} />)}
  </svg>;
}

function CardCanvas({ data }: { data: CardData }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    let live = true;
    void (async () => {
      await loadCardFonts(`${data.label} ${data.title} ${data.cells.map(cell => cell.top).join(" ")}`);
      const pictures = await loadPictures(data.cells.map(cell => cell.art));
      if (live && ref.current) drawCard(ref.current, data, pictures, location.host);
    })();
    return () => { live = false; };
  }, [data]);
  return <canvas ref={ref} width={1080} height={1350} aria-label={data.title} />;
}

function PackTiles({ current, onPick }: { current: PackId; onPick: (pack: PackId) => void }) {
  return <ul className="ns-packs">
    {PACKS.map(pack => <li key={pack.id}>
      <button type="button" aria-pressed={pack.id === current} onClick={() => onPick(pack.id)}>
        <Pic id={pack.icon} className="ns-pack-pic" /><span>{pack.bn}</span>
      </button>
    </li>)}
  </ul>;
}

export function NamGame() {
  const rng = useRef(makeRng(1));
  const [round, setRound] = useState<Round>(() => newRound("pashu", 1, rng.current));
  const [phase, setPhase] = useState<Phase>("play");
  const [result, setResult] = useState({ stars: 0 });
  const [touched, setTouched] = useState(false);
  const [showing, setShowing] = useState(false);
  const [slow, setSlow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  const pack = packOf(round.pack), mode = pack.levels[round.level - 1];
  const levels = useLevels(levelKey(pack.id), pack.levels.length);
  const target = round.targets[round.index];
  const spot = isSpot(pack, mode);
  const answer = answerOf(mode, target);
  const board = useRef<HTMLDivElement>(null);

  const start = useCallback((id: PackId, level?: number) => {
    const spec = packOf(id);
    let saved: string | null = null;
    try { saved = localStorage.getItem(`ektukhani-levels-${levelKey(id)}`); } catch { /* storage blocked */ }
    rng.current = makeRng(newSeed());
    setRound(newRound(id, level ?? firstOpenLevel(readLevels(saved, spec.levels.length), spec.levels.length), rng.current));
    setPhase("play");
  }, []);

  useEffect(() => {
    start(packFromHash(location.hash) ?? "pashu");
    const onHash = () => { const id = packFromHash(location.hash); if (id) start(id); };
    addEventListener("hashchange", onHash);
    return () => removeEventListener("hashchange", onHash);
  }, [start]);

  const pickPack = (id: PackId) => {
    sfx.tap();
    history.replaceState(null, "", `#p=${id}`);
    start(id);
    board.current?.scrollIntoView({ block: "nearest" });
  };

  const choose = (id: string, element?: Element | null) => {
    if (round.solved || phase !== "play") return;
    setTouched(true);
    if (id === answer) {
      sfx.good();
      const first = round.wrong.length === 0;
      speak(learnedLine(mode, target).main);
      setRound(r => ({ ...r, solved: true, firstTry: r.firstTry + (first ? 1 : 0), rightRun: first ? r.rightRun + 1 : 0, missRun: first ? 0 : r.missRun + 1 }));
      return;
    }
    if (round.wrong.includes(id)) return;
    tone(330, 0.14, 0.06, "sine", 0, 262);
    shake(element);
    setRound(r => ({ ...r, wrong: [...r.wrong, id] }));
  };

  const finish = () => {
    const stars = starsOf(round.firstTry, round.targets.length);
    const before = levels.stars, wasComplete = pack.levels.every((_, index) => before[index + 1]);
    levels.record(round.level, stars);
    const nowComplete = pack.levels.every((_, index) => index + 1 === round.level || before[index + 1]);
    if (nowComplete && !wasComplete) confetti(); else sfx.win();
    setResult({ stars });
    setPhase("done");
    atBreak();
  };

  const next = () => {
    sfx.tap();
    if (round.index + 1 >= round.targets.length) { finish(); return; }
    setRound(r => {
      const index = r.index + 1;
      return { ...r, index, wrong: [], solved: false, choices: choicesFor(pack, mode, r.targets[index], choiceCount(r.missRun, r.rightRun), rng.current) };
    });
  };

  const tapFigure = (x: number, y: number) => {
    const part = spotAt(pack, target.view!, x, y);
    if (part) choose(part.id, board.current?.querySelector(".ns-figure"));
  };

  const prompt = promptOf(mode, target, spot);
  const learned = learnedLine(mode, target);
  const hint = round.wrong.length >= 2 && !round.solved;
  const ghost = !touched && round.index === 0 && round.level === 1 && !levels.stars[1];
  const named = (choice: Choice) => round.solved || round.wrong.includes(choice.id);
  const cardData: CardData = {
    label: `নাম শিখি · ${pack.bn}`, title: cardTitle(pack, mode, round.targets.length, bn), stars: result.stars,
    cells: round.targets.map(item => cardCell(mode, item)),
  };

  const rings = (item: Item) => {
    const out: { at: [number, number]; kind: "right" | "wrong" | "hint" | "show" }[] = [];
    for (const id of round.wrong) for (const at of pack.items.find(part => part.id === id)?.spots ?? []) out.push({ at, kind: "wrong" });
    if (round.solved || hint) for (const at of item.spots ?? []) out.push({ at, kind: round.solved ? "right" : "hint" });
    return out;
  };

  return <div className={`ns${slow ? " ns-slow" : ""}`}>
    <div className="ns-bar">
      <p className="ns-where"><b>{pack.bn}</b><span>লেভেল {bn(round.level)} · {LEVEL_TITLE[mode]}</span></p>
      <button type="button" className="ns-pill" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে</button>
      <SoundToggle compact />
    </div>

    <div className="ns-board" ref={board}>
      {phase === "play" && <>
        <ol className="ns-dots" aria-label={`${bn(round.targets.length)}টার মধ্যে ${bn(round.index + 1)} নম্বর`}>
          {round.targets.map((item, index) => <li key={item.id} className={index < round.index || (index === round.index && round.solved) ? "on" : index === round.index ? "now" : ""} />)}
        </ol>

        <div className={`ns-prompt ns-${mode}`}>
          {mode === "read" && (pack.id === "shorir"
            ? <Figure view={target.view!} rings={(target.spots ?? []).map(at => ({ at, kind: "show" as const }))} className="ns-figure ns-figure-small" />
            : <Pic id={target.art} className="ns-pic ns-pic-big" />)}
          {(mode === "home" || mode === "thing") && <Pic id={mode === "thing" ? target.thing!.art : target.art} className="ns-pic ns-pic-mid" />}
          <div className="ns-ask">
            {prompt.word && <p className="ns-word" lang={prompt.latin ? "en" : undefined}>{prompt.word}</p>}
            <p className="ns-q">{prompt.ask}</p>
          </div>
          {prompt.word && !prompt.latin && <SpeakButton text={`${prompt.word} ${prompt.ask}`} />}
        </div>

        {spot
          ? <div className={`ns-figure-wrap ns-${target.view}`}>
              <Figure view={target.view!} rings={rings(target)} onTap={tapFigure} />
              {ghost && <span className="ns-ghost-at" style={spotPercent(target.view!, target.spots![0])}>{FINGER}</span>}
              {/* Keyboard and screen readers: one button per part, laid over the figure. */}
              <div className="ns-parts">{pack.items.filter(item => item.view === target.view).map(item => <button type="button" key={item.id} data-ok={item.id === answer ? "1" : undefined} style={spotPercent(item.view!, item.spots![0])} aria-label={`${item.bn}, ${item.en}`} onClick={event => choose(item.id, event.currentTarget.parentElement?.previousElementSibling)} />)}</div>
            </div>
          : <ul className={`ns-choices n${round.choices.length}${mode === "read" ? " ns-names" : ""}`}>
              {round.choices.map(choice => {
                const right = choice.id === answer, state = round.solved && right ? "right" : round.wrong.includes(choice.id) ? "wrong" : hint && right ? "hint" : "";
                return <li key={choice.id}>
                  <button type="button" className={`ns-choice ${state}`} data-ok={right ? "1" : undefined} disabled={round.solved && !right}
                    aria-label={mode === "read" ? choice.bn : `${choice.bn}, ${choice.en}`} onClick={event => choose(choice.id, event.currentTarget)}>
                    {mode === "read"
                      ? <><b>{choice.bn}</b>{round.solved && <small lang="en">{choice.en}</small>}</>
                      : <><Pic id={choice.art} /><span className="ns-name">{named(choice) && <><b>{choice.bn}</b><small lang="en">{choice.en}</small></>}</span></>}
                    {ghost && right && <span className="ns-ghost-at">{FINGER}</span>}
                  </button>
                </li>;
              })}
            </ul>}

        <div className="ns-after" role="status" aria-live="polite">
          {round.solved
            ? <>
                {(mode === "home" || mode === "thing" || mode === "role") && <p className="ns-learned-line gx-pop"><b>{learned.main}</b>{learned.sub && <span lang={mode === "home" ? undefined : "en"}>{learned.sub}</span>}</p>}
                <button type="button" className="kit-primary ns-next" onClick={next} aria-label={round.index + 1 >= round.targets.length ? "শেষ দেখো" : "পরেরটা"}>{round.index + 1 >= round.targets.length ? "দেখো কী শিখলে" : "পরেরটা"} <span aria-hidden="true">→</span></button>
              </>
            : round.wrong.length > 0 && <p className="ns-try">{hint ? "আলো জ্বলা ছবিটা দেখো।" : "আরেকবার ভাবো।"}</p>}
        </div>
      </>}

      {phase === "done" && <div className="ns-done">
        <StarReveal count={result.stars} />
        <h2>{cardTitle(pack, mode, round.targets.length, bn)}</h2>
        <ul className="ns-learned">
          {round.targets.map(item => {
            const cell = cardCell(mode, item);
            return <li key={item.id}>
              {cell.spot ? <Figure view={item.view!} focus={cell.spot} rings={[{ at: cell.spot, kind: "show" }]} className="ns-pic" /> : <Pic id={cell.art} />}
              <b>{cell.top}</b><small lang={mode === "home" ? undefined : "en"}>{cell.bottom}</small>
            </li>;
          })}
        </ul>
        <p className="ns-away">{pack.away}</p>
        <div className="ns-pair">
          <button type="button" className="kit-primary" onClick={() => { sfx.pop(); start(pack.id, round.level); }}>আবার খেলো</button>
          <button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setPhase("idle"); }}>শেষ</button>
        </div>
        <ShowParentButton onClick={() => setShowing(true)} />
      </div>}

      {phase === "idle" && <div className="ns-idle">
        <p>খেলা শেষ। আবার খেলতে চাইলে একটা বেছে নাও।</p>
        <PackTiles current={pack.id} onPick={pickPack} />
      </div>}
    </div>

    <ShowParent open={showing} onClose={() => setShowing(false)} picture={{
      fileName: `nam-shikhi-${pack.id}.png`,
      make: async () => { const pictures = await loadPictures(cardData.cells.map(cell => cell.art)); return renderCard(canvas => drawCard(canvas, cardData, pictures, location.host)); },
    }}>
      <div className="kit-card"><CardCanvas data={cardData} /></div>
    </ShowParent>
    {resting && <RestScreen onExtend={extend} />}

    <section className="ns-more" aria-labelledby="ns-more-title">
      <h2 id="ns-more-title">কোনটার নাম শিখবে?</h2>
      {phase !== "idle" && <PackTiles current={pack.id} onPick={pickPack} />}
      <h3>{pack.bn}: লেভেল</h3>
      <LevelGrid count={pack.levels.length} stars={levels.stars} unlocked={levels.unlocked} current={round.level} onPick={level => { start(pack.id, level); board.current?.scrollIntoView({ block: "nearest" }); }} />
      <ol className="ns-level-names">{pack.levels.map((item, index) => <li key={item}><b>{bn(index + 1)}</b> {LEVEL_TITLE[item]}</li>)}</ol>
      <div className="ns-gate">
        <ParentGate><ShareToolLink title="নাম শিখি" text="ছবি দেখে পশুপাখি, ফল, সবজি আর শরীরের নাম শেখার খেলা, বাংলা আর ইংরেজিতে।" /></ParentGate>
      </div>
    </section>
  </div>;
}
