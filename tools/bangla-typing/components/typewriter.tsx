"use client";

import { Fragment, useEffect, useRef, useState, type ChangeEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { bn, caption, check, cleanName, gradeOf, grades, humanLine, opening, parseShareHash, passages, score, shareHash, words, MAX_NAME, TEST_SECONDS, type Shared } from "../lib/typing";

const TOOL = "bangla-typing";
// Percentages from a handful of people are noise.
const COMPARE_MIN = 20;
const KEYS = ["ক", "খ", "গ", "ত", "ম", "ল", "স", "র", "ন"];
// shortcut: refuses only big single inserts (clipboard chips, paste); someone determined can still cheat a self-reported test.
const MAX_INSERT = 30;

type Done = { w: number; a: number; seconds: number };

export function Typewriter() {
  const [p, setP] = useState(0);
  const [typed, setTyped] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [done, setDone] = useState<Done | null>(null);
  const [name, setName] = useState("");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [bell, setBell] = useState(true);
  const [rings, setRings] = useState(0);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const machine = useRef<HTMLDivElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const lineTop = useRef(0);
  const audio = useRef<AudioContext | null>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const passage = passages[p];
  const progress = check(passage, typed);
  const elapsed = startedAt === null ? 0 : Math.min(TEST_SECONDS, (now - startedAt) / 1000);
  const card: Shared | null = done ? { p, w: done.w, a: done.a, n: cleanName(name) } : null;
  const state = card ? shareHash(card).slice(1) : "";

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared result counts as a challenge.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (shared) { setFriend(shared); restart(shared.p); }
    };
    if (!parseShareHash(window.location.hash)) setP(Math.floor(Math.random() * passages.length));
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    if (startedAt === null || done) return;
    const timer = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(timer);
  }, [startedAt, done]);

  useEffect(() => {
    if (startedAt !== null && !done && now - startedAt >= TEST_SECONDS * 1000) finish(typed, TEST_SECONDS);
    // Only the clock decides a time-out; `typed` is read as it stands at that tick.
  }, [now]);

  // The paper rolls up a line when the current word moves to the next line, and the carriage bell rings.
  useEffect(() => {
    const box = paper.current;
    const word = box?.querySelector<HTMLElement>(`[data-i="${progress.current}"]`);
    if (!box || !word || word.offsetTop === lineTop.current) return;
    if (word.offsetTop > lineTop.current && startedAt !== null) ding();
    lineTop.current = word.offsetTop;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    box.scrollTo({ top: Math.max(0, word.offsetTop - parseFloat(getComputedStyle(box).lineHeight)), behavior: reduced ? "auto" : "smooth" });
  }, [progress.current, p]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("টাইপিং সার্টিফিকেট").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  function ding() {
    setRings(count => count + 1);
    if (!bell) return;
    try {
      const context = audio.current ??= new AudioContext();
      void context.resume();
      const at = context.currentTime, tone = context.createOscillator(), gain = context.createGain();
      tone.type = "triangle";
      tone.frequency.value = 2350;
      gain.gain.setValueAtTime(0.12, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.7);
      tone.connect(gain).connect(context.destination);
      tone.start(at);
      tone.stop(at + 0.7);
    } catch { /* no Web Audio here: the bell still swings */ }
  }

  function finish(value: string, seconds: number) {
    const { wpm, accuracy } = score(check(passage, value), seconds);
    setDone({ w: wpm, a: accuracy, seconds: Math.max(1, Math.round(seconds)) });
    setCompared("idle");
    input.current?.blur();
    ding();
  }

  function restart(next: number) {
    setP(next); setTyped(""); setStartedAt(null); setNow(0); setDone(null);
    lineTop.current = 0;
    paper.current?.scrollTo({ top: 0 });
  }

  function onType(event: ChangeEvent<HTMLTextAreaElement>) {
    if (done) return;
    const value = event.target.value;
    if (value.length - typed.length > MAX_INSERT) return;
    const time = Date.now();
    const start = startedAt ?? time;
    if (startedAt === null) { setStartedAt(time); setNow(time); }
    setTyped(value);
    if (check(passage, value).finished) finish(value, (time - start) / 1000);
  }

  function onFocus() {
    // Bring the paper to the top so it stays visible above the phone keyboard.
    if (!done) setTimeout(() => machine.current?.scrollIntoView({ block: "start", behavior: "smooth" }), 300);
  }

  async function compareWithEveryone() {
    if (!card) return;
    setCompared("sending");
    const tally = await addToTally(TOOL, [gradeOf(card.w).id]);
    if (tally) { setEveryone(tally); setCompared("done"); } else setCompared("failed");
  }

  const counts = everyone ? grades.map(grade => everyone.counts[grade.id] ?? 0) : [];
  const total = counts.reduce((sum, count) => sum + count, 0);
  const rival = friend?.n || "বন্ধু";
  const versus = friend && card && friend.p === card.p
    ? card.w > friend.w ? `${rival} লিখেছিল মিনিটে ${bn(friend.w)}টা, তুমি ${bn(card.w)}টা। তুমিই জিতলে!`
      : card.w === friend.w ? `${rival}ও ঠিক ${bn(friend.w)}টা লিখেছিল। টাই!` : `${rival} লিখেছিল মিনিটে ${bn(friend.w)}টা। আরেকবার চেষ্টা করে হারিয়ে দাও!`
    : "";
  const clock = done ? 0 : Math.ceil(TEST_SECONDS - elapsed);

  return (
    <div className="bt">
      {friend && (
        <section className="bt-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.n || "বন্ধুর"} সার্টিফিকেট: মিনিটে ${bn(friend.w)}টা শব্দ, ${bn(friend.a)}% নির্ভুল`} />
          <div>
            <p className="bt-kicker">তোমার জন্য একটা চ্যালেঞ্জ এসেছে</p>
            <h2 id="friend-title">{friend.n || "তোমার বন্ধু"} মিনিটে {bn(friend.w)}টা শব্দ লিখেছে। <span>তুমি কত পারো?</span></h2>
            <p>একই লেখা, নিচে টাইপ শুরু করো।</p>
          </div>
        </section>
      )}

      <div className="bt-machine" ref={machine} data-done={Boolean(done)}>
        <div className="bt-roller" aria-hidden="true"><i /><i /></div>
        <div className="bt-sheet">
          <p className="bt-sr" id="bt-passage-label">এই লেখাটা হুবহু টাইপ করো</p>
          <div className="bt-text" ref={paper} lang="bn" aria-labelledby="bt-passage-label">
            {words(passage).map((word, index) => <Fragment key={index}>{index > 0 && " "}<span data-i={index} data-mark={progress.marks[index]}>{word}</span></Fragment>)}
          </div>
          {done && (
            <div className="bt-done" role="status">
              <p>{done.seconds < TEST_SECONDS ? `পুরোটা শেষ, ${bn(done.seconds)} সেকেন্ডে!` : "ডিং! সময় শেষ।"}</p>
              <strong>মিনিটে {bn(done.w)}টা শব্দ</strong>
              <span>{bn(done.a)}% নির্ভুল</span>
            </div>
          )}
        </div>
        <div className="bt-strip">
          <p className="bt-clock" data-low={startedAt !== null && !done && clock <= 10}><b>{bn(clock)}</b> সেকেন্ড</p>
          <p className="bt-count">ঠিক শব্দ <b>{bn(progress.correctWords)}</b></p>
          <button type="button" className="bt-bell" aria-pressed={bell} onClick={() => setBell(on => !on)} title="লাইনের শেষে ঘণ্টি">
            <svg key={rings} className={rings ? "bt-ring" : undefined} viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a1.6 1.6 0 0 1 1.6 1.6v.5A6 6 0 0 1 18 11v4l2 2.5H4L6 15v-4a6 6 0 0 1 4.4-5.9v-.5A1.6 1.6 0 0 1 12 3Zm-2.2 16h4.4a2.2 2.2 0 0 1-4.4 0Z" />{!bell && <path d="M4 4l16 16" className="bt-bell-off" />}</svg>
            <span className="bt-sr">ঘণ্টির শব্দ</span>
          </button>
        </div>
        <label className="bt-input">
          <span className="bt-sr">ওপরের লেখাটা এখানে টাইপ করো</span>
          <textarea ref={input} value={typed} onChange={onType} onFocus={onFocus} onPaste={event => event.preventDefault()} onDrop={event => event.preventDefault()}
            rows={2} lang="bn" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} readOnly={Boolean(done)}
            placeholder={done ? "" : "এখানে চাপো, টাইপ শুরু করো…"} />
        </label>
        <div className="bt-keys" aria-hidden="true">{KEYS.map((key, index) => <i key={key} data-hit={typed.length > 0 && typed.length % KEYS.length === index}>{key}</i>)}</div>
      </div>

      <div className="bt-actions">
        {done && <a className="kit-primary bt-see" href="#result">সার্টিফিকেট দেখো</a>}
        <button type="button" className="kit-secondary" onClick={() => restart(p)} disabled={startedAt === null}>আবার শুরু করো</button>
        <button type="button" className="kit-secondary" onClick={() => restart((p + 1) % passages.length)}>অন্য লেখা দাও</button>
      </div>
      <p className="bt-hint">প্রথম অক্ষর চাপলেই ঘড়ি চলবে। Avro, Ridmik, Gboard, যেকোনো বাংলা কিবোর্ডে চলবে। দাঁড়ি-কমা না দিলেও চলে।</p>

      <StickyNext show={Boolean(card) && !resultVisible} title={<strong>মিনিটে {card ? bn(card.w) : ""}টা শব্দ</strong>} sub={card ? `${bn(card.a)}% নির্ভুল` : ""} href="#result" label="সার্টিফিকেট দেখো" />

      <section className="bt-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="bt-result-head">
          <h2 id="result-title">{card ? <>মিনিটে <em>{bn(card.w)}টা শব্দ</em>, {bn(card.a)}% নির্ভুল</> : "৬০ সেকেন্ড টাইপ করলেই সার্টিফিকেট"}</h2>
          <p>{card ? versus || humanLine(card.w, card.a) : "ঘড়ি থামলে তোমার নামসহ একটা মজার টাইপিং সার্টিফিকেট তৈরি হবে। তারপর বন্ধুকে একই লেখা টাইপ করতে দাও।"}</p>
        </div>
        {card && (
          <div className="bt-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
              <figcaption id="card-summary" className="bt-sr">টাইপিং সার্টিফিকেট: {card.n && `${card.n}, `}মিনিটে {bn(card.w)}টা শব্দ, {bn(card.a)}% নির্ভুল, সিল: {gradeOf(card.w).stamp}। {humanLine(card.w, card.a)}</figcaption>
              {previewError && <p className="kit-status" role="alert">সার্টিফিকেটের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="bt-controls">
              <label className="bt-name">
                <span>তোমার নাম <small>সার্টিফিকেটে বসবে, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="bangla-typing.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint={`লিংক পেলে বন্ধু একই লেখা (“${opening(card.p)}”) টাইপ করবে।`} />
              <button type="button" className="kit-link bt-again" onClick={() => { restart(p); document.getElementById("tool")?.scrollIntoView({ behavior: "smooth" }); }}>আবার টাইপ করো</button>
              <p className="bt-method"><b>যেভাবে মাপা:</b> শুধু হুবহু ঠিক শব্দগুলো গোনা হয়, তারপর মিনিটের হিসাবে। নির্ভুল মানে শেষ লেখায় কত ভাগ অক্ষর ঠিক। কিবোর্ডভেদে য়, ৎ বা অদৃশ্য চিহ্নের ফারাক ভুল ধরা হয় না। এটা নিজের ফোনে মাপা মজার পরীক্ষা, কোনো চাকরির পরীক্ষা বা আসল সার্টিফিকেট না।</p>
            </div>
          </div>
        )}
        {card && (
          <div className="bt-everyone">
            <h3>সবাই মিনিটে কত লেখে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>শুধু তোমার গতি কোন ঘরে পড়ে, সেটা গোনা হবে। নাম বা লেখা যাবে না।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : total < COMPARE_MIN
              ? <p className="kit-status">যোগ হয়েছে! এখনো মাত্র {bn(total)} জন মিলিয়েছে, তাই হিসাবটা এখনই বলা যাবে না। বন্ধুদের লিংক পাঠাও।</p>
              : <ul className="bt-bars">
                {grades.map((grade, index) => { const value = Math.round(counts[index] / total * 100); return <li key={grade.id} data-mine={gradeOf(card.w).id === grade.id}><span>{grade.stamp} · মিনিটে {grade.label}</span><i style={{ width: `${value}%` }} /><b>{bn(value)}%</b></li>; })}
                <li className="bt-bars-note">{bn(total)} জনের মধ্যে। তোমার ঘরটা গাঢ় করে দেখানো।</li>
              </ul>}
          </div>
        )}
      </section>
    </div>
  );
}
