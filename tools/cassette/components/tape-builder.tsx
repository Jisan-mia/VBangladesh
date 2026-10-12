"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, hiss, sfx, tone } from "../../../shared/game-sound";
import { SoundToggle } from "../../../shared/game-ui";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, type CardContent } from "../lib/draw-card";
import { SIDE, bn, cleanTitle, commonLine, commonSongs, credit, defaultSlots, inlays, kinds, parseShareHash, placeSong, seasonLabel, seasonOf, shareHash, shownTitle, slotLabel, songs, tallyId, tapeLine, titleIdeas, MAX_TITLE_LENGTH, type KindId, type Tape } from "../lib/cassette";
import { JCard } from "./j-card";

const TOOL = "cassette";
// "৮০% ক্যাসেটে আছে" after three votes is noise; wait for a real crowd.
const TALLY_MIN = 20;

// A song dropping into its slot: the tape deck's plastic clunk.
function clunk() { tone(120, 0.09, 0.2, "square", 0, 70); hiss(0.05, 0.1, 900); buzz(10); }

export function TapeBuilder() {
  const [slots, setSlots] = useState<number[]>([...defaultSlots]);
  const [title, setTitle] = useState("");
  const [color, setColor] = useState(0);
  const [when, setWhen] = useState("");
  const [active, setActive] = useState<number | null>(null);
  const [filter, setFilter] = useState<KindId | "all">("all");
  const [spin, setSpin] = useState(0);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Tape | null>(null);
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [joined, setJoined] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [previewError, setPreviewError] = useState(false);
  const picker = useRef<HTMLDialogElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const tape: Tape = useMemo(() => ({ slots, title, color, when }), [slots, title, color, when]);
  const line = tapeLine(slots);
  const match = commonLine(slots, friend);
  const card: CardContent = useMemo(() => ({ ...tape, line, match }), [tape, line, match]);
  const state = shareHash(tape).slice(1);

  useEffect(() => {
    setWhen(seasonOf(new Date()));
    // In-page anchors (#result) also change the hash, so only a real shared tape replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("রাফির মিক্সটেপ · সাইড A").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site]);

  function open(slot: number) {
    setActive(slot);
    picker.current?.showModal();
  }

  function choose(song: number) {
    if (active === null) return;
    setSlots(current => placeSong(current, active, song));
    setSpin(value => value + 1);
    clunk();
    setJoined(current => current === "done" ? "idle" : current);
    picker.current?.close();
  }

  async function join() {
    setJoined("sending");
    // Only listed song ids are counted; the tape's name never leaves the link.
    const tally = await addToTally(TOOL, slots.map(tallyId));
    if (tally) { setEveryone(tally); setJoined("done"); sfx.good(); } else setJoined("failed");
  }

  const now = active === null ? null : songs[slots[active]];
  const shown = shownTitle(tape);
  const season = seasonLabel(when);
  const titles = slots.map(slot => songs[slot].title);
  const caption = `${match ? `${match}। ` : ""}${shown}${season ? ` · ${season}` : ""}: ${titles.slice(0, 3).join(", ")}… দশ গানের ক্যাসেট বানালাম। তোমার ক্যাসেটে কোন গান?`;
  const ranked = everyone && everyone.total >= TALLY_MIN
    ? songs.map((song, index) => ({ song, index, percent: Math.round(((everyone.counts[tallyId(index)] ?? 0) / everyone.total) * 100) })).sort((a, b) => b.percent - a.percent).slice(0, 5)
    : [];
  const list = songs.map((song, index) => ({ song, index })).filter(({ song }) => filter === "all" || song.kind === filter);

  return (
    <div className="cs">
      {friend && (
        <section className="cs-friend" aria-labelledby="cs-friend-title">
          <p className="cs-kicker">বন্ধু তার ক্যাসেট পাঠিয়েছে</p>
          <h2 id="cs-friend-title">{friend.title ? `“${friend.title}”` : "বন্ধুর ক্যাসেট"}, দশটা গান।<br /><span>তোমার ক্যাসেটে কোন গান?</span></h2>
          <JCard tape={friend} common={commonSongs(slots, friend)} />
          <a className="kit-primary" href="#cs-tape">আমার ক্যাসেট বানাই</a>
        </section>
      )}

      <div className="cs-stage" id="cs-tape">
        <p className="cs-hint">যে গানটা বদলাবে, তার লাইনে ট্যাপ করো। <SoundToggle compact /></p>
        <JCard tape={tape} onPick={open} spin={spin} />
        <div className="cs-dress">
          <label className="cs-field">
            <span>ক্যাসেটের নাম <small>{bn(MAX_TITLE_LENGTH)} অক্ষরের মধ্যে</small></span>
            <input value={title} maxLength={MAX_TITLE_LENGTH + 10} onChange={event => setTitle(event.target.value)} onBlur={() => setTitle(current => cleanTitle(current))} placeholder="যেমন: রাফির মিক্সটেপ" autoComplete="off" />
          </label>
          <div className="cs-ideas" role="group" aria-label="নামের আইডিয়া">
            {titleIdeas.map(idea => <button type="button" key={idea} aria-pressed={cleanTitle(title) === idea} onClick={() => setTitle(idea)}>{idea}</button>)}
          </div>
          <fieldset className="cs-colors">
            <legend>জে-কার্ডের রং</legend>
            {inlays.map(inlay => <button type="button" key={inlay.id} aria-pressed={color === inlay.id} aria-label={inlay.label} title={inlay.label} style={{ background: inlay.paper }} onClick={() => setColor(inlay.id)} />)}
          </fieldset>
        </div>
      </div>

      <dialog ref={picker} className="cs-picker" aria-labelledby="cs-picker-title" onClose={() => setActive(null)} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        <div className="cs-picker-inner">
          <div className="cs-picker-head">
            <div className="cs-picker-top">
              <h2 id="cs-picker-title">{active === null ? "গান বেছে নাও" : <>সাইড {active < SIDE ? "A" : "B"}-র <em>{bn((active % SIDE) + 1)} নম্বরে</em> কোন গান?</>}</h2>
              <button type="button" className="cs-close" onClick={() => picker.current?.close()}>বন্ধ করো</button>
            </div>
            {now && <p className="cs-now">এখন আছে: <b>{now.title}</b> · {credit(now)}</p>}
            <fieldset className="kit-chips cs-filter">
              <legend className="cs-sr">কোন ধরনের গান?</legend>
              <button type="button" aria-pressed={filter === "all"} onClick={() => setFilter("all")}>সব</button>
              {kinds.map(kind => <button type="button" key={kind.id} aria-pressed={filter === kind.id} onClick={() => setFilter(kind.id)}>{kind.label}</button>)}
            </fieldset>
          </div>
          <ul className="cs-songs">
            {list.map(({ song, index }) => {
              const slot = slots.indexOf(index);
              return (
                <li key={index}>
                  <button type="button" aria-pressed={slot >= 0} onClick={() => choose(index)}>
                    <b>{song.title}</b><small>{credit(song)}</small>
                    {slot >= 0 && <span className="cs-slot" aria-label={`ক্যাসেটের ${slotLabel(slot)}-এ আছে`}>{slotLabel(slot)}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="cs-source"><b>সূত্র ও যাচাই:</b> গানের নাম আর শিল্পী বা গীতিকারের নাম বাংলা উইকিপিডিয়া, গীতবিতান আর শিল্পী-ব্যান্ডের পাতা দেখে মিলিয়ে নেওয়া। ‘কথা-সুর’ লেখা থাকলে নামটা গীতিকার-সুরকারের। এখানে শুধু নাম, কোনো গানের কথা বা অডিও নেই। ভুল চোখে পড়লে পাতার নিচের বক্সে জানাও।</p>
        </div>
      </dialog>

      <StickyNext show={!resultVisible && active === null} title={<><strong>দশটা</strong> গান তোলা হলো</>} sub={line} href="#result" label="ক্যাসেটটা দেখো" />

      <section className="cs-result" id="result" ref={result} aria-labelledby="cs-result-title">
        <div className="cs-result-head">
          <h2 id="cs-result-title">তোমার ক্যাসেট তৈরি</h2>
          <p>{line}</p>
        </div>
        <div className="cs-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="cs-card-summary" />
            <figcaption id="cs-card-summary" className="cs-sr">{shown}{season ? `, ${season}` : ""}। সাইড A: {titles.slice(0, SIDE).join(", ")}। সাইড B: {titles.slice(SIDE).join(", ")}। {line} {match}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="cs-controls">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="amar-cassette.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption} state={state} hint="লিংক পাঠালে বন্ধু নিজেরটা বানিয়ে দেখতে পাবে, কোন গান দুজনেরই আছে।" />
          </div>
        </div>

        <div className="cs-everyone">
          <h3>সবার ক্যাসেটে কোন গান বেশি?</h3>
          {joined !== "done" ? <>
            <p>তোমার দশটা গান সবার হিসাবে যোগ করতে পারো। ক্যাসেটের নাম যাবে না, শুধু কোন গান সেটা গোনা হবে।</p>
            <button type="button" className="kit-secondary" onClick={join} disabled={joined === "sending"}>{joined === "sending" ? "যোগ হচ্ছে…" : "সবার সাথে মেলাও"}</button>
            {joined === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : ranked.length && everyone ? <>
            <p>{bn(everyone.total)} জনের ক্যাসেটের সাথে মেলানো হলো।</p>
            <ul className="cs-bars">{ranked.map(({ song, index, percent }) => <li key={index} data-mine={slots.includes(index) || undefined}><span>{song.title}</span><i style={{ width: `${Math.max(percent, 2)}%` }} /><b>{bn(percent)}%</b></li>)}</ul>
          </> : <p className="kit-status">যোগ হয়েছে। এখনো খুব কম মানুষ ক্যাসেট বানিয়েছে, তাই কোন গান এগিয়ে, দেখানো যাচ্ছে না। বন্ধুদের লিংক পাঠাও।</p>}
        </div>
      </section>
    </div>
  );
}
