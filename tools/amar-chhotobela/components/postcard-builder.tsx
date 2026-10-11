"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, PhotoPicker, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-postcard";
import { bn, chapters, createCard, decades, memories, memoryLine, parseShareHash, possessive, shareHash, toggleMemory, MAX_NAME_LENGTH, type DecadeId, type MemoryId, type Shared } from "../lib/postcard";
import { MemorySketch } from "./memory-sketch";

const TOOL = "amar-chhotobela";
// Below this, "৩ জন মিলিয়েছে" reads as an empty room rather than social proof.
const SOCIAL_PROOF_MIN = 50;
// Percentages from a handful of people are noise ("১০০% মানুষের ছিল" after one vote).
const COMPARE_MIN = 20;
const share = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

export function PostcardBuilder() {
  const [selected, setSelected] = useState<MemoryId[]>([]);
  const [name, setName] = useState("");
  const [decade, setDecade] = useState<DecadeId | "">("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const own = useMemo(() => ({ selected, name, decade }), [selected, name, decade]);
  const card = useMemo(() => createCard(own, friend), [own, friend]);
  const state = shareHash(own).slice(1);

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
    loadCardFonts("আমার ছোটবেলা").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site, photo);
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend, photo]);

  function toggle(id: MemoryId) {
    setSelected(current => toggleMemory(current, id));
    // Changed picks make the old comparison stale; let them compare again.
    setCompared(current => current === "done" ? "idle" : current);
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, selected);
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  function restart() {
    if (selected.length > 2 && !window.confirm("সব বাছাই মুছে নতুন করে শুরু করবে?")) return;
    setSelected([]);
    setCompared("idle");
    document.getElementById("memory-grid")?.scrollIntoView({ behavior: "smooth" });
  }

  const ranked = compared === "done" && everyone ? selected.map(id => ({ memory: memories.find(memory => memory.id === id)!, percent: share(everyone.counts[id] ?? 0, everyone.total) })).sort((a, b) => a.percent - b.percent) : [];
  const caption = card.match ? `${card.match}! আমার ছোটবেলার ${bn(card.count)}টা মিলেছে। তোমার কয়টা?` : `আমার ছোটবেলার ${bn(card.count)}টা মিলে গেছে! তোমার কয়টা মেলে, দেখো তো:`;

  return (
    <div className="khata">
      {friend && (
        <section className="khata-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name ? possessive(friend.name) : "বন্ধুর"} ছোটবেলার খাতা`} />
          <div>
            <p className="khata-kicker">তোমার জন্য একটা খাতা এসেছে</p>
            <h2 id="friend-title">{friend.name ? possessive(friend.name) : "তোমার বন্ধুর"} ছোটবেলার {bn(friend.selected.length)}টা মিলেছে।<br /><span>তোমার কয়টা?</span></h2>
            <a className="kit-primary" href="#memory-grid">আমারটা মেলাই</a>
          </div>
        </section>
      )}

      {everyone && everyone.total >= SOCIAL_PROOF_MIN && <p className="khata-proof">এখন পর্যন্ত <strong>{bn(everyone.total)} জন</strong> নিজের ছোটবেলা মিলিয়েছে</p>}

      <div className="khata-grid-wrap" id="memory-grid">
        {chapters.map(chapter => (
          <fieldset className="khata-chapter" key={chapter.id}>
            <legend>{chapter.label}</legend>
            <div className="khata-tiles">
              {memories.filter(memory => memory.chapter === chapter.id).map(memory => (
                <button type="button" key={memory.id} className="khata-tile" data-chapter={memory.chapter} aria-pressed={selected.includes(memory.id)} onClick={() => toggle(memory.id)}>
                  <MemorySketch drawing={memory.drawing} />
                  <span>{memory.label}</span>
                  <svg className="khata-tick" viewBox="0 0 32 24" aria-hidden="true"><path d="M3 12l9 9L29 3" /></svg>
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <StickyNext show={selected.length > 0 && !resultVisible} title={<><strong>{bn(selected.length)}টা</strong> মিলেছে</>} sub={memoryLine(selected.length)} href="#result" label="খাতাটা দেখো" />

      <section className="khata-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="khata-result-head">
          <h2 id="result-title">{card.count ? <>তোমার খাতায় <em>{bn(card.count)}টা</em> স্মৃতি</> : "তোমার খাতাটা এখনো ফাঁকা"}</h2>
          <p>{card.count ? card.line : "ওপরের তালিকা থেকে যেগুলো তোমার ছোটবেলায় ছিল, সেগুলোয় ট্যাপ করো।"}</p>
        </div>

        <div className="khata-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="khata-sr">{card.headline}। {memories.filter(memory => card.selected.has(memory.id)).map(memory => memory.label).join(", ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">খাতার ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="khata-controls">
            <label className="khata-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <PhotoPicker value={photo} onChange={setPhoto} />
            <fieldset className="kit-chips">
              <legend>ছোটবেলা কেটেছে কোন দশকে?</legend>
              {decades.map(item => <button type="button" key={item.id} aria-pressed={decade === item.id} onClick={() => setDecade(current => current === item.id ? "" : item.id)}>{item.label}</button>)}
            </fieldset>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="amar-chhotobela.png" makeImage={() => cardBlob(card, format, site, photo)} imageKey={`${state}|${format}|${photo?.width ?? 0}`} caption={caption} state={state} disabled={!card.count} hint={card.count ? "বন্ধু লিংক খুললে তোমার খাতা দেখবে, নিজেরটাও মেলাতে পারবে।" : ""} />
            {card.count > 0 && <button type="button" className="kit-link khata-restart" onClick={restart}>আবার শুরু করি</button>}
          </div>
        </div>

        {card.count > 0 && (
          <div className="khata-everyone">
            <h3>সবার সাথে মিলিয়ে দেখবে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>দেখো কোন স্মৃতিটা শুধু তোমার মতো অল্প কয়েকজনের, আর কোনটা প্রায় সবার। নাম বা ছবি যাবে না, শুধু বাছাইগুলো গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : <>
              <p>{bn(everyone.total)} জনের সাথে মেলানো হলো।</p>
              {everyone.total < COMPARE_MIN ? <p className="kit-status">এখনো খুব কম মানুষ মিলিয়েছে, তাই হিসাব এখনই ঠিকমতো বলা যাবে না। বন্ধুদের লিংক পাঠাও, কয়েকজন মেলালেই জমে যাবে!</p> : <>
              {ranked.length > 0 && <div className="khata-rare">
                <p><span>কম মানুষের যেটা ছিল</span><strong>{ranked[0].memory.label}</strong><em>{ranked[0].percent < 30 ? "মাত্র " : ""}{bn(ranked[0].percent)}% মানুষের ছিল</em></p>
                {ranked.length > 1 && <p><span>প্রায় সবার যেটা ছিল</span><strong>{ranked.at(-1)!.memory.label}</strong><em>{bn(ranked.at(-1)!.percent)}% মানুষের ছিল</em></p>}
              </div>}
              <ul className="khata-bars">{ranked.slice().reverse().map(({ memory, percent }) => <li key={memory.id}><span>{memory.label}</span><i style={{ width: `${percent}%` }} /><b>{bn(percent)}%</b></li>)}</ul>
              </>}
            </>}
          </div>
        )}
      </section>
    </div>
  );
}
