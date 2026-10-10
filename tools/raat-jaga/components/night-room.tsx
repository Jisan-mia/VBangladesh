"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  bdKickoff, bn, bnYear, createCard, hosts, nightById, nights, nightTitle, parseShareHash, possessive, scoreLine, scoreNote, shareHash,
  toggleNight, yearOf, years, DEFAULT_PICKS, MAX_NAME_LENGTH, type NightId, type Shared,
} from "../lib/nights";

const TOOL = "raat-jaga";
// Percentages from a handful of people are noise ("১০০% জেগেছে" after one vote).
const COMPARE_MIN = 20;
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

function StarIcon() {
  return <svg className="rj-star" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.8 6.2 6.7.7-5 4.5 1.4 6.6L12 17.1l-5.9 3.4 1.4-6.6-5-4.5 6.7-.7z" /></svg>;
}

export function NightRoom() {
  const [selected, setSelected] = useState<NightId[]>(DEFAULT_PICKS);
  const [lastTapped, setLastTapped] = useState<NightId>("2026-final");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const own = useMemo(() => ({ selected, name }), [selected, name]);
  const card = useMemo(() => createCard(own, friend), [own, friend]);
  const state = shareHash(own).slice(1);
  const friendName = friend?.name || "তোমার বন্ধু";

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared link replaces the friend.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      // Start blank so "দুজনেই জেগেছিলাম" only counts nights this person ticked themselves.
      setSelected([]);
    };
    readFriend();
    setSite(window.location.host);
    window.addEventListener("hashchange", readFriend);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("বিশ্বকাপের রাত").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  function toggle(id: NightId) {
    // Functional update: two quick taps before a re-render must both count.
    setSelected(current => toggleNight(current, id));
    setLastTapped(id);
    setCompared(current => current === "done" ? "idle" : current);
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, selected);
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const onScreen = selected.includes(lastTapped) ? lastTapped : selected.at(-1);
  const screen = onScreen ? nightById(onScreen) : null;
  const ranked = compared === "done" && everyone ? selected.map(id => ({ night: nightById(id), share: percent(everyone.counts[id] ?? 0, everyone.total) })).sort((a, b) => a.share - b.share) : [];
  const common = friend ? selected.filter(id => friend.selected.includes(id)).length : 0;
  const caption = common
    ? `${friend?.name || "বন্ধু"} আর আমি বিশ্বকাপের ${bn(common)} রাত একসাথে জেগেছি! ২০টার মধ্যে আমি জেগেছি ${bn(card.count)} রাত। তুমি কয় রাত?`
    : `বিশ্বকাপের ২০টা রাতের মধ্যে ${bn(card.count)} রাত জেগেছি, চা গেছে ${bn(card.cups)} কাপ! তুমি কয় রাত জেগেছ?`;

  return (
    <div className="rj">
      {friend && (
        <section className="rj-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name ? possessive(friend.name) : "বন্ধুর"} বিশ্বকাপের রাতের কার্ড`} />
          <div>
            <p className="rj-kicker">তোমার জন্য একটা রাতের হিসাব এসেছে</p>
            <h2 id="friend-title">{friendName} ২০-এ {bn(friend.selected.length)} রাত জেগেছে।<br /><span>তুমি কয় রাত?</span></h2>
            <a className="kit-primary" href="#nights">আমার রাতগুলো দাগাই</a>
          </div>
        </section>
      )}

      <div className="rj-room">
        <div className="rj-tv">
          <svg className="rj-antenna" viewBox="0 0 120 40" aria-hidden="true"><path d="M60 38 28 3M60 38 94 6" /><circle cx="60" cy="38" r="4" /></svg>
          <div className="rj-cover" aria-hidden="true" />
          <div className="rj-cabinet" aria-live="polite">
            <div className="rj-screen" data-on={Boolean(screen)} key={onScreen ?? "off"}>
              {screen ? <>
                <small>{nightTitle(screen)}</small>
                <strong>{scoreLine(screen)}</strong>
                <small>{bdKickoff(screen.kickoff).time}{scoreNote(screen) ? ` · ${scoreNote(screen)}` : ""}</small>
              </> : <small>{friend ? `${possessive(friendName)} তারাগুলো জানালায়। এবার তোমার রাত দাগাও।` : "নিচের তালিকায় যে রাতগুলো জেগেছিলে, ছুঁয়ে দাও"}</small>}
            </div>
            <span className="rj-knobs" aria-hidden="true"><i /><i /><b /></span>
          </div>
        </div>
        <div className="rj-window" aria-hidden="true">
          {nights.map(night => (
            <i key={night.id} style={{ left: `${8 + night.star[0] * 84}%`, top: `${8 + night.star[1] * 84}%` }} data-on={card.selected.has(night.id)} data-friend={Boolean(friend?.selected.includes(night.id))} />
          ))}
        </div>
        <svg className="rj-tea" viewBox="0 0 40 34" aria-hidden="true"><path className="rj-steam" d="M15 10c-3-3 3-5 0-9M23 10c-3-3 3-5 0-9" /><path d="M7 14h24l-2 14a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4ZM31 17h3a4 4 0 0 1 0 8h-4" /></svg>
        <p className="rj-count">
          <span className="rj-count-big"><b>{bn(nights.length)}</b>-এ <strong>{bn(card.count)}</strong> রাত</span>
          <span className="rj-count-sub">{bn(card.cups)} কাপ চা · {bn(card.hours)} ঘণ্টা ঘুম গেল <em>মজার হিসাব</em></span>
        </p>
      </div>

      <div className="rj-sheet" id="nights">
        <p className="rj-rule">এখানে রাত মানে <strong>বাংলাদেশ সময় রাত ১১টা থেকে ভোর ৫টার মধ্যে</strong> শুরু হওয়া ম্যাচ।</p>
        {years.map(year => (
          <fieldset className="rj-year" key={year}>
            <legend>{bnYear(year)} <span>{hosts[year]}</span></legend>
            {nights.filter(night => yearOf(night) === year).map(night => {
              const when = bdKickoff(night.kickoff);
              const note = scoreNote(night);
              return (
                <button type="button" key={night.id} className="rj-night" aria-pressed={card.selected.has(night.id)} onClick={() => toggle(night.id)}>
                  <span className="rj-when"><strong>{when.time}</strong><small>{when.date}</small></span>
                  <span className="rj-match">
                    <small>{night.stage}{friend?.selected.includes(night.id) && <em className="rj-also">{friend.name ? `${friend.name}ও` : "বন্ধুও"}</em>}</small>
                    <strong>{scoreLine(night)}</strong>
                    {note && <small>{note}</small>}
                  </span>
                  <StarIcon />
                </button>
              );
            })}
          </fieldset>
        ))}
        <p className="rj-source">সূত্র/যাচাই: প্রতিটা ম্যাচের তারিখ, স্কোর আর শুরুর সময় ফিফার ম্যাচ রিপোর্ট ও উইকিপিডিয়ার ম্যাচ-পাতা থেকে নেওয়া, বাংলাদেশ সময়ে (UTC+6) বদলানো। ২০২২ ফাইনাল শুরু হয়েছিল রাত ৯টায়, আর ২০০২-এর সব খেলা দিনের বেলায়, তাই সেগুলো এই তালিকায় নেই।</p>
      </div>

      <StickyNext show={card.count > 0 && !resultVisible} title={<><strong>{bn(card.count)} রাত</strong> জেগেছ</>} sub={card.line} href="#result" label="কার্ডটা দেখো" />

      <section className="rj-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="rj-result-head">
          <h2 id="result-title">{card.count ? <>তোমার আকাশে <em>{bn(card.count)}টা</em> তারা</> : "তোমার আকাশ এখনো ফাঁকা"}</h2>
          <p>{card.count ? card.line : "ওপরের তালিকা থেকে যে রাতগুলো জেগেছিলে, ছুঁয়ে দাও।"}</p>
        </div>
        <div className="rj-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="rj-sr">{card.headline}। {nights.filter(night => card.selected.has(night.id)).map(night => `${nightTitle(night)}: ${scoreLine(night)}`).join("; ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="rj-controls">
            <label className="rj-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="raat-jaga.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption} state={state} disabled={!card.count} hint={card.count ? "লিংক পেলে বন্ধু তোমার আকাশ দেখবে, নিজের রাত দাগালে দেখবে কোন রাতগুলো দুজনেই জেগেছিলে।" : ""} />
          </div>
        </div>

        {card.count > 0 && (
          <div className="rj-everyone">
            <h3>সবার সাথে মিলিয়ে দেখবে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>দেখো কোন রাতে প্রায় সবাই জেগেছিল, আর কোনটা শুধু তোমার মতো অল্প কয়েকজনের। নাম যাবে না, শুধু কোন কোন ম্যাচ দাগিয়েছ সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : everyone.total < COMPARE_MIN ? <p className="kit-status">{bn(everyone.total)} জনের সাথে মেলানো হলো। এখনো খুব কম মানুষ, তাই হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও!</p> : <>
              <p>{bn(everyone.total)} জনের সাথে মেলানো হলো।</p>
              <div className="rj-rare">
                <p><span>তোমার সবচেয়ে বিরল রাত</span><strong>{nightTitle(ranked[0].night)}: {scoreLine(ranked[0].night)}</strong><em>{ranked[0].share < 30 ? "মাত্র " : ""}{bn(ranked[0].share)}% জেগেছিল</em></p>
                {ranked.length > 1 && <p><span>যে রাতে প্রায় সবাই জেগেছিল</span><strong>{nightTitle(ranked.at(-1)!.night)}: {scoreLine(ranked.at(-1)!.night)}</strong><em>{bn(ranked.at(-1)!.share)}% জেগেছিল</em></p>}
              </div>
            </>}
          </div>
        )}
      </section>
    </div>
  );
}
