"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, prepareCard } from "../lib/draw-card";
import {
  DEFAULT_ROUTE, FARE_NOTE, MAX_NAME_LENGTH, MAX_ROUNDS, bn, bucketLabel, bucketOf, createCard, finalAnswer, isDone, offer, parseShareHash,
  possessive, quickLines, resultOf, routeById, routes, shareHash, sliderMin, startGame, suggestedOffer, tallyIds, type Game, type RouteId, type Shared,
} from "../lib/haggle";
import { Street } from "./street";

const TOOL = "mama-jaben";
// Percentages from a handful of people are noise ("১০০% মানুষ ১ দফায়" after one vote).
const COMPARE_MIN = 20;
const percent = (count: number, of: number) => Math.round((count / Math.max(of, 1)) * 100);

export function HaggleGame() {
  const [game, setGame] = useState<Game>(() => startGame(DEFAULT_ROUTE));
  // Fast taps can land before React re-renders; every move builds on the latest game.
  const latest = useRef(game);
  const [amount, setAmount] = useState(() => suggestedOffer(game));
  const [plays, setPlays] = useState(0);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const resultVisible = useInView(resultRef);

  const route = routeById(game.route);
  const result = resultOf(game);
  const own = useMemo<Shared | null>(() => isDone(game) ? { route: game.route, fare: game.fare, rounds: game.round, name } : null, [game, name]);
  const card = useMemo(() => own && createCard(own, friend), [own, friend]);
  const state = own ? shareHash(own).slice(1) : "";

  function play(next: Game) {
    latest.current = next;
    setGame(next);
    setAmount(suggestedOffer(next));
    if (next.status === "deal") navigator.vibrate?.(20);
  }

  function begin(id: RouteId) {
    play(startGame(id));
    setPlays(count => count + 1);
    setCompared("idle");
  }

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared result replaces the friend.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      begin(shared.route);
    };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await prepareCard((card?.title ?? "") + (card?.route ?? "") + "মামা যাবেন");
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend), "feed", site);
      setPreviewError(false);
    })().catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  async function compareWithEveryone() {
    if (!result) return;
    setCompared("sending");
    const tally = await addToTally(TOOL, [bucketOf(result)]);
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const done = isDone(game);
  const talking = game.status === "talk";
  const min = sliderMin(route);
  const lines = quickLines(game);
  const friendName = friend?.name || "তোমার বন্ধু";
  const caption = result?.fare
    ? `মামাকে ${bn(result.fare)} টাকায় রাজি করালাম, ${bn(result.rounds)} দফায় (${route.from} → ${route.to})। তুমি কত টাকায় পারবে?`
    : `${route.from} → ${route.to}: মামা বললেন, “আরেকজন দেখেন মামা।” তুমি পারবে রাজি করাতে?`;
  const showCompare = compared === "done" && everyone && everyone.total >= COMPARE_MIN;

  return (
    <div className="mj">
      {friend && (
        <section className="mj-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name ? possessive(friend.name) : "বন্ধুর"} দরদামের কার্ড`} />
          <div>
            <p className="mj-kicker">তোমার জন্য একটা চ্যালেঞ্জ এসেছে</p>
            <h2 id="friend-title">
              {friend.fare ? <>{friendName} মামাকে {bn(friend.fare)} টাকায় রাজি করিয়েছে, {bn(friend.rounds)} দফায়।</> : <>{friendName} মামাকে রাজি করাতে পারেনি!</>}
              <br /><span>এবার তোমার পালা।</span>
            </h2>
            <a className="kit-primary" href="#haggle">আমি দরদাম করি</a>
          </div>
        </section>
      )}

      <div className="mj-play">
      <div className="mj-scene" id="haggle" data-status={game.status} key={`scene-${plays}`}>
        <svg className="mj-skyline" viewBox="0 0 200 90" preserveAspectRatio="xMinYMax slice" aria-hidden="true">
          <path d="M0 90V38h26v-14h22v66zm54 0V50h30v40zm36 0V18h28v72zm34 0V58h24v32z" fill="#1d4656" />
          <path d="M8 46h5v6H8zm22-14h5v6h-5zm0 20h5v6h-5zm30 6h5v6h-5zm38-30h5v6h-5zm0 22h5v6h-5zm32 16h5v6h-5z" fill="#f0b42966" />
        </svg>
        <div className="mj-talk">
          <p className="mj-corner">{route.from} মোড়</p>
          <p className="mj-bubble mj-you" key={`y-${game.round}-${game.status}`}><span className="mj-sr">তুমি বললে: </span>{game.you}</p>
          <p className="mj-bubble mj-mama" key={`m-${game.round}-${game.status}`} role="status" aria-live="polite"><span className="mj-sr">মামা বললেন: </span>{game.mama}</p>
        </div>
        <div className="mj-art"><Street /></div>
        {game.status === "deal" && <span className="mj-bell" aria-hidden="true">ক্রিং ক্রিং!</span>}
      </div>

      <fieldset className="mj-routes">
        <legend>“কই যাইবেন?” <small>রাস্তা বদলাতে ছোঁও</small></legend>
        <div>
          {routes.map(item => (
            <button type="button" key={item.id} aria-pressed={item.id === game.route} onClick={() => begin(item.id)}>
              {item.to}<small>{item.from} থেকে</small>
            </button>
          ))}
        </div>
      </fieldset>

      <div className="mj-plate" data-status={game.status}>
        <p className="mj-plate-route">{route.from} → {route.to}</p>
        <ol className="mj-rounds" aria-label={`দফা ${bn(game.round)}/${bn(MAX_ROUNDS)}`}>
          {Array.from({ length: MAX_ROUNDS }, (_, index) => <li key={index} data-on={index < game.round} />)}
        </ol>
        <p className="mj-plate-fare">
          {game.status === "gone" ? <b className="mj-plate-gone">মামা গেলেন</b> : <>
            <small>{game.status === "deal" ? "রাজি" : game.status === "final" ? "শেষ কথা" : "মামা চায়"}</small>
            <b>{bn(game.status === "deal" ? game.fare : game.ask)}</b>
            <small>টাকা</small>
          </>}
        </p>
        {talking && <p className="mj-plate-mine"><small>তুমি বলবে</small><b>{bn(amount)}</b></p>}
      </div>

      {talking && (
        <div className="mj-offer">
          <div className="mj-slider">
            <button type="button" onClick={() => setAmount(value => Math.max(min, value - 5))} disabled={amount <= min} aria-label="৫ টাকা কমাও">−</button>
            <input type="range" aria-label="তুমি কত টাকা বলবে" min={min} max={game.ask} step={5} value={amount} onChange={event => setAmount(Number(event.target.value))} aria-valuetext={`${bn(amount)} টাকা`} />
            <button type="button" onClick={() => setAmount(value => Math.min(game.ask, value + 5))} disabled={amount >= game.ask} aria-label="৫ টাকা বাড়াও">+</button>
          </div>
          <div className="mj-quick" role="group" aria-label="চটজলদি বলো">
            {lines.map(line => <button type="button" key={line.label} onClick={() => play(offer(latest.current, line.amount, line.text))}>{line.label}<small>{bn(line.amount)}৳</small></button>)}
          </div>
          <button type="button" className="kit-primary mj-say" onClick={() => play(offer(latest.current, amount))}>
            {amount >= game.ask ? "ঠিক আছে, চলেন" : `${bn(amount)} টাকা বলো`}
          </button>
          <p className="mj-hint">দফা {bn(game.round + 1)}/{bn(MAX_ROUNDS)} · {FARE_NOTE}</p>
        </div>
      )}

      {game.status === "final" && (
        <div className="mj-offer mj-final">
          <button type="button" className="kit-primary mj-say" onClick={() => play(finalAnswer(latest.current, true))}>আচ্ছা, {bn(game.ask)} টাকায় চলেন</button>
          <button type="button" className="kit-secondary" onClick={() => play(finalAnswer(latest.current, false))}>থাক, হেঁটেই যাই</button>
        </div>
      )}

      {done && (
        <div className="mj-offer mj-again">
          <button type="button" className="kit-secondary" onClick={() => begin(game.route)}>{game.status === "gone" ? "মামাকে আবার ডাকো" : "আবার দরদাম করো"}</button>
        </div>
      )}
      </div>

      <StickyNext show={done && !resultVisible} title={<strong>{result?.fare ? `${bn(result.fare)} টাকায় রাজি` : "মামা রাজি হননি"}</strong>} sub={card?.line} href="#result" label="কার্ড দেখো" />

      {card && result && (
        <section className="mj-result" id="result" ref={resultRef} aria-labelledby="result-title">
          <div className="mj-result-head">
            <h2 id="result-title">{result.fare ? <><em>{bn(result.fare)} টাকায়</em> রাজি, {bn(result.rounds)} দফায়</> : <>মামা রাজি হননি</>}</h2>
            <p>{card.line} এই খেলায় মামার মনের ভাড়া ছিল {bn(route.fair)} টাকা।</p>
          </div>

          <div className="mj-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
              <figcaption id="card-summary" className="mj-sr">{card.title}: {card.route}, {card.headline}, {card.rounds}। মামা বললেন: {card.mama}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>

            <div className="mj-controls">
              <label className="mj-field">
                <span>কার্ডে তোমার নাম <small>না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="mama-jaben.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint="লিংক পেলে বন্ধু একই রাস্তায় একই মামার সাথে দরদাম করবে।" />
            </div>
          </div>

          <div className="mj-everyone">
            <h3>সবাই কয় দফায় রাজি করায়, দেখবে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>নাম, রাস্তা বা ভাড়া যাবে না। শুধু কয় দফায় শেষ হলো, সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : !showCompare ? (
              <p className="kit-status">এখনো খুব কম মানুষ মিলিয়েছে, তাই হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও, কয়েকজন মেলালেই মজাটা শুরু!</p>
            ) : (
              <ul className="mj-bars">
                {tallyIds.map(id => {
                  const share = percent(everyone.counts[id] ?? 0, everyone.total);
                  return <li key={id} data-mine={id === bucketOf(result)}><span>{bucketLabel[id]}{id === bucketOf(result) && " · তুমি"}</span><i aria-hidden="true"><b style={{ width: `${share}%` }} /></i><em>{bn(share)}%</em></li>;
                })}
              </ul>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
