"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { printFor, printSvg } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import { STEPS, STYLES, answerFor, bn, caption, chainText, dictionaryUrl, humanLine, kinPossessive, parseShareHash, phrase, quizOptions, shareHash, stepLabel, stepProblem, termFor, terms, MAX_NAME_LENGTH, MAX_STEPS, type Shared, type Step, type Style } from "../lib/kin";

const TOOL = "attiyo";
const START: Step[] = ["f", "z", "h"];
// Below this, "সবচেয়ে বেশি খোঁজা" from a handful of people is noise.
const COMPARE_MIN = 20;

export function Album() {
  const [chain, setChain] = useState<Step[]>(START);
  const [style, setStyle] = useState<Style>("c");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [oops, setOops] = useState("");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [guess, setGuess] = useState<string | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const answer = answerFor(chain, style);
  const own = useMemo(() => ({ chain, style, name }), [chain, style, name]);
  const state = chain.length ? shareHash(own).slice(1) : "";
  const options = friend ? quizOptions(friend.chain, friend.style) : null;
  const quizOpen = Boolean(friend && options && !guess);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared chain opens the quiz.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      setGuess(null);
      setStyle(shared.style);
      // Keep the answer off the album until the friend has guessed; an unnamed chain has nothing to guess.
      setChain(quizOptions(shared.chain, shared.style) ? [] : shared.chain);
    };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("কে কী হয়? ফুপা পিসেমশাই").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, own, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [own, format, site]);

  function add(step: Step) {
    const problem = stepProblem(chain, step, style);
    setOops(problem ?? "");
    if (!problem) { setChain([...chain, step]); setCounted(current => current === "done" ? "idle" : current); }
  }

  function edit(next: Step[]) {
    setChain(next);
    setOops("");
    setCounted(current => current === "done" ? "idle" : current);
  }

  function answerQuiz(option: string) {
    if (!friend) return;
    setGuess(option);
    setChain(friend.chain);
  }

  async function countMine() {
    setCounted("sending");
    const tally = await addToTally(TOOL, [answer.key]);
    if (tally) { setEveryone(tally); setCounted("done"); }
    else setCounted("failed");
  }

  const homeOther = STYLES.find(item => item.id !== style)!;
  const homeMine = STYLES.find(item => item.id === style)!;
  const nodes = Array.from({ length: chain.length + 1 }, (_, index) => chain.slice(0, index));
  const friendAnswer = friend ? answerFor(friend.chain, friend.style) : null;
  const friendWho = friend?.name || "তোমার বন্ধু";
  const top = everyone && everyone.total >= COMPARE_MIN
    ? Object.entries(everyone.counts).filter(([key]) => key in terms).sort((a, b) => b[1] - a[1]).slice(0, 3)
    : [];
  const topLabel = (key: string) => phrase(key.split(".") as Step[], style);
  const note = [answer.entry?.note, answer.entry?.book && `বইয়ের ভাষায়: ${answer.entry.book}।`].filter(Boolean).join(" ");

  return (
    <div className="at">
      {friend && friendAnswer && (
        <section className="at-quiz" aria-labelledby="quiz-title">
          <p className="at-kicker">এবার তোমার পালা</p>
          <h2 id="quiz-title">{friendWho} জানতে চায়: <span>{chainText(friend.chain, friend.style)}</span> তোমার কী হয়?</h2>
          {options ? <>
            <div className="at-options" role="group" aria-labelledby="quiz-title">
              {options.map(option => {
                const right = option === termFor(friend.chain, friend.style);
                return <button type="button" key={option} disabled={Boolean(guess)} aria-pressed={guess === option} data-state={guess ? right ? "right" : guess === option ? "wrong" : "dim" : undefined} onClick={() => answerQuiz(option)}>{option.replace(/ \/ /g, " বা ")}</button>;
              })}
            </div>
            <p className="at-verdict" role="status" aria-live="polite">
              {guess && (guess === termFor(friend.chain, friend.style) ? <>ঠিক! <b>{friendAnswer.said}</b>। {friendAnswer.other && friendAnswer.other !== friendAnswer.term ? `${STYLES.find(item => item.id !== friend.style)!.home} ${friendAnswer.other.replace(/ \/ /g, " বা ")}।` : ""}</> : <>উঁহু! উত্তর <b>{friendAnswer.said}</b>। নিচের অ্যালবামে দেখো কেন।</>)}
            </p>
          </> : <p className="at-verdict">{friendAnswer.unnamed
            ? <>এর আলাদা নাম নেই। সবাই বলে <b>“{friendAnswer.said}”</b>। নিচে খুলে দিলাম, এবার নিজের একটা খোঁজো।</>
            : <>{STYLES.find(item => item.id === friend.style)!.home} বলে <b>“{friendAnswer.said}”</b>, {STYLES.find(item => item.id !== friend.style)!.home} <b>{friendAnswer.other?.replace(/ \/ /g, " বা ")}</b>। নিচে খুলে দিলাম।</>}</p>}
        </section>
      )}

      <div className="at-page" id="album">
        <ol className="at-strip" aria-label="সম্পর্কের ধাপগুলো">
          {nodes.map((prefix, index) => (
            <li key={prefix.join(".") || "me"} className="at-print" data-me={index === 0} data-end={index === chain.length && index > 0}>
              <span className="at-photo" dangerouslySetInnerHTML={{ __html: printSvg(printFor(prefix)) }} />
              <span className="at-caption">{index === 0 ? "আমি" : phrase(prefix, style)}</span>
            </li>
          ))}
          {quizOpen && <li className="at-print at-print-ghost" aria-hidden="true"><span className="at-photo" /><span className="at-caption">?</span></li>}
        </ol>

        <div className="at-answer" aria-live="polite">
          {!chain.length ? <>
            <p className="at-chain">শুধু আমি</p>
            <p className={quizOpen ? "at-term at-term-said" : "at-term"}>{quizOpen ? "আগে ওপরে আন্দাজ করো ↑" : "তুমি নিজেই!"}</p>
          </> : <>
            <p className="at-chain">{chainText(chain, style)} =</p>
            {answer.unnamed ? <>
              <p className="at-term at-term-none">আলাদা নাম নেই</p>
              <p className="at-said">বলে: <b>{answer.said}</b></p>
            </> : <p className={answer.term ? "at-term" : "at-term at-term-said"}>{answer.said}</p>}
            {!answer.unnamed && (
              <dl className="at-homes">
                <div data-mine="true"><dt>{homeMine.home}</dt><dd>{answer.term ? answer.term.replace(/ \/ /g, " বা ") : <small>বলে: {answer.said}</small>}</dd></div>
                <div><dt>{homeOther.home}</dt><dd>{answer.other ? answer.other.replace(/ \/ /g, " বা ") : <small>বলে: {answer.saidOther}</small>}</dd></div>
              </dl>
            )}
            {(note || answer.entry) && <p className="at-note">{note} {answer.entry && <a href={dictionaryUrl(answer.entry.head)} target="_blank" rel="noopener noreferrer">অভিধানে দেখো ↗</a>}</p>}
          </>}
        </div>
      </div>

      <div className="at-pad">
        <p className="at-ask" id="at-ask">{!chain.length ? "কার? প্রথম ধাপটা বেছে নাও" : chain.length < MAX_STEPS ? <>{kinPossessive(answer.said)} কে? <small>আরেক ধাপ বেছে নাও</small></> : <>চার ধাপ হয়ে গেছে! <small>একটা মুছে আবার খোঁজো</small></>}</p>
        <div className="at-chips" role="group" aria-labelledby="at-ask">
          {STEPS.map(step => (
            <button type="button" key={step} data-blocked={Boolean(stepProblem(chain, step, style))} onClick={() => add(step)}>
              <i aria-hidden="true">+</i>{stepLabel(step, style)}
            </button>
          ))}
        </div>
        <p className="at-oops" role="status" aria-live="polite">{oops}</p>
        <div className="at-tools">
          <button type="button" className="kit-secondary" onClick={() => edit(chain.slice(0, -1))} disabled={!chain.length}>← একটা মোছো</button>
          <button type="button" className="kit-link" onClick={() => edit([])} disabled={!chain.length}>নতুন করে শুরু</button>
        </div>
      </div>

      <fieldset className="kit-chips at-style">
        <legend>তোমাদের বাসায় ডাকে…</legend>
        {STYLES.map(item => <button type="button" key={item.id} aria-pressed={style === item.id} onClick={() => setStyle(item.id)}>{item.label}</button>)}
      </fieldset>

      <StickyNext show={chain.length > 0 && !resultVisible && !quizOpen} title={<><strong>{answer.unnamed ? "আলাদা নাম নেই" : answer.said}</strong></>} sub={chainText(chain, style)} href="#result" label="কার্ড বানাও" />

      <section className="at-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="at-result-head">
          <h2 id="result-title">{chain.length ? <>অ্যালবামের পাতা: <em>{answer.unnamed ? "আলাদা নাম নেই" : answer.said}</em></> : "অ্যালবামের পাতাটা এখনো ফাঁকা"}</h2>
          <p>{humanLine(chain, style)}</p>
        </div>
        <div className="at-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="at-sr">{chain.length ? caption(chain, style) : "এখনো কোনো ধাপ নেই।"}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="at-controls">
            <label className="at-field">
              <span>তোমার নাম <small>লিংকের প্রিভিউতে বসবে, না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="ke-ki-hoy.png" makeImage={() => cardBlob(own, format, site)} imageKey={`${state}|${format}`} caption={chain.length ? caption(chain, style) : ""} state={state} disabled={!chain.length}
              hint={chain.length ? (answer.unnamed ? "বন্ধু লিংক খুলে এই সম্পর্কের ডাক দেখবে।" : "বন্ধু আগে আন্দাজ করবে, তারপর উত্তর দেখবে।") : "এক ধাপ বানালেই কার্ড হবে।"} />
          </div>
        </div>

        <div className="at-everyone">
          <h3>সবাই কোন সম্পর্কটা বেশি খোঁজে?</h3>
          {top.length > 0 && <ol className="at-top">{top.map(([key, count]) => <li key={key}><b>{topLabel(key)}</b><span>{chainText(key.split(".") as Step[], style)}</span><em>{bn(count)} জন</em></li>)}</ol>}
          {everyone && everyone.total < COMPARE_MIN && <p className="kit-status">এখনো {bn(everyone.total)} জন গুনেছে, তালিকা দেখাতে আরেকটু লাগবে।</p>}
          {terms[answer.key] ? <>
            <p>তোমার এখনকার সম্পর্কটা ({answer.said}) গুনে নিতে পারো। নাম বা ছবি যায় না, শুধু কোন সম্পর্ক সেটা গোনা হয়। পরে অন্যটা গুনলে আগেরটা বদলে যায়।</p>
            <button type="button" className="kit-secondary" onClick={countMine} disabled={counted === "sending" || counted === "done"}>{counted === "sending" ? "গোনা হচ্ছে…" : counted === "done" ? "গোনা হয়েছে!" : "আমারটাও গুনে নাও"}</button>
            {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : <p className="kit-status">নামওয়ালা সম্পর্কই গোনা হয়। এটার আলাদা নাম নেই।</p>}
        </div>
      </section>
    </div>
  );
}
