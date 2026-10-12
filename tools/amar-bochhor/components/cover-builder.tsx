"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { hiss, sfx } from "../../../shared/game-sound";
import { SoundToggle } from "../../../shared/game-ui";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, PhotoPicker, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { coverBlob, drawCover } from "../lib/draw-cover";
import { bn, caption, cleanName, coverTitle, defaultYear, editorial, parseShareHash, owner, pickLabel, prompts, stateOf, wordId, DEFAULT_PICKS, EDITION, MAX_NAME, WORD, type Cover } from "../lib/barshiki";

const TOOL = "amar-bochhor";
// Percentages from a handful of people are noise ("১০০% মানুষের শব্দ ধৈর্য" after one vote).
const COMPARE_MIN = 20;
const words = prompts[WORD].options;

function summary(cover: Cover) {
  return `${coverTitle(cover)}। ${prompts.map((prompt, index) => `${prompt.label}: ${pickLabel(cover, index)}`).join("। ")}। সম্পাদকীয়: ${editorial(cover)}`;
}

export function CoverBuilder() {
  const [year, setYear] = useState(EDITION);
  const [picks, setPicks] = useState<number[]>([...DEFAULT_PICKS]);
  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [open, setOpen] = useState(-1);
  const [friend, setFriend] = useState<Cover | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const thumb = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const cover = useMemo<Cover>(() => ({ year, picks, name: cleanName(name) }), [year, picks, name]);
  const state = stateOf(cover);

  useEffect(() => {
    setYear(defaultYear(new Date()));
    // In-page anchors (#result, #make) also change the hash, so only a real shared cover counts.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) { setFriend(shared); setYear(shared.year); } };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(coverTitle(cover)).then(() => {
      if (cancelled) return;
      if (preview.current) {
        drawCover(preview.current, cover, format, site, photo);
        const small = thumb.current;
        if (small) {
          small.width = preview.current.width / 4;
          small.height = preview.current.height / 4;
          small.getContext("2d")?.drawImage(preview.current, 0, 0, small.width, small.height);
        }
      }
      if (friend && friendCanvas.current) drawCover(friendCanvas.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [cover, format, site, photo, friend]);

  function choose(prompt: number, option: number) {
    // A page turning to the next line of the সূচিপত্র; the last line closes with a soft chime.
    if (picks[prompt] !== option) { hiss(0.14, 0.07, 3200, "bandpass"); if (prompt + 1 === prompts.length) sfx.good(); }
    setPicks(current => current.map((pick, index) => index === prompt ? option : pick));
    // Walk down the সূচিপত্র like a form: the next line opens, the last one closes.
    setOpen(prompt + 1 < prompts.length ? prompt + 1 : -1);
    if (prompt === WORD) setCounted(current => current === "done" ? "idle" : current);
  }

  async function countMine() {
    setCounted("sending");
    const tally = await addToTally(TOOL, [wordId(cover)]);
    if (tally) { setEveryone(tally); setCounted("done"); sfx.good(); }
    else setCounted("failed");
  }

  const ranked = everyone ? words.map(word => ({ word, percent: Math.round(((everyone.counts[word.id] ?? 0) / Math.max(everyone.total, 1)) * 100) })).sort((a, b) => b.percent - a.percent).slice(0, 5) : [];

  return (
    <div className="by">
      {friend && (
        <section className="by-friend" aria-labelledby="by-friend-title">
          <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={summary(friend)} />
          <div>
            <p className="by-friend-kicker">বন্ধু তার বার্ষিকী পাঠিয়েছে</p>
            <h2 id="by-friend-title">{coverTitle(friend)}। বছরের শব্দ: <span>{pickLabel(friend, WORD)}</span></h2>
            <p>তোমার বছরটা কেমন গেল?</p>
            <a className="kit-primary" href="#make">আমারটা বানাই</a>
          </div>
        </section>
      )}

      <div className="by-desk" id="make">
        <div className="by-desk-head">
          <p><small>{owner(cover.name)}</small><b>বার্ষিকী</b><span>সংখ্যা {bn(year)}</span></p>
          <a className="by-thumb" href="#result" aria-label="পুরো প্রচ্ছদটা দেখো">
            <canvas ref={thumb} width={cardSizes.feed.width / 4} height={cardSizes.feed.height / 4} aria-hidden="true" />
          </a>
        </div>
        <div className="by-sheet">
          <p className="by-sheet-head"><span>সূচিপত্র</span><small>যেটা বদলাতে চাও, ট্যাপ করো</small><SoundToggle compact /></p>
          <ol className="by-lines">
            {prompts.map((prompt, index) => (
              <li key={prompt.id}>
                <button type="button" className="by-line" aria-expanded={open === index} aria-controls={`by-opt-${prompt.id}`} onClick={() => setOpen(current => current === index ? -1 : index)}>
                  <span className="by-line-label">{prompt.label}</span>
                  <span className="by-dots" aria-hidden="true" />
                  <strong key={picks[index]}>{pickLabel(cover, index)}</strong>
                  <svg viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1.5 6 6.5 11 1.5" /></svg>
                </button>
                <fieldset className="by-options" id={`by-opt-${prompt.id}`} hidden={open !== index}>
                  <legend className="by-sr">{prompt.label}</legend>
                  {prompt.options.map((option, optionIndex) => (
                    <button type="button" key={option.id} aria-pressed={picks[index] === optionIndex} onClick={() => choose(index, optionIndex)}>{option.label}</button>
                  ))}
                </fieldset>
              </li>
            ))}
          </ol>
          <label className="by-name">
            <span>প্রচ্ছদে কার নাম? <small>না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
        </div>
      </div>

      <StickyNext show={!resultVisible} title={<><strong>{bn(year)}</strong> সংখ্যা তৈরি</>} sub={`বছরের শব্দ: ${pickLabel(cover, WORD)}`} href="#result" label="প্রচ্ছদ দেখো" />

      <section className="by-result" id="result" ref={result} aria-labelledby="by-result-title">
        <h2 id="by-result-title">{coverTitle(cover)}</h2>
        <p className="by-editorial">“{editorial(cover)}”</p>
        <div className="by-result-body">
          <figure className="kit-card by-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="by-summary" />
            <figcaption id="by-summary" className="by-sr">{summary(cover)}</figcaption>
            {previewError && <p className="kit-status" role="alert">প্রচ্ছদটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="by-controls">
            <PhotoPicker value={photo} onChange={setPhoto} label="প্রচ্ছদে ছবি" />
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`barshiki-${year}.png`} makeImage={() => coverBlob(cover, format, site, photo)} imageKey={`${state}|${format}|${photo?.width ?? 0}`} caption={caption(cover)} state={state} hint="বন্ধুকে লিংক পাঠালে সে নিজেরটাও বানাতে পারবে।" />
          </div>
        </div>

        <div className="by-everyone">
          <h3>সবার বছরের শব্দ কী?</h3>
          {counted !== "done" || !everyone ? <>
            <p>তোমার শব্দ ‘{pickLabel(cover, WORD)}’ গোনায় যোগ করো, দেখো কোন শব্দ সবচেয়ে বেশি মানুষের। শুধু শব্দটা গোনা হয়, নাম বা ছবি যায় না।</p>
            <button type="button" className="kit-secondary" onClick={countMine} disabled={counted === "sending"}>{counted === "sending" ? "গোনা হচ্ছে…" : "আমার শব্দটাও গোনো"}</button>
            {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : everyone.total < COMPARE_MIN ? (
            <p className="kit-status">গোনা হয়েছে। এখনো মাত্র {bn(everyone.total)} জন যোগ দিয়েছে, তাই হিসাব দেখানো যাচ্ছে না। বন্ধুদের লিংক পাঠাও।</p>
          ) : (
            <ul className="by-bars">{ranked.map(({ word, percent }) => <li key={word.id} data-mine={word.id === wordId(cover)}><span>{word.label}</span><i style={{ width: `${percent}%` }} /><b>{bn(percent)}%</b></li>)}</ul>
          )}
        </div>
      </section>
    </div>
  );
}
