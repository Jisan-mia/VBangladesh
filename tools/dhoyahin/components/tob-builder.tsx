"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  addDays, bn, caption, cheerCaption, cheerLabel, cheers, cleanName, cleanPrice, cleanSticks, facts, headline, inRange, loadQuit, localToday, maxDate, plant, possessive,
  relationLabel, relations, saveQuit, stateOf, stats, tally, parseState, DEFAULT_PRICE, DEFAULT_STICKS, MAX_NAME, MAX_PRICE, MAX_STICKS, MIN_QUIT_DATE, STICK_CHIPS,
  type Cheer, type Quit,
} from "../lib/dhoyahin";
import { Tob } from "./tob";

const TOOL = "dhoyahin";
const storage = () => { try { return window.localStorage; } catch { return null; } };
const quickDays = [{ ago: 0, label: "আজ" }, { ago: 1, label: "গতকাল" }, { ago: 7, label: "৭ দিন আগে" }, { ago: 30, label: "৩০ দিন আগে" }] as const;

/** Redraws a card canvas once the Bangla fonts are in. */
function useCard(canvas: RefObject<HTMLCanvasElement | null>, quit: Quit | null, today: string | null, format: CardFormat, site: string) {
  const [failed, setFailed] = useState(false);
  const key = quit && today ? `${stateOf(quit)}|${today}|${format}|${site}` : "";
  useEffect(() => {
    if (!quit || !today) return;
    let cancelled = false;
    loadCardFonts("ধোঁয়াহীন দিন").then(() => {
      if (cancelled || !canvas.current) return;
      drawCard(canvas.current, quit, today, format, site);
      setFailed(false);
    }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
    // the key stands in for quit, today, format and site
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  return failed;
}

export function TobBuilder() {
  const [today, setToday] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [sticks, setSticks] = useState(String(DEFAULT_STICKS));
  const [price, setPrice] = useState(String(DEFAULT_PRICE));
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Quit | null>(null);
  const [reply, setReply] = useState<Cheer>({ line: "gorbito", from: "ammu" });
  const [site, setSite] = useState("");
  const [note, setNote] = useState("");
  const loaded = useRef(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendCanvas = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  useEffect(() => {
    const now = localToday(new Date());
    const saved = loadQuit(storage(), now);
    setDate(saved?.date ?? now);
    if (saved) { setSticks(String(saved.sticks)); setPrice(String(saved.price)); setName(saved.name); }
    // In-page anchors (#result, #tob) also change the hash, so only a real shared count replaces the friend.
    const readFriend = () => { const shared = parseState(window.location.hash, now); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setToday(now);
    setSite(window.location.host);
    loaded.current = true;
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  const day = today ?? "2026-10-10";
  const quit = useMemo<Quit>(() => ({ date: date || day, sticks: cleanSticks(Number(sticks)), price: cleanPrice(Number(price)), name: cleanName(name) }), [date, day, sticks, price, name]);
  const count = tally(quit, day);
  const head = headline(quit, count);
  const [first, second] = stats(count, quit.sticks);
  const shape = useMemo(() => plant(count.days), [count.days]);
  const state = stateOf(quit);
  const replyQuit = useMemo(() => friend ? { ...friend, cheer: reply } : null, [friend, reply]);

  useEffect(() => { if (loaded.current && today) saveQuit(storage(), quit); }, [quit, today]);
  const previewError = useCard(preview, today ? quit : null, today, format, site);
  const friendError = useCard(friendCanvas, replyQuit, today, "feed", site);

  function restart() {
    if (count.days > 0 && !window.confirm("আজ থেকে আবার গোনা শুরু করবে?")) return;
    setDate(day);
    setNote("কোনো ব্যাপার না। নতুন চারা, নতুন শুরু। আজ থেকে আবার গুনছি।");
    document.getElementById("tob")?.scrollIntoView({ behavior: "smooth" });
  }

  const friendCount = friend ? tally(friend, day) : null;
  const friendWho = friend?.name || "তোমার বন্ধু";

  return (
    <div className="tob">
      {friend && friendCount && (
        <section className="tob-friend" aria-labelledby="tob-friend-title">
          <Tob plant={plant(friendCount.days)} label={`${friend.name ? possessive(friend.name) : "বন্ধুর"} টবের গাছ`} />
          <div>
            {friend.cheer
              ? <><p className="tob-kicker">{relationLabel(friend.cheer)} লিখেছে</p><h2 id="tob-friend-title">“{cheerLabel(friend.cheer)}”</h2><p>{friendWho}: {headline(friend, friendCount).big} {friendCount.days > 0 ? `ধোঁয়াহীন, ${bn(friendCount.saved)} টাকা বাঁচল` : headline(friend, friendCount).sub}</p></>
              : <><p className="tob-kicker">তোমাকে একটা খবর দিল</p><h2 id="tob-friend-title">{friendWho}: <span>{headline(friend, friendCount).big}</span> {friendCount.days > 0 ? "ধোঁয়াহীন" : ""}</h2><p>{friendCount.days > 0 ? `${bn(friendCount.skipped)}টা সিগারেট খায়নি, ${bn(friendCount.saved)} টাকা বাঁচল। ` : ""}গোনাটা প্রতিদিন নিজে নিজে বাড়ে।</p></>}
            {friend.cheer
              // A link with a tag usually comes back to the quitter: their own pot comes first.
              ? <div className="tob-friend-actions"><a className="kit-primary" href="#tob">আমার টবে ফিরি</a><a className="kit-link" href="#cheer">আরেকটা চিরকুট বাঁধো</a></div>
              : <div className="tob-friend-actions"><a className="kit-primary" href="#cheer">উৎসাহ পাঠাও</a><a className="kit-link" href="#tob">আমিও শুরু করব</a></div>}
          </div>
        </section>
      )}

      {friend && replyQuit && (
        <section className="tob-cheer" id="cheer" aria-labelledby="tob-cheer-title">
          <h2 id="tob-cheer-title">{friend.name ? possessive(friend.name) : "ওর"} টবে একটা চিরকুট বেঁধে দাও</h2>
          <fieldset className="kit-chips">
            <legend>কী লিখবে?</legend>
            {cheers.map(item => <button type="button" key={item.id} aria-pressed={reply.line === item.id} onClick={() => setReply(current => ({ ...current, line: item.id }))}>{item.label}</button>)}
          </fieldset>
          <fieldset className="kit-chips">
            <legend>তুমি ওর কে?</legend>
            {relations.map(item => <button type="button" key={item.id} aria-pressed={reply.from === item.id} onClick={() => setReply(current => ({ ...current, from: item.id }))}>{item.label}</button>)}
          </fieldset>
          <figure className="kit-card">
            <canvas ref={friendCanvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendWho}-এর কার্ড, ${relationLabel(reply)} লিখেছে: ${cheerLabel(reply)}`} />
            {friendError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <ShareBar tool={TOOL} fileName="dhoyahin-chirkut.png" makeImage={() => cardBlob(replyQuit, day, "feed", site)} imageKey={`${stateOf(replyQuit)}|${day}`} caption={cheerCaption(friend, friendCount!, reply)} state={stateOf(replyQuit)} hint="লিংকটা ওকেই পাঠাও। খুললে ও তোমার চিরকুটটা দেখবে।" />
        </section>
      )}

      <section className="tob-main" id="tob" aria-label="তোমার হিসাব">
        <div className="tob-stage">
          <div className="tob-count" aria-live="polite">
            <strong>{head.big}</strong>
            <span>{head.sub}</span>
            <ul>
              <li>{first}</li>
              <li>{second}</li>
            </ul>
          </div>
          <Tob plant={shape} label={count.days < 0 ? "টবে একটা বীজ, চারা গজাবে শুরুর দিন থেকে" : `টবের চারায় ${bn(shape.leaves.length)}টা পাতা${shape.flowers.length ? `, ${bn(shape.flowers.length)}টা ফুল` : ""}`} />
        </div>
        <p className="tob-legend">প্রতিদিন একটা নতুন পাতা, প্রতি মাসে একটা ফুল।</p>

        <div className="tob-controls">
          <div className="tob-field">
            <label htmlFor="tob-date">কবে থেকে ছাড়লে?</label>
            <input id="tob-date" type="date" value={date} min={MIN_QUIT_DATE} max={maxDate(day)} onChange={event => { if (inRange(event.target.value, day)) { setDate(event.target.value); setNote(""); } }} />
            <div className="tob-quick" role="group" aria-label="তাড়াতাড়ি বেছে নাও">
              {quickDays.map(item => { const value = addDays(day, -item.ago); return <button type="button" key={item.ago} aria-pressed={date === value} onClick={() => { setDate(value); setNote(""); }}>{item.label}</button>; })}
            </div>
            <small>সামনের কোনো দিনও দিতে পারো, যেমন ১ জানুয়ারি।</small>
          </div>

          <div className="tob-field">
            <span id="tob-sticks-label">দিনে কয়টা খেতে?</span>
            <div className="tob-quick" role="group" aria-labelledby="tob-sticks-label">
              {STICK_CHIPS.map(value => <button type="button" key={value} aria-pressed={quit.sticks === value} onClick={() => setSticks(String(value))}>{bn(value)}টা</button>)}
              <input aria-label="দিনে কয়টা, নিজে লেখো" type="number" inputMode="numeric" min={1} max={MAX_STICKS} value={sticks} onChange={event => setSticks(event.target.value)} />
            </div>
          </div>

          <div className="tob-field">
            <label htmlFor="tob-price">একটা সিগারেটের দাম</label>
            <div className="tob-money"><input id="tob-price" type="number" inputMode="decimal" min={1} max={MAX_PRICE} step="0.5" value={price} onChange={event => setPrice(event.target.value)} /><span>টাকা</span></div>
            <small>{bn(DEFAULT_PRICE)} টাকা শুধু উদাহরণ। তুমি যে দামে কিনতে, সেটা লেখো। প্যাকেটে কিনলে প্যাকেটের দাম ভাগ শলার সংখ্যা।</small>
          </div>
        </div>
      </section>

      <StickyNext show={Boolean(today) && !friend && !resultVisible} title={<><strong>{head.big}</strong> {count.days > 0 ? "ধোঁয়াহীন" : ""}</>} sub={second} href="#result" label="কার্ড দেখো" />

      <section className="tob-result" id="result" ref={result} aria-labelledby="tob-result-title">
        <h2 id="tob-result-title">{count.line}</h2>
        <div className="tob-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="tob-summary" />
            <figcaption id="tob-summary" className="tob-sr">{quit.name ? `${quit.name}: ` : ""}{head.big}, {head.sub}। {first}। {second}। {count.line}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="tob-share">
            <label className="tob-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="dhoyahin.png" makeImage={() => cardBlob(quit, day, format, site)} imageKey={`${state}|${day}|${format}`} caption={caption(quit, count)} state={state} hint="আব্বু-আম্মুকে পাঠাও। ওরা রোজকার হিসাব দেখবে, চিরকুটও বেঁধে দিতে পারবে।" />
            <div className="tob-restart">
              <button type="button" className="kit-link" onClick={restart}>আবার শুরু করো</button>
              <p className="kit-status" role="status">{note || "মাঝে একটা খেয়ে ফেললেও লজ্জার কিছু নেই। আবার আজ থেকে।"}</p>
            </div>
          </div>
        </div>
      </section>

      <aside className="tob-facts" aria-labelledby="tob-facts-title">
        <h2 id="tob-facts-title">দুটো কথা, সূত্রসহ</h2>
        <ul>{facts.map(fact => <li key={fact.url}><p>{fact.text}</p><a href={fact.url} target="_blank" rel="noopener noreferrer">সূত্র: {fact.source}</a></li>)}</ul>
        <p className="tob-note">টাকার হিসাব শুধু গুণ: দিন × দিনে কয়টা × একটার দাম। এটা ডাক্তারি পরামর্শ না। ছাড়তে কষ্ট হলে ডাক্তার বা কাছের সরকারি স্বাস্থ্যকেন্দ্রে কথা বলো। তোমার হিসাব এই ফোনেই থাকে।</p>
      </aside>
    </div>
  );
}
