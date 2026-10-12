"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cardSizes, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { sfx } from "../../../shared/game-sound";
import { SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { art, figureSvg } from "../lib/art";
import { cardBlob, drawCard, prepareCard } from "../lib/draw-card";
import { bn, createCard, fillSlots, label, packById, packs, parseShareHash, possessive, shareHash, swapItem, swapOptions, tallyVote, CLASSIC, GRID, MAX_NAME_LENGTH, type ItemId, type Pack, type PackId, type PackState } from "../lib/pack";

const TOOL = "starter-pack";
// Below this, "৩ জন প্যাকেট বানিয়েছে" reads as an empty stall rather than social proof.
const SOCIAL_PROOF_MIN = 50;
// Percentages from a handful of people in one pack are noise ("১০০% রেখেছে" after one vote).
const COMPARE_MIN = 20;
const percent = (count: number, of: number) => Math.round((count / Math.max(of, 1)) * 100);
// A 16-point starburst, like the "নতুন!" sticker on toy packaging (viewBox -50 -50 100 100).
const STAR = Array.from({ length: 32 }, (_, index) => { const r = index % 2 ? 41 : 49, a = index / 32 * Math.PI * 2; return `${(Math.cos(a) * r).toFixed(1)},${(Math.sin(a) * r).toFixed(1)}`; }).join(" ");
const packStyle = (pack: Pack) => ({ "--pack": pack.color, "--pack-deep": pack.deep, "--pack-on": pack.on } as CSSProperties);

function ItemArt({ id }: { id: ItemId }) {
  // Static drawings from lib/art, never user input.
  return <svg viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: art[id] }} />;
}

function Figure({ pack }: { pack: Pack }) {
  // Static drawing from lib/art; colours come from the fixed pack list.
  return <span className="sp-figure-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: figureSvg(pack.color, pack.deep, pack.mood) }} />;
}

