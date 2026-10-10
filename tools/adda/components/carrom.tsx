"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { blendLine, bn, boardFull, caption, cleanName, countLine, groupLine, layoutBoard, linkMembers, parseShareHash, questions, reasonLine, roleById, roleOf, roles, shareHash, shownName, whoText, MAX_BOARD, MAX_NAME, QUESTION_COUNT, type Answer, type Member, type Shared } from "../lib/adda";
import { cardBlob, drawBoard, drawCard, LOOSE, LOOSE_R, STRIKER_REST } from "../lib/draw-board";

const TOOL = "adda";
// A share of four pieces from a handful of people is noise.
const TALLY_MIN = 30;
const FLICK_MS = 1300;
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);
const place = (x: number, y: number, r: number) => ({ "--x": `${x * 100}%`, "--y": `${y * 100}%`, "--r": `${r * 200}%` }) as CSSProperties;

/** The carrom board: canvas art behind, pieces (or the quiz) on the surface, answered questions as pocketed coins on the rail. */
function Board({ members, mine = -1, flick, small, progress, label, children }: { members: readonly Member[]; mine?: number; flick?: boolean; small?: boolean; progress?: number; label?: string; children?: ReactNode }) {
  const art = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const context = art.current?.getContext("2d");
    if (context) drawBoard(context, 0, 0, art.current!.width);
  }, []);
  const { slots, emptyCentre } = members.length ? layoutBoard(members) : { slots: [], emptyCentre: false };
  return (
    <div className="adda-board" data-small={small || undefined} data-flick={flick || undefined} role={label ? "img" : undefined} aria-label={label}>
      <canvas ref={art} className="adda-art" width={small ? 320 : 760} height={small ? 320 : 760} aria-hidden="true" />
      <div className="adda-surface">
        {children ?? <>
          {LOOSE.map((piece, index) => <span key={index} className="adda-piece adda-loose" data-role={piece.role} style={place(piece.x, piece.y, LOOSE_R)} aria-hidden="true" />)}
          {members.length === 1 && members[0].role !== "striker" && <span className="adda-piece adda-rest" data-role="striker" style={place(STRIKER_REST.x, STRIKER_REST.y, 0.04)} aria-hidden="true" />}
          {emptyCentre && <span className="adda-ghost" aria-hidden="true">কুইন?</span>}
          {slots.map(slot => <span key={slot.index} className="adda-piece" data-role={slot.member.role} data-mine={slot.index === mine || undefined} style={place(slot.x, slot.y, slot.r)} aria-hidden="true" />)}
          {!small && members.length > 1 && slots.map(slot => (
            <span key={`label-${slot.index}`} className="adda-label" data-mine={slot.index === mine || undefined} style={place(slot.x, slot.y + slot.r, slot.r)} aria-hidden="true">
              <b>{shownName(slot.member, slot.index === mine)}</b><small>{roleById(slot.member.role).piece}</small>
            </span>
          ))}
          {flick && <span className="adda-piece adda-shot" data-role="striker" style={place(STRIKER_REST.x, STRIKER_REST.y, 0.045)} aria-hidden="true" />}
        </>}
      </div>
      {progress !== undefined && <ol className="adda-rail" aria-hidden="true">{questions.map((_, index) => <li key={index} data-on={index < progress || undefined} data-tone={index % 2 ? "black" : "white"} />)}</ol>}
    </div>
  );
}

