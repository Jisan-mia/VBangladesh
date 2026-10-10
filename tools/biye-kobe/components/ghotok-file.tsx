"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawReport } from "../lib/draw-report";
import { bn, caption, createReport, parseShareHash, possessive, questions, shareHash, timings, MAX_NAME_LENGTH, QUESTION_COUNT, type Answer, type Shared } from "../lib/report";

const TOOL = "biye-kobe";
// Long enough to see the tick land, short enough that six answers feel quick.
const ADVANCE_MS = 650;
// Below this, "most common" from a handful of reports is noise.
const TALLY_MIN = 30;
const blank = () => Array<Answer | null>(QUESTION_COUNT).fill(null);
const firstOpen = (list: readonly (Answer | null)[], from = 0) => {
  for (let step = 0; step < list.length; step++) { const index = (from + step) % list.length; if (list[index] === null) return index; }
  return QUESTION_COUNT;
};

/** The ghotok's folded umbrella, leaning on the file. */
function Umbrella() {
  return <svg className="bk-umbrella" viewBox="0 0 40 160" aria-hidden="true"><path d="M20 30v-14a9 9 0 0 0-18 0" fill="none" stroke="#6b3f1f" strokeWidth="5" strokeLinecap="round" /><path d="M13 30q-5 60 5 112h4q10-52 5-112Z" fill="#1f1b1a" /><path d="M19 142h2v16h-2Z" fill="#c9c2b8" /></svg>;
}

