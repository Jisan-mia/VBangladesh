"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { drawInvite, drawReply, inviteBlob, replyBlob } from "../lib/draw-invite";
import { cleanInvite, cleanMapLink, cleanName, dateText, humanLine, inviteTitle, occasionById, occasions, parseShareHash, replyHash, replyLine, replyTitle, replyTo, shareHash, timeText, titleOf, MAX_MAP, MAX_NAME, MAX_PLACE, type Invite, type OccasionId, type Shared } from "../lib/invite";

const TOOL = "dawat";

/** The sample date: the coming ১২ ডিসেম্বর, deep in wedding season. */
function sampleDate(now: Date) {
  const year = now.getMonth() === 11 && now.getDate() > 12 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-12-12`;
}

function inviteSummary(invite: Invite) {
  return [titleOf(invite), dateText(invite.date, true), timeText(invite.time), invite.place].filter(Boolean).join(" · ");
}

export function InviteBuilder() {
  const [picked, setPicked] = useState<OccasionId | null>(null);
  // null = still the occasion's sample, so switching occasion swaps the sample but never what someone typed.
  const [a, setA] = useState<string | null>(null);
  const [b, setB] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [place, setPlace] = useState<string | null>(null);
  const [date, setDate] = useState(() => sampleDate(new Date()));
  const [map, setMap] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [replying, setReplying] = useState(false);
  const [guest, setGuest] = useState("");
  const [pick, setPick] = useState(0);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const replyCanvas = useRef<HTMLCanvasElement>(null);
  const guestInput = useRef<HTMLInputElement>(null);
  // Always rendered: useInView attaches on mount, before a shared card is read from the hash.
  const friendBox = useRef<HTMLDivElement>(null);
  const send = useRef<HTMLDivElement>(null);
  const sendVisible = useInView(send);
  const friendVisible = useInView(friendBox);

  const occasionId = picked ?? friend?.occasion ?? "biye";
  const occasion = occasionById(occasionId);
  const [first, second] = occasion.fields;
  const mapLink = cleanMapLink(map);
  const invite = useMemo(() => cleanInvite({
    occasion: occasionId, a: a ?? first.sample, b: b ?? second?.sample ?? "", date,
    time: time ?? occasion.time, place: place ?? occasion.place, map: mapLink,
  }), [occasionId, a, b, date, time, place, mapLink, first.sample, second, occasion.time, occasion.place]);
  const state = shareHash(invite).slice(1);
  const invited = friend && friend.guest === null ? friend : null;
  const replied = friend && friend.guest !== null ? friend : null;
  const reply = useMemo<Shared | null>(() => invited ? { ...invited, guest: cleanName(guest), pick } : null, [invited, guest, pick]);

  useEffect(() => {
    // In-page anchors (#make, #send) also change the hash, so only a real shared card counts.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) { setFriend(shared); setReplying(false); } };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(titleOf(invite)).then(() => {
      if (cancelled) return;
      if (preview.current) drawInvite(preview.current, invite, format, site);
      if (invited && friendCanvas.current) drawInvite(friendCanvas.current, invited, "feed", site);
      if (replied && friendCanvas.current) drawReply(friendCanvas.current, replied, "feed", site);
      if (reply && replyCanvas.current) drawReply(replyCanvas.current, reply, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [invite, format, site, invited, replied, reply, replying]);

  function startReply() {
    setReplying(true);
    requestAnimationFrame(() => guestInput.current?.focus({ preventScroll: false }));
  }

  const named = a !== null;

  return (
    <div className="dw">
      <div ref={friendBox}>
        {invited && (
          <section className="dw-friend" aria-labelledby="dw-friend-title">
            <p className="dw-friend-kicker">তোমার একটা দাওয়াত এসেছে</p>
            <h2 id="dw-friend-title">{inviteTitle(invited)}</h2>
            <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={inviteSummary(invited)} />
            <div className="dw-friend-actions">
              {!replying && <button type="button" className="kit-primary dw-coming" onClick={startReply}>আমি আসছি</button>}
              {invited.map && <a className="kit-secondary" href={invited.map} target="_blank" rel="noopener noreferrer nofollow">ম্যাপে জায়গাটা দেখো</a>}
            </div>
            <ul className="dw-facts">
              {invited.date && <li><b>কবে:</b> {dateText(invited.date, true)}{invited.time && `, ${timeText(invited.time)}`}{invited.occasion === "khela" && invited.time && " (বাংলাদেশ সময়)"}</li>}
              {invited.place && <li><b>কোথায়:</b> {invited.place}</li>}
            </ul>
            {replying && reply && (
              <div className="dw-reply" aria-labelledby="dw-reply-title">
                <h3 id="dw-reply-title">উত্তরটা সাজিয়ে পাঠাও</h3>
                <label className="dw-field">
                  <span>তোমার নাম <small>উত্তরের নিচে বসবে</small></span>
                  <input ref={guestInput} value={guest} maxLength={MAX_NAME} onChange={event => setGuest(event.target.value)} placeholder="যেমন: নাদিয়া" autoComplete="name" />
                </label>
                <fieldset className="dw-picks">
                  <legend>কী বলে আসবে?</legend>
                  {occasionById(invited.occasion).replies.map((text, index) => <button type="button" key={text} aria-pressed={pick === index} onClick={() => setPick(index)}>{text}</button>)}
                </fieldset>
                <figure className="kit-card dw-reply-card" data-format={format}>
                  <span className="dw-stamp" aria-hidden="true">আসছি!</span>
                  <canvas ref={replyCanvas} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`${replyTitle(reply)} ${replyLine(reply)}`} />
                </figure>
                <FormatToggle value={format} onChange={setFormat} />
                <ShareBar tool={TOOL} fileName={`dawat-uttor-${invited.occasion}.png`} makeImage={() => replyBlob(reply, format, site)} imageKey={`${replyHash(reply, reply.guest ?? "", pick)}|${format}`} caption={`${replyTo(reply)} আসছি! ${replyLine(reply)}`} state={replyHash(reply, reply.guest ?? "", pick).slice(1)} hint="যে দাওয়াত দিয়েছে, তাকে এটা পাঠাও। লিংকে শুধু তোমার নাম, উত্তর আর অনুষ্ঠানের নাম-তারিখ থাকে।" />
              </div>
            )}
            <a className="kit-link dw-own-link" href="#make">তুমিও দাওয়াত দেবে? নিজের কার্ড বানাও</a>
          </section>
        )}
        {replied && (
          <section className="dw-friend dw-friend-reply" aria-labelledby="dw-friend-title">
            <p className="dw-friend-kicker">দাওয়াতের উত্তর এসেছে</p>
            <h2 id="dw-friend-title">{replyTitle(replied)}</h2>
            <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${replyTitle(replied)} ${replyLine(replied)}`} />
            <a className="kit-primary" href="#make">আরেকটা দাওয়াত কার্ড বানাও</a>
          </section>
        )}
      </div>

      <fieldset className="dw-occasions" id="make">
        <legend>কিসের দাওয়াত?</legend>
        <div>
          {occasions.map(item => <button type="button" key={item.id} data-occasion={item.id} aria-pressed={item.id === occasionId} onClick={() => setPicked(item.id)}>{item.chip}</button>)}
        </div>
      </fieldset>

      <div className="dw-body">
        <figure className="kit-card dw-card" data-format={format}>
          <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="dw-summary" />
          <figcaption id="dw-summary" className="dw-sr">{inviteSummary(invite)}। {humanLine(invite)}</figcaption>
          {previewError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>

        <div className="dw-controls">
          <div className="dw-names" id="dw-names">
            <label className="dw-field">
              <span>{first.label}</span>
              <input value={a ?? first.sample} maxLength={MAX_NAME} onChange={event => setA(event.target.value)} onFocus={event => a === null && event.currentTarget.select()} placeholder={first.sample} />
            </label>
            {second && (
              <label className="dw-field">
                <span>{second.label}</span>
                <input value={b ?? second.sample} maxLength={MAX_NAME} onChange={event => setB(event.target.value)} onFocus={event => b === null && event.currentTarget.select()} placeholder={second.sample || "না দিলেও চলবে"} />
              </label>
            )}
          </div>
          <div className="dw-when">
            <label className="dw-field">
              <span>তারিখ</span>
              <input type="date" value={date} min="2020-01-01" max="2100-12-31" onChange={event => setDate(event.target.value)} />
            </label>
            <label className="dw-field">
              <span>সময় {occasionId === "khela" && <small>বাংলাদেশ সময়</small>}</span>
              <input type="time" value={time ?? occasion.time} onChange={event => setTime(event.target.value)} />
            </label>
          </div>
          <label className="dw-field">
            <span>কোথায়? <small>{MAX_PLACE}টা অক্ষরের মধ্যে</small></span>
            <input value={place ?? occasion.place} maxLength={MAX_PLACE} onChange={event => setPlace(event.target.value)} onFocus={event => place === null && event.currentTarget.select()} placeholder={occasion.place} />
          </label>
          <details className="dw-map" open={Boolean(map)}>
            <summary>ম্যাপের লিংক দেবে? <small>চাইলে</small></summary>
            <label className="dw-field">
              <span className="dw-sr">গুগল ম্যাপের লিংক</span>
              <input type="url" inputMode="url" value={map} maxLength={MAX_MAP + 60} onChange={event => setMap(event.target.value)} placeholder="https://maps.app.goo.gl/…" aria-describedby="dw-map-note" />
            </label>
            <p id="dw-map-note" className={map.trim() && !mapLink ? "dw-note dw-note-bad" : "dw-note"} role="status" aria-live="polite">
              {!map.trim() ? "গুগল ম্যাপে জায়গাটা খুঁজে ‘Share’ চাপো, লিংক কপি করে এখানে দাও।" : mapLink ? "ম্যাপ যোগ হয়েছে। লিংক খুললে অতিথি ‘ম্যাপে জায়গাটা দেখো’ বোতাম পাবে।" : "এটা গুগল ম্যাপের লিংক না। শুধু গুগল ম্যাপের লিংক দেওয়া যাবে।"}
            </p>
          </details>
          <p className="dw-privacy">লিংক যার কাছে, সে-ই নাম, তারিখ আর জায়গা দেখবে। তাই ফোন নম্বর দিয়ো না, দিলেও লিংকে যাবে না।</p>

          <div className="dw-send" id="send" ref={send}>
            <h2>{occasion.line}</h2>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`dawat-${occasionId}.png`} makeImage={() => inviteBlob(invite, format, site)} imageKey={`${state}|${format}`} caption={occasion.caption} state={state} hint="লিংক খুললে অতিথি কার্ডটা দেখবে, আর এক চাপে ‘আমি আসছি’ জানাতে পারবে।" />
          </div>
        </div>
      </div>

      <StickyNext
        show={!sendVisible && !(friend && friendVisible)}
        title={<><strong>{occasion.nounOf} দাওয়াত</strong> তৈরি</>}
        sub={named ? "এবার পাঠিয়ে দাও" : "নাম, তারিখ আর জায়গা বদলে নাও"}
        href={named ? "#send" : "#dw-names"}
        label={named ? "পাঠাও" : "নাম বসাও"}
      />
    </div>
  );
}
