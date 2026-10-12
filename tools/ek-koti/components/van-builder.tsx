"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cardSizes, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, prepareCard } from "../lib/draw-card";
import { parcelIcon, vanSvg } from "../lib/van-art";
import { BUDGET, PRICE_NOTE, bn, countOf, createCard, groupLevels, groups, itemById, items, leftOf, parseCount, parseShareHash, possessive, roomFor, setCount, shareHash, spentOf, starter, taka, MAX_NAME_LENGTH, type Cart, type GroupId, type ItemId, type Shared } from "../lib/van";

const TOOL = "ek-koti";
// Below this, "৩ জন ভ্যান বোঝাই করেছে" reads as an empty road rather than social proof.
const SOCIAL_PROOF_MIN = 50;
// Percentages from a handful of people are noise ("১০০% মানুষ কিনেছে" after one vote).
const COMPARE_MIN = 20;
const percent = (count: number, of: number) => Math.round((count / Math.max(of, 1)) * 100);

/** Rolls the shown number towards the real one, so the counter visibly falls. */
function useRolling(value: number) {
  const [shown, setShown] = useState(value);
  const current = useRef(value);
  useEffect(() => {
    const start = current.current;
    if (start === value) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { current.current = value; setShown(value); return; }
    const began = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const progress = Math.min(1, (now - began) / 550);
      current.current = Math.round(start + (value - start) * (1 - (1 - progress) ** 3));
      setShown(current.current);
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return shown;
}

export function VanBuilder() {
  const [cart, setCart] = useState<Cart>(starter);
  // Fast taps can land before React re-renders; every change builds on the latest cart, not a stale render.
  const latest = useRef<Cart>(starter);
  const [name, setName] = useState("");
  const [tab, setTab] = useState<GroupId>("khawa");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  // Each change gets a new key so its little animation plays again.
  const [pop, setPop] = useState({ text: "", key: 0 });
  const [warn, setWarn] = useState({ text: "", key: 0 });
  const [fresh, setFresh] = useState(-1);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const own = useMemo(() => ({ cart, name }), [cart, name]);
  const card = useMemo(() => createCard(own, friend), [own, friend]);
  const state = shareHash(own).slice(1);
  const left = leftOf(cart);
  const rolling = useRolling(left);
  const levels = groupLevels(cart);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared van replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const van = await prepareCard(card, card.title);
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site, van);
      if (friend && friendPreview.current) {
        const theirs = createCard(friend);
        const theirVan = await prepareCard(theirs, theirs.title);
        if (!cancelled && friendPreview.current) drawCard(friendPreview.current, theirs, "feed", site, theirVan);
      }
      setPreviewError(false);
    })().catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  useEffect(() => {
    if (!warn.text) return;
    const timer = setTimeout(() => setWarn(current => ({ ...current, text: "" })), 2600);
    return () => clearTimeout(timer);
  }, [warn]);

  function change(id: ItemId, wanted: number) {
    const current = latest.current;
    const before = countOf(current, id);
    const next = setCount(current, id, wanted);
    const after = countOf(next, id);
    if (wanted > after) {
      const item = itemById(id);
      setWarn(current => ({ key: current.key + 1, text: after >= (item.max ?? Infinity) ? "এটা একটাই কেনা যায়!" : `টাকায় কুলোচ্ছে না! বাকি আছে ${taka(leftOf(next))}` }));
    }
    if (after === before) { setPop(current => ({ ...current, text: "" })); return; }
    const moved = (after - before) * itemById(id).price;
    if (after > before) navigator.vibrate?.(10);
    setPop(current => ({ key: current.key + 1, text: moved > 0 ? `−${taka(moved)}` : `+${taka(-moved)}` }));
    const was = groupLevels(current);
    setFresh(groupLevels(next).findIndex((level, index) => level > was[index]));
    latest.current = next;
    setCart(next);
    // Changed picks make the old comparison stale; let them compare again.
    setCompared(current => current === "done" ? "idle" : current);
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, Object.keys(cart));
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  function restart() {
    if (card.count > 3 && !window.confirm("ভ্যান খালি করে আবার এক কোটি থেকে শুরু করবে?")) return;
    latest.current = starter;
    setCart(starter);
    setFresh(-1);
    setCompared("idle");
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  }

  const spentShare = (spentOf(cart) / BUDGET) * 100;
  const bought = Object.keys(cart) as ItemId[];
  const showCompare = compared === "done" && everyone && everyone.total >= COMPARE_MIN;
  const rarestMine = showCompare ? [...bought].sort((a, b) => (everyone.counts[a] ?? 0) - (everyone.counts[b] ?? 0))[0] : undefined;
  const mostOverall = showCompare ? [...items].sort((a, b) => (everyone.counts[b.id] ?? 0) - (everyone.counts[a.id] ?? 0))[0] : undefined;
  const caption = card.match
    ? `${card.match}! আমার এক কোটির ভ্যানে ${bn(card.count)}টা জিনিস। তুমি কী কিনতে?`
    : `হাতে এক কোটি টাকা থাকলে আমি কিনতাম: ${card.list.split(", ").slice(0, 3).join(", ")}… তুমি কী কিনতে?`;
  const friendName = friend?.name || "তোমার বন্ধু";
  const vanLabel = `ভ্যানে ${groups.map((group, index) => `${group.short} ${bn(levels[index])}টা`).join(", ")}`;

  return (
    <div className="ek">
      {friend && (
        <section className="ek-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name ? possessive(friend.name) : "বন্ধুর"} এক কোটির ভ্যান`} />
          <div>
            <p className="ek-kicker">তোমার জন্য একটা ভ্যান এসেছে</p>
            <h2 id="friend-title">{friendName} এক কোটি টাকায় {bn(Object.keys(friend.cart).length)} রকম জিনিস কিনেছে।<br /><span>তুমি কী কিনতে?</span></h2>
            <a className="kit-primary" href="#shop">আমার ভ্যান বোঝাই করি</a>
          </div>
        </section>
      )}

      <div className="ek-shop" id="shop">
        <div className="ek-stage">
        <div className={`ek-board${warn.text ? " is-short" : ""}`} key={`board-${warn.key}`}>
          <p className="ek-left"><span>বাকি</span> <strong>{taka(rolling)}</strong></p>
          {pop.text && <span className="ek-pop" key={pop.key} aria-hidden="true">{pop.text}</span>}
          <i className="ek-bar" aria-hidden="true"><b style={{ width: `${spentShare}%` }} /></i>
          <p className="ek-spent" role="status" aria-live="polite">{warn.text || <>খরচ {taka(BUDGET - left)} <span className="ek-sr">, বাকি {taka(left)}</span></>}</p>
        </div>

        <div className="ek-yard">
          <div className="ek-van" role="img" aria-label={vanLabel} dangerouslySetInnerHTML={{ __html: vanSvg(levels, { fresh, crop: true }) }} />
        </div>
        </div>

        {everyone && everyone.total >= SOCIAL_PROOF_MIN && <p className="ek-proof">এখন পর্যন্ত <strong>{bn(everyone.total)} জন</strong> নিজের ভ্যান বোঝাই করেছে</p>}

        <div className="ek-tabs" role="group" aria-label="কী কিনবে">
          {groups.map((group, index) => (
            <button type="button" key={group.id} aria-pressed={tab === group.id} onClick={() => setTab(group.id)} style={{ "--tint": `var(--g-${group.id})` } as CSSProperties}>
              <span className="ek-tab-icon" dangerouslySetInnerHTML={{ __html: parcelIcon(group.id) }} />
              <span>{group.short}</span>
              {levels[index] > 0 && <b><span className="ek-sr">, কেনা হয়েছে </span>{bn(levels[index])}</b>}
            </button>
          ))}
        </div>

        <ul className="ek-items" aria-label={groups.find(group => group.id === tab)!.label}>
          {items.filter(item => item.group === tab).map(item => {
            const count = countOf(cart, item.id);
            const room = roomFor(cart, item.id);
            return (
              <li key={item.id} className="ek-item" data-on={count > 0} data-off={!count && !room} style={{ "--tint": `var(--g-${item.group})` } as CSSProperties}>
                <p className="ek-name">{item.label}<small>{taka(item.price)}{"note" in item && ` · ${item.note}`}</small></p>
                <div className="ek-qty">
                  <button type="button" onClick={() => change(item.id, countOf(latest.current, item.id) - 1)} disabled={!count} aria-label={`${item.label}: একটা কমাও`}>−</button>
                  <input inputMode="numeric" value={bn(count)} onFocus={event => event.currentTarget.select()} onChange={event => change(item.id, parseCount(event.target.value))} aria-label={`${item.label}: কয়টা`} />
                  <button type="button" onClick={() => change(item.id, countOf(latest.current, item.id) + 1)} aria-disabled={!room} aria-label={`${item.label}: আরেকটা কেনো`}>+</button>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="ek-note">দাম {PRICE_NOTE}। একটা জিনিস অনেকগুলো কিনতে মাঝের ঘরে সংখ্যাটা লিখে দাও।</p>
      </div>

      <StickyNext show={!resultVisible} title={<><strong>{bn(card.count)} রকম</strong> জিনিস ভ্যানে</>} sub={card.line} href="#result" label="ভ্যানের ছবি দেখো" />

      <section className="ek-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="ek-result-head">
          <h2 id="result-title">{card.count ? <>খরচ <em>{taka(card.spent)}</em>, বাকি {taka(card.left)}</> : "ভ্যানটা এখনো খালি"}</h2>
          <p>{card.count ? card.line : "ওপরের তালিকা থেকে + চেপে কিছু কেনো।"}</p>
        </div>

        <div className="ek-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="ek-sr">{card.title}: {card.headline}। {card.list}</figcaption>
            {previewError && <p className="kit-status" role="alert">ভ্যানের ছবিটা দেখানো যাচ্ছে না। পাতাটা রিলোড করে দেখো।</p>}
          </figure>

          <div className="ek-controls">
            <label className="ek-field">
              <span>ভ্যানে নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="ek-koti.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} disabled={!card.count} hint={card.count ? "বন্ধুকে লিংক দাও, ও তোমার ভ্যান দেখে নিজেরটা বোঝাই করুক।" : ""} />
            <button type="button" className="kit-link ek-restart" onClick={restart}>আবার এক কোটি থেকে শুরু করি</button>
          </div>
        </div>

        {card.count > 0 && (
          <div className="ek-everyone">
            <h3>সবাই কী কিনছে, দেখবে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>নাম যাবে না, টাকার অঙ্কও না। শুধু কোন কোন জিনিস কিনেছ, সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : !showCompare ? (
              <p className="kit-status">এখনো খুব কম মানুষ মিলিয়েছে, তাই হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও, কয়েকজন মেলালে দেখা যাবে।</p>
            ) : (
              <div className="ek-rare">
                {mostOverall && <p><span>সবচেয়ে বেশি কেনা</span><strong>{mostOverall.label}</strong><em>{bn(percent(everyone.counts[mostOverall.id] ?? 0, everyone.total))}% মানুষ কিনেছে{countOf(cart, mostOverall.id) ? ", তুমিও" : ""}</em></p>}
                {rarestMine && <p><span>তোমার সবচেয়ে আলাদা কেনা</span><strong>{itemById(rarestMine).label}</strong><em>মাত্র {bn(percent(everyone.counts[rarestMine] ?? 0, everyone.total))}% মানুষ কিনেছে</em></p>}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
