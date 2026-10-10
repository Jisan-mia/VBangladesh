"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { bn, createCard, DEFAULT_PICKS, fishes, groups, isRare, parseShareHash, possessive, shareHash, toggleFish, MAX_NAME_LENGTH, type FishId, type Shared } from "../lib/fish";
import { FishIcon } from "./fish-icon";

const TOOL = "mache-bhate";
// Below this, "৩ জন সাজিয়েছে" reads as an empty room rather than social proof.
const SOCIAL_PROOF_MIN = 50;
// Percentages from a handful of people are noise ("১০০% মানুষ খেয়েছে" after one vote).
const COMPARE_MIN = 20;
const TRAY_SHOWN = 9;
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

export function DalaBuilder() {
  const [selected, setSelected] = useState<FishId[]>(DEFAULT_PICKS);
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
  const friendPicks = useMemo(() => new Set(friend?.selected ?? []), [friend]);
  const friendBadge = friend ? `${(friend.name.split(" ")[0] || "বন্ধু").slice(0, 10)}ও` : "";

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
    loadCardFonts("মাছে-ভাতে ডালা").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  function toggle(id: FishId) {
    setSelected(current => toggleFish(current, id));
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
    if (selected.length > 3 && !window.confirm("ডালা খালি করে নতুন করে সাজাবে?")) return;
    setSelected([]);
    setCompared("idle");
    document.getElementById("fish-grid")?.scrollIntoView({ behavior: "smooth" });
  }

  const ranked = compared === "done" && everyone ? card.fish.map(fish => ({ fish, share: percent(everyone.counts[fish.id] ?? 0, everyone.total) })).sort((a, b) => a.share - b.share) : [];
  // The discovery nudge never points at a fish that is getting scarce.
  const missing = compared === "done" && everyone ? fishes.filter(fish => !selected.includes(fish.id) && !isRare(fish.id)).map(fish => ({ fish, share: percent(everyone.counts[fish.id] ?? 0, everyone.total) })).sort((a, b) => b.share - a.share)[0] : undefined;
  const caption = card.match ? `${card.match}! আমার ডালায় ${bn(card.total)}টা দেশি মাছের ${bn(card.count)}টা। তোমার ডালায় কয়টা?` : `${bn(card.total)}টা দেশি মাছের ${bn(card.count)}টা আমি খেয়েছি, ${card.tier}! তোমার ডালায় কয়টা উঠবে?`;
  const shown = selected.slice(-TRAY_SHOWN);

  return (
    <div className="mb">
      {friend && (
        <section className="mb-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name ? possessive(friend.name) : "বন্ধুর"} মাছের ডালা`} />
          <div>
            <p className="mb-kicker">তোমার জন্য একটা ডালা এসেছে</p>
            <h2 id="friend-title">{friend.name ? possessive(friend.name) : "তোমার বন্ধুর"} ডালায় {bn(friend.selected.length)}টা মাছ।<br /><span>তোমার কয়টা?</span></h2>
            <p className="mb-friend-note">নিচের তালিকায় ‘{friendBadge}’ লেখা মাছগুলো ওর ডালাতেও আছে।</p>
            <a className="kit-primary" href="#fish-grid">আমারটা সাজাই</a>
          </div>
        </section>
      )}

      <div className="mb-dala">
        <div className="mb-tray" aria-hidden="true" data-few={selected.length <= 4}>
          {shown.length ? shown.map(id => <FishIcon key={id} id={id} className="mb-tray-fish" />) : <span className="mb-tray-empty">ডালা ফাঁকা</span>}
          {selected.length > TRAY_SHOWN && <span className="mb-tray-more">+{bn(selected.length - TRAY_SHOWN)}</span>}
        </div>
        <p className="mb-tag" aria-live="polite"><span>{bn(fishes.length)}-এ</span><strong>{bn(selected.length)}</strong><span className="mb-sr">টা মাছ ডালায়</span></p>
      </div>
      <p className="mb-hint">নিচে যে মাছ খেয়েছ, ছুঁয়ে দাও। ভুল হলে আবার ছুঁলেই নেমে যাবে।</p>

      {everyone && everyone.total >= SOCIAL_PROOF_MIN && <p className="mb-proof">এখন পর্যন্ত <strong>{bn(everyone.total)} জন</strong> নিজের ডালা সাজিয়েছে</p>}

      <div className="mb-grid" id="fish-grid">
        {groups.map(group => {
          const inGroup = fishes.filter(fish => fish.group === group.id);
          return (
            <fieldset className="mb-group" key={group.id} data-group={group.id}>
              <legend>{group.label} <small>{bn(inGroup.filter(fish => selected.includes(fish.id)).length)}/{bn(inGroup.length)}</small></legend>
              <div className="mb-tiles">
                {inGroup.map(fish => (
                  <button type="button" key={fish.id} className="mb-tile" aria-pressed={selected.includes(fish.id)} onClick={() => toggle(fish.id)}>
                    <FishIcon id={fish.id} className="mb-tile-art" />
                    <span className="mb-tile-name">{fish.label}</span>
                    {"rare" in fish && <span className="mb-tile-rare">এখন কম পাওয়া যায়</span>}
                    {friendPicks.has(fish.id) && <span className="mb-tile-friend">{friendBadge}</span>}
                    <svg className="mb-tick" viewBox="0 0 32 24" aria-hidden="true"><path d="M3 12l9 9L29 3" /></svg>
                  </button>
                ))}
              </div>
            </fieldset>
          );
        })}
        <p className="mb-source">
          <strong>সূত্র ও যাচাই:</strong> মাছের নাম ও বানান <a href="https://bn.banglapedia.org/index.php?title=মাছ" target="_blank" rel="noopener noreferrer">বাংলাপিডিয়া</a> আর সাগরের মাছ <a href="https://marinebiodiversity.org.bd/species/lates-calcarifer/" target="_blank" rel="noopener noreferrer">বাংলাদেশের সামুদ্রিক মাছের তালিকা</a> (মৎস্য অধিদপ্তরের অ্যালবাম থেকে) মিলিয়ে।
          ‘এখন কম পাওয়া যায়’ লেখা মাছগুলো নদী-বিলে কমে যাওয়ায় <a href="https://en.bdfish.org/?p=4815" target="_blank" rel="noopener noreferrer">IUCN বাংলাদেশের ২০১৫ সালের লাল তালিকায়</a> হুমকির মুখে থাকা মাছ; চাষের মাছ বাজারে মিলতে পারে।
          ছবিগুলো চেনার সুবিধার জন্য আঁকা নকশা, হুবহু মাছের ছবি না। এলাকাভেদে একই মাছের অন্য নামও আছে।
        </p>
      </div>

      <StickyNext show={selected.length > 0 && !resultVisible} title={<><strong>{bn(selected.length)}টা</strong> মাছ ডালায়</>} sub={card.tier} href="#result" label="ডালাটা দেখো" />

      <section className="mb-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="mb-result-head">
          <h2 id="result-title">{card.count ? <>তোমার ডালায় <em>{bn(card.count)}টা</em> মাছ</> : "তোমার ডালাটা এখনো ফাঁকা"}</h2>
          <p>{card.count ? <><strong>{card.tier}।</strong> {card.line}</> : "ওপরের তালিকা থেকে যে মাছগুলো খেয়েছ, ছুঁয়ে দাও।"}</p>
          {card.match && <p className="mb-match">{card.match}</p>}
        </div>

        <div className="mb-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="mb-sr">{card.title}: {bn(card.total)}টার মধ্যে {bn(card.count)}টা মাছ। {card.fish.map(fish => fish.label).join(", ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">ডালার ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="mb-controls">
            <label className="mb-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="mache-bhate.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} disabled={!card.count} hint={card.count ? "লিংক পেলে বন্ধু তোমার ডালা দেখবে, তারপর নিজেরটা সাজাতে পারবে।" : ""} />
            {card.count > 0 && <button type="button" className="kit-link mb-restart" onClick={restart}>ডালা খালি করে আবার সাজাই</button>}
          </div>
        </div>

        {card.count > 0 && (
          <div className="mb-everyone">
            <h3>সবার ডালার সাথে মেলাবে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>দেখো কোন মাছটা খুব কম মানুষের পাতে উঠেছে, আর কোনটা প্রায় সবার। নাম যাবে না, শুধু কোন কোন মাছ বেছেছ সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : <>
              <p>{bn(everyone.total)} জনের ডালার সাথে মেলানো হলো।</p>
              {everyone.total < COMPARE_MIN ? <p className="kit-status">এখনো খুব কম মানুষ মিলিয়েছে, তাই হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও, কয়েকজন সাজালেই মজাটা শুরু!</p> : <>
                <div className="mb-rare">
                  {ranked[0] && <p><span>তোমার ডালার সবচেয়ে বিরল মাছ</span><strong>{ranked[0].fish.label}</strong><em>{ranked[0].share < 30 ? "মাত্র " : ""}{bn(ranked[0].share)}% মানুষের ডালায় আছে</em></p>}
                  {missing && <p><span>সবার ডালায় আছে, তোমারটায় নেই</span><strong>{missing.fish.label}</strong><em>{bn(missing.share)}% মানুষ খেয়েছে। তুমি কখনো চেখে দেখেছ?</em></p>}
                </div>
                <ul className="mb-bars">{ranked.slice().reverse().map(({ fish, share }) => <li key={fish.id}><span>{fish.label}</span><i style={{ width: `${share}%` }} /><b>{bn(share)}%</b></li>)}</ul>
              </>}
            </>}
          </div>
        )}
      </section>
    </div>
  );
}

