"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { hiss, sfx } from "../../../shared/game-sound";
import { SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { drawPlateCard, plateBlob } from "../lib/draw-plate";
import { bhortaOf, bhortas, bn, caption, cleanName, pairLine, parseShareHash, questions, reason, shareHash, MAX_NAME, QUESTION_COUNT, type Answer, type Plate } from "../lib/bhorta";

const TOOL = "bhorta";
// A "most common" line from a handful of people is noise.
const TALLY_MIN = 100;

// One thing lands on the পাটা with each answer; after the sixth, the pile is ground into a ball.
const ingredients = ["শুকনা মরিচ", "পেঁয়াজ", "রসুন", "কাঁচা মরিচ", "ধনেপাতা", "সরিষার তেল"] as const;

function Ingredient({ index }: { index: number }) {
  switch (index) {
    case 0: return <svg viewBox="0 0 40 40"><path d="M6 26 Q20 12 34 20" stroke="#b4372a" strokeWidth="7" fill="none" strokeLinecap="round" /><path d="M6 26 L3 22" stroke="#4d6b1c" strokeWidth="3" strokeLinecap="round" /></svg>;
    case 1: return <svg viewBox="0 0 40 40"><circle cx="20" cy="22" r="12" fill="#c9739a" /><circle cx="20" cy="22" r="8" fill="none" stroke="#f3dbe8" strokeWidth="2" /><circle cx="20" cy="22" r="4" fill="none" stroke="#f3dbe8" strokeWidth="2" /></svg>;
    case 2: return <svg viewBox="0 0 40 40"><path d="M20 8 C30 16 30 32 20 32 C10 32 10 16 20 8Z" fill="#f4eee0" stroke="#cbbf9f" strokeWidth="2" /><path d="M20 12 V30" stroke="#cbbf9f" strokeWidth="1.5" /></svg>;
    case 3: return <svg viewBox="0 0 40 40"><path d="M8 28 Q22 20 34 10" stroke="#3f9a2a" strokeWidth="6" fill="none" strokeLinecap="round" /><path d="M8 28 L5 33" stroke="#2c5f17" strokeWidth="3" strokeLinecap="round" /></svg>;
    case 4: return <svg viewBox="0 0 40 40"><path d="M20 34 V18" stroke="#2c6a20" strokeWidth="2" /><circle cx="14" cy="16" r="6" fill="#4f9a35" /><circle cx="26" cy="15" r="6" fill="#5fae3e" /><circle cx="20" cy="9" r="6" fill="#3f8a2c" /></svg>;
    default: return <svg viewBox="0 0 40 40"><path d="M20 6 C28 18 30 24 30 27 A10 10 0 0 1 10 27 C10 24 12 18 20 6Z" fill="#e8b520" /><ellipse cx="16" cy="24" rx="2.5" ry="4" fill="#fff3b0" /></svg>;
  }
}

export function Shilpata() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Plate | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const card = useRef<HTMLCanvasElement>(null);
  const friendCard = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const done = answers.length === QUESTION_COUNT;
  const plate: Plate = { answers, name };
  const bhorta = done ? bhortaOf(answers) : null;
  const shownName = cleanName(name);
  const state = done ? shareHash(plate).slice(1) : "";
  const blocked = name.trim() !== "" && !shownName;
  const friendBhorta = friend ? bhortaOf(friend.answers) : null;
  const friendWho = friend?.name || "তোমার বন্ধু";
  const cardData = { answers, name: shownName, friend };

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared plate counts.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`শিলপাটায় বেটে দেখা গেল ${shownName} হলো ভর্তা`).then(() => {
      if (cancelled) return;
      if (done && card.current) drawPlateCard(card.current, { answers, name: shownName, friend }, format, site);
      if (friend && friendCard.current) drawPlateCard(friendCard.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [answers, done, shownName, format, site, friend]);

  function pick(answer: Answer) {
    // A spice drops on the stone and the nora rubs it; after the sixth, a small chime says the ball is ready.
    sfx.drop();
    hiss(0.2, 0.08, 700, "lowpass", 0.06);
    if (answers.length === QUESTION_COUNT - 1) setTimeout(sfx.good, 320);
    setAnswers(current => current.length < QUESTION_COUNT ? [...current, answer] : current);
  }

  function restart() {
    setAnswers([]);
    setCounted("idle");
    document.getElementById("shilpata")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function count() {
    if (!bhorta) return;
    setCounted("sending");
    const tally = await addToTally(TOOL, [bhorta.id]);
    if (tally) { setEveryone(tally); setCounted("done"); }
    else setCounted("failed");
  }

  const question = done ? null : questions[answers.length];
  const top = everyone && everyone.total >= TALLY_MIN ? bhortas.reduce((best, item) => (everyone.counts[item.id] ?? 0) > (everyone.counts[best.id] ?? 0) ? item : best) : null;

  return (
    <div className="bh">
      {friend && friendBhorta && (
        <section className="bh-friend" aria-labelledby="friend-title">
          <canvas ref={friendCard} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendWho} হলো ${friendBhorta.name}। ${friendBhorta.tag}।`} />
          <div>
            <p className="bh-kicker">বন্ধু একটা থালা পাঠিয়েছে</p>
            <h2 id="friend-title">{friendWho} হলো <em>{friendBhorta.name}</em>,<br /><span>তুমি কোনটা?</span></h2>
            <a className="kit-primary" href="#shilpata">আমারটা বেটে দেখি</a>
          </div>
        </section>
      )}

      <div className="bh-stone" id="shilpata">
        {question ? (
          <fieldset className="bh-question" key={answers.length}>
            <legend><span className="bh-count">{bn(answers.length + 1)}/{bn(QUESTION_COUNT)}</span>{question.ask}</legend>
            <div className="bh-choices">
              {question.options.map((option, index) => <button type="button" className="bh-choice" key={option.label} onClick={() => pick(index as Answer)}>{option.label}</button>)}
            </div>
          </fieldset>
        ) : (
          <p className="bh-ground" role="status">বাটা শেষ! তুমি <strong>{bhorta?.name}</strong></p>
        )}

        <div className="bh-slab" aria-hidden="true">
          {done && bhorta
            ? <span className="bh-ball" style={{ "--ball": bhorta.ball, "--fleck": bhorta.fleck } as CSSProperties} />
            : <ol className="bh-pile">{ingredients.map((item, index) => <li key={item} data-on={index < answers.length}><Ingredient index={index} /></li>)}</ol>}
          <span className="bh-nora" data-step={answers.length % 2} />
        </div>
        <p className="bh-landed" aria-live="polite">
          {done ? "" : answers.length ? `পাটায় পড়ল ${ingredients[answers.length - 1]}` : "প্রতি উত্তরে পাটায় পড়বে একটা করে মসলা"}
        </p>
        <div className="bh-redo">
          <SoundToggle compact />
          {answers.length > 0 && !done && <button type="button" className="kit-link" onClick={() => setAnswers(current => current.slice(0, -1))}>আগেরটায় ফেরো</button>}
          {done && <button type="button" className="kit-link" onClick={restart}>আবার বাটো</button>}
        </div>
      </div>

      <StickyNext show={done && !resultVisible} title={<>তুমি <strong>{bhorta?.name}</strong></>} sub={bhorta?.tag} href="#result" label="থালার ছবি নাও" />

      {done && bhorta && (
        <section className="bh-result" id="result" ref={result} aria-labelledby="result-title">
          <div className="bh-result-head">
            <h2 id="result-title">{shownName ? `${shownName} হলো` : "তুমি হলে"} <em>{bhorta.name}</em></h2>
            <p><strong>{bhorta.tag}।</strong> {bhorta.line}</p>
            {friend && <p className="bh-pair">{pairLine({ answers, name: shownName }, friend)}</p>}
          </div>

          <div className="bh-result-body">
            <figure className="kit-card bh-card" data-format={format}>
              <canvas ref={card} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
              <figcaption id="card-summary" className="bh-sr">কাঁসার থালায় কলাপাতা, তাতে {bhorta.name}। {shownName ? `${shownName} হলো` : "আমি হলাম"} {bhorta.name}: {bhorta.tag}। কেন? {reason(answers)}।</figcaption>
              {previewError && <p className="kit-status" role="alert">থালার ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>

            <div className="bh-controls">
              <label className="bh-field">
                <span>থালায় তোমার নাম <small>না দিলেও চলবে, {bn(MAX_NAME)} অক্ষরের মধ্যে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="given-name" aria-invalid={blocked || undefined} aria-describedby="name-note" />
                <small id="name-note" className={blocked ? "bh-warn" : "bh-sr"} role={blocked ? "alert" : undefined}>{blocked ? "এই নামটা থালায় লেখা যাবে না। অন্য নাম লেখো।" : ""}</small>
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`bhorta-${format}.png`} makeImage={() => plateBlob(cardData, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption(plate)} state={state}
                hint="বন্ধু লিংক খুললে আগে তোমার থালা দেখবে, তারপর নিজের ভর্তা বাটবে।" />
              <div className="bh-everyone">
                {top && <p>সবচেয়ে বেশি মানুষ: <strong>{top.name}</strong> <small>({bn(everyone!.total)} জনের গোনা, জরিপ না)</small></p>}
                {counted === "done"
                  ? <p className="kit-status">গুনে নেওয়া হলো, ধন্যবাদ!</p>
                  : <button type="button" className="kit-link" onClick={count} disabled={counted === "sending"}>{counted === "sending" ? "গোনা হচ্ছে…" : "আমার ভর্তাটাও গুনে নাও"}</button>}
                {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
                {counted !== "done" && <p className="bh-note">শুধু ভর্তার নামটা (যেমন ‘{bhorta.name}’) গোনা হয়। তোমার নাম বা উত্তর না।</p>}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
