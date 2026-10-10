"use client";

import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { dialAngle, drawTicketCard, ticketBlob, DIAL_MAX, DIAL_MIN } from "../lib/draw-ticket";
import { bn, buckets, bucketOf, caption, cleanName, comment, heartAge, parseShareHash, possessive, questions, runningAge, shareHash, ticketNumber, MAX_NAME, QUESTION_COUNT, type Answer, type Reading } from "../lib/moner-boyos";

const TOOL = "moner-boyos";
// A "most common" line from a handful of people is noise.
const TALLY_MIN = 100;
const ticks = Array.from({ length: (DIAL_MAX - DIAL_MIN) / 2 + 1 }, (_, index) => DIAL_MIN + index * 2);
// Rounded: server and browser trig can differ in the last digits, which breaks hydration.
const round = (value: number) => Math.round(value * 100) / 100;
const point = (degrees: number, radius: number) => [round(100 + Math.cos((degrees * Math.PI) / 180) * radius), round(100 + Math.sin((degrees * Math.PI) / 180) * radius)] as const;

function Dial({ age, done }: { age: number | null; done: boolean }) {
  return <svg className="mb-dial" viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="97" className="mb-dial-rim" />
    <circle cx="100" cy="100" r="88" className="mb-dial-face" />
    {ticks.map(value => {
      const major = value % 10 === 0, angle = dialAngle(value);
      const [x1, y1] = point(angle, major ? 70 : 77), [x2, y2] = point(angle, 83), [tx, ty] = point(angle, 56);
      return <g key={value}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} className={major ? "mb-tick-major" : "mb-tick"} />
        {major && <text x={tx} y={ty} className="mb-tick-label">{bn(value)}</text>}
      </g>;
    })}
    <text x="100" y="142" className="mb-dial-caption">মনের বয়স</text>
    <g className="mb-needle" data-idle={age === null} style={{ transform: `rotate(${age === null ? 128 : dialAngle(age)}deg)` }}>
      <line x1="86" y1="100" x2="166" y2="100" />
    </g>
    <circle cx="100" cy="100" r="8" className="mb-hub" />
    <text x="100" y="78" className={done ? "mb-dial-value mb-dial-value-done" : "mb-dial-value"} key={done ? age : "q"}>{done && age !== null ? bn(age) : "?"}</text>
  </svg>;
}

