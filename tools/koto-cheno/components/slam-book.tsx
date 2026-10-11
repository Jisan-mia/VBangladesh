"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { site as content } from "../content";
import { cardBlob, drawCard } from "../lib/draw-card";
import { accusative, askAbout, bn, challengeCard, cleanName, difficultyLine, isComplete, ownerOf, parseShareHash, questions, scoreCard, scoreOf, sentence, shareHash, MAX_NAME_LENGTH, TOTAL, type Pick, type Picks, type Shared } from "../lib/slambook";

const TOOL = "koto-cheno";
const blank = (): (Pick | null)[] => questions.map(() => null);
const firstOpen = (picks: Picks) => Math.max(0, picks.indexOf(null));

function Doodle({ drawing, color }: { drawing: string; color?: string }) {
  return <svg className="kc-doodle" viewBox="0 0 48 48" aria-hidden="true" style={color ? { color } : undefined}><path d={drawing} /></svg>;
}

function Steps({ labels, now }: { labels: readonly string[]; now: number }) {
  return <ol className="kc-steps" aria-label="ধাপ">
    {labels.map((label, index) => <li key={label} data-state={index < now ? "done" : index === now ? "now" : "next"} aria-current={index === now ? "step" : undefined}><b aria-hidden="true">{bn(index + 1)}</b>{label}</li>)}
  </ol>;
}

