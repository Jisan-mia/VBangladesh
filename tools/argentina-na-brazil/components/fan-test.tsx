"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { drawFanCard, fanCardBlob, loadScene } from "../lib/draw-card";
import { fanBadge, fanCaption, fanLaneLine, fanLaneTitle, fanLine, fanPair, fanScore, fanTest, fanTitle, newSeed, rivalOf, scoreLine, type FanTeam } from "../lib/fan";
import { bn, FAN_ROUNDS, possessive, shareHash, teamOf, type Pick, type Roof, type Shared } from "../lib/roof";

const TOOL = "argentina-na-brazil";
const letters = ["ক", "খ", "গ"];

/** The আসল ফ্যান test, offered under the roof card once Argentina or Brazil is up. */
export function FanTest({ own, team, neighbour, linkSeed, site }: { own: Roof; team: FanTeam; neighbour: Roof | null; linkSeed: number | null; site: string }) {
  const [seed, setSeed] = useState<number | null>(null);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [at, setAt] = useState(0);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const firstOption = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);

  const rounds = useMemo(() => seed === null ? [] : fanTest(team, seed), [team, seed]);
  const finished = seed !== null && at >= FAN_ROUNDS;
  const round = rounds[Math.min(at, FAN_ROUNDS - 1)];
  const picked = picks[at];
  const right = round && picked !== undefined && picked === round.right;
  // The friend's taps only count under the seed they came with, so their link's seed is reused for this test.
  const friend = neighbour?.quiz && linkSeed !== null ? neighbour : null;
  const shared = useMemo<Shared | null>(() => finished ? { own: { ...own, quiz: picks }, neighbour, seed } : null, [finished, own, picks, neighbour, seed]);
  const state = shared ? shareHash(shared).slice(1) : "";
  const label = teamOf(team).label;

  useEffect(() => {
    if (!moved.current) return;
    if (finished) document.getElementById("fan")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    else if (picked === undefined) firstOption.current?.focus({ preventScroll: true });
    else nextButton.current?.focus({ preventScroll: true });
  }, [at, picked, finished, seed]);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    Promise.all([loadScene(shared, format), loadCardFonts("আসল ফ্যান পরীক্ষা ৮-এ ৭")]).then(([scene]) => {
      if (cancelled || !preview.current) return;
      drawFanCard(preview.current, scene, shared, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [shared, format, site]);

  function start() {
    moved.current = true;
    setSeed(linkSeed ?? newSeed());
    setPicks([]);
    setAt(0);
  }

  function pick(option: Pick) {
    moved.current = true;
    setPicks(current => current.length === at ? [...current, option] : current);
  }

  if (seed === null) {
    const friendScore = friend ? scoreLine(fanScore(friend.team, linkSeed!, friend.quiz!)) : "";
    return <section className="abn-fan" id="fan" aria-labelledby="fan-title">
      <div className="abn-fan-invite">
        <ol className="abn-fan-bunting" data-team={team} aria-hidden="true">{Array.from({ length: FAN_ROUNDS }, (_, index) => <li key={index} />)}</ol>
        <p className="abn-fan-kicker">আসল ফ্যান পরীক্ষা · {bn(FAN_ROUNDS)}টা প্রশ্ন</p>
        <h2 id="fan-title">তুমি কি খাঁটি {label} ভক্ত?</h2>
        <p>{friend ? <><strong>{friend.name || "বন্ধু"}</strong> {possessive(teamOf(friend.team).label)} পরীক্ষায় পেয়েছে <strong>{friendScore}</strong>। এবার তোমার পালা, {possessive(label)} {bn(FAN_ROUNDS)}টা প্রশ্ন।</> : "বিশ্বকাপ, ফাইনাল, কোপা আমেরিকা আর কিংবদন্তিদের নিয়ে প্রশ্ন। প্রতিটায় তিনটা উত্তর, ঠিক একটাই।"}</p>
        <button type="button" className="kit-primary" onClick={start}>পরীক্ষা দাও</button>
      </div>
    </section>;
  }

  if (!shared) {
    const { question, options } = round;
    return <section className="abn-fan" id="fan" aria-labelledby="fan-ask">
      <div className="abn-fan-board" key={at}>
        <div className="abn-fan-meta">
          <span>{possessive(label)} আসল ফ্যান পরীক্ষা</span>
          <span aria-label={`${bn(at + 1)} নম্বর প্রশ্ন, মোট ${bn(FAN_ROUNDS)}টা`}>{bn(at + 1)}/{bn(FAN_ROUNDS)}</span>
        </div>
        <ol className="abn-fan-bunting" data-team={team} aria-hidden="true">
          {rounds.map((item, index) => <li key={item.question.id} data-state={picks[index] === undefined ? (index === at ? "now" : "") : picks[index] === item.right ? "right" : "wrong"} />)}
        </ol>
        <h2 className="abn-fan-ask" id="fan-ask">{question.ask}</h2>
        <div className="abn-fan-options" role="group" aria-labelledby="fan-ask">
          {options.map((option, index) => {
            const status = picked === undefined ? undefined : index === round.right ? "right" : index === picked ? "wrong" : "dim";
            return <button type="button" key={option} ref={index === 0 ? firstOption : undefined} data-status={status} disabled={picked !== undefined} onClick={() => pick(index as Pick)}>
              <span className="abn-fan-letter" aria-hidden="true">{letters[index]}</span>
              <span>{option}</span>
              {status === "right" && <span className="abn-sr"> (ঠিক উত্তর)</span>}
              {status === "wrong" && <span className="abn-sr"> (তোমার উত্তর, হয়নি)</span>}
            </button>;
          })}
        </div>
        {picked !== undefined && <div className="abn-fan-answer">
          <p className="abn-fan-verdict" data-right={right}>{right ? "একদম ঠিক! একটা পতাকা উঠল।" : "হয়নি। ঠিক উত্তরটা সবুজ দাগে।"}</p>
          <p>{question.fact} <small>সূত্র: {question.source}</small></p>
        </div>}
        <p className="abn-sr" aria-live="polite">{picked !== undefined ? `${right ? "ঠিক" : "হয়নি"}। উত্তর: ${options[round.right]}। ${question.fact}` : ""}</p>
        {picked !== undefined && <button type="button" ref={nextButton} className="kit-primary abn-fan-next" onClick={() => { moved.current = true; setAt(current => current + 1); }}>{at === FAN_ROUNDS - 1 ? "স্কোর দেখো" : "পরের প্রশ্ন"}</button>}
      </div>
    </section>;
  }

  const pair = fanPair(shared) && neighbour;
  const score = fanScore(team, seed, picks);
  return <section className="abn-fan abn-fan-done" id="fan" aria-labelledby="fan-title">
    <div className="abn-fan-head">
      <p className="abn-fan-kicker">আসল ফ্যান পরীক্ষা · {fanBadge(team, score)}</p>
      <h2 id="fan-title">{pair ? fanLaneTitle(shared) : fanTitle(shared.own, seed)}</h2>
      <p>{pair ? fanLaneLine(shared.own, neighbour, seed) : fanLine(team, seed, picks)}</p>
    </div>
    <div className="abn-result-body">
      <figure className="kit-card" data-format={format}>
        <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={fanCaption(shared)} />
        {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
      </figure>
      <div className="abn-controls">
        <FormatToggle value={format} onChange={setFormat} />
        <ShareBar tool={TOOL} fileName="asol-fan.png" makeImage={() => fanCardBlob(shared, format, site)} imageKey={`${state}|${format}`} caption={fanCaption(shared)} state={state} hint={`${teamOf(rivalOf(team)).label} সাপোর্টার কোনো বন্ধুকে লিংকটা পাঠাও। সে নিজের দলের ${bn(FAN_ROUNDS)}টা প্রশ্ন পাবে, তারপর দুজনের স্কোর এক কার্ডে।`} />
        <details className="abn-fan-review">
          <summary>{bn(FAN_ROUNDS)}টা প্রশ্নের উত্তর আর সূত্র</summary>
          <ol>
            {rounds.map((item, index) => {
              const ok = picks[index] === item.right;
              return <li key={item.question.id} data-right={ok}>
                <p><span className="abn-sr">{ok ? "ঠিক" : "ভুল"}: </span>{item.question.ask}</p>
                <p><strong>{item.options[item.right]}</strong>{!ok && <s>{item.options[picks[index]]}</s>}</p>
                <p>{item.question.fact} <small>সূত্র: {item.question.source}</small></p>
              </li>;
            })}
          </ol>
          <p className="abn-fan-check">সব উত্তর উইকিপিডিয়ায় প্রতিটা ম্যাচের পাতা মিলিয়ে অক্টোবর ২০২৬-এ যাচাই করা, ২০২৬ বিশ্বকাপের তথ্য বড় সংবাদমাধ্যমের সাথেও। ভুল চোখে পড়লে পাতার নিচের বক্সে জানিও।</p>
        </details>
        <button type="button" className="kit-link" onClick={start}>আবার দাও</button>
      </div>
    </div>
  </section>;
}
