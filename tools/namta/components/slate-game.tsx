"use client";

import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, type Tally } from "../../../shared/share-client";
import { confetti, sfx, shake } from "../../../shared/game-sound";
import { totalStars, useLevels } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  bn, caption, cleanName, digitOf, encodeOrder, humanLine, outOf, parseShareHash, parseStart, proudLine, randomOrder, scoreOf, shareHash,
  nearMissLine, starWord, tableName, tableStars, typeDigit, versusLine, whos, DEFAULT_ORDER, DEFAULT_TABLE, LEVEL_COUNT, MAX_NAME, TABLES, type Shared, type WhoId,
} from "../lib/namta";

const TOOL = "namta";
// Percentages from a handful of people are noise.
const COMPARE_MIN = 20;
const PRAISE = ["ঠিক!", "শাবাশ!", "একদম ঠিক!", "ঠিক ধরেছ!"];
// A right answer stays on the slate just long enough to feel good, then the cloth wipes it.
const RIGHT_PAUSE = 700;
const KEYS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

type Feedback = { right: boolean; m: number; answer: number };

export function SlateGame() {
  const [t, setT] = useState(DEFAULT_TABLE);
  const [q, setQ] = useState(DEFAULT_ORDER);
  const [a, setA] = useState<number[]>([]);
  const [typed, setTyped] = useState("");
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [timerOn, setTimerOn] = useState(false);
  const [now, setNow] = useState(0);
  const [name, setName] = useState("");
  const [who, setWho] = useState<WhoId>("bachcha");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const strip = useRef<HTMLDivElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const shownAt = useRef(0);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const levels = useLevels(TOOL, LEVEL_COUNT);

  const pending = feedback !== null;
  const index = pending ? a.length - 1 : a.length;
  const done = !pending && a.length === q.length;
  const m = q[Math.min(index, q.length - 1)];
  const card: Shared | null = done ? { t, q, a, n: cleanName(name), w: who, s: timerOn ? seconds : 0 } : null;
  const state = card ? shareHash(card).slice(1) : "";
  const score = card ? scoreOf(card) : 0;
  const sameSet = Boolean(friend && card && friend.t === t && encodeOrder(friend.q) === encodeOrder(q));
  const rival = friend?.n || "বন্ধু";

  function start(table: number, order: number[]) {
    setT(table); setQ(order); setA([]); setTyped(""); setFeedback(null); setStartedAt(null); setSeconds(0); setCompared("idle");
  }

  useEffect(() => {
    // In-page anchors (#result) also change the hash: only a real challenge or a "#t=7" start link does anything.
    const readHash = (scroll: boolean) => {
      const shared = parseShareHash(window.location.hash);
      if (shared) { setFriend(shared); start(shared.t, shared.q); return; }
      const table = parseStart(window.location.hash);
      if (table === null) return;
      start(table, randomOrder());
      if (scroll) document.getElementById("tool")?.scrollIntoView({ block: "start" });
    };
    readHash(false);
    const onHash = () => readHash(true);
    window.addEventListener("hashchange", onHash);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Keep the chosen table's chip in view inside its strip (never scrolls the page).
  useEffect(() => {
    const box = strip.current, chip = box?.querySelector<HTMLElement>("[aria-pressed=true]");
    if (box && chip) box.scrollLeft = chip.offsetLeft - box.clientWidth / 2 + chip.offsetWidth / 2;
  }, [t]);

  useEffect(() => {
    if (!feedback?.right) return;
    const timer = setTimeout(next, RIGHT_PAUSE);
    return () => clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    if (!timerOn || startedAt === null || done) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [timerOn, startedAt, done]);

  useEffect(() => {
    if (!card && !friend) return;
    let cancelled = false;
    loadCardFonts("নামতা চ্যালেঞ্জ ১০-এ ১০").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  function next() {
    setFeedback(null);
  }

  function press(digit: number) {
    if (done) return;
    if (feedback && !feedback.right) return;
    if (feedback) next();
    if (startedAt === null) setStartedAt(Date.now());
    setTyped(current => typeDigit(feedback ? "" : current, digit));
  }

  function erase() {
    if (!pending) setTyped(current => current.slice(0, -1));
  }

  function submit() {
    if (done) return;
    // A quick double tap on "ঠিক আছে" must not skip the right answer before a child can read it.
    if (pending) { if (Date.now() - shownAt.current > 400) next(); return; }
    if (!typed) return;
    const answer = Number(typed);
    const answers = [...a, answer];
    setA(answers);
    setTyped("");
    const right = answer === t * m;
    setFeedback({ right, m, answer });
    // Chime on the slate; a full table (all ten right) earns the big one.
    if (!right) { sfx.wrong(); shake(board.current); }
    else if (answers.length === q.length && answers.every((value, at) => value === t * q[at])) { sfx.good(); setTimeout(() => { sfx.win(); confetti(); }, 300); }
    else sfx.good();
    shownAt.current = Date.now();
    if (answers.length === q.length) {
      setSeconds(Math.max(1, Math.round((Date.now() - (startedAt ?? Date.now())) / 1000)));
      levels.record(t, tableStars(scoreOf({ t, q, a: answers })));
    }
  }

  // A real keyboard works too: digits (0-9 or ০-৯), Backspace, Enter. Typing a name is left alone.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if ((event.target as HTMLElement).closest?.("input, textarea, select, [contenteditable]")) return;
      const digit = digitOf(event.key);
      if (digit !== null) { press(digit); event.preventDefault(); }
      else if (event.key === "Backspace") { erase(); event.preventDefault(); }
      else if (event.key === "Enter" && !(event.target as HTMLElement).closest?.("button, a")) { submit(); event.preventDefault(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, [`t${t}`]);
    if (tally) { setEveryone(tally); setCompared("done"); } else setCompared("failed");
  }

  function again(table: number) {
    start(table, randomOrder());
    document.getElementById("tool")?.scrollIntoView({ block: "start" });
  }

  const elapsed = startedAt === null ? 0 : Math.max(0, Math.floor(((done ? startedAt + seconds * 1000 : now) - startedAt) / 1000));
  const said = feedback ? feedback.right ? `${PRAISE[index % PRAISE.length]} ${bn(t)} গুণ ${bn(feedback.m)} সমান ${bn(t * feedback.m)}।` : `এটা হবে ${bn(t * feedback.m)}।` : done ? `শেষ! ${outOf(score)}।` : `${bn(t)} গুণ ${bn(m)} সমান কত?`;
  const ranked = everyone ? TABLES.map(table => ({ table, count: everyone.counts[`t${table}`] ?? 0 })).sort((x, y) => y.count - x.count).slice(0, 5) : [];
  const total = everyone ? TABLES.reduce((sum, table) => sum + (everyone.counts[`t${table}`] ?? 0), 0) : 0;

  return (
    <div className="nm">
      {friend && (
        <section className="nm-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.n || "বন্ধুর"} স্লেট: ${tableName(friend.t)}, ${outOf(scoreOf(friend))}`} />
          <div>
            <p className="nm-kicker">তোমার জন্য একটা নামতা চ্যালেঞ্জ এসেছে</p>
            <h2 id="friend-title">{friend.n || "তোমার বন্ধু"} {tableName(friend.t)}য় পেয়েছে {outOf(scoreOf(friend))}। <span>এবার তোমার পালা!</span></h2>
            <p>একই ১০টা অঙ্ক, একই ক্রমে। নিচে শুরু করো।</p>
          </div>
        </section>
      )}

      <p className="nm-label" id="table-label">কোন নামতা খেলবে?</p>
      <div className="nm-strip" ref={strip} role="group" aria-labelledby="table-label">
        {TABLES.map(table => <button type="button" key={table} aria-pressed={table === t} aria-label={tableName(table)} onClick={() => start(table, randomOrder())}>{bn(table)}</button>)}
      </div>

      <div className="nm-frame">
        <div className="nm-board" ref={board} data-state={done ? "done" : feedback ? (feedback.right ? "right" : "wrong") : "ask"}>
          <div className="nm-board-top">
            <ol className="nm-beads" aria-label={`${bn(q.length)}টার মধ্যে ${bn(a.length)}টা হয়েছে`}>
              {q.map((sum, at) => <li key={at} data-mark={at < a.length ? (a[at] === t * sum ? "ok" : "fix") : at === index && !done ? "now" : "todo"} />)}
            </ol>
            <span className="nm-tools">
            <SoundToggle compact />
            <button type="button" className="nm-timer" aria-pressed={timerOn} aria-label={timerOn ? `ঘড়ি চালু, ${bn(elapsed)} সেকেন্ড` : "ঘড়ি বন্ধ"} onClick={() => setTimerOn(on => !on)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="13.5" r="7.5" /><path d="M12 9.5v4l2.5 2M9.5 3h5" />{!timerOn && <path d="M4 4l16 16" />}</svg>
              <span className="nm-timer-text">{timerOn ? `${bn(elapsed)} সে.` : "ঘড়ি বন্ধ"}</span>
            </button>
            </span>
          </div>
          <p className="nm-sr" aria-live="polite">{said}</p>
          {done ? (
            <div className="nm-finish" aria-hidden="true">
              <svg className="nm-star" viewBox="0 0 100 100"><defs><radialGradient id="nm-gold" cx="35%" cy="30%"><stop offset="0" stopColor="#fff1b8" /><stop offset=".45" stopColor="#f5c23b" /><stop offset="1" stopColor="#c98b12" /></radialGradient></defs><path d="M50 4l13.2 30.8 33.3 2.6-25.3 21.8 7.8 32.6L50 74.3 21 91.8l7.8-32.6L3.5 37.4l33.3-2.6Z" /><text x="50" y="62" textAnchor="middle">{starWord(score)}</text></svg>
              <div><p>শেষ! {tableName(t)}</p><strong>{outOf(score)}</strong></div>
            </div>
          ) : (
            <>
              <p className="nm-sum" aria-hidden="true" key={index}>
                <span>{bn(t)} × {bn(m)} =</span>{" "}
                <b data-empty={!feedback && !typed}>{feedback ? bn(t * feedback.m) : typed ? bn(Number(typed)) : "?"}</b>
              </p>
              <p className="nm-feedback" aria-hidden="true">
                {feedback ? (feedback.right ? PRAISE[index % PRAISE.length] : <>এটা হবে <b>{bn(t * feedback.m)}</b>। মনে রাখি!</>) : index === 0 && !typed ? "নিচের বোতামে উত্তর লেখো" : `${bn(index + 1)} নম্বর অঙ্ক`}
              </p>
              {index > 0 && !feedback && <i className="nm-wipe" key={`wipe-${index}`} aria-hidden="true" />}
            </>
          )}
        </div>
      </div>

      {done ? (<>
        <p className="nm-reward"><StarReveal count={tableStars(score)} />{nearMissLine(score) && <small>{nearMissLine(score)}</small>}</p>
        <div className="nm-after">
          <a className="kit-primary nm-see" href="#result">স্লেটের ছবি দেখো</a>
          <button type="button" className="kit-secondary" onClick={() => again(t)}>আবার খেলো</button>
          {t < TABLES.at(-1)! && <button type="button" className="kit-secondary" onClick={() => again(t + 1)}>{tableName(t + 1)} খেলো</button>}
        </div>
      </>) : (
        <div className="nm-pad" role="group" aria-label="উত্তর লেখার বোতাম">
          {KEYS.map(key => <button type="button" key={key} onClick={() => press(key)} disabled={feedback?.right === false}>{bn(key)}</button>)}
          <button type="button" className="nm-erase" onClick={erase} disabled={pending || !typed} aria-label="একটা অঙ্ক মুছো">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5h11v14H9l-6-7Z" /><path d="m12.5 9.5 5 5m0-5-5 5" /></svg>মুছো
          </button>
          <button type="button" onClick={() => press(0)} disabled={feedback?.right === false}>{bn(0)}</button>
          <button type="button" className="nm-ok" onClick={submit} disabled={!pending && !typed} data-nudge={feedback?.right === false}>{pending ? "পরেরটা" : "ঠিক আছে"}</button>
        </div>
      )}

      <details className="nm-levels">
        <summary>সব নামতা <span>★ {bn(totalStars(levels.stars))}/{bn(TABLES.length * 3)}</span></summary>
        <p>২ থেকে ২০, প্রতিটা নামতা একটা ঘর। ১০টাই ঠিক হলে ৩ তারা, ৭টা বা বেশি ঠিক হলে ২, শেষ করলে ১। সব নামতা সব সময় খোলা।</p>
        <LevelGrid count={LEVEL_COUNT} stars={levels.stars} unlocked={LEVEL_COUNT} current={t} noun="নামতা" onPick={pick => { if (pick >= TABLES[0]) again(pick); }} />
      </details>

      <StickyNext show={done && !resultVisible} title={<strong>{outOf(score)}</strong>} sub={card ? proudLine(score, who) : ""} href="#result" label="স্লেটের ছবি দেখো" />

      <section className="nm-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="nm-result-head">
          <h2 id="result-title">{card ? <>{tableName(t)}য় <em>{outOf(score)}</em></> : "১০টা অঙ্ক শেষ হলেই স্লেটের ছবি"}</h2>
          <p>{card ? (sameSet && friend ? versusLine(score, scoreOf(friend), rival) : humanLine(score, t)) : "শেষ হলে পুরো নামতাটা চকে লেখা একটা স্লেট পাবে, ঠিকগুলোয় টিক দেওয়া। নাম দিলে ওপরে বসবে, না দিলেও চলবে।"}</p>
        </div>
        {card && (
          <div className="nm-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
              <figcaption id="card-summary" className="nm-sr">{card.n && `${card.n}, `}{tableName(t)}, {outOf(score)}। {proudLine(score, who)} {humanLine(score, t)}</figcaption>
              {previewError && <p className="kit-status" role="alert">স্লেটের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="nm-controls">
              <label className="nm-name">
                <span>নাম <small>ডাকনাম দাও, না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="off" />
              </label>
              <fieldset className="kit-chips">
                <legend>কে খেলল?</legend>
                {whos.map(item => <button type="button" key={item.id} aria-pressed={who === item.id} onClick={() => setWho(item.id)}>{item.chip}</button>)}
              </fieldset>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="namta.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption(card)} state={state} hint="ভাইবোন বা বন্ধুরাও একই ১০টা অঙ্ক একই ক্রমে খেলতে পারবে।" />
              <button type="button" className="kit-link nm-again" onClick={() => again(t)}>আরেকবার খেলো</button>
            </div>
          </div>
        )}
        {card && (
          <div className="nm-everyone">
            <h3>সবাই কোন নামতা বেশি খেলছে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>চাইলে তোমার খেলাটাও যোগ করো। শুধু কোন নামতা খেলেছ ({tableName(t)}) সেটা গোনা হবে। নাম বা উত্তর যাবে না।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "যোগ হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : total < COMPARE_MIN
              ? <p className="kit-status">যোগ হয়েছে! এখনো মাত্র {bn(total)} জন মিলিয়েছে, তাই হিসাবটা এখনই বলা যাবে না। ভাইবোন আর বন্ধুদের লিংক পাঠাও।</p>
              : <ul className="nm-bars">
                {ranked.map(({ table, count }) => { const value = Math.round(count / total * 100); return <li key={table} data-mine={table === t}><span>{tableName(table)}</span><i style={{ width: `${value}%` }} /><b>{bn(value)}%</b></li>; })}
                <li className="nm-bars-note">{bn(total)} জনের খেলা থেকে, সবচেয়ে বেশি খেলা ৫টা ঘর।</li>
              </ul>}
          </div>
        )}
      </section>
    </div>
  );
}