export function SlamBook() {
  const [answers, setAnswers] = useState(blank);
  const [name, setName] = useState("");
  const [link, setLink] = useState<Shared | null>(null);
  const [guesses, setGuesses] = useState(blank);
  const [guessName, setGuessName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const linkRef = useRef<Shared | null>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const top = useRef<HTMLElement>(null);
  const nameInput = useRef<HTMLInputElement>(null);
  const resultVisible = useInView(result);

  const mode = !link ? "write" : link.guesses ? "result" : "guess";
  const owner = link ? link.name : cleanName(name);
  const answered = answers.filter(pick => pick !== null).length;
  const guessed = guesses.filter(pick => pick !== null).length;
  const score = link ? scoreOf(link.answers, guesses) : 0;
  const writeDone = isComplete(answers);
  const guessDone = isComplete(guesses);

  const card = useMemo(() => {
    if (!link) return challengeCard(answers, name);
    return link.guesses ? scoreCard(link.answers, link.guesses, link.name, link.guessName) : scoreCard(link.answers, guesses, link.name, guessName);
  }, [link, answers, name, guesses, guessName]);

  const state = !link
    ? isComplete(answers) ? shareHash({ answers, name, guesses: null, guessName: "" }).slice(1) : ""
    : !link.guesses && isComplete(guesses) ? shareHash({ ...link, guesses, guessName }).slice(1) : "";

  function open(shared: Shared | null) {
    linkRef.current = shared;
    setLink(shared);
    setGuesses(blank());
    setGuessName("");
  }

  useEffect(() => {
    const read = () => {
      const shared = parseShareHash(window.location.hash);
      if (shared) open(shared);
      // In-page anchors (#q-3, #result) replace the hash; put the friend's link back so a reload still opens their page.
      else if (linkRef.current) history.replaceState(null, "", "#" + shareHash(linkRef.current).slice(1));
    };
    read();
    window.addEventListener("hashchange", read);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("তুমি আমাকে কতটা চেনো?").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, card, mode === "result" ? "feed" : format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, mode]);

  function choose(question: number, option: Pick) {
    if (!link) setAnswers(current => current.map((pick, index) => index === question ? option : pick));
    // A guess is final: once the answer shows, changing it would be cheating.
    else setGuesses(current => current[question] !== null ? current : current.map((pick, index) => index === question ? option : pick));
  }

  function startOwn() {
    const carried = link?.guesses ? link.guessName : cleanName(guessName);
    history.replaceState(null, "", window.location.pathname);
    open(null);
    setAnswers(blank());
    setName(carried);
    top.current?.scrollIntoView({ behavior: "smooth" });
  }

  function guessToo() {
    const challenge: Shared = { ...link!, guesses: null, guessName: "" };
    history.replaceState(null, "", "#" + shareHash(challenge).slice(1));
    open(challenge);
    top.current?.scrollIntoView({ behavior: "smooth" });
  }

  function restart() {
    if (answered > 2 && !window.confirm("সব উত্তর মুছে নতুন করে লিখবে?")) return;
    setAnswers(blank());
    top.current?.scrollIntoView({ behavior: "smooth" });
  }

  const whom = owner ? accusative(owner) : "বন্ধুকে";
  const caption = !link
    ? "আমার স্লাম বুক লেখা শেষ! তুমি আমাকে কতটা চেনো? ৮টা প্রশ্নে আন্দাজ করো:"
    : `${whom} আমি ${bn(TOTAL)}-এ ${bn(score)} চিনি! কোনটা মিলল, দেখো:`;
  const summary = card.kind === "challenge"
    ? `${ownerOf(card.owner)} স্লাম বুক: তুমি আমাকে কতটা চেনো? ${card.line}`
    : `${card.done ? sentence(card.knows) : "আন্দাজ চলছে"}। ${questions.map((question, index) => `${question.mine}: ${card.marks[index] === "right" ? "মিলেছে" : card.marks[index] === "wrong" ? "মেলেনি" : "বাকি"}`).join(", ")}`;
  const canvas = <figure className="kit-card" data-format={mode === "result" ? "feed" : format}>
    <canvas ref={preview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-describedby="card-summary" />
    <figcaption id="card-summary" className="kc-sr">{summary}</figcaption>
    {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
  </figure>;

  return (
    <div className="kc">
      <section className="kc-hero container" aria-labelledby="kc-title" ref={top}>
        {mode === "write" && <>
          <p className="kc-kicker">স্লাম বুক · ৮টা প্রশ্ন · দুই মিনিট</p>
          <h1 id="kc-title">বন্ধুরা তোমাকে <span>কতটা চেনে?</span></h1>
          <p className="kc-lead">{content.lead}</p>
        </>}
        {mode === "guess" && link && <>
          <p className="kc-kicker kc-turn">তোমার পালা! {owner || "এক বন্ধু"} তোমাকে একটা স্লাম বুক পাঠিয়েছে</p>
          <h1 id="kc-title">তুমি <span>{owner ? accusative(owner) : "তোমার বন্ধুকে"}</span> কতটা চেনো?</h1>
          <p className="kc-lead">{owner || "তোমার বন্ধু"} নিজের ৮টা উত্তর লিখে লুকিয়ে রেখেছে। প্রতিটা প্রশ্নে আন্দাজ করো, চাপলেই দেখবে মিলল কি না।</p>
          <p className="kc-tease"><span>{owner || "বন্ধু"} বলছে:</span> “{difficultyLine(link.answers)}”</p>
        </>}
        {mode === "result" && card.kind === "score" && <>
          <p className="kc-kicker kc-turn">স্লাম বুকের ফল এসেছে</p>
          <h1 id="kc-title">{link?.guessName || "এক বন্ধু"} {whom} <span>{card.knows.score}</span> চেনে</h1>
          <p className="kc-lead">{card.line}</p>
        </>}
      </section>

      <section className="container" id="tool" aria-label={mode === "write" ? "নিজের স্লাম বুক লেখো" : mode === "guess" ? "বন্ধুর উত্তর আন্দাজ করো" : "বন্ধুর ফল"}>
        {mode === "result" && link?.guesses ? (
          <div className="kc-received">
            {canvas}
            <div className="kc-received-side">
              <div className="kc-next">
                <button type="button" className="kit-primary" onClick={startOwn}>নিজের স্লাম বুক বানাও</button>
                <button type="button" className="kit-secondary" onClick={guessToo}>আমিও আন্দাজ করি</button>
              </div>
              <details className="kc-details">
                <summary>{link.guessName || "বন্ধু"} কোনটায় কী ভেবেছিল? <small>উত্তরসহ, তাই নিজে খেলতে চাইলে আগে খেলো</small></summary>
                <ol>{questions.map((question, index) => {
                  const guess = link.guesses![index], answer = link.answers[index];
                  return <li key={question.id} data-right={guess === answer}><span>{question.mine}</span><b>{question.options[guess].label}</b><em>{guess === answer ? "মিলেছে" : `উত্তর: ${question.options[answer].label}`}</em></li>;
                })}</ol>
              </details>
            </div>
          </div>
        ) : <>
          <Steps labels={mode === "write" ? ["উত্তর দাও", "লিংক পাঠাও", "বন্ধু আন্দাজ করবে"] : ["আন্দাজ করো", "স্কোর দেখো", "ফল পাঠাও"]} now={(mode === "write" ? writeDone : guessDone) ? 1 : 0} />

          <div className="kc-book" data-mode={mode}>
            <div className="kc-spiral" aria-hidden="true">{Array.from({ length: 14 }, (_, index) => <i key={index} />)}</div>
            <div className="kc-book-head">
              <p className="kc-tape">{mode === "write" ? "আমার স্লাম বুক" : `${ownerOf(owner)} স্লাম বুক`}</p>
              <p className="kc-count" aria-live="polite">{mode === "write" ? <><b>{bn(answered)}</b>/{bn(TOTAL)} লেখা হলো</> : guessed ? <><b>{bn(score)}</b>/{bn(guessed)} মিলেছে</> : <><b>{bn(TOTAL)}</b>টা প্রশ্ন</>}</p>
            </div>
            {mode === "write"
              ? <label className="kc-name"><span>নাম:</span><input ref={nameInput} value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="তোমার নাম (না দিলেও চলবে)" autoComplete="nickname" /></label>
              : <p className="kc-name"><span>নাম:</span><b>{owner || "নাম লেখেনি"}</b></p>}

            <ol className="kc-questions">
              {questions.map((question, index) => {
                const guess = guesses[index];
                const answer = link ? link.answers[index] : null;
                const revealed = Boolean(link) && guess !== null;
                return <li key={question.id} id={`q-${index + 1}`} className="kc-q" data-revealed={revealed} data-right={revealed && guess === answer}>
                  <fieldset>
                    <legend><span className="kc-num" aria-hidden="true">{bn(index + 1)}</span>{link ? askAbout(question, owner) : question.mine}</legend>
                    <div className="kc-options">
                      {question.options.map((option, choice) => {
                        const mark = !revealed ? undefined : choice === answer ? (choice === guess ? "right" : "answer") : choice === guess ? "wrong" : "dim";
                        return <button type="button" key={option.label} className="kc-option" aria-pressed={link ? guess === choice : answers[index] === choice} data-mark={mark} disabled={revealed} onClick={() => choose(index, choice as Pick)}>
                          <Doodle drawing={option.drawing} color={"color" in option ? option.color : undefined} />
                          <span>{option.label}</span>
                          <svg className="kc-loop" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true"><path pathLength={100} d="M18 8C44 0 92 4 96 28c3 22-30 30-54 30C16 58 3 46 4 30 5 16 28 7 56 5" /></svg>
                          {(mark === "right" || mark === "wrong") && <svg className="kc-mark" viewBox="0 0 24 24" aria-hidden="true"><path d={mark === "right" ? "M5 12.5l4.5 4.5L19 7" : "M7 7l10 10M17 7 7 17"} /></svg>}
                        </button>;
                      })}
                    </div>
                    {revealed && answer !== null && <p className="kc-verdict">{guess === answer ? "মিলেছে!" : `মেলেনি। ${owner || "বন্ধু"} বেছেছে “${question.options[answer].label}”।`}</p>}
                  </fieldset>
                </li>;
              })}
            </ol>
          </div>

          <StickyNext
            show={(link ? guessed : answered) > 0 && !resultVisible}
            title={link ? <><strong>{bn(score)}/{bn(guessDone ? TOTAL : guessed)}</strong> মিলেছে</> : writeDone ? <><strong>৮টাই</strong> লেখা শেষ</> : <><strong>{bn(answered)}/{bn(TOTAL)}</strong> লেখা হলো</>}
            sub={link ? (guessDone ? card.line : `আর ${bn(TOTAL - guessed)}টা আন্দাজ বাকি`) : writeDone ? "এবার লিংক পাঠাও, বন্ধুরা আন্দাজ করুক" : "উত্তর লুকানো থাকবে, বন্ধু আন্দাজ করবে"}
            href={(link ? guessDone : writeDone) ? "#result" : `#q-${firstOpen(link ? guesses : answers) + 1}`}
            label={(link ? guessDone : writeDone) ? (link ? "স্কোর কার্ড দেখো" : "লিংক পাঠাও") : "পরের প্রশ্ন"} />

          <section className="kc-result" id="result" ref={result} aria-labelledby="result-title">
            <div className="kc-result-head">
              {link ? <>
                <h2 id="result-title">{guessDone ? <>তুমি {whom} <em>{bn(TOTAL)}-এ {bn(score)}</em> চেনো</> : `আর ${bn(TOTAL - guessed)}টা আন্দাজ বাকি`}</h2>
                <p>{guessDone ? card.line : "সব কয়টায় আন্দাজ করলেই স্কোর কার্ড তৈরি হবে।"}</p>
              </> : <>
                <h2 id="result-title">{writeDone ? "তোমার স্লাম বুক তৈরি!" : `আর ${bn(TOTAL - answered)}টা প্রশ্ন বাকি`}</h2>
                <p>{writeDone ? "কার্ডে শুধু প্রশ্ন, উত্তর লুকানো। লিংক খুলে বন্ধু আন্দাজ করবে, শেষে দেখবে কয়টা মিলল।" : "সব কয়টার উত্তর দিলেই লিংক পাঠাতে পারবে।"}</p>
              </>}
            </div>
            <div className="kc-result-body">
              {canvas}
              <div className="kc-controls">
                {!link && writeDone && !owner && <p className="kc-nudge">নাম দিলে বন্ধু দেখবে “তুমি রাফিকে কতটা চেনো?”, রাফির জায়গায় তোমার নাম। <button type="button" className="kit-link" onClick={() => nameInput.current?.focus()}>নাম লেখো</button></p>}
                {link && <label className="kc-field">
                  <span>তোমার নাম <small>{owner || "বন্ধু"} দেখবে কে আন্দাজ করল</small></span>
                  <input value={guessName} maxLength={MAX_NAME_LENGTH} onChange={event => setGuessName(event.target.value)} placeholder="যেমন: মিম" autoComplete="nickname" />
                </label>}
                <FormatToggle value={format} onChange={setFormat} />
                <ShareBar tool={TOOL} fileName="koto-cheno.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state || undefined} disabled={!state}
                  hint={link ? (guessDone ? `লিংকটা ${whom} পাঠাও, দেখুক তুমি কতটা চেনো।` : `আর ${bn(TOTAL - guessed)}টা আন্দাজ বাকি।`) : writeDone ? "কার্ড বা লিংকে উত্তর দেখা যায় না। বন্ধু আন্দাজ করলে তবেই সেই উত্তর খুলবে।" : `আর ${bn(TOTAL - answered)}টা প্রশ্ন বাকি।`} />
                {link && guessDone && <div className="kc-yours">
                  <h3>এবার তোমার পালা</h3>
                  <p>নিজের ৮টা উত্তর লেখো, বন্ধুদের পাঠাও। দেখো কে তোমাকে সবচেয়ে বেশি চেনে।</p>
                  <button type="button" className="kit-secondary" onClick={startOwn}>নিজের স্লাম বুক বানাও</button>
                </div>}
                {!link && answered > 0 && <button type="button" className="kit-link kc-restart" onClick={restart}>সব মুছে আবার লিখি</button>}
              </div>
            </div>
          </section>
        </>}
      </section>
    </div>
  );
}