export function PackBuilder() {
  const [packId, setPackId] = useState<PackId>("varsity");
  const [slots, setSlots] = useState<Partial<Record<PackId, ItemId[]>>>({});
  const [grid, setGrid] = useState(false);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<PackState | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const dialog = useRef<HTMLDialogElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const pack = packById(packId);
  const all = useMemo(() => slots[packId] ?? fillSlots(packId), [slots, packId]);
  const own = useMemo<PackState>(() => ({ pack: packId, items: all.slice(0, grid ? GRID : CLASSIC), name }), [packId, all, grid, name]);
  const card = useMemo(() => createCard(own, friend), [own, friend]);
  const friendCard = useMemo(() => friend && createCard(friend), [friend]);
  const state = shareHash(own).slice(1);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared pack replaces the friend.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      // Your turn starts on the same pack and layout, from its default items.
      setPackId(shared.pack);
      setGrid(shared.items.length === GRID);
    };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([prepareCard(card), friendCard ? prepareCard(friendCard) : null]).then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friendCard && friendPreview.current) drawCard(friendPreview.current, friendCard, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, friendCard, format, site]);

  // Changed picks make an earlier comparison stale; let them compare again.
  const changed = () => setCompared(current => current === "done" ? "idle" : current);

  function choosePack(id: PackId) {
    setPackId(id);
    setEditing(null);
    changed();
  }

  function openSwap(index: number) {
    setEditing(index);
    dialog.current?.showModal();
  }

  function swap(item: ItemId) {
    if (editing === null) return;
    sfx.pop();
    setSlots(current => ({ ...current, [packId]: swapItem(all, editing, item) }));
    changed();
    dialog.current?.close();
  }

  function reset() {
    setSlots(current => ({ ...current, [packId]: undefined }));
    changed();
    document.getElementById("pack")?.scrollIntoView({ behavior: "smooth" });
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, tallyVote(own));
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const voters = everyone?.counts[packId] ?? 0;
  const showCompare = compared === "done" && everyone && voters >= COMPARE_MIN;
  const ranked = showCompare ? own.items.map(id => ({ id, percent: percent(everyone.counts[`${packId}.${id}`] ?? 0, voters) })).sort((a, b) => a.percent - b.percent) : [];
  const editingItem = editing === null ? null : own.items[editing];
  const options = swapOptions(packId, own.items);
  const customised = own.items.some((id, index) => id !== fillSlots(packId)[index]);
  const caption = `${card.title}: ${pack.label}! ${own.items.map(label).join(", ")}। তোমার প্যাকেটে কী থাকত?`;
  const friendName = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";

  return (
    <div className="sp" style={packStyle(pack)}>
      {friend && friendCard && (
        <section className="sp-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName} স্টার্টার প্যাক: ${friendCard.pack.label}। ${friend.items.map(label).join(", ")}`} />
          <div>
            <p className="sp-kicker">তোমার জন্য একটা খেলনার প্যাকেট এসেছে</p>
            <h2 id="friend-title">{friendName} ‘{friendCard.pack.label}’ প্যাকেট।<br /><span>তোমারটায় কী থাকত?</span></h2>
            <a className="kit-primary" href="#pack">আমারটা বানাই</a>
          </div>
        </section>
      )}

      <fieldset className="sp-packs">
        <legend>কোন প্যাকেট বানাবে?</legend>
        <div>
          {packs.map(item => <button type="button" key={item.id} style={packStyle(item)} aria-pressed={item.id === packId} onClick={() => choosePack(item.id)}>{item.chip}</button>)}
        </div>
      </fieldset>

      <div className="sp-pack" id="pack" data-grid={grid}>
        <span className="sp-hole" aria-hidden="true" />
        <div className="sp-head">
          {grid && <Figure pack={pack} />}
          <div className="sp-titles">
            <p className="sp-ribbon">{pack.label}</p>
            <p className="sp-title">{card.title}</p>
          </div>
          <span className="sp-badge" aria-hidden="true"><svg viewBox="-50 -50 100 100"><polygon points={STAR} fill="#ffd34d" stroke="#2b2135" strokeWidth="3" strokeLinejoin="round" /></svg><span>{pack.badge[0]}</span><b>{pack.badge[1]}</b></span>
        </div>
        <div className="sp-body">
          {!grid && <div className="sp-bubble sp-figure"><Figure pack={pack} /></div>}
          <ol className="sp-items" aria-label="প্যাকেটে যা আছে">
            {own.items.map((id, index) => (
              <li key={id}>
                <button type="button" className="sp-bubble sp-item" onClick={() => openSwap(index)} aria-haspopup="dialog" aria-label={`${label(id)}। বদলাতে চাপো`}>
                  <ItemArt id={id} />
                  <span>{label(id)}</span>
                  <svg className="sp-swap-mark" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9a7 7 0 0 1 12-3l2 2M19 4v4h-4M19 15a7 7 0 0 1-12 3l-2-2M5 20v-4h4" /></svg>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <p className="sp-warning"><b>সতর্কতা:</b> {pack.warning}</p>
      </div>

      <div className="sp-under">
        <p className="sp-hint">যে খোপের জিনিস মেলে না, সেটা চেপে বদলাও</p>
        <div className="sp-ctl">
        <SoundToggle compact />
        <fieldset className="sp-layout">
          <legend className="sp-sr">কয়টা খোপ?</legend>
          <button type="button" aria-pressed={!grid} onClick={() => { setGrid(false); changed(); }}>৬টা</button>
          <button type="button" aria-pressed={grid} onClick={() => { setGrid(true); changed(); }}>৩×৩</button>
        </fieldset>
        </div>
      </div>

      {everyone && everyone.total >= SOCIAL_PROOF_MIN && <p className="sp-proof">এখন পর্যন্ত <strong>{bn(everyone.total)} জন</strong> নিজের প্যাকেট বানিয়েছে</p>}

      <dialog ref={dialog} className="sp-swap" style={packStyle(pack)} aria-labelledby="swap-title" onClose={() => setEditing(null)} onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
        <div className="sp-swap-inner">
          <h2 id="swap-title">{editingItem ? <>‘{label(editingItem)}’-এর বদলে কী রাখবে?</> : "কী রাখবে?"}</h2>
          <div className="sp-swap-options">
            {options.map(id => <button type="button" key={id} className="sp-bubble sp-item" onClick={() => swap(id)}><ItemArt id={id} /><span>{label(id)}</span></button>)}
          </div>
          <button type="button" className="kit-secondary sp-swap-close" onClick={() => dialog.current?.close()}>যেমন আছে, থাক</button>
        </div>
      </dialog>

      <StickyNext show={!resultVisible} title={<><strong>{pack.chip}</strong> প্যাকেট তৈরি</>} sub={card.line} href="#result" label="ছবিটা দেখো" />

      <section className="sp-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="sp-result-head">
          <h2 id="result-title">তোমার প্যাকেট <em>দোকানে ঝুলছে!</em></h2>
          <p>{card.line}</p>
        </div>

        <div className="sp-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="sp-sr">{card.title}: {pack.label}। {own.items.map(label).join(", ")}। {card.line}</figcaption>
            {previewError && <p className="kit-status" role="alert">প্যাকেটের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="sp-controls">
            <label className="sp-field">
              <span>প্যাকেটে নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`starter-pack-${packId}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption} state={state} hint="বন্ধু লিংক খুললে তোমার প্যাকেট দেখবে, আর নিজেরটা বানাতে পারবে।" />
            {customised && <button type="button" className="kit-link sp-restart" onClick={reset}>প্যাকেট আগের মতো করো</button>}
          </div>
        </div>

        <div className="sp-everyone">
          <h3>অন্যদের প্যাকেটের সাথে মেলাবে?</h3>
          {compared !== "done" || !everyone ? <>
            <p>দেখো ‘{pack.label}’ প্যাকেটে তোমার কোন জিনিসটা খুব কম মানুষ রেখেছে। নাম যাবে না, শুধু কোন প্যাকেটে কোন জিনিস রাখলে সেটা গোনা হবে।</p>
            <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
            {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : !showCompare ? (
            <p className="kit-status">এই প্যাকেট এখনো খুব কম মানুষ বানিয়েছে, তাই হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও, কয়েকজন বানালেই মজাটা শুরু!</p>
          ) : (
            <div className="sp-rare">
              <p><span>তোমার প্যাকেটের সবচেয়ে অন্যরকম জিনিস</span><strong>{label(ranked[0].id)}</strong><em>{ranked[0].percent < 30 ? "মাত্র " : ""}{bn(ranked[0].percent)}% মানুষ রেখেছে</em></p>
              <p><span>প্রায় সবার প্যাকেটে যেটা আছে</span><strong>{label(ranked.at(-1)!.id)}</strong><em>{bn(ranked.at(-1)!.percent)}% মানুষ রেখেছে</em></p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
