"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { addPick, bn, captionFor, chipLabel, chipOrder, dayLabel, dhakaDate, humanLine, oldestDate, parseShareHash, readPlayed, riddleById, riddleFor, shareHash, shiftDate, tallyItems, triesOf, MAX_NAME_LENGTH, type Pick, type Played, type Shared, type Tries } from "../lib/dhadha";

const TOOL = "dhadha";
const STORE = "dhadha-played";
// Percentages from a handful of people are noise ("১০০% পেরেছে" after one play).
const TALLY_MIN = 20;
const triesText = (tries: Tries) => (tries === 1 ? "প্রথম চেষ্টায় পেরেছে" : tries === 2 ? "দ্বিতীয় চেষ্টায় পেরেছে" : "এবার আটকে গেছে");

function load(): Played {
  try { return readPlayed(JSON.parse(localStorage.getItem(STORE) ?? "null")); } catch { return {}; }
}
function save(played: Played) {
  try { localStorage.setItem(STORE, JSON.stringify(played)); } catch { /* private mode: the riddle still works, it just won't remember */ }
}

function Kupi() {
  return <svg className="dh-kupi" viewBox="0 0 64 104" aria-hidden="true">
    <defs><linearGradient id="dh-tin" x1="0" x2="1"><stop offset="0" stopColor="#463d35" /><stop offset=".35" stopColor="#a39787" /><stop offset=".6" stopColor="#6e6359" /><stop offset="1" stopColor="#382f29" /></linearGradient></defs>
    <g className="dh-flame"><path d="M32 2c9 13 11 26 0 33C21 28 23 15 32 2Z" /><path className="dh-flame-core" d="M32 16c4 7 4 13 0 17-4-4-4-10 0-17Z" /></g>
    <rect x="30.5" y="34" width="3" height="7" fill="#1d1712" />
    <rect x="27" y="40" width="10" height="9" fill="#5a5047" />
    <path d="M14 98 17 66q1-6 7-7l5-10h6l5 10q6 1 7 7l3 32Z" fill="url(#dh-tin)" />
    <rect x="15" y="88" width="34" height="3" fill="#2b241f" />
    <rect x="16.5" y="66" width="31" height="2.5" fill="#2b241f" />
    <rect x="0" y="98" width="64" height="6" rx="3" fill="#6b4329" />
  </svg>;
}

