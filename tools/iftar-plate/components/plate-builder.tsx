"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { buzz, sfx, tone } from "../../../shared/game-sound";
import { SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { art, plateBase } from "../lib/art";
import { cardBlob, drawCard, prepareCard } from "../lib/draw-plate";
import { bn, createCard, dhakaToday, items, layoutPlate, mostPicked, parseShareHash, placeLabel, places, possessive, ramadanDay, SCENE, shareHash, sources, starters, toggleItem, MAX_ITEMS, MAX_NAME_LENGTH, type ItemId, type Plate, type PlaceId, type RamadanDay } from "../lib/plate";

const TOOL = "iftar-plate";
// "১০০% প্লেটে বেগুনি" after two votes is noise, so the ranking stays hidden until this many plates are counted.
const TALLY_MIN = 30;

function ItemArt({ id }: { id: ItemId }) {
  // Static drawings from lib/art, never user input.
  return <svg viewBox="0 0 64 64" aria-hidden="true" dangerouslySetInnerHTML={{ __html: art[id] }} />;
}

export function PlateBuilder() {
  const [picks, setPicks] = useState<ItemId[]>(starters);
  const [place, setPlace] = useState<PlaceId | "">("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Plate | null>(null);
  const [site, setSite] = useState("");
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [bump, setBump] = useState<{ kind: "add" | "full"; n: number }>({ kind: "add", n: 0 });
  const [previewError, setPreviewError] = useState(false);
  // Read on the phone after mount: the page is prerendered, so the server's date would be stale.
  const [ramadan, setRamadan] = useState<RamadanDay | null>(null);
  // Two quick taps can land before React re-renders; the ref always holds the latest plate.
  const latest = useRef(picks);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const ranked = everyone ? mostPicked(everyone.counts, everyone.total, TALLY_MIN) : null;
  const popular = ranked ? `সবার প্লেটে সবচেয়ে বেশি: ${ranked[0].label}` : "";
  const own = useMemo(() => ({ picks, place, name }), [picks, place, name]);
  const card = useMemo(() => createCard(own, friend, popular, ramadan), [own, friend, popular, ramadan]);
  const spots = useMemo(() => layoutPlate(picks), [picks]);
  const state = shareHash(own).slice(1);
  const count = picks.length;

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared plate replaces the friend's.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    setRamadan(ramadanDay(dhakaToday(new Date())));
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    prepareCard(card).then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  function toggle(id: ItemId) {
    const next = toggleItem(latest.current, id);
    if (next.full) { sfx.wrong(); setBump(current => ({ kind: "full", n: current.n + 1 })); return; }
    // A dish lands on the plate with a small ceramic clink.
    if (next.picks.length > latest.current.length) { sfx.drop(); tone(2200, 0.05, 0.04, "triangle", 0.03); buzz(12); setBump(current => ({ kind: "add", n: current.n + 1 })); }
    latest.current = next.picks;
    setPicks(next.picks);
    setCompared(current => current === "done" ? "idle" : current);
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, place ? [...picks, place] : picks);
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  function restart() {
    latest.current = starters;
    setPicks(starters);
    setPlace("");
    setCompared("idle");
    document.getElementById("plate")?.scrollIntoView({ behavior: "smooth" });
  }

  const full = bump.kind === "full" && bump.n > 0 && count >= MAX_ITEMS;
  const friendName = friend?.name ? possessive(friend.name) : "তোমার বন্ধুর";
  const where = placeLabel(place);
  const caption = card.match
    ? `${card.match}। আমার ইফতারির প্লেটে: ${card.names.replaceAll(" · ", ", ")}। তোমার প্লেটে কী?`
    : `আমার ইফতারির প্লেট${where ? ` (${where})` : ""}: ${card.names.replaceAll(" · ", ", ")}। তোমার প্লেটে আজ কী?`;

  return (
    <div className="ip">
      {friend && (
        <section className="ip-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendName} ইফতারির প্লেট: ${createCard(friend).names}`} />
          <div>
            <p className="ip-kicker">তোমার জন্য একটা প্লেট এসেছে</p>
            <h2 id="friend-title">{friendName} প্লেটে {bn(friend.picks.length)} পদ।<br /><span>তোমার প্লেটে কী?</span></h2>
            <a className="kit-primary" href="#plate-items">আমার প্লেট সাজাই</a>
          </div>
        </section>
      )}

      <div className="ip-mat" id="plate">
        {card.day && <p className="ip-day">{card.day}</p>}
        <p className="ip-count" aria-live="polite"><span>প্লেটে</span> <strong key={count}>{bn(count)} পদ</strong>{where && <em>{where}</em>}</p>
        <svg
          className="ip-scene"
          viewBox={`0 0 ${SCENE.width} ${SCENE.height}`}
          role="img"
          aria-label={count ? `ইফতারির প্লেটে: ${card.names}` : "ফাঁকা ইফতারির প্লেট"}
          data-bump={bump.n ? `${bump.kind}-${bump.n % 2}` : undefined}
        >
          <g dangerouslySetInnerHTML={{ __html: plateBase() }} />
          {spots.map(spot => (
            <g key={spot.id} className="ip-spot" style={{ transform: `translate(${spot.x - spot.size / 2}px, ${spot.y - spot.size / 2}px) scale(${spot.size / 64})` }}>
              <g className="ip-drop" dangerouslySetInnerHTML={{ __html: art[spot.id] }} />
            </g>
          ))}
          {!count && <text x={SCENE.cx} y={SCENE.cy + 8} textAnchor="middle" className="ip-empty">নিচ থেকে বেছে তোলো</text>}
        </svg>
        <div className="ip-foot">
        <p className="ip-tally">{full ? `প্লেট ভরে গেছে! ${bn(MAX_ITEMS)} পদের বেশি ধরে না, একটা নামিয়ে আরেকটা তোলো।` : ranked ? <>সবার প্লেটে সবচেয়ে বেশি উঠেছে: <strong>{ranked[0].label}</strong></> : "চাপলে প্লেটে ওঠে, আবার চাপলে নেমে যায়।"}</p>
        <SoundToggle compact />
        </div>
      </div>

      <fieldset className="ip-items" id="plate-items">
        <legend>ইফতার আইটেম <span>যা যা খাবে, চেপে প্লেটে তোলো</span></legend>
        <div className="ip-chips">
          {items.map(item => (
            <button type="button" key={item.id} className="ip-chip" aria-pressed={picks.includes(item.id)} onClick={() => toggle(item.id)}>
              <ItemArt id={item.id} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="kit-chips ip-places">
        <legend>কোথায় ইফতার? <small>না বাছলেও চলবে</small></legend>
        {places.map(option => <button type="button" key={option.id} aria-pressed={place === option.id} onClick={() => setPlace(current => current === option.id ? "" : option.id)}>{option.label}</button>)}
      </fieldset>

      <StickyNext show={!resultVisible} title={<><strong>{bn(count)} পদ</strong> প্লেটে</>} sub={card.line} href="#result" label="প্লেট সাজানো শেষ" />

      <section className="ip-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="ip-result-head">
          <h2 id="result-title">{count ? <>তোমার প্লেটে <em>{bn(count)} পদ</em></> : "প্লেটটা এখনো ফাঁকা"}</h2>
          <p>{count ? card.line : "ওপরের তালিকা থেকে যা খাবে, চেপে প্লেটে তোলো।"}</p>
        </div>

        <div className="ip-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="ip-sr">{card.title}: {card.names}। {card.line}{card.day && ` ${card.day}।`}</figcaption>
            {previewError && <p className="kit-status" role="alert">প্লেটের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            {ramadan?.likely && <p className="ip-note">রমজানের দিনটা সম্ভাব্য: চাঁদ দেখার ওপর নির্ভর করে এক দিন আগে-পরে হতে পারে। <a href={sources.moon.url} target="_blank" rel="noopener">ঠিক দিন জানায় জাতীয় চাঁদ দেখা কমিটি</a></p>}
          </figure>

          <div className="ip-controls">
            <label className="ip-field">
              <span>কার প্লেট? <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="iftar-plate.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${popular}|${friend ? shareHash(friend) : ""}`} caption={caption} state={state} disabled={!count} hint={count ? "বন্ধু তোমার প্লেট দেখবে, তারপর নিজেরটা সাজাবে।" : ""} />
            <button type="button" className="kit-link ip-restart" onClick={restart}>আবার শুরুর প্লেটে ফিরি</button>
          </div>
        </div>

        {count > 0 && (
          <div className="ip-everyone">
            <h3>সবার প্লেটে কোনটা বেশি?</h3>
            {compared !== "done" || !everyone ? <>
              <p>পেঁয়াজু না বেগুনি, কোনটা বেশি প্লেটে ওঠে? তোমার প্লেটটা গোনায় যোগ করে দেখো। নাম যাবে না, শুধু কোন কোন খাবার বাছলে সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "গোনা হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : !ranked ? (
              <p className="kit-status">তোমার প্লেট গোনা হয়ে গেছে! এখনো খুব কম প্লেট জমেছে, {bn(TALLY_MIN)}টা হলেই হিসাবটা দেখাব। বন্ধুদের লিংক পাঠাও।</p>
            ) : (
              <ol className="ip-rank">
                {ranked.slice(0, 6).map(row => (
                  <li key={row.id} data-mine={picks.includes(row.id)}>
                    <ItemArt id={row.id} />
                    <span>{row.label}{picks.includes(row.id) && <small>তোমার প্লেটেও</small>}</span>
                    <b>{bn(row.percent)}%</b>
                    <i style={{ width: `${row.percent}%` }} aria-hidden="true" />
                  </li>
                ))}
              </ol>
            )}
            {compared === "done" && ranked && <p className="ip-note">মোট {bn(everyone!.total)}টা প্লেট থেকে, একই ফোন থেকে আবার মেলালে আগের প্লেটটাই বদলায়।</p>}
          </div>
        )}
      </section>
    </div>
  );
}