export function WeighingMachine() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Reading | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const card = useRef<HTMLCanvasElement>(null);
  const friendCard = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const done = answers.length === QUESTION_COUNT;
  const reading: Reading = { answers, name };
  const age = done ? heartAge(answers) : null;
  const bucket = age === null ? null : bucketOf(age);
  const state = done ? shareHash(reading).slice(1) : "";
  const shownName = cleanName(name);
  const blocked = name.trim() !== "" && !shownName;
  const friendWho = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";
  const friendAge = friend ? heartAge(friend.answers) : 0;

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared ticket counts.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`মনের মাপের টিকিট ${shownName} মন্তব্য`).then(() => {
      if (cancelled) return;
      if (done && card.current) drawTicketCard(card.current, { answers, name: shownName, friend }, format, site);
      if (friend && friendCard.current) drawTicketCard(friendCard.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [answers, done, shownName, format, site, friend]);

  function pick(answer: Answer) {
    if (done) return;
    setAnswers(current => current.length < QUESTION_COUNT ? [...current, answer] : current);
  }

  function restart() {
    setAnswers([]);
    setCounted("idle");
    document.getElementById("machine")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function count() {
    if (!bucket) return;
    setCounted("sending");
    const tally = await addToTally(TOOL, [bucket.id]);
    if (tally) { setEveryone(tally); setCounted("done"); }
    else setCounted("failed");
  }

  const question = done ? null : questions[answers.length];
  const top = everyone && everyone.total >= TALLY_MIN ? buckets.reduce((best, item) => (everyone.counts[item.id] ?? 0) > (everyone.counts[best.id] ?? 0) ? item : best) : null;

  return (
    <div className="mb">
      {friend && (
        <section className="mb-friend" aria-labelledby="friend-title">
          <canvas ref={friendCard} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendWho} মনের বয়স ${bn(friendAge)}। মন্তব্য: ${comment(friend.answers)}`} />
          <div>
            <p className="mb-kicker">মেলা থেকে একটা টিকিট এসেছে</p>
            <h2 id="friend-title">{friendWho} মন <em>{bn(friendAge)}</em>,<br /><span>তোমার?</span></h2>
            <a className="kit-primary" href="#machine">আমারটা মাপি</a>
          </div>
        </section>
      )}

      <div className="mb-stage" id="machine">
        <div className="mb-bunting" aria-hidden="true" />
        <div className="mb-machine">
          <ol className="mb-bulbs" aria-hidden="true">
            {questions.map((_, index) => <li key={index} data-on={index < answers.length} />)}
          </ol>
          <Dial age={done ? age : runningAge(answers)} done={done} />

          {question ? (
            <fieldset className="mb-question" key={answers.length}>
              <legend><span className="mb-count">{bn(answers.length + 1)}/{bn(QUESTION_COUNT)}</span>{question.ask}</legend>
              <div className="mb-choices">
                {question.options.map((option, index) => <button type="button" className="mb-choice" key={option.label} onClick={() => pick(index as Answer)}>{option.label}</button>)}
              </div>
              {answers.length > 0 && <button type="button" className="kit-link mb-back" onClick={() => setAnswers(current => current.slice(0, -1))}>আগেরটায় ফেরো</button>}
            </fieldset>
          ) : (
            <p className="mb-printed" role="status">মাপা শেষ! এই নাও টিকিট।</p>
          )}
          <div className="mb-slot" aria-hidden="true" />
        </div>

        {done && age !== null && bucket && (
          <div className="mb-ticket-wrap">
            <article className="mb-ticket" aria-labelledby="ticket-title">
              <p className="mb-ticket-head"><span>মনের মাপের টিকিট</span><span>নং {ticketNumber(answers)}</span></p>
              <h2 id="ticket-title"><small>মনের বয়স</small><span><b>{bn(age)}</b> বছর</span></h2>
              <p className="mb-stamp" aria-hidden="true">{bucket.label}</p>
              <p className="mb-ticket-comment"><span>মন্তব্য:</span> {comment(answers)}</p>
            </article>
            <button type="button" className="kit-link mb-again" onClick={restart}>আবার মাপো</button>
          </div>
        )}
      </div>

      <StickyNext show={done && !resultVisible} title={<>মনের বয়স <strong>{age === null ? "" : bn(age)}</strong></>} sub={bucket?.kind} href="#result" label="টিকিটের ছবি নাও" />

      {done && age !== null && bucket && (
        <section className="mb-result" id="result" ref={result} aria-labelledby="result-title">
          <div className="mb-result-head">
            <h2 id="result-title">{shownName ? `${possessive(shownName)} মনের` : "তোমার মনের"} বয়স <em>{bn(age)}</em>{friend ? <span>, {friendWho} {bn(friendAge)}</span> : null}</h2>
            <p><strong>{bucket.label}:</strong> {bucket.kind}</p>
          </div>

          <div className="mb-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={card} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
              <figcaption id="card-summary" className="mb-sr">মনের মাপের টিকিট। {shownName ? `নাম: ${shownName}। ` : ""}মনের বয়স {bn(age)} বছর, {bucket.label}। মন্তব্য: {comment(answers)}।</figcaption>
              {previewError && <p className="kit-status" role="alert">টিকিটের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>

            <div className="mb-controls">
              <label className="mb-field">
                <span>টিকিটে তোমার নাম <small>না দিলেও চলবে, {bn(MAX_NAME)} অক্ষরের মধ্যে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="given-name" aria-invalid={blocked || undefined} aria-describedby="name-note" />
                <small id="name-note" className={blocked ? "mb-warn" : "mb-sr"} role={blocked ? "alert" : undefined}>{blocked ? "এই নামটা টিকিটে লেখা যাবে না। অন্য নাম লেখো।" : ""}</small>
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`moner-boyos-${format}.png`} makeImage={() => ticketBlob({ answers, name: shownName, friend }, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption(reading)} state={state}
                hint="লিংক পেলে বন্ধু তোমার টিকিট দেখবে, তারপর নিজের মন মাপবে।" />
              <div className="mb-everyone">
                {top && <p>সবচেয়ে বেশি মানুষের মন: <strong>{top.label}</strong> <small>({bn(everyone!.total)} জনের গোনা, জরিপ না)</small></p>}
                {counted === "done"
                  ? <p className="kit-status">গুনে নেওয়া হলো, ধন্যবাদ!</p>
                  : <button type="button" className="kit-link" onClick={count} disabled={counted === "sending"}>{counted === "sending" ? "গোনা হচ্ছে…" : "আমার টিকিটটাও গুনে নাও"}</button>}
                {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
                {counted !== "done" && <p className="mb-note">শুধু মনের বয়সের দলটা (যেমন ‘{bucket.label}’) গোনা হয়। নাম বা উত্তর না।</p>}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