export function KupiNight() {
  const [today, setToday] = useState("");
  const [date, setDate] = useState("");
  const [riddleId, setRiddleId] = useState("");
  const [played, setPlayed] = useState<Played>({});
  const [friend, setFriend] = useState<Shared | null>(null);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const riddle = riddleById(riddleId);
  const record = played[date];
  const picks = useMemo<Pick[]>(() => (record?.id === riddleId ? record.picks : []), [record, riddleId]);
  const tries = triesOf(picks);
  const done = tries !== null;
  const own = useMemo<Shared>(() => ({ date, id: riddleId, tries, name }), [date, riddleId, tries, name]);
  const state = riddle ? shareHash(own).slice(1) : "";

  function open(day: string, id?: string) {
    setDate(day);
    setRiddleId(id ?? riddleFor(day).id);
  }

  useEffect(() => {
    const now = dhakaDate();
    setToday(now);
    setPlayed(load());
    setSite(window.location.host);
    // In-page anchors (#result, #riddle) also change the hash, so only a real riddle link moves the page.
    const readLink = () => {
      const shared = parseShareHash(window.location.hash, dhakaDate());
      if (!shared) return false;
      open(shared.date, shared.id);
      if (shared.tries !== null) setFriend(shared);
      return true;
    };
    if (!readLink()) open(now);
    const onHash = () => { readLink(); };
    window.addEventListener("hashchange", onHash);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    if (!riddle || !today) return;
    let cancelled = false;
    loadCardFonts("নানির শোলক আজকের ধাঁধা").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, own, format, site, today);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [riddle, own, format, site, today]);

  function go(day: string) {
    open(day);
    // A copied address then opens this same day; today's riddle needs no hash at all.
    window.history.replaceState(null, "", day === today ? window.location.pathname : `#d=${day}`);
  }

  function pick(choice: Pick) {
    if (!riddle || done) return;
    const next = addPick(picks, choice);
    const updated = { ...played, [date]: { id: riddleId, picks: next } };
    setPlayed(updated);
    save(updated);
    if (triesOf(next) !== null) addToTally(TOOL, tallyItems(updated)).then(tally => { if (tally) setEveryone(tally); });
  }

  if (!riddle || !today) {
    return <div className="dh-stage" data-state="thinking" aria-busy="true"><p className="dh-wait">নানি ধাঁধাটা মনে করছে…</p></div>;
  }

  const order = chipOrder(riddle);
  const wrongOnce = !done && picks.length === 1;
  const stageState = tries === 1 || tries === 2 ? "solved" : tries === 0 ? "missed" : wrongOnce ? "wrong" : "thinking";
  const nani = tries === 1 ? "ঠিক ধরেছ! এক চেষ্টাতেই।" : tries === 2 ? "হ্যাঁ, এবার ঠিক!" : tries === 0 ? "হলো না। উত্তরটা নানিই বলে দিল।" : wrongOnce ? "উঁহু! আরেকবার ভাবো।" : "বলো তো দেখি, কী?";
  const prev = shiftDate(date, -1);
  const canPrev = prev >= oldestDate(today);
  const canNext = date < today;
  const seen = everyone?.counts[`seen:${riddle.id}`] ?? 0;
  const firstTry = everyone?.counts[`ok:${riddle.id}`] ?? 0;
  const showFriend = friend && friend.tries !== null && friend.date === date && friend.id === riddleId;

  return (
    <div className="dh">
      {showFriend && (
        <section className="dh-friend" aria-labelledby="friend-title">
          <p className="dh-friend-kicker">তোমার জন্য একটা ধাঁধা এসেছে</p>
          <h2 id="friend-title">{friend.name || "তোমার বন্ধু"} {triesText(friend.tries!)}।<br /><span>{done ? `তুমি ${triesText(tries)}!` : "তুমি পারবে?"}</span></h2>
          {!done && <a className="kit-primary" href="#riddle">আমিও খেলি</a>}
        </section>
      )}

      <section className="dh-stage" id="riddle" data-state={stageState} aria-labelledby="riddle-day">
        <div className="dh-days">
          <button type="button" onClick={() => go(prev)} disabled={!canPrev} aria-label="আগের দিনের ধাঁধা"><span aria-hidden="true">‹</span></button>
          <h2 id="riddle-day">{dayLabel(date, today)}</h2>
          <button type="button" onClick={() => go(shiftDate(date, 1))} disabled={!canNext} aria-label="পরের দিনের ধাঁধা"><span aria-hidden="true">›</span></button>
        </div>

        <blockquote className="dh-bubble">
          {riddle.lines.map(line => <p key={line}>{line}</p>)}
        </blockquote>

        <div className="dh-nani">
          <Kupi />
          <p role="status" aria-live="polite"><small>নানি বলছে</small>{nani}</p>
        </div>

        <div className="dh-chips" role="group" aria-label="তোমার উত্তর বেছে নাও">
          {order.map(choice => {
            const tapped = picks.includes(choice);
            const mark = choice === 0 && (tapped || done) ? "right" : tapped ? "wrong" : "idle";
            return <button type="button" key={choice} data-mark={mark} aria-pressed={tapped} disabled={done || tapped} onClick={() => pick(choice)}>
              <span>{chipLabel(riddle, choice)}</span>
              {mark === "right" && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12l5 5L20 6" /></svg>}
              {mark === "wrong" && <span className="dh-sr">, ভুল</span>}
            </button>;
          })}
        </div>

        {done ? (
          <div className="dh-answer">
            <p className="dh-answer-head">উত্তর: <strong>{riddle.answer}</strong></p>
            <p>{riddle.why}</p>
            <p className="dh-tally">{seen >= TALLY_MIN ? <>এই ধাঁধা প্রথম চেষ্টায় পেরেছে <strong>{bn(Math.round((firstTry / seen) * 100))}%</strong> মানুষ ({bn(seen)} জনের মধ্যে)</> : "আরও কয়েকজন খেললে দেখাব কতজন প্রথম চেষ্টায় পেরেছে।"}</p>
            <p className="dh-more">
              {canPrev && <button type="button" className="kit-link" onClick={() => go(prev)}>আগের দিনেরটাও খেলো</button>}
              {date === today ? <span>নতুন ধাঁধা আসবে রাত ১২টায়।</span> : <button type="button" className="kit-link" onClick={() => go(today)}>আজকেরটায় ফেরো</button>}
            </p>
          </div>
        ) : (
          <p className="dh-privacy">উত্তর দিলে শুধু “প্রথম চেষ্টায় পেরেছ কি না” নামহীনভাবে গোনা হয়, যাতে দেখাতে পারি কতজন পারল। নাম বা অন্য কিছু যায় না।</p>
        )}
      </section>

      <StickyNext show={done && !resultVisible} title={<strong>{tries === 1 ? "প্রথম চেষ্টায়!" : tries === 2 ? "দ্বিতীয় চেষ্টায়!" : "এবার হলো না"}</strong>} sub="এবার বন্ধুদের ধরো, ওরা পারে কি না" href="#result" label="ধাঁধাটা পাঠাও" />

      <section className="dh-result" id="result" ref={result} aria-labelledby="result-title">
        <h2 id="result-title">ধাঁধাটা বন্ধুদের দাও</h2>
        <p className="dh-result-lead">ছবিতে শুধু ধাঁধা থাকে, উত্তর থাকে না। বন্ধুরা কমেন্টে উত্তর লিখুক!</p>
        <div className="dh-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="dh-sr">{dayLabel(date, today)}: {riddle.lines.join(" ")} {humanLine(tries)}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="dh-controls">
            {done && (
              <label className="dh-field">
                <span>নাম <small>না দিলেও চলবে, ছবিতে বসবে</small></span>
                <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
            )}
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="ajker-dhadha.png" makeImage={() => cardBlob(own, format, site, today)} imageKey={`${state}|${format}`} caption={captionFor(own, today)} state={state} hint="লিংক খুললে বন্ধু এই ধাঁধাটাই পাবে, উত্তর না দেখে।" />
          </div>
        </div>
      </section>
    </div>
  );
}
