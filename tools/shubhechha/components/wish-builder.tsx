"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { FormatToggle, PhotoPicker, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { FRAME_SIZE, drawFrame, frameBlob } from "../lib/draw-frame";
import { bn, byNearest, captionOf, cleanName, createCard, createFrame, frameById, frameCaption, frameHash, frameOrder, frames, messageOf, occasionById, occasions, parseFrameHash, parseShareHash, presetsOf, previewTitle, recipientsOf, shareHash, toLine, MAX_MESSAGE_LENGTH, MAX_NAME_LENGTH, type FrameId, type FramePick, type OccasionId, type Wish } from "../lib/greeting";

const TOOL = "shubhechha";

export function WishBuilder() {
  const [today, setToday] = useState<Date | null>(null);
  const [picked, setPicked] = useState<OccasionId | null>(null);
  const [choice, setChoice] = useState<number | "own">(0);
  const [own, setOwn] = useState("");
  const [name, setName] = useState("");
  /** Recipient id for জন্মদিন/বিবাহবার্ষিকী; "" = the neutral default. */
  const [to, setTo] = useState("");
  const [toName, setToName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [framing, setFraming] = useState(false);
  const [pickedFrame, setPickedFrame] = useState<FrameId | null>(null);
  const [ribbon, setRibbon] = useState(0);
  const [photo, setPhoto] = useState<Photo | null>(null);
  // Every picked photo is shrunk to the same width, so count picks to tell a new photo from the old one.
  const [photoCount, setPhotoCount] = useState(0);
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

  // The date only exists in the browser; until then the pickers keep their built-in calendar order.
  const order = useMemo(() => today ? byNearest(today) : occasions, [today]);
  const frameList = useMemo(() => today ? frameOrder(today) : frames, [today]);
  const occasionId = picked ?? friend?.occasion ?? order[0].id;
  const occasion = occasionById(occasionId);
  const recipients = recipientsOf(occasionId);
  const recipient = recipients.find(item => item.id === to) ?? recipients[0];
  const wish = useMemo<Wish>(() => ({
    occasion: occasionId, preset: choice === "own" ? 0 : choice, text: choice === "own" ? own : null, name,
    ...(recipient ? { to: recipient.id, toName } : {}),
  }), [occasionId, choice, own, name, recipient, toName]);
  const state = shareHash(wish).slice(1);
  const message = messageOf(wish);
  const left = MAX_MESSAGE_LENGTH - Array.from(own).length;

  // A frame for the picked national day if it has one, else the next one coming.
  const frameId = pickedFrame ?? frameList.find(item => item.id === occasionId)?.id ?? frameList[0].id;
  const frame = frameById(frameId);
  const pick = useMemo<FramePick>(() => ({ frame: frameId, ribbon }), [frameId, ribbon]);
  const frameState = frameHash(pick).slice(1);

  useEffect(() => {
    // In-page anchors (#send) also change the hash, so only a real shared card or frame counts.
    const readHash = () => {
      const sharedFrame = parseFrameHash(window.location.hash);
      if (sharedFrame) { setFraming(true); setPickedFrame(sharedFrame.frame); setRibbon(sharedFrame.ribbon); return; }
      const shared = parseShareHash(window.location.hash);
      if (shared) setFriend(shared);
    };
    readHash();
    window.addEventListener("hashchange", readHash);
    setToday(new Date());
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readHash);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const frameCard = createFrame(pick, new Date());
    loadCardFonts(framing ? frameCard.ribbon : occasion.title).then(() => {
      if (cancelled) return;
      const now = new Date();
      if (preview.current) {
        if (framing) drawFrame(preview.current, frameCard, photo);
        else drawCard(preview.current, createCard(wish, now), format, site, photo);
      }
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend, now), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [wish, occasion.title, format, site, photo, friend, framing, pick]);

  function pickOccasion(id: OccasionId) {
    setPicked(id);
    setChoice(0);
    setTo("");
  }

  function pickRecipient(id: string) {
    setTo(id);
    if (choice !== "own") setChoice(0);
  }

  function pickFrame(id: FrameId) {
    setPickedFrame(id);
    setRibbon(0);
  }

  function pickPhoto(next: Photo | null) {
    setPhoto(next);
    setPhotoCount(count => count + 1);
  }

  function writeOwn() {
    if (!own.trim()) setOwn(message);
    setChoice("own");
  }

  const friendName = friend ? cleanName(friend.name) : "";
  const friendGift = friend ? occasionById(friend.occasion).gift : "";
  const recipientLine = toLine(wish);
  const size = framing ? { width: FRAME_SIZE, height: FRAME_SIZE } : cardSizes[format];
  const frameCard = createFrame(pick, today ?? new Date());

  return (
    <div className="wish-builder">
      <div ref={friendBox}>{friend && (
        <section className="wish-friend" aria-labelledby="friend-title">
          <p className="wish-friend-kicker">তোমার জন্য একটা কার্ড এসেছে</p>
          <h2 id="friend-title">{friendName ? <>তোমাকে {friendGift} পাঠিয়েছে <span>{friendName}</span></> : previewTitle(friend)}</h2>
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${occasionById(friend.occasion).title}। ${toLine(friend) ? `${toLine(friend)}। ` : ""}${messageOf(friend)}${friendName ? ` — ${friendName}` : ""}`} />
          <a className="kit-primary" href="#make">তুমিও একটা পাঠাও</a>
        </section>
      )}</div>

      <div className="wish-pick">
        {/* A separate format, not a ninth occasion: it swaps the picker for the frame days. */}
        <button type="button" className="wish-frame-toggle" aria-pressed={framing} onClick={() => setFraming(!framing)}>প্রোফাইল ফ্রেম</button>
        <fieldset className="wish-occasions" id="make" data-mode={framing ? "frame" : "card"}>
          <legend>{framing ? "কোন দিনের ফ্রেম?" : "কিসের কার্ড?"}</legend>
          <div>
            {framing
              ? frameList.map(item => (
                <button type="button" key={item.id} data-occasion={item.id} aria-pressed={item.id === frameId} onClick={() => pickFrame(item.id)}>
                  <strong>{item.chip}</strong><small>{item.when}</small>
                </button>
              ))
              : order.map(item => (
                <button type="button" key={item.id} data-occasion={item.id} aria-pressed={item.id === occasionId} onClick={() => pickOccasion(item.id)}>
                  <strong>{item.chip}</strong><small>{item.when}</small>
                </button>
              ))}
          </div>
        </fieldset>
      </div>

      <div className="wish-body">
        <figure className="kit-card wish-card" data-format={framing ? "frame" : format}>
          <canvas ref={preview} width={size.width} height={size.height} role="img" aria-describedby="wish-summary" />
          <figcaption id="wish-summary" className="wish-sr">
            {framing
              ? `${frame.gift}। ফিতায় লেখা: ${frameCard.ribbon}।${photo ? " মাঝখানে তোমার ছবি।" : " মাঝখানে ছবির জায়গা ফাঁকা।"}`
              : <>{occasion.title}। {recipientLine ? `${recipientLine}। ` : ""}{message}{cleanName(name) ? ` — ${cleanName(name)}` : ""}</>}
          </figcaption>
          {previewError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>

        <div className="wish-controls">
          {framing ? (
            <>
              <div id="wish-photo" className="wish-photo">
                <PhotoPicker value={photo} onChange={pickPhoto} width={900} label="তোমার ছবি" note="ফ্রেমের মাঝখানে বসবে। ফোনেই থাকে, লিংকে যায় না" />
              </div>
              <fieldset className="wish-messages">
                <legend>ফিতায় কী লেখা থাকবে?</legend>
                {frame.ribbons.map((text, index) => (
                  <button type="button" key={text} aria-pressed={ribbon === index} onClick={() => setRibbon(index)}>{text}</button>
                ))}
              </fieldset>
            </>
          ) : (
            <>
              {recipient && (
                <div className="wish-to">
                  <fieldset className="kit-chips">
                    <legend>কাকে পাঠাবে?</legend>
                    {recipients.map(item => (
                      <button type="button" key={item.id} aria-pressed={item.id === recipient.id} onClick={() => pickRecipient(item.id)}>{item.chip}</button>
                    ))}
                  </fieldset>
                  <label className="wish-field">
                    <span>{occasionId === "bibahobarshiki" ? "দুজনের নাম" : "যার জন্মদিন, তার নাম"} <small>{recipient.to ? `না দিলে লেখা থাকবে ‘${recipient.to}’` : "না দিলেও চলবে"}</small></span>
                    <input value={toName} maxLength={MAX_NAME_LENGTH} onChange={event => setToName(event.target.value)} placeholder={occasionId === "bibahobarshiki" ? "যেমন: রিমা ও রাফি" : "যেমন: নাদিয়া"} autoComplete="off" />
                  </label>
                </div>
              )}

              <label className="wish-field" id="wish-name">
                <span>তোমার নাম <small>কার্ডের নিচে বসবে</small></span>
                <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি ও পরিবার" autoComplete="name" />
              </label>

              <fieldset className="wish-messages">
                <legend>কী লিখবে?</legend>
                {presetsOf(wish).map((text, index) => (
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

              <PhotoPicker value={photo} onChange={pickPhoto} label="তোমার ছবি" note="চাইলে দাও। ফোনেই থাকে, লিংকে যায় না" />
            </>
          )}

          <div className="wish-send" id="send" ref={send}>
            {framing ? (
              <>
                <h2>{frame.line}</h2>
                <ShareBar tool={TOOL} fileName={`shubhechha-frame-${frameId}.png`} makeImage={() => frameBlob(createFrame(pick, new Date()), photo)} imageKey={`${frameState}|${photoCount}`} caption={frameCaption(pick)} state={frameState} hint={photo ? "ছবিটা ডাউনলোড করে ফেসবুকে প্রোফাইল ছবি করে দাও। লিংকে শুধু ফ্রেমটা যায়, তোমার ছবি না।" : "আগে ওপরে নিজের ছবি দাও। লিংকে শুধু ফ্রেমটা যায়, তোমার ছবি না।"} />
              </>
            ) : (
              <>
                <h2>{occasion.line}</h2>
                <FormatToggle value={format} onChange={setFormat} />
                <ShareBar tool={TOOL} fileName={`shubhechha-${occasion.id}.png`} makeImage={() => cardBlob(createCard(wish, new Date()), format, site, photo)} imageKey={`${state}|${format}|${photoCount}`} caption={captionOf(wish)} state={state} hint="লিংকে শুধু কার্ডটা যায়, তোমার ছবি না।" />
              </>
            )}
          </div>
        </div>
      </div>

      {framing ? (
        <StickyNext
          show={!sendVisible}
          title={<><strong>{frame.chip}</strong> ফ্রেম তৈরি</>}
          sub={photo ? "এবার নামিয়ে প্রোফাইল ছবি করে দাও" : "নিজের ছবি বসালে তবেই জমবে"}
          href={photo ? "#send" : "#wish-photo"}
          label={photo ? "নামাও" : "ছবি দাও"}
        />
      ) : (
        <StickyNext
          show={!sendVisible && !(friend && friendVisible)}
          title={<><strong>{occasion.chip}</strong> কার্ড তৈরি</>}
          sub={cleanName(name) ? occasion.line : "নিজের নাম বসালে আরও আপন লাগবে"}
          href={cleanName(name) ? "#send" : "#wish-name"}
          label={cleanName(name) ? "পাঠাও" : "নাম বসাও"}
        />
      )}
    </div>
  );
}
