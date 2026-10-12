"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import { SoundToggle } from "../../../shared/game-ui";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, PhotoPicker, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, drawSwatch } from "../lib/draw-print";
import { backdropById, backdrops, bn, caption, createCard, parseShareHash, possessive, shareHash, todayLocal, DEFAULT_PRINT, MAX_NAME, type BackdropId, type Print } from "../lib/studio";

const TOOL = "studior-chhobi";
// Below this, "৩ জন ছবি তুলেছে" reads as an empty studio rather than social proof.
const SOCIAL_PROOF_MIN = 50;
// Percentages from a handful of people are noise.
const COMPARE_MIN = 20;
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

// The studio camera: a bright snap, then the shutter clacking shut. Plays with the flash.
function shutter() { hiss(0.04, 0.12, 4500, "highpass"); tone(1400, 0.03, 0.08, "square"); tone(700, 0.05, 0.1, "square", 0.07); buzz(10); }

export function StudioBuilder() {
  const [print, setPrint] = useState<Print>(DEFAULT_PRINT);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [friend, setFriend] = useState<Print | null>(null);
  const [site, setSite] = useState("");
  const [touched, setTouched] = useState(false);
  const [flash, setFlash] = useState(0);
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const swatches = useRef<Array<HTMLCanvasElement | null>>([]);
  const send = useRef<HTMLDivElement>(null);
  const sendVisible = useInView(send);
  const card = useMemo(() => createCard(print, friend), [print, friend]);
  const hash = shareHash(print).slice(1);
  const backdrop = backdropById(print.backdrop);

  useEffect(() => {
    // In-page anchors (#studio, #send) also change the hash, so only a real shared print counts.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      setPrint(current => ({ ...current, backdrop: shared.backdrop }));
    };
    readFriend();
    setPrint(current => ({ ...current, date: current.date || todayLocal() }));
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    swatches.current.forEach((canvas, index) => { if (canvas) drawSwatch(canvas, backdrops[index].id); });
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(card.line + card.name).then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site, photo);
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, photo, friend]);

  function update(patch: Partial<Print>) {
    setPrint(current => ({ ...current, ...patch }));
    setTouched(true);
  }

  function choose(id: BackdropId) {
    if (id !== print.backdrop) { setFlash(count => count + 1); shutter(); }
    update({ backdrop: id });
    setCounted(current => current === "done" ? "idle" : current);
  }

  function pickPhoto(next: Photo | null) {
    setPhoto(next);
    if (next) { setFlash(count => count + 1); shutter(); setTouched(true); }
  }

  async function countMine() {
    setCounted("sending");
    const tally = await addToTally(TOOL, [print.backdrop]);
    if (tally) { setEveryone(tally); setCounted("done"); sfx.good(); }
    else setCounted("failed");
  }

  const friendName = friend?.name ? possessive(friend.name) : "বন্ধুর";
  const friendBackdrop = friend ? backdropById(friend.backdrop) : null;

  return (
    <div className="sc">
      {friend && friendBackdrop && (
        <section className="sc-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName} স্টুডিওর ছবি, ${possessive(friendBackdrop.label)} সামনে`} />
          <div>
            <p className="sc-friend-kicker">স্টুডিও থেকে একটা ছবি এসেছে</p>
            <h2 id="friend-title">{friendName} ছবি, {possessive(friendBackdrop.label)} সামনে।<br /><span>এবার তোমার পালা!</span></h2>
            <a className="kit-primary" href="#studio" onClick={() => choose(friendBackdrop.id)}>একই ব্যাকড্রপে আমিও তুলি</a>
          </div>
        </section>
      )}

      {everyone && everyone.total >= SOCIAL_PROOF_MIN && <p className="sc-proof">এখন পর্যন্ত <strong>{bn(everyone.total)} জন</strong> স্টুডিওতে ছবি তুলেছে</p>}

      <div className="sc-studio" id="studio">
        <fieldset className="sc-backdrops">
          <legend>কোন ব্যাকড্রপের সামনে দাঁড়াবে?</legend>
          <div className="sc-backdrop-row">
            {backdrops.map((item, index) => (
              <button type="button" key={item.id} aria-pressed={item.id === print.backdrop} onClick={() => choose(item.id)}>
                <canvas ref={element => { swatches.current[index] = element; }} width={132} height={100} aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
          <SoundToggle compact />
        </fieldset>

        <div className="sc-photo">
          <PhotoPicker value={photo} onChange={pickPhoto} width={900} label="তোমার ছবি" note="মাঝের ফ্রেমে বসবে। ফোনেই থাকে, কোথাও যায় না" />
        </div>

        <figure className="kit-card sc-print" data-format={format}>
          <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="sc-summary" />
          <span className="sc-flash" key={flash} data-on={flash > 0} aria-hidden="true" />
          <figcaption id="sc-summary" className="sc-sr">স্টুডিওর ছবি: {backdrop.label} ব্যাকড্রপ, পাশে প্লাস্টিকের ফুলদানি{photo ? ", মাঝখানে তোমার ছবি" : ", মাঝখানে একটা ছায়া-মানুষ"}{card.dateText ? `, কোণে তারিখ ${card.dateText}` : ""}। নিচে কলমে লেখা: {card.name ? `${card.name}, ` : ""}{card.line}</figcaption>
          {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>

        <div className="sc-fields">
          <label className="sc-field" id="sc-name">
            <span>নাম <small>ছবির নিচে কলমে লেখা থাকবে</small></span>
            <input value={print.name} maxLength={MAX_NAME + 6} onChange={event => update({ name: event.target.value })} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
          <label className="sc-field">
            <span>তারিখ <small>কোণে কমলা অক্ষরে</small></span>
            <input type="date" value={print.date} min="1950-01-01" max="2099-12-31" onChange={event => update({ date: event.target.value })} />
          </label>
        </div>

        <div className="sc-send" id="send" ref={send}>
          <h2>“{card.line}”</h2>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={TOOL} fileName={`studior-chhobi-${print.backdrop}.png`} makeImage={() => cardBlob(card, format, site, photo)} imageKey={`${hash}|${format}|${card.line}|${photo ? flash : "-"}`} caption={caption(print, friend)} state={hash} hint="লিংক খুললে বন্ধু একই ব্যাকড্রপ আর তারিখ দেখবে, তোমার ছবি ছাড়া। ছবি শুধু তোমার ফোনে থাকে।" />
        </div>
      </div>

      <section className="sc-everyone" aria-labelledby="everyone-title">
        <h2 id="everyone-title">সবাই কোন ব্যাকড্রপে দাঁড়াচ্ছে?</h2>
        {counted !== "done" || !everyone ? <>
          <p>তোমার বাছাইটাও গুনে দেখাই? শুধু ব্যাকড্রপের নাম (‘{backdrop.label}’) গোনা হবে। ছবি, নাম বা তারিখ না।</p>
          <button type="button" className="kit-secondary" onClick={countMine} disabled={counted === "sending"}>{counted === "sending" ? "গোনা হচ্ছে…" : "আমারটাও গোনো"}</button>
          {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
        </> : everyone.total < COMPARE_MIN ? <p className="kit-status">গোনা হয়ে গেছে! এখনো খুব কম মানুষ ছবি তুলেছে, তাই হিসাবটা এখনই দেখানো যাচ্ছে না। বন্ধুদের লিংক পাঠাও।</p> : <>
          <ul className="sc-bars">{backdrops.map(item => { const share = percent(everyone.counts[item.id] ?? 0, everyone.total); return <li key={item.id} data-mine={item.id === print.backdrop}><span>{item.label}{item.id === print.backdrop ? " · তুমি" : ""}</span><i style={{ width: `${share}%` }} /><b>{bn(share)}%</b></li>; })}</ul>
          <p className="kit-status">{bn(everyone.total)} জনের বাছাই থেকে। এটা একটুখানির খেলা, কোনো জরিপ না।</p>
        </>}
      </section>

      <StickyNext show={touched && !sendVisible} title={<><strong>{backdrop.label}</strong> তৈরি</>} sub={photo ? card.line : "নিজের ছবি দিলে আরও জমবে"} href="#send" label="শেয়ার করো" />
    </div>
  );
}
