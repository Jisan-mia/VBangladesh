"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { loadCardFonts } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { designBlob, drawDesign, sizes, type Format } from "../lib/draw-name";
import { caption, cleanName, defaultDesign, humanLine, isBlocked, parseShareHash, possessive, shareHash, styleById, styles, MAX_NAME, PLACEHOLDER_NAME, type Design, type StyleId } from "../lib/namer";

const TOOL = "namer-design";
// A "most loved" line from a handful of people is noise.
const TALLY_MIN = 100;
const CHIP_SCALE = 0.25;
const formats: Array<{ id: Format; label: string }> = [
  { id: "feed", label: "ফেসবুক পোস্ট" },
  { id: "story", label: "স্টোরি" },
  { id: "square", label: "প্রোফাইল ছবি" },
];
const bn = (value: number) => new Intl.NumberFormat("bn-BD").format(value);

export function NameStudio() {
  const [design, setDesign] = useState<Design>(defaultDesign);
  const [gift, setGift] = useState(false);
  const [format, setFormat] = useState<Format>("feed");
  const [friend, setFriend] = useState<Design | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const stage = useRef<HTMLCanvasElement>(null);
  const card = useRef<HTMLCanvasElement>(null);
  const friendCard = useRef<HTMLCanvasElement>(null);
  const chips = useRef<Array<HTMLCanvasElement | null>>([]);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const shown = useMemo<Design>(() => ({ ...design, from: gift ? design.from : "" }), [design, gift]);
  const name = cleanName(shown.name);
  const blocked = shown.name.trim() !== "" && isBlocked(shown.name);
  const fromBlocked = gift && shown.from.trim() !== "" && isBlocked(shown.from);
  const state = shareHash(shown).slice(1);
  const style = styleById(shown.style)!;
  const line = humanLine(shown);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared design counts.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(`${shown.name} ${PLACEHOLDER_NAME}`).then(() => {
      if (cancelled) return;
      if (stage.current) drawDesign(stage.current, shown, "stage", site);
      styles.forEach((item, index) => { const chip = chips.current[index]; if (chip) drawDesign(chip, { ...shown, style: item.id }, "stage", site, CHIP_SCALE); });
      if (card.current) drawDesign(card.current, shown, format, site);
      if (friend && friendCard.current) drawDesign(friendCard.current, friend, "square", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [shown, format, site, friend]);

  const update = (patch: Partial<Design>) => {
    setDesign(current => ({ ...current, ...patch }));
    // A changed design makes the old count stale.
    setCounted(current => current === "done" ? "idle" : current);
  };

  function takeGift() {
    if (!friend) return;
    setDesign({ ...friend, from: "" });
    setGift(false);
    document.getElementById("result")?.scrollIntoView({ behavior: "smooth" });
  }

  async function count() {
    setCounted("sending");
    const tally = await addToTally(TOOL, [shown.style]);
    if (tally) { setEveryone(tally); setCounted("done"); }
    else setCounted("failed");
  }

  const favourite = everyone && everyone.total >= TALLY_MIN
    ? styles.reduce((best, item) => (everyone.counts[item.id] ?? 0) > (everyone.counts[best.id] ?? 0) ? item : best, styles[0])
    : null;

  return (
    <div className="namer">
      {friend && (
        <section className="namer-friend" aria-labelledby="friend-title">
          <canvas ref={friendCard} width={sizes.square.width} height={sizes.square.height} role="img" aria-label={`${friend.name}, ${styleById(friend.style)!.phrase} লেখা`} />
          <div>
            {friend.from ? <>
              <p className="namer-kicker">উপহার এসেছে</p>
              <h2 id="friend-title">{friend.from} তোমার নামটা সাজিয়ে পাঠিয়েছে!<br /><span>{friend.name}, {styleById(friend.style)!.phrase}</span></h2>
              <div className="namer-friend-actions">
                <button type="button" className="kit-primary" onClick={takeGift}>ছবিটা নিয়ে নাও</button>
                <a className="kit-link" href="#studio">এবার তুমি কারো নাম সাজাও</a>
              </div>
            </> : <>
              <p className="namer-kicker">বন্ধুর নাম এসেছে</p>
              <h2 id="friend-title">{possessive(friend.name)} নাম, {styleById(friend.style)!.phrase}।<br /><span>এবার তোমার পালা!</span></h2>
              <a className="kit-primary" href="#studio">আমারটা সাজাই</a>
            </>}
          </div>
        </section>
      )}

      <div className="namer-stage" id="studio">
        <canvas ref={stage} width={sizes.stage.width} height={sizes.stage.height} role="img" aria-label={`${name || PLACEHOLDER_NAME}, ${style.phrase} লেখা`} />
      </div>

      <div className="namer-controls">
        <label className="namer-field">
          <span>কার নাম সাজাবে? <small>বাংলা বা ইংরেজিতে, {bn(MAX_NAME)} অক্ষরের মধ্যে</small></span>
          <input value={design.name} maxLength={MAX_NAME} onChange={event => update({ name: event.target.value })} placeholder="যেমন: রাফি বা Nadia" autoComplete="nickname" aria-invalid={blocked || undefined} aria-describedby="name-note" />
          <small id="name-note" className={blocked ? "namer-warn" : "namer-sr"} role={blocked ? "alert" : undefined}>{blocked ? "এই নামটা সাজানো যাবে না। অন্য নাম লেখো।" : ""}</small>
        </label>

        <fieldset className="namer-styles">
          <legend>কোন ঢঙে?</legend>
          <div className="namer-styles-row">
            {styles.map((item, index) => (
              <button type="button" key={item.id} aria-pressed={item.id === shown.style} onClick={() => update({ style: item.id as StyleId })}>
                <canvas ref={element => { chips.current[index] = element; }} width={sizes.stage.width * CHIP_SCALE} height={sizes.stage.height * CHIP_SCALE} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <StickyNext show={Boolean(name) && !resultVisible} title={<strong>{name} · {style.label}</strong>} sub={line} href="#result" label="ছবিটা নাও" />

      <section className="namer-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="namer-result-head">
          <h2 id="result-title">{name ? <><em>{possessive(name)}</em> নাম সাজানো হয়ে গেছে</> : "নামটা লিখলেই সাজানো হবে"}</h2>
          <p>{name ? line : "ওপরে নামটা লেখো। ঢং যখন খুশি বদলাও।"}</p>
        </div>

        <div className="namer-result-body">
          <figure className="kit-card namer-card" data-format={format}>
            <canvas ref={card} width={sizes[format].width} height={sizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="namer-sr">{name || PLACEHOLDER_NAME}, {style.phrase} লেখা। {line}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="namer-side">
            <fieldset className="kit-chips">
              <legend>কোথায় দেবে?</legend>
              {formats.map(item => <button type="button" key={item.id} aria-pressed={format === item.id} onClick={() => setFormat(item.id)}>{item.label}</button>)}
            </fieldset>
            {format === "square" && <p className="namer-note">গোল করে কাটলেও নামটা পুরো দেখা যাবে।</p>}

            <div className="namer-gift">
              <button type="button" className="namer-gift-toggle" aria-pressed={gift} onClick={() => setGift(value => !value)}>
                <b aria-hidden="true" />বন্ধুর নাম সাজিয়ে পাঠাচ্ছি
              </button>
              {gift && <label className="namer-field">
                <span>তোমার নাম <small>ছবিতে লেখা থাকবে, কে পাঠাল</small></span>
                <input value={design.from} maxLength={MAX_NAME} onChange={event => update({ from: event.target.value })} placeholder="যেমন: তানিয়া" autoComplete="nickname" aria-invalid={fromBlocked || undefined} />
                {fromBlocked && <small className="namer-warn" role="alert">এই নামটা লেখা যাবে না।</small>}
              </label>}
            </div>

            <ShareBar tool={TOOL} fileName={`namer-design-${format}.png`} makeImage={() => designBlob(shown, format, site)} imageKey={`${state}|${format}`} caption={caption(shown)} state={state} disabled={!name}
              hint={!name ? "আগে নামটা লেখো।" : gift ? "লিংক খুললে বন্ধু দেখবে, তুমি ওর নাম সাজিয়ে পাঠিয়েছ।" : "লিংক খুললে বন্ধু তোমার নামটা এই ঢঙেই দেখবে, আর নিজেরটাও সাজাতে পারবে।"} />
          </div>
        </div>

        <div className="namer-everyone">
          {favourite && <p>সবচেয়ে প্রিয় ঢং: <strong>{favourite.label}</strong> <small>({bn(everyone!.total)} জনের গোনা)</small></p>}
          {name && (counted === "done"
            ? <p className="kit-status">গুনে নেওয়া হলো, ধন্যবাদ!</p>
            : <button type="button" className="kit-link" onClick={count} disabled={counted === "sending"}>{counted === "sending" ? "গোনা হচ্ছে…" : "আমার পছন্দের ঢংটাও গুনে নাও"}</button>)}
          {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          {name && counted !== "done" && <p className="namer-note">শুধু ঢংটা গোনা হয়, নাম কখনো না।</p>}
        </div>
      </section>
    </div>
  );
}
