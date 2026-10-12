"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { art } from "../lib/art";
import { bn, createCard, groups, isGi, parseShareHash, placeOf, possessive, shareHash, starters, sweetById, sweets, tier, toggleSweet, total, MAX_NAME_LENGTH, type Shared, type SweetId } from "../lib/box";
import { cardBlob, drawCard, prepareCard } from "../lib/draw-box";

const TOOL = "mishtir-baksho";
// Below this, "৩ জন বাক্স সাজিয়েছে" reads as an empty shop rather than social proof.
const SOCIAL_PROOF_MIN = 50;
// Percentages from a handful of people are noise ("১০০% মানুষ খেয়েছে" after one vote).
const COMPARE_MIN = 20;
const percent = (count: number, of: number) => Math.round((count / Math.max(of, 1)) * 100);

function SweetArt({ id }: { id: SweetId }) {
  // Static drawings from lib/art, never user input.
  return <svg viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: art[id] }} />;
}

export function BoxBuilder() {
  const [selected, setSelected] = useState<SweetId[]>(starters);
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
  const count = selected.length;

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared box replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    prepareCard(card.lid).then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  function toggle(id: SweetId) {
    if (!selected.includes(id)) navigator.vibrate?.(12);
    setSelected(current => toggleSweet(current, id));
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
    if (count > 5 && !window.confirm("বাক্স খালি করে আবার প্রথম থেকে সাজাবে?")) return;
    setSelected(starters);
    setCompared("idle");
    document.getElementById("sweet-box")?.scrollIntoView({ behavior: "smooth" });
  }

  const showCompare = compared === "done" && everyone && everyone.total >= COMPARE_MIN;
  const rarestMine = showCompare ? [...selected].sort((a, b) => (everyone.counts[a] ?? 0) - (everyone.counts[b] ?? 0))[0] : undefined;
  const leastOverall = showCompare ? [...sweets].sort((a, b) => (everyone.counts[a.id] ?? 0) - (everyone.counts[b.id] ?? 0))[0] : undefined;
  const caption = card.match ? `${card.match}! আমার মিষ্টির বাক্সে ${bn(total)}-এ ${bn(count)}টা। তোমার কয়টা?` : `আমার মিষ্টির বাক্সে ${bn(total)}-এ ${bn(count)}টা, ${card.tier}! তোমার বাক্সে কয়টা, দেখো তো:`;
  const friendName = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";

  return (
    <div className="mb">
      {friend && (
        <section className="mb-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName} মিষ্টির বাক্স`} />
          <div>
            <p className="mb-kicker">তোমার জন্য একটা মিষ্টির বাক্স এসেছে</p>
            <h2 id="friend-title">{friendName} বাক্সে {bn(friend.selected.length)}টা মিষ্টি।<br /><span>তোমার কয়টা?</span></h2>
            <a className="kit-primary" href="#sweet-grid">আমার বাক্স সাজাই</a>
          </div>
        </section>
      )}

      <div className="mb-box" id="sweet-box">
        <div className="mb-box-head">
          <p className="mb-count" aria-live="polite"><span>বাক্সে</span> <strong key={count}>{bn(total)}-এ {bn(count)}টা</strong></p>
          <p className="mb-tier">{tier(count)}</p>
        </div>
        <ol className="mb-slots" aria-label="বাক্সে যা আছে">
          {selected.map(id => <li key={id} className="mb-slot is-full" title={sweetById(id).label}><SweetArt id={id} /></li>)}
          {Array.from({ length: total - count }, (_, index) => <li key={`empty-${index}`} className="mb-slot" aria-hidden="true" />)}
        </ol>
      </div>

      {everyone && everyone.total >= SOCIAL_PROOF_MIN && <p className="mb-proof">এখন পর্যন্ত <strong>{bn(everyone.total)} জন</strong> নিজের বাক্স সাজিয়েছে</p>}

      <div className="mb-grid" id="sweet-grid">
        <h2 className="mb-grid-title">{bn(total)}টা মিষ্টির নাম ও ছবি <span>যেগুলো খেয়েছ, চেপে বাক্সে তোলো</span></h2>
        {groups.map(group => (
          <fieldset className="mb-group" key={group.id}>
            <legend>{group.label}</legend>
            <div className="mb-tiles">
              {sweets.filter(sweet => sweet.group === group.id).map(sweet => (
                <button type="button" key={sweet.id} className="mb-tile" aria-pressed={selected.includes(sweet.id)} onClick={() => toggle(sweet.id)}>
                  <SweetArt id={sweet.id} />
                  <span className="mb-name">{sweet.label}</span>
                  {placeOf(sweet) && <small className="mb-place">{placeOf(sweet)}{isGi(sweet) && <b>জিআই</b>}</small>}
                  <svg className="mb-tick" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
                </button>
              ))}
            </div>
          </fieldset>
        ))}
      </div>

      <StickyNext show={!resultVisible} title={<><strong>{bn(total)}-এ {bn(count)}টা</strong> বাক্সে</>} sub={tier(count)} href="#result" label="বাক্স বাঁধো" />

      <section className="mb-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="mb-result-head">
          <h2 id="result-title">{count ? <>তোমার বাক্সে <em>{bn(count)}টা</em> মিষ্টি</> : "বাক্সটা এখনো ফাঁকা"}</h2>
          <p>{count ? card.line : "ওপরের তালিকা থেকে যেগুলো খেয়েছ, চেপে বাক্সে তোলো।"}</p>
        </div>

        <div className="mb-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="mb-sr">{card.lid}: {bn(total)}-এ {bn(count)}টা, {card.tier}। {card.names}</figcaption>
            {previewError && <p className="kit-status" role="alert">বাক্সের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="mb-controls">
            <label className="mb-field">
              <span>ঢাকনায় নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="mishtir-baksho.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} disabled={!count} hint={count ? "বন্ধু লিংক খুলে নিজের বাক্স সাজালে, দুজনের কয়টা মিলল সেটা ওর ছবিতে লেখা উঠবে।" : ""} />
            <button type="button" className="kit-link mb-restart" onClick={restart}>আবার প্রথম থেকে সাজাই</button>
          </div>
        </div>

        {count > 0 && (
          <div className="mb-everyone">
            <h3>সবার বাক্সের সাথে মেলাবে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>দেখো তোমার কোন মিষ্টিটা খুব কম মানুষ খেয়েছে। নাম যাবে না, শুধু কোন কোন মিষ্টি বাছলে সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : !showCompare ? (
              <p className="kit-status">এখনো খুব কম মানুষ মিলিয়েছে, তাই হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও, কয়েকজন মেলালেই হিসাব দেখা যাবে।</p>
            ) : (
              <div className="mb-rare">
                {rarestMine && <p><span>তোমার বাক্সের সবচেয়ে বিরল মিষ্টি</span><strong>{sweetById(rarestMine).label}</strong><em>{bn(percent(everyone.counts[rarestMine] ?? 0, everyone.total))}% মানুষ খেয়েছে</em></p>}
                {leastOverall && <p><span>সবচেয়ে কম মানুষ খেয়েছে</span><strong>{"known" in leastOverall ? leastOverall.known : leastOverall.label}</strong><em>{selected.includes(leastOverall.id) ? "তুমি তাদের একজন!" : "পরের বার চেখে দেখো?"}</em></p>}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
