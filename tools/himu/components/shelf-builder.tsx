"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-shelf";
import { bn, books, commonLine, createCard, parseShareHash, possessive, sample, scoreText, shareHash, shelves, tierFor, titleOf, toggleBook, MAX_NAME_LENGTH, type BookId, type Shared } from "../lib/shelf";
import { spineLook } from "../lib/spines";
import { NightRoad } from "./night-road";

const TOOL = "himu";
// Below this, "৩ জন মিলিয়েছে" reads as an empty room rather than social proof.
const SOCIAL_PROOF_MIN = 50;
// Percentages from a handful of people are noise.
const COMPARE_MIN = 20;
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

export function ShelfBuilder() {
  const [read, setRead] = useState<BookId[]>(sample);
  const [touched, setTouched] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const touchedRef = useRef(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const own = useMemo(() => ({ read, name }), [read, name]);
  const card = useMemo(() => createCard(own, friend), [own, friend]);
  const state = shareHash(own).slice(1);
  const friendName = friend?.name ? friend.name : "বন্ধু";
  const common = friend ? commonLine(read, friend.read, books.length) : null;

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared shelf replaces the friend.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      // Their own shelf starts empty so "দুজনেরই পড়া" counts only what they really tick.
      setRead(current => touchedRef.current ? current : []);
      setTouched(true);
    };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("হুমায়ূন আহমেদের বই").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  function toggle(id: BookId) {
    touchedRef.current = true;
    setTouched(true);
    setRead(current => toggleBook(current, id));
    // Changed picks make the old comparison stale.
    setCompared(current => current === "done" ? "idle" : current);
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, read);
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  function restart() {
    if (read.length > 2 && !window.confirm("সব বই তাক থেকে নামিয়ে নতুন করে শুরু করবে?")) return;
    touchedRef.current = true;
    setRead([]);
    setCompared("idle");
    document.getElementById("shelf")?.scrollIntoView({ behavior: "smooth" });
  }

  const ranked = compared === "done" && everyone && everyone.total >= COMPARE_MIN
    ? books.map(book => ({ book, share: percent(everyone.counts[book.id] ?? 0, everyone.total) })).sort((a, b) => a.share - b.share)
    : [];
  const tip = ranked.find(item => !read.includes(item.book.id));
  const rarest = ranked.find(item => read.includes(item.book.id));
  const caption = card.match
    ? `${card.match}! হুমায়ূন আহমেদের ${bn(books.length)}টা বইয়ের ${bn(card.count)}টা আমার পড়া। তুমি কয়টা পড়েছ?`
    : `হুমায়ূন আহমেদের ${bn(books.length)}টা বইয়ের ${bn(card.count)}টা পড়েছি, আমি “${card.tier}”। তুমি কয়টা পড়েছ?`;

  return (
    <div className="hm">
      {friend && (
        <section className="hm-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${possessive(friendName)} বইয়ের তাক`} />
          <div>
            <p className="hm-kicker">তোমার জন্য একটা তাক এসেছে</p>
            <h2 id="friend-title">{friendName} {bn(books.length)}টার {bn(friend.read.length)}টা পড়েছে।<br /><span>তুমি কয়টা?</span></h2>
            <a className="kit-primary" href="#shelf">আমার তাক সাজাই</a>
          </div>
        </section>
      )}

      {everyone && everyone.total >= SOCIAL_PROOF_MIN && <p className="hm-proof">এখন পর্যন্ত <strong>{bn(everyone.total)} জন</strong> নিজের তাক মিলিয়েছে</p>}

      <div className="hm-night" id="shelf">
        <div className="hm-sky">
          <div className="hm-count" aria-live="polite">
            <p className="hm-score"><span>{bn(books.length)}-এ</span> <strong>{bn(read.length)}</strong></p>
            <p className="hm-tier">{tierFor(read.length)}</p>
          </div>
          <NightRoad progress={read.length / books.length} />
        </div>
        <p className="hm-hint">{!touched ? <>নমুনা হিসেবে <b>৩টা</b> বই আগে থেকেই বাছা আছে। যেগুলো পড়েছ ট্যাপ করো, না পড়লে আবার ট্যাপ করে সরাও।</>
          : friend ? <><i className="hm-dot" aria-hidden="true" /> হলুদ ফোঁটা মানে {friendName} পড়েছে। তুমি যেগুলো পড়েছ, সেগুলোয় ট্যাপ করো।</>
          : "যেগুলো পড়েছ, ট্যাপ করো। ভুল হলে আবার ট্যাপ করলেই উঠে যাবে।"}</p>

        {shelves.map(shelf => {
          const onShelf = books.map((book, index) => ({ book, index })).filter(item => item.book.shelf === shelf.id);
          const done = onShelf.filter(item => read.includes(item.book.id)).length;
          return (
            <fieldset className="hm-shelf" key={shelf.id}>
              <legend><span>{shelf.label}</span> <small>{bn(onShelf.length)}-এ {bn(done)}</small></legend>
              <ul className="hm-books">
                {onShelf.map(({ book, index }) => {
                  const look = spineLook(index);
                  return (
                    <li key={book.id}>
                      <button type="button" className="hm-spine" aria-pressed={read.includes(book.id)} data-shelf={book.shelf} data-friend={friend?.read.includes(book.id) || undefined} onClick={() => toggle(book.id)}
                        style={{ "--spine": look.color, "--ink": look.ink, "--lift": `${look.lift * 2}px` } as CSSProperties}
                        aria-label={friend?.read.includes(book.id) ? `${book.title} (${friendName} পড়েছে)` : book.title}>
                        <span>{book.title}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          );
        })}
        <p className="hm-source">তাঁর বই ২০০-র বেশি, এখানে সবচেয়ে চেনা ৩০টা। নাম যাচাই: <a href="https://bn.banglapedia.org/index.php/আহমেদ,_হুমায়ূন" target="_blank" rel="noopener noreferrer">বাংলাপিডিয়া</a> ও <a href="https://bn.wikipedia.org/wiki/হুমায়ূন_আহমেদের_গ্রন্থতালিকা" target="_blank" rel="noopener noreferrer">উইকিপিডিয়ার গ্রন্থতালিকা</a>।</p>
      </div>

      <StickyNext show={read.length > 0 && !resultVisible} title={<><strong>{scoreText(read.length)}</strong> পড়া</>} sub={tierFor(read.length)} href="#result" label="কার্ডটা দেখো" />

      <section className="hm-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="hm-result-head">
          <h2 id="result-title">{card.count ? <>তুমি <em>{card.tier}</em></> : "তাকটা এখনো খালি"}</h2>
          <p>{card.line}</p>
        </div>

        <div className="hm-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="hm-sr">{scoreText(card.count)} পড়া, {card.tier}। {read.map(titleOf).join(", ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="hm-controls">
            {common && (
              <div className="hm-common">
                <h3>{possessive(friendName)} সাথে দুজনেরই পড়া: {bn(common.count)}টা</h3>
                <p>{common.count ? common.text : "এখনো একটাও মেলেনি। তুমি যেগুলো পড়েছ, ওপরে ট্যাপ করো।"}</p>
              </div>
            )}
            <label className="hm-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="humayun-boi.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${card.match}`} caption={caption} state={state} hint="লিংক পাঠালে বন্ধুও নিজের তাক মেলাতে পারবে।" />
            {read.length > 0 && <button type="button" className="kit-link hm-restart" onClick={restart}>সব নামিয়ে আবার শুরু করি</button>}
          </div>
        </div>

        <div className="hm-everyone">
          <h3>সবাই কোনটা কম পড়েছে?</h3>
          {compared !== "done" || !everyone ? <>
            <p>তোমার তাক সবার সাথে মেলালে দেখবে কোন বইটা প্রায় কেউ পড়েনি, সেটাই হতে পারে তোমার পরের বই। নাম যাবে না, শুধু বইগুলো গোনা হবে।</p>
            <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
            {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : everyone.total < COMPARE_MIN ? (
            <p className="kit-status">{bn(everyone.total)} জনের সাথে মেলানো হলো। এখনো খুব কম মানুষ, তাই হিসাব এখনই ঠিকমতো বলা যাবে না। বন্ধুদের লিংক পাঠাও!</p>
          ) : (
            <div className="hm-tips">
              {tip && <p><span>পরের বই হিসেবে ধরো</span><strong>{tip.book.title}</strong><em>{tip.share < 30 ? "মাত্র " : ""}{bn(tip.share)}% মানুষ পড়েছে</em></p>}
              {rarest && <p><span>তুমি পড়েছ, কম মানুষ পড়েছে</span><strong>{rarest.book.title}</strong><em>{bn(rarest.share)}% মানুষ পড়েছে</em></p>}
              <p className="hm-tips-note">{bn(everyone.total)} জনের তাকের হিসাব।</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
