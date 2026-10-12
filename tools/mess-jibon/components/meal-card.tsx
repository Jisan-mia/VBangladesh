"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, type CardContent } from "../lib/draw-card";
import { bn, commonLine, defaultPicks, messLine, momentNumber, moments, parseShareHash, percentOf, possessive, sections, serial, shareHash, tierFor, toggleMoment, MAX_HALL_LENGTH, MAX_NAME_LENGTH, TOTAL, type MealCard as Card, type MomentId } from "../lib/mess";

const TOOL = "mess-jibon";
// Below this, "৩ জন মিলিয়েছে" reads as an empty room rather than company.
const SOCIAL_PROOF_MIN = 50;
// "১০০% মানুষের আছে" after two votes is noise, not a finding.
const TALLY_MIN = 30;
const sectionMarks = ["ক", "খ", "গ", "ঘ", "ঙ"];

function cardFor(card: Card, friend: Card | null): CardContent {
  return { name: card.name, hall: card.hall, picked: card.picked, line: messLine(card.picked), match: commonLine(card.picked, friend) };
}

export function MealCard() {
  const [picked, setPicked] = useState<MomentId[]>(defaultPicks);
  const [name, setName] = useState("");
  const [hall, setHall] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Card | null>(null);
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [joined, setJoined] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const own: Card = useMemo(() => ({ picked, name, hall }), [picked, name, hall]);
  const card = useMemo(() => cardFor(own, friend), [own, friend]);
  const state = shareHash(own).slice(1);
  const line = messLine(picked);
  const tier = tierFor(picked.length);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared card replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("রাফির মেস সার্টিফিকেট মিল কার্ড").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, cardFor(friend, null), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  function toggle(id: MomentId) {
    setPicked(current => toggleMoment(current, id));
    // Changed holes make the old comparison stale; let them compare again.
    setJoined(current => current === "done" ? "idle" : current);
  }

  async function join() {
    setJoined("sending");
    // Only fixed moment ids are counted; the name and the hall or mess name never leave the link.
    const tally = await addToTally(TOOL, picked);
    if (tally) { setEveryone(tally); setJoined("done"); } else setJoined("failed");
  }

  const friendName = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";
  const ranked = joined === "done" && everyone && everyone.total >= TALLY_MIN
    ? moments.filter(moment => picked.includes(moment.id)).map(moment => ({ moment, percent: percentOf(everyone.counts[moment.id] ?? 0, everyone.total) })).sort((a, b) => b.percent - a.percent)
    : [];
  const caption = card.match
    ? `${card.match}। আমার হল-মেস জীবনের মিল কার্ডে ${bn(TOTAL)}-এ ${bn(picked.length)}টা ফুটো, খেতাব ${tier}। তোমার কয়টা?`
    : `আমার হল-মেস জীবনের মিল কার্ডে ${bn(TOTAL)}-এ ${bn(picked.length)}টা ফুটো, খেতাব ${tier}। ${line} তোমার কয়টা?`;

  return (
    <div className="mj">
      {friend && (
        <section className="mj-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName} মিল কার্ড`} />
          <div>
            <p className="mj-kicker">বন্ধু তার মিল কার্ড পাঠিয়েছে</p>
            <h2 id="friend-title">{friendName} কার্ডে {bn(TOTAL)}-এ <em>{bn(friend.picked.length)}টা</em> ফুটো।<br />তোমার কয়টা?</h2>
            <a className="kit-primary" href="#mj-card">আমারটা ফুটো করি</a>
          </div>
        </section>
      )}

      <div className="mj-table">
        <div className="mj-card" id="mj-card">
          <div className="mj-card-head">
            <p className="mj-card-title">মিল কার্ড<small>হল · হোস্টেল · মেস</small></p>
            <p className="mj-count" aria-live="polite"><span>{bn(TOTAL)}-এ</span><strong>{bn(picked.length)}</strong><span>টা ফুটো</span></p>
          </div>
          <p className="mj-tier">খেতাব: <strong>{tier}</strong>{friend && <span><i aria-hidden="true" /> মানে {friendName}ও আছে</span>}</p>
          {everyone && everyone.total >= SOCIAL_PROOF_MIN && <p className="mj-proof">এখন পর্যন্ত <strong>{bn(everyone.total)} জন</strong> নিজের মিল কার্ড মিলিয়েছে</p>}

          {sections.map((section, index) => (
            <fieldset className="mj-section" key={section.id}>
              <legend><span>{sectionMarks[index]}</span>{section.label}</legend>
              <div className="mj-grid">
                {moments.filter(moment => moment.section === section.id).map(moment => {
                  const theirs = friend?.picked.includes(moment.id);
                  return (
                    <button type="button" key={moment.id} className="mj-cell" aria-pressed={picked.includes(moment.id)} onClick={() => toggle(moment.id)}>
                      <span className="mj-hole" aria-hidden="true"><b>{serial(momentNumber(moment.id))}</b></span>
                      <span className="mj-label">{moment.label}{theirs && <span className="mj-sr"> (বন্ধুরও আছে)</span>}</span>
                      {theirs && <i className="mj-star" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <StickyNext show={picked.length > 0 && !resultVisible} title={<><strong>{bn(TOTAL)}-এ {bn(picked.length)}টা</strong> ফুটো</>} sub={line} href="#result" label="কার্ড দেখো" />

      <section className="mj-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="mj-result-head">
          <h2 id="result-title">{picked.length ? <>তোমার মিল কার্ডে <em>{bn(TOTAL)}-এ {bn(picked.length)}টা</em> ফুটো</> : "মিল কার্ড এখনো আস্ত"}</h2>
          <p>{picked.length ? <>খেতাব: <strong>{tier}</strong>। {line}</> : "ওপরের কার্ড থেকে যা যা তোমার হল বা মেস জীবনে হয়েছে, সেগুলোয় ট্যাপ করো।"}</p>
        </div>

        <div className="mj-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="mj-card-summary" />
            <figcaption id="mj-card-summary" className="mj-sr">মিল কার্ড{name.trim() ? `, ${name.trim()}` : ""}: {bn(TOTAL)}-এ {bn(picked.length)}টা ফুটো, খেতাব {tier}। {moments.filter(moment => picked.includes(moment.id)).map(moment => moment.label).join(", ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="mj-controls">
            <div className="mj-fields">
              <label className="mj-field">
                <span>নাম <small>না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <label className="mj-field">
                <span>হল, হোস্টেল বা মেসের নাম <small>না দিলেও চলবে</small></span>
                <input value={hall} maxLength={MAX_HALL_LENGTH} onChange={event => setHall(event.target.value)} placeholder="যেমন: সবুজ নীড়" autoComplete="off" />
              </label>
            </div>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="mess-jibon-mil-card.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption} state={state} disabled={!picked.length} hint={picked.length ? "লিংক পাঠালে রুমমেট নিজেরটা ফুটো করে দেখতে পারবে, তোমাদের কী কী মিলল।" : ""} />
            <p className="mj-also">মাসের মিল রেট বের করবে? <a href="/bhagabhagi#mil">ভাগাভাগি</a>-তে মোট বাজার আর সবার মিল লেখো, কে কত দেবে বের হয়ে যাবে।</p>
          </div>
        </div>

        {picked.length > 0 && (
          <div className="mj-everyone">
            <h3>সবার মিল কার্ডের সাথে মেলাবে?</h3>
            {joined !== "done" ? <>
              <p>দেখো কোন মুহূর্তটা প্রায় সবার আছে, আর কোনটা অল্প কয়েকজনের। শুধু ফুটোগুলো গোনা হবে। নাম বা হল-মেসের নাম যাবে না।</p>
              <button type="button" className="kit-secondary" onClick={join} disabled={joined === "sending"}>{joined === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {joined === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : !ranked.length ? (
              <p className="kit-status">যোগ হয়েছে। এখনো খুব কম মানুষ মিলিয়েছে, তাই হিসাব দেখানো যাচ্ছে না। রুমমেটদের লিংক পাঠাও।</p>
            ) : <>
              <p>{bn(everyone!.total)} জনের মিল কার্ডের সাথে মেলানো হলো।</p>
              <div className="mj-rare">
                <p><span>সবচেয়ে বেশি জনের সাথে মিলেছে</span><strong>{ranked[0].moment.card}</strong><em>{bn(ranked[0].percent)}% মানুষের</em></p>
                {ranked.length > 1 && <p><span>সবচেয়ে কম জনের সাথে মিলেছে</span><strong>{ranked.at(-1)!.moment.card}</strong><em>{ranked.at(-1)!.percent < 30 ? "মাত্র " : ""}{bn(ranked.at(-1)!.percent)}% মানুষের</em></p>}
              </div>
              <ul className="mj-bars">{ranked.map(({ moment, percent }) => <li key={moment.id}><span>{moment.card}</span><i style={{ width: `${percent}%` }} /><b>{bn(percent)}%</b></li>)}</ul>
            </>}
          </div>
        )}
      </section>
    </div>
  );
}
