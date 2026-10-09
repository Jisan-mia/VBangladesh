"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { saveBlob } from "../../../shared/art-export";
import { cardBlob, cardSizes, drawCard, loadCardFont, type CardFormat } from "../lib/draw-postcard";
import { bn, chapters, createCard, decades, memories, memoryLine, parseShareHash, possessive, shareHash, toggleMemory, MAX_NAME_LENGTH, type DecadeId, type MemoryId, type Shared } from "../lib/postcard";
import { MemorySketch } from "./memory-sketch";

const FILE_NAME = "amar-chhotobela.png";

export function PostcardBuilder() {
  const [selected, setSelected] = useState<MemoryId[]>([]);
  const [name, setName] = useState("");
  const [decade, setDecade] = useState<DecadeId | "">("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [site, setSite] = useState("");
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [inApp, setInApp] = useState(false);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [resultVisible, setResultVisible] = useState(false);
  const [saveView, setSaveView] = useState("");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const own = useMemo(() => ({ selected, name, decade }), [selected, name, decade]);
  const card = useMemo(() => createCard(own, friend), [own, friend]);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared card replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    setCanShareFiles(Boolean(navigator.canShare?.({ files: [new File([""], FILE_NAME, { type: "image/png" })] })));
    // Facebook/Messenger/Instagram in-app browsers block blob downloads; we show a long-press image there instead.
    setInApp(/FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram/i.test(navigator.userAgent));
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFont().then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend), "feed", site);
    }).catch(() => { if (!cancelled) setStatus("খাতার ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।"); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  useEffect(() => {
    if (!result.current) return;
    const observer = new IntersectionObserver(([entry]) => setResultVisible(entry.isIntersecting), { threshold: 0.15 });
    observer.observe(result.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => { if (saveView) URL.revokeObjectURL(saveView); }, [saveView]);

  const shareLink = () => `${window.location.origin}${window.location.pathname}${shareHash(own)}`;
  const caption = () => `আমার ছোটবেলার ${bn(card.count)}টা মিলে গেছে! তোমার কয়টা মেলে, দেখো তো:`;

  function toggle(id: MemoryId) {
    setSelected(current => toggleMemory(current, id));
    setStatus("");
  }

  async function makeFile() {
    return new File([await cardBlob(card, format, site)], FILE_NAME, { type: "image/png" });
  }

  async function share() {
    if (!card.count || busy) return;
    setBusy(true);
    try {
      if (canShareFiles) await navigator.share({ files: [await makeFile()], text: `${caption()} ${shareLink()}` });
      else if (navigator.share) await navigator.share({ text: caption(), url: shareLink() });
      else { await copyLink(); return; }
      setStatus("শেয়ার হয়ে গেছে। এবার দেখো, কে কয়টা মেলায়!");
    } catch (error) {
      setStatus(error instanceof Error && error.name === "AbortError" ? "" : "সরাসরি শেয়ার হলো না। ছবিটা নামিয়ে নিজে পোস্ট করো।");
    } finally { setBusy(false); }
  }

  async function download() {
    if (!card.count || busy) return;
    setBusy(true);
    try {
      const blob = await cardBlob(card, format, site);
      if (inApp) setSaveView(URL.createObjectURL(blob));
      else { saveBlob(blob, FILE_NAME); setStatus("ছবি নেমে গেছে। ফোনের গ্যালারি বা ডাউনলোড ফোল্ডারে পাবে।"); }
    } catch {
      setStatus("ছবিটা নামানো গেল না। আরেকবার চেষ্টা করো।");
    } finally { setBusy(false); }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${caption()} ${shareLink()}`);
      setStatus("লিংক কপি হয়েছে। ফেসবুক বা মেসেঞ্জারে পেস্ট করে দাও। বন্ধু খুললেই দেখবে তোমাদের কয়টা মেলে।");
    } catch {
      setStatus("কপি হলো না। ব্রাউজারের ঠিকানাটা নিজে কপি করে নাও।");
    }
  }

  function restart() {
    if (selected.length > 2 && !window.confirm("সব বাছাই মুছে নতুন করে শুরু করবে?")) return;
    setSelected([]);
    setStatus("");
    document.getElementById("memory-grid")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="khata">
      {friend && (
        <section className="khata-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name ? possessive(friend.name) : "বন্ধুর"} ছোটবেলার খাতা`} />
          <div>
            <p className="khata-kicker">তোমার জন্য একটা খাতা এসেছে</p>
            <h2 id="friend-title">{friend.name ? possessive(friend.name) : "তোমার বন্ধুর"} ছোটবেলার {bn(friend.selected.length)}টা মিলেছে।<br /><span>তোমার কয়টা?</span></h2>
            <a className="khata-button" href="#memory-grid">আমারটা মেলাই</a>
          </div>
        </section>
      )}

      <div className="khata-grid-wrap" id="memory-grid">
        {chapters.map(chapter => (
          <fieldset className="khata-chapter" key={chapter.id}>
            <legend>{chapter.label}</legend>
            <div className="khata-tiles">
              {memories.filter(memory => memory.chapter === chapter.id).map(memory => {
                const picked = selected.includes(memory.id);
                return (
                  <button type="button" key={memory.id} className="khata-tile" data-chapter={memory.chapter} aria-pressed={picked} onClick={() => toggle(memory.id)}>
                    <MemorySketch drawing={memory.drawing} />
                    <span>{memory.label}</span>
                    <svg className="khata-tick" viewBox="0 0 32 24" aria-hidden="true"><path d="M3 12l9 9L29 3" /></svg>
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      <div className="khata-bar" data-show={selected.length > 0 && !resultVisible} aria-hidden={selected.length === 0 || resultVisible}>
        <p><strong>{bn(selected.length)}টা</strong> মিলেছে<span>{memoryLine(selected.length)}</span></p>
        <a className="khata-button" href="#result" tabIndex={selected.length === 0 || resultVisible ? -1 : 0}>খাতাটা দেখো</a>
      </div>

      <section className="khata-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="khata-result-head">
          <h2 id="result-title">{card.count ? <>তোমার খাতায় <em>{bn(card.count)}টা</em> স্মৃতি</> : "তোমার খাতাটা এখনো ফাঁকা"}</h2>
          <p>{card.count ? card.line : "ওপরের তালিকা থেকে যেগুলো তোমার ছোটবেলায় ছিল, ছুঁয়ে দাও।"}</p>
        </div>

        <div className="khata-result-body">
          <figure className="khata-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="khata-sr">{card.headline}। {memories.filter(memory => card.selected.has(memory.id)).map(memory => memory.label).join(", ")}</figcaption>
          </figure>

          <div className="khata-controls">
            <label className="khata-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <fieldset className="khata-chips">
              <legend>ছোটবেলা কেটেছে কোন দশকে?</legend>
              {decades.map(item => <button type="button" key={item.id} aria-pressed={decade === item.id} onClick={() => setDecade(current => current === item.id ? "" : item.id)}>{item.label}</button>)}
            </fieldset>
            <fieldset className="khata-chips">
              <legend>কোথায় দেবে?</legend>
              <button type="button" aria-pressed={format === "feed"} onClick={() => setFormat("feed")}>ফেসবুক পোস্ট</button>
              <button type="button" aria-pressed={format === "story"} onClick={() => setFormat("story")}>স্টোরি</button>
            </fieldset>

            <div className="khata-actions">
              <button type="button" className="khata-button khata-share" onClick={share} disabled={!card.count || busy}>{busy ? "একটু দাঁড়াও…" : "শেয়ার করো"}</button>
              <div>
                <button type="button" className="khata-secondary" onClick={download} disabled={!card.count || busy}>ছবি নামাও</button>
                <button type="button" className="khata-secondary" onClick={copyLink} disabled={!card.count}>লিংক কপি করো</button>
              </div>
            </div>
            <p className="khata-status" role="status" aria-live="polite">{status || (card.count ? "লিংক পেলে বন্ধু দেখবে তোমার খাতা, আর নিজেরটা মেলাতে পারবে।" : "")}</p>
            {inApp && <p className="khata-tip">ফেসবুকের ভেতর থেকে খুলেছ? ছবি না নামলে ওপরের ⋮ চেপে “ব্রাউজারে খোলো” বেছে নাও।</p>}
            {card.count > 0 && <button type="button" className="khata-restart" onClick={restart}>আবার শুরু করি</button>}
          </div>
        </div>
      </section>

      {saveView && (
        <div className="khata-save" role="dialog" aria-modal="true" aria-labelledby="save-title">
          <div>
            <h2 id="save-title">ছবিটা চেপে ধরে রাখো</h2>
            <p>তারপর “ছবি সেভ করো” বা “Download image” বেছে নাও।</p>
            <img src={saveView} alt={card.headline} />
            <button type="button" className="khata-button" onClick={() => setSaveView("")}>ঠিক আছে</button>
          </div>
        </div>
      )}
    </div>
  );
}
