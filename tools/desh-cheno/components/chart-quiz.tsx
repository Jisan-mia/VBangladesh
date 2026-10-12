"use client";

import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, sfx, shake } from "../../../shared/game-sound";
import { totalStars, useLevels } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { badge, bn, compareLine, defaultSet, humanLine, isRight, nearMissLine, parseResult, possessive, resultHash, rightShare, scoreLine, scoreOf, setById, setStars, tallyItems, MAX_NAME_LENGTH, ROUNDS, type Pick, type Result } from "../lib/game";
import { quizSets, type SetId } from "../lib/questions";
import { Doodle, Star } from "./doodle";

const TOOL = "desh-cheno";
const letters = ["ক", "খ", "গ"];

export function ChartQuiz() {
  const [setId, setSetId] = useState<SetId>("protik");
  const [picks, setPicks] = useState<Pick[]>([]);
  const [at, setAt] = useState(0);
  const [name, setName] = useState("");
  const [friend, setFriend] = useState<Result | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const firstChip = useRef<HTMLButtonElement>(null);
  const moved = useRef(false);
  const resultVisible = useInView(resultBox);
  const levels = useLevels(TOOL, quizSets.length);

  const quiz = setById(setId)!;
  const level = quizSets.findIndex(item => item.id === setId) + 1;
  const finished = at >= ROUNDS;
  const question = quiz.questions[Math.min(at, ROUNDS - 1)];
  const picked = picks[at];
  const score = scoreOf(setId, picks);
  const result: Result = { set: setId, picks, name };
  const state = finished ? resultHash(result) : "";

  function start(id: SetId) {
    setSetId(id);
    setPicks([]);
    setAt(0);
    setCompared("idle");
  }

  useEffect(() => {
    // In-page anchors (#card, #chart) also change the hash, so only a real shared result replaces the friend.
    const readFriend = () => {
      const shared = parseResult(window.location.hash);
      if (shared) { setFriend(shared); start(shared.set); }
      return shared;
    };
    if (!readFriend()) start(defaultSet(new Date()));
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  // Stars are saved per set; StarReveal chimes each star, so the big cheer is only for a perfect 10.
  useEffect(() => {
    if (!finished || !moved.current) return;
    levels.record(level, setStars(score));
    if (score === ROUNDS) { confetti(); sfx.win(); }
  }, [finished]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard and screen-reader users land on the next step, never back at the top.
  useEffect(() => {
    if (!moved.current) return;
    if (finished) document.getElementById("card")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    else if (picked === undefined) firstChip.current?.focus({ preventScroll: true });
    else nextButton.current?.focus({ preventScroll: true });
  }, [at, picked, finished]);

  useEffect(() => {
    if (!finished && !friend) return;
    let cancelled = false;
    loadCardFonts("দেশ চেনো ১০-এ ৯").then(() => {
      if (cancelled) return;
      if (finished && preview.current) drawCard(preview.current, { set: setId, picks, name }, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [finished, setId, picks, name, format, site, friend]);

  function pick(option: Pick, chip: Element) {
    moved.current = true;
    if (isRight(question, option)) sfx.good(); else { sfx.wrong(); shake(chip); }
    setPicks(current => current.length === at ? [...current, option] : current);
  }

  function advance() {
    moved.current = true;
    setAt(current => current + 1);
  }

  async function compare() {
    setCompared("sending");
    const tally = await addToTally(TOOL, tallyItems(result));
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const nextSet = quizSets[(quizSets.findIndex(item => item.id === setId) + 1) % quizSets.length];
  const line = humanLine(result);
  const caption = quiz.victory
    ? `বিজয়ের ৫৫ বছর: দেশ চেনো কুইজে আমি ${scoreLine(score)}। লাল-সবুজের দেশটা তুমি কতটা চেনো?`
    : `দেশ চেনো কুইজে আমি ${scoreLine(score)}। নিজের দেশটা তুমি কতটা চেনো?`;
  const right = picked !== undefined && isRight(question, picked);

  return (
    <div className="desh" data-victory={quiz.victory ? "" : undefined}>
      {friend && (
        <section className="desh-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name ? possessive(friend.name) : "বন্ধুর"} দেশ চেনো কার্ড`} />
          <div>
            <p className="desh-kicker">একটা চ্যালেঞ্জ এসেছে</p>
            <h2 id="friend-title">{friend.name || "তোমার বন্ধু"} পেয়েছে <b>{scoreLine(scoreOf(friend.set, friend.picks))}</b>, তুমি?<br /><span>একই ১০টা প্রশ্ন, এবার তোমার পালা</span></h2>
            <a className="kit-primary" href="#chart">আমি খেলি</a>
          </div>
        </section>
      )}

      <div className="desh-wall" id="chart">
        <div className="desh-paper" key={setId}>
          <span className="desh-tape desh-tape-l" aria-hidden="true" />
          <span className="desh-tape desh-tape-r" aria-hidden="true" />
          <div className="desh-meta">
            <span>{quiz.victory ? "বিজয়ের ৫৫ বছর" : quiz.label}</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span className="desh-count" aria-label={finished ? "সব শেষ" : `${bn(at + 1)} নম্বর প্রশ্ন, মোট ${bn(ROUNDS)}টা`}>{finished ? "শেষ" : `${bn(at + 1)}/${bn(ROUNDS)}`}</span>
              <SoundToggle compact />
            </span>
          </div>

          {finished ? (
            <div className="desh-q desh-done">
              <p className="desh-score">{scoreLine(score)}</p>
              <p className="desh-badge">{badge(score)}</p>
              <p className="desh-fact">{line}</p>
              <a className="kit-primary" href="#card">কার্ডটা দেখো</a>
            </div>
          ) : (
            <div className="desh-q" key={`${setId}-${at}`}>
              <div className="desh-ask-row">
                <Doodle name={question.art} className="desh-doodle" />
                <h2 className="desh-ask" id="desh-ask">{question.ask}</h2>
              </div>
              <div className="desh-chips" role="group" aria-labelledby="desh-ask">
                {question.options.map((option, index) => {
                  const status = picked === undefined ? undefined : index === question.right ? "right" : index === picked ? "wrong" : "dim";
                  return <button type="button" key={option} ref={index === 0 ? firstChip : undefined} className="desh-chip" data-tone={index} data-status={status} disabled={picked !== undefined} onClick={event => pick(index as Pick, event.currentTarget)}>
                    <span className="desh-letter" aria-hidden="true">{letters[index]}</span>
                    <span className="desh-option">{option}</span>
                    {status === "right" && <span className="desh-mark" aria-hidden="true"><Star state="right" /></span>}
                    {status === "right" && <span className="desh-sr"> (সঠিক উত্তর)</span>}
                    {status === "wrong" && <span className="desh-sr"> (তোমার উত্তর, হয়নি)</span>}
                  </button>;
                })}
              </div>
              {picked !== undefined && <div className="desh-answer">
                <p className="desh-verdict" data-right={right}>{right ? "একদম ঠিক! একটা তারা পেলে।" : "হয়নি। ঠিক উত্তরে তারাটা লাগিয়ে দিলাম।"}</p>
                <p className="desh-fact">{question.fact} <small>সূত্র: {question.source}</small></p>
              </div>}
            </div>
          )}
          <p className="desh-sr" aria-live="polite">{picked !== undefined && !finished ? `${right ? "ঠিক" : "হয়নি"}। উত্তর: ${question.options[question.right]}। ${question.fact}` : ""}</p>

          {!finished && picked !== undefined && <button type="button" ref={nextButton} className="kit-primary desh-next" onClick={advance}>{at === ROUNDS - 1 ? "স্কোর দেখো" : "পরের প্রশ্ন"}</button>}

          <ol className="desh-stars" aria-label="১০টা প্রশ্নের তারা">
            {quiz.questions.map((item, index) => {
              const done = picks[index] !== undefined;
              const status = done ? (isRight(item, picks[index]) ? "right" : "wrong") : index === at ? "now" : "";
              return <li key={item.id}><Star state={status} /><span className="desh-sr">{bn(index + 1)}: {status === "right" ? "ঠিক" : status === "wrong" ? "ভুল" : status === "now" ? "এখন" : "বাকি"}</span></li>;
            })}
          </ol>
        </div>

        <div className="kit-chips desh-sets" role="group" aria-label="অন্য চার্ট খেলো">
          {quizSets.map(item => <button type="button" key={item.id} aria-pressed={item.id === setId} onClick={() => { moved.current = false; start(item.id); }}>{item.label}</button>)}
        </div>
      </div>

      <details className="desh-levels">
        <summary>সব সেট <span>★ {bn(totalStars(levels.stars))}/{bn(quizSets.length * 3)}</span></summary>
        <p>{quizSets.map((item, index) => `${bn(index + 1)} ${item.short}`).join(" · ")}। ১০টাই ঠিক হলে ৩ তারা, ৭টা বা বেশি ঠিক হলে ২, শেষ করলে ১। সব সেট সব সময় খোলা।</p>
        <LevelGrid count={quizSets.length} stars={levels.stars} unlocked={quizSets.length} current={level} noun="সেট" onPick={pick => { moved.current = false; start(quizSets[pick - 1].id); document.getElementById("chart")?.scrollIntoView(); }} />
      </details>

      <StickyNext show={finished && !resultVisible} title={<><strong>{scoreLine(score)}</strong> · {badge(score)}</>} sub={line} href="#card" label="কার্ডটা দেখো" />

      {finished && (
        <section className="desh-result" id="card" ref={resultBox} aria-labelledby="card-title">
          <div className="desh-result-head">
            <p className="desh-kicker">{badge(score)}</p>
            <h2 id="card-title">তোমার স্কোর <em>{scoreLine(score)}</em></h2>
            <p className="desh-reward"><StarReveal count={setStars(score)} />{nearMissLine(score) && <small>{nearMissLine(score)}</small>}</p>
            <p>{line}{friend && friend.set === setId && <strong> {compareLine(score, friend)}</strong>}</p>
          </div>
          <div className="desh-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
              <figcaption id="card-summary" className="desh-sr">{name || "আমার চার্ট"}: {scoreLine(score)}, {badge(score)}। {line} কার্ডে প্রশ্ন বা উত্তর নেই, শুধু ১০টা তারা।</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="desh-controls">
              <label className="desh-field">
                <span>নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="desh-cheno.png" makeImage={() => cardBlob(result, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint="কার্ডে উত্তর থাকে না। লিংক খুললে বন্ধু একই ১০টা প্রশ্ন পাবে।" />
            </div>
          </div>

          <section className="desh-review" aria-labelledby="review-title">
            <h3 id="review-title">১০টা প্রশ্ন আরেকবার</h3>
            <ol>
              {quiz.questions.map((item, index) => {
                const ok = isRight(item, picks[index]);
                const share = everyone ? rightShare(everyone.counts, item.id) : null;
                return <li key={item.id} data-right={ok}>
                  <p className="desh-review-q"><span className="desh-sr">{ok ? "ঠিক" : "ভুল"}: </span>{item.ask}</p>
                  <p className="desh-review-a"><strong>{item.options[item.right]}</strong>{!ok && <s>{item.options[picks[index]]}</s>}</p>
                  <p>{item.fact} <small>সূত্র: {item.source}</small></p>
                  {share !== null && <p className="desh-review-share">সবার মধ্যে {bn(share)}% ঠিক পেরেছে</p>}
                </li>;
              })}
            </ol>
            <div className="desh-compare">
              {compared === "done" ? <p className="kit-status">যোগ হয়েছে। নাম ছাড়া, শুধু কোন প্রশ্নে ঠিক-ভুল সেটুকু।</p> : <>
                <button type="button" className="kit-secondary" onClick={compare} disabled={compared === "sending"}>{compared === "sending" ? "একটু দাঁড়াও…" : "সবার সাথে মেলাও"}</button>
                <p className="kit-status">{compared === "failed" ? "এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।" : "কোন প্রশ্নে সবাই কতটা পারে, দেখাবে। নাম যায় না।"}</p>
              </>}
            </div>
          </section>

          <div className="desh-again">
            <button type="button" className="kit-primary" onClick={() => { start(nextSet.id); document.getElementById("chart")?.scrollIntoView(); }}>আরেকটা চার্ট: {nextSet.label}</button>
            <button type="button" className="kit-link" onClick={() => { start(setId); document.getElementById("chart")?.scrollIntoView(); }}>এই চার্টটাই আবার খেলো</button>
          </div>
        </section>
      )}

      <aside className="desh-source" aria-label="উত্তরের সূত্র">
        <h2>উত্তরগুলো কোথা থেকে যাচাই করা</h2>
        <p>প্রতিটা উত্তর <a href="https://en.banglapedia.org/" rel="noopener" target="_blank">বাংলাপিডিয়া</a> (এশিয়াটিক সোসাইটি অব বাংলাদেশ), <a href="https://ich.unesco.org/en/state/bangladesh-BD" rel="noopener" target="_blank">ইউনেস্কো</a>, শিক্ষক বাতায়ন আর বাংলা একাডেমির সংশোধিত বর্ষপঞ্জি মিলিয়ে অক্টোবর ২০২৬-এ যাচাই করা। প্রতিটা উত্তরের পাশেই সূত্র লেখা।</p>
        <p className="desh-source-line">যেসব তথ্য নিয়ে মতভেদ আছে (যেমন দেশের সবচেয়ে উঁচু চূড়া বা সবচেয়ে লম্বা নদী), সেগুলো ইচ্ছা করে রাখিনি। কোনো মানুষ বা রাজনীতি নিয়ে প্রশ্ন নেই। ভুল চোখে পড়লে পাতার নিচের বক্সে জানিও।</p>
      </aside>
    </div>
  );
}