export function GhotokFile() {
  const [answers, setAnswers] = useState<(Answer | null)[]>(blank);
  const [index, setIndex] = useState(0);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const file = useRef<HTMLDivElement>(null);
  const resultVisible = useInView(result);
  const fileVisible = useInView(file, 0.4);

  const report = useMemo(() => createReport(answers, name), [answers, name]);
  const friendReport = useMemo(() => friend && createReport(friend.answers, friend.name), [friend]);
  const state = report.complete ? shareHash({ answers: answers as Answer[], name }).slice(1) : "";

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared report counts as a friend's.
    const readFriend = () => { const link = parseShareHash(window.location.hash); if (link) setFriend(link); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => { window.removeEventListener("hashchange", readFriend); if (timer.current) clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("ঘটকের রিপোর্ট").then(() => {
      if (cancelled) return;
      if (preview.current) drawReport(preview.current, report, format, site);
      if (friendReport && friendPreview.current) drawReport(friendPreview.current, friendReport, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [report, format, site, friendReport]);

  function stopTimer() { if (timer.current) { clearTimeout(timer.current); timer.current = null; } }

  function pick(answer: Answer) {
    if (index >= QUESTION_COUNT) return;
    stopTimer();
    const next = answers.map((value, position) => position === index ? answer : value);
    setAnswers(next);
    setCounted(current => current === "done" ? "idle" : current);
    const target = firstOpen(next, index + 1);
    timer.current = setTimeout(() => setIndex(target), ADVANCE_MS);
  }

  function go(target: number) {
    stopTimer();
    setIndex(Math.max(0, Math.min(QUESTION_COUNT, target)));
  }

  function restart() {
    stopTimer();
    setAnswers(blank());
    setIndex(0);
    setCounted("idle");
    file.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function compare() {
    if (!report.timing) return;
    setCounted("sending");
    const tally = await addToTally(TOOL, [report.timing.id]);
    if (tally) { setEveryone(tally); setCounted("done"); } else setCounted("failed");
  }

  const question = index < QUESTION_COUNT ? questions[index] : null;
  const chosen = question ? answers[index] : null;
  const friendWho = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";
  const top = everyone ? timings.map(timing => ({ timing, count: everyone.counts[timing.id] ?? 0 })).sort((a, b) => b.count - a.count)[0] : null;
  const mine = everyone && report.timing ? Math.round(((everyone.counts[report.timing.id] ?? 0) / Math.max(everyone.total, 1)) * 100) : 0;

  return (
    <div className="bk">
      {friend && friendReport?.timing && (
        <section className="bk-friend" aria-labelledby="friend-title">
          <p className="bk-friend-kicker">ঘটকের কাছে একটা ফাইল এসেছে</p>
          <h2 id="friend-title">{friendWho} রিপোর্টে লেখা: “{friendReport.timing.text}”। <span>এবার তোমারটা।</span></h2>
          <details>
            <summary>{friendWho} রিপোর্টটা দেখো</summary>
            <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendWho} রিপোর্ট: ${friendReport.timing.text}। কারণ: ${friendReport.reason}`} />
          </details>
        </section>
      )}

      <div className="bk-desk" ref={file} id="file">
        <div className="bk-folder">
          <p className="bk-tab" aria-hidden="true">ঘটকের ফাইল</p>
          <Umbrella />
          <div className="bk-sheet">
            <div className="bk-sheet-head">
              <span>ফাইল নং ঘ-{report.fileNo}</span>
              <span aria-live="polite">{question ? <>প্রশ্ন <b>{bn(index + 1)}</b>/{bn(QUESTION_COUNT)}</> : "ফাইল শেষ"}</span>
            </div>

            {question ? (
              <div className="bk-question" key={index} role="group" aria-labelledby={`bk-q-${index}`}>
                <h2 id={`bk-q-${index}`}>{question.ask}</h2>
                <div className="bk-chips">
                  {question.chips.map((chip, option) => (
                    <button type="button" key={chip} aria-pressed={chosen === option} onClick={() => pick(option as Answer)}>
                      <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="3" /><path d="M6 12.5l4 4 8-9" /></svg>
                      <span>{chip}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bk-done">
                <p className="bk-done-kicker">ঘটক রিপোর্ট লিখে ফেলেছেন</p>
                <p className="bk-done-label">সম্ভাব্য সময়</p>
                <p className="bk-done-big">{report.timing?.text}</p>
                <p className="bk-done-reason"><b>কারণ:</b> {report.reason}</p>
                <span className="bk-stamp" aria-hidden="true">শুধু মজা</span>
                <a className="kit-primary" href="#result">রিপোর্টটা দেখো</a>
              </div>
            )}

            <div className="bk-nav">
              <button type="button" onClick={() => go(index - 1)} disabled={index === 0}>← আগেরটা</button>
              <ol className="bk-boxes" aria-label={`${bn(report.answered)}টা প্রশ্নের উত্তর দিয়েছ`}>
                {answers.map((value, position) => <li key={position} data-done={value !== null} data-current={position === index} />)}
              </ol>
              <button type="button" onClick={() => go(firstOpen(answers, index + 1))} disabled={chosen === null}>পরেরটা →</button>
            </div>
          </div>
        </div>
      </div>

      <StickyNext show={report.complete && !resultVisible && !fileVisible} title={<>রিপোর্ট <strong>তৈরি</strong></>} sub={report.timing?.short} href="#result" label="রিপোর্টটা দেখো" />

      <section className="bk-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="bk-result-head">
          <h2 id="result-title">{report.complete ? <>ঘটকের <em>গোপন রিপোর্ট</em></> : "ঘটক রিপোর্ট লিখছেন…"}</h2>
          <p>{report.complete ? report.line : `আর ${bn(QUESTION_COUNT - report.answered)}টা প্রশ্ন বাকি। শেষ হলেই শেয়ার করতে পারবে।`}</p>
        </div>
        <div className="bk-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="bk-sr">{report.timing ? `সম্ভাব্য সময়: ${report.timing.text}। কারণ: ${report.reason}। ${report.line} শুধু মজা।` : "ঘটকের রিপোর্ট এখনো অর্ধেক লেখা।"}</figcaption>
            {previewError && <p className="kit-status" role="alert">রিপোর্টের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="bk-controls">
            <label className="bk-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="biye-kobe.png" makeImage={() => cardBlob(report, format, site)} imageKey={`${state}|${format}`} caption={caption(report)} state={state || undefined} disabled={!report.complete} hint={report.complete ? "লিংক পেলে বন্ধু তোমার রিপোর্ট দেখবে, তারপর নিজেরটা বানাবে।" : "আগে ৬টা প্রশ্নের উত্তর দাও।"} />
            <p className="bk-promise">এটা শুধু মজা। কেউ ভবিষ্যৎ জানে না, ঘটকও না। বিয়ে করা, না করা, কবে করা, পুরোটাই তোমার সিদ্ধান্ত।</p>
            {report.complete && (
              <div className="bk-everyone">
                <h3>সবার রিপোর্টের সাথে মেলাবে?</h3>
                {counted !== "done" || !everyone ? <>
                  <p>শুধু তোমার ‘সম্ভাব্য সময়’টা গোনা হবে। নাম বা উত্তর যাবে না।</p>
                  <button type="button" className="kit-secondary" onClick={compare} disabled={counted === "sending"}>{counted === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
                  {counted === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
                </> : everyone.total < TALLY_MIN || !top ? (
                  <p>এখনো মাত্র {bn(everyone.total)}টা রিপোর্ট জমেছে। আরও কয়েকজন খেললেই দেখাব কোনটা সবচেয়ে বেশি আসে। বন্ধুদের লিংক পাঠাও!</p>
                ) : (
                  <p>{bn(everyone.total)}টা রিপোর্টে সবচেয়ে বেশি এসেছে: <strong>{top.timing.short}</strong>। তোমারটা এসেছে {bn(mine)}% জনের।</p>
                )}
              </div>
            )}
            {report.answered > 0 && <button type="button" className="kit-link" onClick={restart}>নতুন করে উত্তর দাও</button>}
          </div>
        </div>
      </section>
    </div>
  );
}
