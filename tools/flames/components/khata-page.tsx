"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { drawFlames, flamesBlob } from "../lib/draw-flames";
import { bn, caption, cleanName, humanLine, isBlocked, letters, mixedScripts, outcome, outcomes, parseShareHash, play, samplePair, shareHash, MAX_NAME, type Pair } from "../lib/flames";

const TOOL = "flames";
const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Steps: one per struck pair, one to write the count, one per struck F-L-A-M-E-S letter, one to ring the answer. */
const lastStep = (game: ReturnType<typeof play>) => game.pairs.length + game.struck.length + 2;

export function KhataPage() {
  const [names, setNames] = useState<Pair>(samplePair);
  const [played, setPlayed] = useState<Pair>(samplePair);
  const [step, setStep] = useState(0);
  const [friend, setFriend] = useState<Pair | null>(null);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const firstInput = useRef<HTMLInputElement>(null);
  const card = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const game = play(played);
  const won = outcome(game);
  const line = humanLine(game);
  const pairCount = game.pairs.length;
  const end = lastStep(game);
  const done = step >= end;
  const strikesShown = Math.max(0, Math.min(game.struck.length, step - pairCount - 1));
  const state = shareHash(played).slice(1);
  const a = cleanName(played.a), b = cleanName(played.b);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared game counts.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared); setNames(shared); setPlayed(shared); setStep(0);
    };
    readFriend();
    setSite(window.location.host);
    if (reducedMotion()) setStep(99);
    window.addEventListener("hashchange", readFriend);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  // The pen moves one stroke at a time; pairs are quick, the count and FLAMES strikes get a beat to read.
  useEffect(() => {
    if (done) return;
    const delay = step === 0 ? 700 : step <= pairCount ? 520 : step === pairCount + 1 ? 900 : 650;
    const timer = window.setTimeout(() => setStep(current => current + 1), delay);
    return () => window.clearTimeout(timer);
  }, [step, done, pairCount]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`${a} ${b} ${won.label} ${line} FLAMES খাতার শেষ পাতা`).then(() => {
      if (cancelled || !card.current) return;
      drawFlames(card.current, played, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [played, a, b, won.label, line, format, site]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = { a: cleanName(names.a), b: cleanName(names.b) };
    if ([names.a, names.b].some(name => name.trim() && isBlocked(name))) { setError("এই নামটা খাতায় লেখা যাবে না। অন্য নাম লেখো।"); return; }
    if (!letters(next.a).length || !letters(next.b).length) { setError("দুটো নামই লেখো, তারপর কাটো।"); return; }
    setError("");
    setPlayed(next);
    setTouched(true);
    setStep(reducedMotion() ? 99 : 0);
  }

  function myTurn() {
    setNames({ a: "", b: "" });
    document.getElementById("khata")?.scrollIntoView({ block: "start" });
    firstInput.current?.focus({ preventScroll: true });
  }

  const struckA = new Set(game.pairs.slice(0, step).map(([i]) => i));
  const struckB = new Set(game.pairs.slice(0, step).map(([, j]) => j));
  const lastStruck = strikesShown ? game.struck[strikesShown - 1] : -1;
  const mixed = mixedScripts(names);

  return (
    <div className="flames">
      {friend && (
        <section className="flames-friend" aria-labelledby="friend-title">
          <p className="flames-kicker">বন্ধুর খাতা থেকে</p>
          <h2 id="friend-title">{friend.a} ফ্লেমস খেলেছে: {friend.a} + {friend.b} = <em>{outcome(play(friend)).label}</em></h2>
          <p>এবার তোমার পালা! দুটো নাম লেখো, দেখো কী আসে।</p>
          <button type="button" className="kit-primary" onClick={myTurn}>নিজেরটা খেলো</button>
        </section>
      )}

      <div className="khata" id="khata">
        <span className="khata-stamp" aria-hidden="true">শুধু মজা</span>
        <form className="khata-form" onSubmit={submit} noValidate>
          <div className="khata-fields">
            <label>
              <span>প্রথম নাম</span>
              <input ref={firstInput} value={names.a} maxLength={MAX_NAME} onChange={event => setNames(current => ({ ...current, a: event.target.value }))} onFocus={event => event.currentTarget.select()} placeholder="যেমন: রাফি" autoComplete="off" enterKeyHint="next" />
            </label>
            <span className="khata-plus" aria-hidden="true">+</span>
            <label>
              <span>দ্বিতীয় নাম</span>
              <input value={names.b} maxLength={MAX_NAME} onChange={event => setNames(current => ({ ...current, b: event.target.value }))} onFocus={event => event.currentTarget.select()} placeholder="যেমন: মিম" autoComplete="off" enterKeyHint="go" />
            </label>
          </div>
          <button type="submit" className="kit-primary khata-go">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20l3.5-1L19 7.5 16.5 5 5 16.5zM14.5 7l2.5 2.5" /></svg>
            কাটো!
          </button>
          <p className={error ? "khata-error" : "khata-hint"} role={error ? "alert" : undefined}>
            {error || (mixed ? "একটা বাংলায়, একটা ইংরেজিতে লিখলে কোনো অক্ষর মিলবে না। দুটো একই ভাষায় লেখো।" : `বাংলা বা ইংরেজি, ${bn(MAX_NAME)} অক্ষরের মধ্যে`)}
          </p>
        </form>

        <div className="khata-sheet" aria-hidden="true">
          <p className="khata-name">{game.a.map((unit, index) => <span key={index} className={struckA.has(index) ? "is-struck" : undefined}>{unit}</span>)}</p>
          <span className="khata-and">+</span>
          <p className="khata-name">{game.b.map((unit, index) => <span key={index} className={struckB.has(index) ? "is-struck" : undefined}>{unit}</span>)}</p>
          <p className="khata-left" data-show={step > pairCount}>
            {game.left ? <>বাকি রইল <b>{bn(game.left)}</b>টা অক্ষর</> : "সব অক্ষর কেটে গেল!"}
          </p>
          <ol className="khata-flames">
            {outcomes.map((item, index) => {
              const order = game.struck.indexOf(index);
              const struck = order >= 0 && order < strikesShown;
              return (
                <li key={item.letter} className={struck ? "is-struck" : done && index === game.result ? "is-ringed" : undefined}>
                  <b>{item.letter}</b>
                  <small>{item.label}</small>
                  {struck && <i>{bn(order + 1)}</i>}
                  {done && index === game.result && <svg viewBox="0 0 100 120" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="50" cy="58" rx="44" ry="54" /></svg>}
                </li>
              );
            })}
          </ol>
          <p className="khata-count">
            {done || (step > pairCount && !game.left) ? "" : lastStruck >= 0 ? <>{bn(game.left)} গুনে কাটা গেল <b>{outcomes[lastStruck].letter}</b></> : step > pairCount ? <>এবার {bn(game.left)} গুনে গুনে কাটি…</> : pairCount ? "মিলে যাওয়া অক্ষর কাটছি…" : "কোনো অক্ষর মেলেনি…"}
          </p>
          <p className="khata-answer" data-show={done}>
            <span>{a} + {b} =</span> <strong>{won.label}</strong>
          </p>
        </div>
        <p className="flames-sr" aria-live="polite">{done ? `ফল: ${a} + ${b} = ${won.label}। ${line}` : ""}</p>
        {!done && <button type="button" className="kit-link khata-skip" onClick={() => setStep(99)}>এক্ষুনি ফল দেখাও</button>}
      </div>

      <StickyNext show={touched && done && !resultVisible} title={<><strong>{won.label}</strong></>} sub={`${a} + ${b} · শুধু মজা`} href="#result" label="কার্ডটা নাও" />

      <section className="flames-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="flames-result-head">
          <h2 id="result-title">{a} + {b} = <em>{done ? won.label : "…"}</em></h2>
          <p>{line} <span className="flames-fun">শুধু মজা, সত্যি না!</span></p>
        </div>
        <div className="flames-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={card} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="flames-sr">খাতার পাতায় লেখা {a} আর {b}, মিলে যাওয়া অক্ষর কাটা, বাকি {bn(game.left)}টা অক্ষর। FLAMES থেকে বাকি রইল {won.letter}: {a} + {b} = {won.label}। {line}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="flames-controls">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`flames-${format}.png`} makeImage={() => flamesBlob(played, format, site)} imageKey={`${state}|${format}`} caption={caption(played)} state={state}
              hint="লিংকে দুটো নামই থাকে। বন্ধু খুললে খাতার পাতায় পুরো কাটাকাটি দেখবে, তারপর নিজেরটা খেলবে।" />
          </div>
        </div>
      </section>
    </div>
  );
}
