"use client";

import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { drawTicketCard, ticketBlob } from "../lib/draw-ticket";
import { bn, bnDigits, caption, cleanName, pairLine, parseShareHash, passenger, placeOf, possessive, questions, reasonLine, shareHash, MAX_NAME, QUESTION_COUNT, type Answer, type Ticket } from "../lib/jibh";
import { DishIcon } from "./dish-icon";

const TOOL = "jibh";
// "১ টিকিটের ১টা সিলেটের" after one vote is noise, not a picture of anyone.
const TALLY_MIN = 50;

export function TicketCounter() {
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Ticket | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const card = useRef<HTMLCanvasElement>(null);
  const friendCard = useRef<HTMLCanvasElement>(null);
  // Watch the card itself, not the whole tall result: the next step stays pinned until the picture is on screen.
  const shown = useRef<HTMLElement>(null);
  const resultVisible = useInView(shown);

  const done = answers.length === QUESTION_COUNT;
  const place = done ? placeOf(answers) : null;
  const shownName = cleanName(name);
  const ticket: Ticket = { answers, name: shownName };
  const state = done ? shareHash(ticket).slice(1) : "";
  const blocked = name.trim() !== "" && !shownName;
  const friendPlace = friend ? placeOf(friend.answers) : null;
  const friendWho = friend?.name || "তোমার বন্ধু";

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
    loadCardFonts(`জিভের টিকিট কাটা হলো ${shownName} গন্তব্য যাত্রা শুভ`).then(() => {
      if (cancelled) return;
      if (done && card.current) drawTicketCard(card.current, { answers, name: shownName, friend }, format, site);
      if (friend && friendCard.current) drawTicketCard(friendCard.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [answers, done, shownName, format, site, friend]);

  function pick(answer: Answer) {
    setAnswers(current => current.length < QUESTION_COUNT ? [...current, answer] : current);
  }

  function restart() {
    setAnswers([]);
    setCounted("idle");
    document.getElementById("counter")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function count() {
    if (!place) return;
    setCounted("sending");
    const tally = await addToTally(TOOL, [place.id]);
    if (tally) { setEveryone(tally); setCounted("done"); }
    else setCounted("failed");
  }

  const question = done ? null : questions[answers.length];
  const sameTrain = everyone && place && everyone.total >= TALLY_MIN ? everyone.counts[place.id] ?? 0 : null;

  return (
    <div className="jb">
      {friend && friendPlace && (
        <section className="jb-friend" aria-labelledby="friend-title">
          <canvas ref={friendCard} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${passenger(friend.name)}: গন্তব্য ${friendPlace.name}। যেখানকার বলে পরিচিত: ${friendPlace.foods}।`} />
          <div>
            <p className="jb-kicker">বন্ধু একটা টিকিট পাঠিয়েছে</p>
            <h2 id="friend-title">{friend.name ? possessive(friend.name) : "তোমার বন্ধুর"} জিভ যাচ্ছে <em>{friendPlace.name}</em>,<br /><span>তোমারটা কোথায়?</span></h2>
            <a className="kit-primary" href="#counter">আমার টিকিট কাটি</a>
          </div>
        </section>
      )}

      <div className="jb-ticket" id="counter">
        <div className="jb-stub" aria-hidden="true">
          <ol className="jb-holes">{questions.map((_, index) => <li key={index} data-on={index < answers.length} />)}</ol>
          <span>জিভ এক্সপ্রেস</span>
        </div>
        <div className="jb-face">
          <p className="jb-head" aria-hidden="true"><span>জিভের টিকিট</span><span>নং {bnDigits(answers.join("").padEnd(QUESTION_COUNT, "-"))}</span></p>
          {question ? (
            <fieldset className="jb-question" key={answers.length}>
              <legend><span className="jb-count">{bn(answers.length + 1)}/{bn(QUESTION_COUNT)}</span>{question.ask}</legend>
              <div className="jb-choices">
                {question.options.map((option, index) => (
                  <button type="button" className="jb-choice" key={option.label} onClick={() => pick(index as Answer)}>
                    <DishIcon art={option.art} />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          ) : place && (
            <div className="jb-done" role="status">
              <p>টিকিট কাটা হলো! গন্তব্য</p>
              <strong>{place.name}</strong>
              <span className="jb-done-art" aria-hidden="true">{place.art.map(art => <DishIcon key={art} art={art} />)}</span>
              <span className="jb-stamp" aria-hidden="true">যাত্রা<br />শুভ</span>
            </div>
          )}
          <div className="jb-redo">
            {answers.length > 0 && !done && <button type="button" className="kit-link" onClick={() => setAnswers(current => current.slice(0, -1))}>আগেরটায় ফেরো</button>}
            {done && <button type="button" className="kit-link" onClick={restart}>আবার টিকিট কাটো</button>}
          </div>
        </div>
      </div>

      <StickyNext show={done && !resultVisible} title={<>গন্তব্য <strong>{place?.name}</strong></>} sub={place?.foods} href="#result" label="টিকিটের ছবি নাও" />

      {done && place && (
        <section className="jb-result" id="result" aria-labelledby="result-title">
          <div className="jb-result-head">
            <h2 id="result-title">{shownName ? possessive(shownName) : "তোমার"} জিভ যাবে <em>{place.name}</em></h2>
            <p className="jb-known">যেখানকার বলে পরিচিত: <strong>{place.foods}</strong></p>
            <p>{place.line}</p>
            <p className="jb-why">{reasonLine(answers)}।</p>
            {friend && <p className="jb-pair">{pairLine(ticket, friend)}</p>}
            <p className="jb-source">সূত্র: {place.source}। <a href="#places">২০টা গন্তব্যের তালিকা আর সূত্র দেখো</a></p>
          </div>

          <div className="jb-result-body">
            <figure className="kit-card jb-card" data-format={format} ref={shown}>
              <canvas ref={card} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
              <figcaption id="card-summary" className="jb-sr">কার্ডবোর্ডের ট্রেনের টিকিট। {passenger(shownName)}, গন্তব্য {place.name}। যেখানকার বলে পরিচিত: {place.foods}। {place.line} {reasonLine(answers)}।</figcaption>
              {previewError && <p className="kit-status" role="alert">টিকিটের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>

            <div className="jb-controls">
              <label className="jb-field">
                <span>টিকিটে তোমার নাম <small>না দিলেও চলবে, {bn(MAX_NAME)} অক্ষরের মধ্যে</small></span>
                <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="given-name" aria-invalid={blocked || undefined} aria-describedby="name-note" />
                <small id="name-note" className={blocked ? "jb-warn" : "jb-sr"} role={blocked ? "alert" : undefined}>{blocked ? "এই নামটা টিকিটে লেখা যাবে না। অন্য নাম লেখো।" : ""}</small>
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName={`jibh-${place.id}-${format}.png`} makeImage={() => ticketBlob({ answers, name: shownName, friend }, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption(ticket)} state={state}
                hint="বন্ধু লিংক খুললে তোমার টিকিট দেখবে। নিজেরটা কাটলে দুটো টিকিট পাশাপাশি উঠবে।" />
              <div className="jb-everyone">
                {counted === "done"
                  ? <p className="kit-status">গুনে নেওয়া হলো, ধন্যবাদ!{sameTrain !== null && <> এ পর্যন্ত গোনা {bn(everyone!.total)}টা টিকিটের {bn(sameTrain)}টা {place.name}-এর।</>}</p>
                  : <button type="button" className="kit-link" onClick={count} disabled={counted === "sending"}>{counted === "sending" ? "গোনা হচ্ছে…" : "আমার টিকিটটাও গুনে নাও"}</button>}
                {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
                {counted !== "done" && <p className="jb-note">শুধু গন্তব্যের নামটা (যেমন ‘{place.name}’) গোনা হয়। তোমার নাম বা উত্তর না। কোন জেলা সেরা, এমন কিছু দেখানো হয় না।</p>}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
