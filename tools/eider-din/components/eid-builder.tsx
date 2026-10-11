"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, cardHeadline, drawCard, type CardContent } from "../lib/draw-card";
import { bn, chapters, colorById, colors, colorShares, commonLine, currentEid, defaultPicks, eidLine, eidTitle, items, leadingColor, parseShareHash, possessive, shareHash, toggleItem, MAX_NAME_LENGTH, TOTAL, type ColorId, type Eid, type ItemId } from "../lib/eid";
import { HandArt } from "./hand-art";

const TOOL = "eider-din";
// "এবার ঈদে সবুজ এগিয়ে" after five votes is noise, not a trend.
const TALLY_MIN = 30;

type EidInfo = ReturnType<typeof currentEid>;

function cardFor(eid: Eid, friend: Eid | null, top: CardContent["top"]): CardContent {
  return { name: eid.name, title: eidTitle(eid.eid), color: colorById(eid.color), picked: eid.picked, line: eidLine(eid.picked), match: commonLine(eid, friend), top };
}

export function EidBuilder() {
  const [color, setColor] = useState<ColorId>("green");
  const [picked, setPicked] = useState<ItemId[]>(defaultPicks);
  const [name, setName] = useState("");
  const [info, setInfo] = useState<EidInfo>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Eid | null>(null);
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [joined, setJoined] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const own: Eid = useMemo(() => ({ color, picked, eid: info?.eid ?? "", name }), [color, picked, info, name]);
  const top = everyone ? leadingColor(everyone.counts, TALLY_MIN) : null;
  const card = useMemo(() => cardFor(own, friend, top), [own, friend, top]);
  const state = shareHash(own).slice(1);
  const shades = everyone && top ? colorShares(everyone.counts) : null;

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared card replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    setInfo(currentEid(new Date()));
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("রাফির ঈদ মেহেদি").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, cardFor(friend, null, null), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  function toggle(id: ItemId) {
    setPicked(current => toggleItem(current, id));
    setJoined(current => current === "done" ? "idle" : current);
  }

  function pickColor(id: ColorId) {
    setColor(id);
    setJoined(current => current === "done" ? "idle" : current);
  }

  async function join() {
    setJoined("sending");
    // Only fixed colour and item ids are counted; the name never leaves the link.
    const tally = await addToTally(TOOL, [color, ...picked]);
    if (tally) { setEveryone(tally); setJoined("done"); } else setJoined("failed");
  }

  const mostDone = everyone && everyone.total >= TALLY_MIN ? items.reduce((best, item) => (everyone.counts[item.id] ?? 0) > (everyone.counts[best.id] ?? 0) ? item : best, items[0]) : null;
  const friendName = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";
  const caption = card.match
    ? `${card.match}! আমার ঈদে ${bn(TOTAL)}-এ ${bn(picked.length)}টা হলো। তোমার কয়টা?`
    : `আমার ঈদে ${bn(TOTAL)}-এ ${bn(picked.length)}টা হলো! ${card.line} তোমার কয়টা?`;

  return (
    <div className="ed">
      {friend && (
        <section className="ed-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName} ঈদের মেহেদি হাত`} />
          <div>
            <p className="ed-kicker">তোমার জন্য একটা মেহেদির হাত এসেছে</p>
            <h2 id="friend-title">{friendName} ঈদে {bn(TOTAL)}-এ <em>{bn(friend.picked.length)}টা</em> হলো।<br />তোমার কয়টা?</h2>
            <a className="kit-primary" href="#ed-items">আমারটা মেলাই</a>
          </div>
        </section>
      )}

      <div className="ed-pick">
        <div className="ed-stage" data-color={color} style={{ "--outfit": colorById(color).bg, "--outfit-ink": colorById(color).ink } as CSSProperties}>
          <HandArt picked={picked} />
          <div className="ed-stage-side">
            <p className="ed-count" aria-live="polite"><strong>{bn(picked.length)}</strong><span>/{bn(TOTAL)}</span></p>
            <fieldset className="ed-swatches">
              <legend>জামার রং: <b>{colorById(color).label}</b></legend>
              <div>
                {colors.map(option => (
                  <button type="button" key={option.id} aria-pressed={color === option.id} aria-label={option.label} title={option.label} style={{ "--swatch": option.bg } as CSSProperties} onClick={() => pickColor(option.id)} />
                ))}
              </div>
            </fieldset>
            <p className="ed-line">{eidLine(picked)}</p>
          </div>
        </div>

        {shades && top && (
          <div className="ed-palette" aria-label={`সবার জামার রং: ${shades.filter(row => row.percent).map(row => `${row.color.label} ${bn(row.percent)}%`).join(", ")}`}>
            <p>এবার ঈদে <strong>{top.label}</strong> এগিয়ে</p>
            <div aria-hidden="true">{shades.filter(row => row.percent).map(row => <i key={row.color.id} style={{ width: `${row.percent}%`, background: row.color.bg }} />)}</div>
          </div>
        )}

        <div className="ed-items" id="ed-items">
          <p className="ed-hint">যেগুলো হয়েছে, সেগুলোয় চাপো। হাতে একটা একটা করে নকশা বসবে।</p>
          {chapters.map(chapter => (
            <fieldset className="ed-chapter" key={chapter.id}>
              <legend>{chapter.label} <small>· {chapter.region}</small></legend>
              <div>
                {items.filter(item => item.chapter === chapter.id).map(item => (
                  <button type="button" key={item.id} aria-pressed={picked.includes(item.id)} onClick={() => toggle(item.id)}>
                    <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="7" /><path d="M6 10.5l2.8 2.8L14.5 7" /></svg>
                    {item.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </div>

      <StickyNext show={picked.length > 0 && !resultVisible} title={<><strong>{bn(TOTAL)}-এ {bn(picked.length)}টা</strong> হলো</>} sub={eidLine(picked)} href="#result" label="হাতটা দেখো" />

      <section className="ed-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="ed-result-head">
          <h2 id="result-title">{picked.length ? <>তোমার ঈদে <em>{bn(TOTAL)}-এ {bn(picked.length)}টা</em></> : "হাতটা এখনো ফাঁকা"}</h2>
          <p>{picked.length ? card.line : "ওপরের তালিকা থেকে ঈদের দিনে যা যা হলো, টিক দাও।"}</p>
        </div>

        <div className="ed-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ed-card-summary" />
            <figcaption id="ed-card-summary" className="ed-sr">{cardHeadline(card)}: {bn(TOTAL)}-এ {bn(picked.length)}টা, জামার রং {card.color.label}। {items.filter(item => picked.includes(item.id)).map(item => item.label).join(", ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="ed-controls">
            <label className="ed-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="eider-din.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${top?.id ?? ""}|${friend ? shareHash(friend) : ""}`} caption={caption} state={state} disabled={!picked.length} hint={picked.length ? "লিংক পাঠালে বন্ধুও নিজের হাত বানিয়ে তোমার সাথে মিলিয়ে দেখতে পারবে।" : ""} />
            {info && (
              <p className="ed-date">
                {eidTitle(info.eid)}: <strong>সম্ভাব্য {info.when}</strong>। চাঁদ দেখার ওপর নির্ভর করে। ঠিক দিন জানায় জাতীয় চাঁদ দেখা কমিটি। <a href={info.source.url} target="_blank" rel="noopener noreferrer">সূত্র</a> · <a href="/koto-din-baki#o=eid-fitr">আর কত দিন বাকি?</a>
              </p>
            )}
          </div>
        </div>

        {picked.length > 0 && (
          <div className="ed-everyone">
            <h3>সবার ঈদের রং দেখবে?</h3>
            {joined !== "done" ? <>
              <p>তোমার জামার রং আর টিকগুলো সবার হিসাবে যোগ হবে। নাম যাবে না, শুধু গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={join} disabled={joined === "sending"}>{joined === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {joined === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : everyone && everyone.total >= TALLY_MIN ? <>
              <p>{bn(everyone.total)} জনের সাথে মেলানো হলো। {top ? <>এবার ঈদে <strong>{top.label}</strong> এগিয়ে, কার্ডেও লেখা উঠেছে।</> : "কোনো রং এখনো একা এগিয়ে নেই।"}</p>
              {mostDone && <p>সবচেয়ে বেশি মানুষের হয়েছে: <strong>{mostDone.label}</strong></p>}
            </> : <p className="kit-status">যোগ হয়েছে! এখনো কম মানুষ মিলিয়েছে, তাই কোন রং এগিয়ে, এখনই বলা যাচ্ছে না। বন্ধুদের লিংক পাঠাও।</p>}
          </div>
        )}
      </section>
    </div>
  );
}