export function Carrom() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [link, setLink] = useState<Shared | null>(null);
  const [joined, setJoined] = useState(true);
  const [flick, setFlick] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const linkRef = useRef<Shared | null>(null);
  const quiz = useRef<HTMLFieldSetElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const done = answers.length === QUESTION_COUNT;
  const full = link ? boardFull(link) : false;
  const together = Boolean(link && joined && !full);
  const earlier = link && together ? linkMembers(link) : [];
  const me: Member | null = done ? { role: roleOf(answers), name: cleanName(name) } : null;
  const members = me ? [...earlier, me] : [];
  const mine = members.length - 1;
  const role = me ? roleById(me.role) : null;
  const state = done ? shareHash({ answers, name, group: earlier }).slice(1) : "";
  const blocked = name.trim() !== "" && !cleanName(name);
  const question = done ? null : questions[answers.length];

  useEffect(() => {
    const read = () => {
      const shared = parseShareHash(window.location.hash);
      if (shared) { linkRef.current = shared; setLink(shared); setJoined(true); }
      // In-page anchors (#result) replace the hash; put the friend's board back so a reload still opens it.
      else if (linkRef.current) history.replaceState(null, "", "#" + shareHash(linkRef.current).slice(1));
    };
    read();
    window.addEventListener("hashchange", read);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", read);
  }, []);

  useEffect(() => {
    if (!done) return;
    let cancelled = false;
    loadCardFonts("আড্ডায় কে কোন গুটি? কুইন স্ট্রাইকার").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, { members, mine, answers }, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes every member, name and answer the card draws.
  }, [state, done, format, site]);

  useEffect(() => {
    if (!flick) return;
    const timer = window.setTimeout(() => setFlick(false), FLICK_MS);
    return () => window.clearTimeout(timer);
  }, [flick]);

  function pick(option: number) {
    if (chosen !== null || done) return;
    const hadFocus = quiz.current?.contains(document.activeElement) ?? false;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const last = answers.length + 1 === QUESTION_COUNT;
    setChosen(option);
    // A beat to see the chit pressed before the next question slides in.
    window.setTimeout(() => {
      setChosen(null);
      setAnswers(current => current.length >= QUESTION_COUNT ? current : [...current, option as Answer]);
      if (last && !still) setFlick(true);
      if (hadFocus) requestAnimationFrame(() => quiz.current?.focus({ preventScroll: true }));
    }, still ? 0 : 240);
  }

  function back() {
    setAnswers(current => current.slice(0, -1));
  }

  function restart() {
    setAnswers([]);
    setFlick(false);
    setCounted("idle");
    document.getElementById("board")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function count() {
    if (!me) return;
    setCounted("sending");
    const tally = await addToTally(TOOL, [me.role]);
    if (tally) { setEveryone(tally); setCounted("done"); }
    else setCounted("failed");
  }

  const shared = link ? linkMembers(link) : [];
  const boardLabel = members.map((member, index) => `${shownName(member, index === mine)}: ${roleById(member.role).piece}`).join(", ");

  return (
    <div className="adda">
      {link && (
        <section className="adda-turn" aria-labelledby="turn-title">
          <Board members={shared} small label={`বন্ধুর বোর্ড: ${shared.map(member => `${shownName(member)} ${roleById(member.role).piece}`).join(", ")}`} />
          <div>
            <p className="adda-turn-kicker">{done && together ? "তুমিও বোর্ডে উঠে গেছ!" : "তোমার পালা!"}</p>
            <h2 id="turn-title">{whoText(shared)} বোর্ডে বসে গেছে।<br /><span>তুমি কোন গুটি?</span></h2>
            <ul className="adda-who">{shared.map((member, index) => <li key={index}><i data-role={member.role} aria-hidden="true" />{shownName(member)} <small>{roleById(member.role).piece}</small></li>)}</ul>
            {full
              ? <p className="adda-turn-note">বোর্ডে {bn(MAX_BOARD)} জন হয়ে গেছে, তাই তোমারটা নতুন বোর্ডে উঠবে।</p>
              : <p className="adda-turn-note">{joined ? (done ? "তোমার গুটি এই বোর্ডে বসে গেছে। " : "খেলা শেষ হলে তুমিও এই বোর্ডে যোগ হবে। ") : (done ? "তোমার গুটি আলাদা বোর্ডে। " : "তোমার গুটি আলাদা বোর্ডে উঠবে। ")}<button type="button" className="kit-link" onClick={() => setJoined(value => !value)}>{joined ? "আলাদা বোর্ড বানাও" : "ওদের বোর্ডে যোগ হও"}</button></p>}
          </div>
        </section>
      )}

      <div className="adda-table" id="board">
        <Board members={members} mine={mine} flick={flick} progress={answers.length} label={done ? `ক্যারম বোর্ড। ${boardLabel}` : undefined}>
          {question ? (
            <fieldset className="adda-quiz" key={answers.length} ref={quiz} tabIndex={-1}>
              <legend><span className="adda-count">{bn(answers.length + 1)}/{bn(QUESTION_COUNT)}</span>{question.ask}</legend>
              <div className="adda-options">
                {question.options.map((option, index) => <button type="button" className="adda-opt" key={option.label} aria-pressed={chosen === index} disabled={chosen !== null} onClick={() => pick(index)}>{option.label}</button>)}
              </div>
            </fieldset>
          ) : undefined}
        </Board>
        <p className="adda-status" aria-live="polite">{done && role ? <>তুমি <strong>{role.piece}</strong> · {role.tag}</> : answers.length ? `${bn(answers.length)}টা উত্তর দেওয়া হলো, আর ${bn(QUESTION_COUNT - answers.length)}টা` : "যেটা তোমার সাথে সবচেয়ে মেলে, ছুঁয়ে দাও"}</p>
        {answers.length > 0 && <div className="adda-redo">
          {done ? <button type="button" className="kit-link" onClick={restart}>আবার খেলি</button> : <button type="button" className="kit-link" onClick={back}>আগেরটায় ফেরো</button>}
        </div>}
      </div>

      <StickyNext show={done && !resultVisible} title={<>তুমি <strong>{role?.piece}</strong></>} sub={role?.tag} href="#result" label="কার্ডটা দেখো" />

      {done && me && role && (
        <section className="adda-result" id="result" ref={result} aria-labelledby="result-title">
          <div className="adda-result-head">
            <p className="adda-result-kicker">{members.length > 1 ? `${bn(members.length)} জনের বোর্ড · ${countLine(members)}` : "আড্ডায় তুমি"}</p>
            <h2 id="result-title">{me.name ? `${me.name} = ` : "তুমি "}<em>{role.piece}</em></h2>
            <p className="adda-result-tag">{role.tag}</p>
            <p>{role.line}</p>
            <p className="adda-blend">{blendLine(answers)}</p>
            {members.length > 1 && <p className="adda-blend">{groupLine(members)}</p>}
          </div>

          <div className="adda-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
              <figcaption id="card-summary" className="adda-sr">ক্যারম বোর্ডের কার্ড। {boardLabel}। {members.length > 1 ? groupLine(members) : `${blendLine(answers)} কারণ: ${reasonLine(answers)}।`}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>

            <div className="adda-controls">
              <label className="adda-field">
                <span>গুটিতে তোমার নাম <small>না দিলেও চলবে, {bn(MAX_NAME)} অক্ষরের মধ্যে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" aria-invalid={blocked || undefined} aria-describedby="name-note" />
                <small id="name-note" className={blocked ? "adda-warn" : "adda-sr"} role={blocked ? "alert" : undefined}>{blocked ? "এই নামটা বোর্ডে লেখা যাবে না। অন্য নাম লেখো।" : ""}</small>
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`adda-${format}.png`} makeImage={() => cardBlob({ members, mine, answers }, format, site)} imageKey={`${state}|${format}`} caption={caption(members, me.role)} state={state}
                hint={members.length < MAX_BOARD ? `বন্ধুকে পাঠাও, সে খেললেই এই বোর্ডে যোগ হবে (${bn(MAX_BOARD)} জন পর্যন্ত)।` : "বোর্ড ভরে গেছে! এবার শুধু শেয়ার।"} />
              <div className="adda-everyone">
                {everyone && everyone.total >= TALLY_MIN && <ul className="adda-bars" aria-label={`${bn(everyone.total)} জনের গুটি`}>
                  {roles.map(item => { const value = percent(everyone.counts[item.id] ?? 0, everyone.total); return <li key={item.id} data-mine={item.id === me.role || undefined}><i data-role={item.id} aria-hidden="true" /><span>{item.piece}</span><b style={{ width: `${value}%` }} /><em>{bn(value)}%</em></li>; })}
                  <li className="adda-bars-note">{bn(everyone.total)} জনের গোনা, জরিপ না</li>
                </ul>}
                {counted === "done"
                  ? <p className="kit-status">গুনে নেওয়া হলো, ধন্যবাদ!</p>
                  : <button type="button" className="kit-link" onClick={count} disabled={counted === "sending"}>{counted === "sending" ? "গোনা হচ্ছে…" : "আমার গুটিটাও গুনে নাও"}</button>}
                {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
                {counted !== "done" && <p className="adda-note">শুধু গুটির নামটা (যেমন ‘{role.piece}’) গোনা হয়। তোমার নাম, উত্তর বা বন্ধুদের নাম না।</p>}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
