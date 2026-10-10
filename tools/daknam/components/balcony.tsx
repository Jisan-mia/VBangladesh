"use client";

import { useEffect, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { daknamBlob, drawDaknam, sizes } from "../lib/draw-daknam";
import { bn, callLine, caption, cleanName, defaultDaknam, humanLine, isBlocked, moods, nameFromTallyId, nextPick, nickname, orders, parseShareHash, possessive, sets, shareHash, summary, tallyId, times, MAX_NAME, type Daknam, type Tap } from "../lib/daknam";

const TOOL = "daknam";
// A "most common" line from a handful of people is noise.
const TALLY_MIN = 100;
const rows = [
  { key: "order", legend: "বাড়িতে তুমি ছিলে", options: orders },
  { key: "mood", legend: "ছোটবেলায় তুমি ছিলে", options: moods },
  { key: "time", legend: "আর তুমি ছিলে", options: times.map(time => time.label) },
] as const;

export function Balcony() {
  const [daknam, setDaknam] = useState<Daknam>(defaultDaknam);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Daknam | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [touched, setTouched] = useState(false);
  const stage = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLCanvasElement>(null);
  const friendCard = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const nick = nickname(daknam);
  const name = cleanName(daknam.name);
  const blocked = daknam.name.trim() !== "" && isBlocked(daknam.name);
  const line = humanLine(daknam);
  const state = shareHash(daknam).slice(1);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared card counts.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`${daknam.name} ${nick} ছোটবেলায় আমার ডাকনাম হতো`).then(() => {
      if (cancelled) return;
      if (stage.current) drawDaknam(stage.current, daknam, "stage", site);
      if (card.current) drawDaknam(card.current, daknam, format, site);
      if (friend && friendCard.current) drawDaknam(friendCard.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [daknam, nick, format, site, friend]);

  const update = (patch: Partial<Daknam>) => {
    setDaknam(current => ({ ...current, ...patch }));
    setTouched(true);
    // A changed name makes the old count stale.
    setCounted(current => current === "done" ? "idle" : current);
  };
  // A new tap starts the cell from its first name, so "আরেকটা" always walks the same three.
  const tap = (key: "order" | "mood" | "time", value: Tap) => update(key === "time" ? { time: value } : { [key]: value, pick: 0 });

  async function count() {
    setCounted("sending");
    const tally = await addToTally(TOOL, [tallyId(daknam)]);
    if (tally) { setEveryone(tally); setCounted("done"); }
    else setCounted("failed");
  }

  const top = everyone && everyone.total >= TALLY_MIN
    ? Object.entries(everyone.counts).reduce<[string, number] | null>((best, entry) => !best || entry[1] > best[1] ? entry : best, null)
    : null;
  const topName = top ? nameFromTallyId(top[0]) : null;
  const friendWho = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";

  return (
    <div className="daknam">
      {friend && (
        <section className="daknam-friend" aria-labelledby="friend-title">
          <canvas ref={friendCard} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendWho} ডাকনাম হতো ${nickname(friend)}`} />
          <div>
            <p className="daknam-kicker">বারান্দা থেকে ডাক এসেছে</p>
            <h2 id="friend-title">{friendWho} ডাকনাম হতো <em>{nickname(friend)}</em>।<br /><span>এবার তোমার পালা!</span></h2>
            <a className="kit-primary" href="#balcony">আমারটা দেখি</a>
          </div>
        </section>
      )}

      <div className="balcony" id="balcony">
        <div className="balcony-stage">
          <canvas ref={stage} width={sizes.stage.width} height={sizes.stage.height} aria-hidden="true" />
          <p className="balcony-call" key={`${nick}|${daknam.time}`} aria-live="polite">
            <b>{nick}!</b> {callLine(daknam)}
          </p>
        </div>
        <button type="button" className="balcony-again" onClick={() => update({ pick: nextPick(daknam.pick) })}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" /></svg>
          আরেকটা ডাকনাম
        </button>
      </div>

      <div className="balcony-controls">
        {rows.map(row => (
          <fieldset className="kit-chips" key={row.key}>
            <legend>{row.legend}</legend>
            {row.options.map((label, index) => <button type="button" key={label} aria-pressed={daknam[row.key] === index} onClick={() => tap(row.key, index as Tap)}>{label}</button>)}
          </fieldset>
        ))}
        <fieldset className="kit-chips daknam-sets">
          <legend>কোন ধরনের ডাকনাম?</legend>
          {sets.map(set => <button type="button" key={set.id} aria-pressed={daknam.set === set.id} onClick={() => update({ set: set.id })}>{set.label}</button>)}
        </fieldset>
        <label className="daknam-field">
          <span>তোমার আসল নাম <small>না দিলেও চলবে, {bn(MAX_NAME)} অক্ষরের মধ্যে</small></span>
          <input value={daknam.name} maxLength={MAX_NAME} onChange={event => update({ name: event.target.value })} placeholder="যেমন: রাফি" autoComplete="given-name" aria-invalid={blocked || undefined} aria-describedby="name-note" />
          <small id="name-note" className={blocked ? "daknam-warn" : "daknam-sr"} role={blocked ? "alert" : undefined}>{blocked ? "এই নামটা কার্ডে লেখা যাবে না। অন্য নাম লেখো।" : ""}</small>
        </label>
      </div>

      <StickyNext show={touched && !resultVisible} title={<><strong>{nick}</strong></>} sub={line} href="#result" label="কার্ডটা নাও" />

      <section className="daknam-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="daknam-result-head">
          <h2 id="result-title">{name ? possessive(name) : "তোমার"} ডাকনাম হতো <em>{nick}</em></h2>
          <p>{line}</p>
        </div>

        <div className="daknam-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={card} width={sizes[format].width} height={sizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="daknam-sr">বারান্দা থেকে ডাক: “{nick}! {callLine(daknam)}” নামফলকে লেখা: {name ? `${name} থেকে ${nick}` : nick}। {line} {summary(daknam)}।</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="daknam-controls">
            <p className="daknam-picks">{summary(daknam)}</p>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`daknam-${format}.png`} makeImage={() => daknamBlob(daknam, format, site)} imageKey={`${state}|${format}`} caption={caption(daknam)} state={state}
              hint="লিংক পেলে বন্ধু তোমার বারান্দা দেখবে, তারপর নিজের ডাকনামটা বের করবে।" />
            <div className="daknam-everyone">
              {top && topName && <p>সবচেয়ে বেশি এসেছে: <strong>{topName}</strong> <small>({bn(everyone!.total)} জনের গোনা, জরিপ না)</small></p>}
              {counted === "done"
                ? <p className="kit-status">গুনে নেওয়া হলো, ধন্যবাদ!</p>
                : <button type="button" className="kit-link" onClick={count} disabled={counted === "sending"}>{counted === "sending" ? "গোনা হচ্ছে…" : "আমার ডাকনামটাও গুনে নাও"}</button>}
              {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
              {counted !== "done" && <p className="daknam-note">শুধু কোন ডাকনামটা এসেছে, সেটা গোনা হয়। তোমার আসল নাম কখনো না।</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
