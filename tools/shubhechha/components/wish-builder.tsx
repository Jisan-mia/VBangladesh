"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { FormatToggle, PhotoPicker, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { bn, byNearest, cleanName, createCard, messageOf, occasionById, occasions, parseShareHash, previewTitle, shareHash, MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH, type OccasionId, type Wish } from "../lib/greeting";

const TOOL = "shubhechha";

export function WishBuilder() {
  const [today, setToday] = useState<Date | null>(null);
  const [picked, setPicked] = useState<OccasionId | null>(null);
  const [choice, setChoice] = useState<number | "own">(0);
  const [own, setOwn] = useState("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [friend, setFriend] = useState<Wish | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  // Always rendered: useInView attaches once on mount, before a shared card is read from the hash.
  const friendBox = useRef<HTMLDivElement>(null);
  const send = useRef<HTMLDivElement>(null);
  const sendVisible = useInView(send);
  const friendVisible = useInView(friendBox);

  // The date only exists in the browser; until then the picker keeps its built-in calendar order.
  const order = useMemo(() => today ? byNearest(today) : occasions, [today]);
  const occasionId = picked ?? friend?.occasion ?? order[0].id;
  const occasion = occasionById(occasionId);
  const wish = useMemo<Wish>(() => ({ occasion: occasionId, preset: choice === "own" ? 0 : choice, text: choice === "own" ? own : null, name }), [occasionId, choice, own, name]);
  const state = shareHash(wish).slice(1);
  const message = messageOf(wish);
  const left = MAX_MESSAGE_LENGTH - Array.from(own).length;

  useEffect(() => {
    // In-page anchors (#send) also change the hash, so only a real shared card counts as a friend's.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setToday(new Date());
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(occasion.title).then(() => {
      if (cancelled) return;
      const now = new Date();
      if (preview.current) drawCard(preview.current, createCard(wish, now), format, site, photo);
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend, now), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [wish, occasion.title, format, site, photo, friend]);

  function pickOccasion(id: OccasionId) {
    setPicked(id);
    setChoice(0);
  }

  function writeOwn() {
    if (!own.trim()) setOwn(message);
    setChoice("own");
  }

  const friendName = friend ? cleanName(friend.name) : "";
  const friendGift = friend ? occasionById(friend.occasion).gift : "";

  return (
    <div className="wish-builder">
      <div ref={friendBox}>{friend && (
        <section className="wish-friend" aria-labelledby="friend-title">
          <p className="wish-friend-kicker">তোমার জন্য একটা কার্ড এসেছে</p>
          <h2 id="friend-title">{friendName ? <>তোমাকে {friendGift} পাঠিয়েছে <span>{friendName}</span></> : previewTitle(friend)}</h2>
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${occasionById(friend.occasion).title}। ${messageOf(friend)}${friendName ? ` — ${friendName}` : ""}`} />
          <a className="kit-primary" href="#make">তুমিও একটা পাঠাও</a>
        </section>
      )}</div>

      <fieldset className="wish-occasions" id="make">
        <legend>কোন উৎসবের কার্ড?</legend>
        <div>
          {order.map(item => (
            <button type="button" key={item.id} data-occasion={item.id} aria-pressed={item.id === occasionId} onClick={() => pickOccasion(item.id)}>
              <strong>{item.chip}</strong><small>{item.when}</small>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="wish-body">
        <figure className="kit-card wish-card" data-format={format}>
          <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="wish-summary" />
          <figcaption id="wish-summary" className="wish-sr">{occasion.title}। {message}{cleanName(name) ? ` — ${cleanName(name)}` : ""}</figcaption>
          {previewError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>

        <div className="wish-controls">
          <label className="wish-field" id="wish-name">
            <span>তোমার নাম <small>কার্ডের নিচে বসবে</small></span>
            <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি ও পরিবার" autoComplete="name" />
          </label>

          <fieldset className="wish-messages">
            <legend>কী লিখবে?</legend>
            {occasion.presets.map((text, index) => (
              <button type="button" key={text} aria-pressed={choice === index} onClick={() => setChoice(index)}>{text}</button>
            ))}
            <button type="button" className="wish-own-toggle" aria-pressed={choice === "own"} onClick={writeOwn}>নিজের মতো লিখব</button>
            {choice === "own" && (
              <label className="wish-field wish-own">
                <span className="wish-sr">নিজের কথা</span>
                <textarea value={own} rows={3} maxLength={MAX_MESSAGE_LENGTH} onChange={event => setOwn(event.target.value)} autoFocus aria-describedby="wish-left" />
                <small id="wish-left" aria-live="polite">{left > 0 ? `আর ${bn(left)} অক্ষর লেখা যাবে` : "আর লেখা যাবে না, কার্ডে এটুকুই ধরে"}</small>
              </label>
            )}
          </fieldset>

          <PhotoPicker value={photo} onChange={setPhoto} label="তোমার ছবি" note="চাইলে দাও। ফোনেই থাকে, লিংকে যায় না" />

          <div className="wish-send" id="send" ref={send}>
            <h2>{occasion.line}</h2>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`shubhechha-${occasion.id}.png`} makeImage={() => cardBlob(createCard(wish, new Date()), format, site, photo)} imageKey={`${state}|${format}|${photo?.width ?? 0}`} caption={occasion.caption} state={state} hint="লিংক খুললে কার্ডটা দেখা যাবে, তোমার ছবি ছাড়া।" />
          </div>
        </div>
      </div>

      <StickyNext
        show={!sendVisible && !(friend && friendVisible)}
        title={<><strong>{occasion.chip}</strong> কার্ড তৈরি</>}
        sub={cleanName(name) ? occasion.line : "নিজের নাম বসালে আরও আপন লাগবে"}
        href={cleanName(name) ? "#send" : "#wish-name"}
        label={cleanName(name) ? "পাঠাও" : "নাম বসাও"}
      />
    </div>
  );
}
