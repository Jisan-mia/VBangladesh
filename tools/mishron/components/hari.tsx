"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { SoundToggle } from "../../../shared/game-ui";
import { confetti, hiss, sfx, tone } from "../../../shared/game-sound";
import { addToTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { bn, caption, combine, headline, humanLine, madeCount, nameOf, nextHint, parseSaved, parseShareHash, possessive, shareHash, MAKEABLE, MAX_NAME_LENGTH, type Mixed, type Shared } from "../lib/game";
import { itemById, kindColor, STARTERS } from "../lib/recipes";

const TOOL = "mishron";
const SAVE_KEY = "mishron:v1";
// Percentages from a handful of players are noise ("মাত্র ০% বানিয়েছে" after one vote).
const COMPARE_MIN = 20;
const BREW_MS = 700;
const FILTER_FROM = 30;

type Shown = { a: string; b: string; mixed: Mixed };

function Chip({ id, onClick, pressed, hint, fresh }: { id: string; onClick: () => void; pressed?: boolean; hint?: boolean; fresh?: boolean }) {
  const item = itemById(id)!;
  return <button type="button" id={`ms-${id}`} className="ms-chip" style={{ "--k": kindColor[item.kind] } as CSSProperties} aria-pressed={pressed} data-hint={hint || undefined} data-fresh={fresh || undefined} onClick={onClick}>{item.name}</button>;
}

/** The clay pot on its mud stove; it bubbles and steams while two things cook. */
function Pot({ brewing }: { brewing: boolean }) {
  return <svg className="ms-pot" data-brewing={brewing} viewBox="0 0 200 176" aria-hidden="true">
    <g className="ms-steam" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round">
      <path d="M78 46c-8-10 8-16 0-28" /><path d="M100 42c-8-10 8-18 0-32" /><path d="M122 46c-8-10 8-16 0-28" />
    </g>
    <path d="M30 120h140a10 10 0 0 1 10 10v36H20v-36a10 10 0 0 1 10-10z" fill="#b78358" />
    <path className="ms-fire" d="M70 166c0-22 14-30 30-30s30 8 30 30z" fill="#f7a12a" />
    <path d="M84 166c0-12 7-18 16-18s16 6 16 18z" fill="#fff1a8" />
    <g className="ms-body">
      <path d="M74 60C34 72 34 132 100 140C166 132 166 72 126 60z" fill="#b0502a" />
      <path d="M74 60C50 70 44 96 52 114C40 92 50 70 74 60z" fill="#d97a49" />
      <path d="M44 92h112M46 112h108" stroke="#f2b33d" strokeWidth="4" />
      <path d="M46 102q8-7 16 0t16 0 16 0 16 0 16 0 16 0 16 0" fill="none" stroke="#fff6e6" strokeWidth="3" />
      <ellipse cx="100" cy="60" rx="30" ry="8" fill="#7a2f14" />
      <ellipse cx="100" cy="61" rx="23" ry="5" fill="#3a1608" />
    </g>
  </svg>;
}

export function MagicPot() {
  const [order, setOrder] = useState<string[]>([...STARTERS]);
  const [latest, setLatest] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [picks, setPicks] = useState<string[]>([]);
  const [brewing, setBrewing] = useState(false);
  const [shown, setShown] = useState<Shown | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [filter, setFilter] = useState("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const found = useMemo(() => new Set(order), [order]);
  const made = madeCount(order);
  const hint = useMemo(() => nextHint(found), [found]);
  const own = useMemo<Shared>(() => ({ found: order, latest: latest || order.at(-1)!, name }), [order, latest, name]);
  const state = made ? shareHash(own).slice(1) : "";

  useEffect(() => {
    try { const saved = parseSaved(localStorage.getItem(SAVE_KEY)); setOrder(saved.order); setLatest(saved.latest); } catch { /* private mode: start fresh */ }
    setLoaded(true);
    // In-page anchors (#result) also change the hash, so only a real shared link replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => { window.removeEventListener("hashchange", readFriend); clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify({ order, latest })); } catch { /* storage full or blocked: the game still works this visit */ }
  }, [order, latest, loaded]);

  useEffect(() => { setHintLevel(0); setCompared(current => current === "done" ? "idle" : current); }, [made]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("নানির জাদুর হাঁড়ি ২০০টা").then(() => {
      if (cancelled) return;
      if (preview.current) drawCard(preview.current, own, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [own, format, site, friend]);

  function tap(id: string) {
    if (brewing) return;
    const next = shown ? [id] : [...picks, id];
    if (shown) setShown(null);
    setPicks(next);
    if (next.length < 2) { sfx.pick(); return; }
    sfx.drop(); hiss(0.5, 0.08, 700, "lowpass", 0.05);
    const [a, b] = next;
    const mixed = combine(a, b, found);
    setBrewing(true);
    const quiet = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    timer.current = setTimeout(() => {
      setBrewing(false);
      setPicks([]);
      setShown({ a, b, mixed });
      if (mixed.type === "none") sfx.drop(); else if (mixed.type === "old") sfx.tap();
      if (mixed.type === "new") {
        if (made + 1 >= MAKEABLE) { sfx.win(); confetti(); } else { sfx.pop(); tone(1250, 0.1, 0.06, "sine", 0.09); }
        setOrder(current => current.includes(mixed.item.id) ? current : [...current, mixed.item.id]);
        setLatest(mixed.item.id);
      }
    }, quiet ? 0 : BREW_MS);
  }

  function unpick(index: number) {
    if (brewing || shown) return;
    setPicks(current => current.filter((_, at) => at !== index));
  }

  function askHint() {
    if (!hint) return;
    const level = Math.min(hintLevel + 1, 2);
    setHintLevel(level);
    setShown(null);
    setFilter("");
    requestAnimationFrame(() => document.getElementById(`ms-${hint.a}`)?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  function restart() {
    if (!window.confirm("এ পর্যন্ত যা বানিয়েছ সব মুছে নতুন করে শুরু করবে?")) return;
    setOrder([...STARTERS]); setLatest(""); setPicks([]); setShown(null); setFilter("");
    document.getElementById("hari")?.scrollIntoView({ behavior: "smooth" });
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, order.filter(id => !(STARTERS as readonly string[]).includes(id)));
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const say = brewing ? "টগবগ টগবগ…"
    : shown?.mixed.type === "new" ? shown.mixed.item.note
    : shown?.mixed.type === "old" ? `${shown.mixed.item.name} তো আগেই বানিয়েছ! অন্য কিছু মেশাও।`
    : shown?.mixed.type === "none" ? shown.mixed.hint
    : hint && hintLevel === 2 ? `ইশারা: ${nameOf(hint.a)} + ${nameOf(hint.b)}`
    : hint && hintLevel === 1 ? `ইশারা: ${nameOf(hint.a)}-এর সাথে কিছু একটা মেশাও…`
    : picks.length === 1 ? "আরেকটা বেছে নাও। একই জিনিস দুবারও চলে।"
    : "ঝুড়ি থেকে যেকোনো দুটো জিনিস বেছে নাও।";
  const query = filter.trim();
  const visible = query ? order.filter(id => nameOf(id).includes(query)) : order;
  const rare = compared === "done" && everyone && everyone.total >= COMPARE_MIN
    ? order.filter(id => !(STARTERS as readonly string[]).includes(id)).map(id => ({ id, percent: Math.round(((everyone.counts[id] ?? 0) / everyone.total) * 100) })).sort((x, y) => x.percent - y.percent).slice(0, 5)
    : [];
  const versus = friend && made ? made - madeCount(friend.found) : 0;
  const friendOnly = friend ? friend.found.filter(id => !found.has(id)).length : 0;

  return (
    <div className="ms">
      {friend && (
        <div className="ms-friend">
          <strong>{friend.name || "তোমার বন্ধু"} {bn(madeCount(friend.found))}টা জিনিস বানিয়েছে · সর্বশেষ: {nameOf(friend.latest)}</strong>
          <span>{made ? `তুমি এখন পর্যন্ত ${bn(made)}টা। ${friendOnly ? `${friend.name ? possessive(friend.name) : "ওর"} কাছে আছে, তোমার নেই: ${bn(friendOnly)}টা।` : "ওর সবগুলোই তোমার আছে!"}` : "এবার তোমার পালা। হাঁড়িতে দুটো জিনিস দাও, দেখো কয়টা পারো।"}</span>
          <details>
            <summary>{friend.name ? possessive(friend.name) : "ওর"} কার্ডটা দেখো</summary>
            <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name ? possessive(friend.name) : "বন্ধুর"} হাঁড়ি: ${bn(madeCount(friend.found))}টা জিনিস, সর্বশেষ ${nameOf(friend.latest)}`} />
          </details>
        </div>
      )}

      <div className="ms-play" id="hari">
        <div className="ms-stage">
          <div className="ms-cloud" aria-live="polite">
            {shown && shown.mixed.type !== "none" && (
              <p className="ms-made" key={`${shown.a}+${shown.b}`} data-type={shown.mixed.type}>
                <span className="ms-recipe">{nameOf(shown.a)} + {nameOf(shown.b)} =</span>
                <strong style={{ "--k": kindColor[shown.mixed.item.kind] } as CSSProperties}>{shown.mixed.item.name}</strong>
                {shown.mixed.type === "new" && <em>নতুন!</em>}
              </p>
            )}
            {!shown && <p className="ms-wait">{brewing ? "আসছে…" : "ভাপে কী উঠবে?"}</p>}
            {shown?.mixed.type === "none" && <p className="ms-made" data-type="none"><span className="ms-recipe">{nameOf(shown.a)} + {nameOf(shown.b)}</span><strong>কিছু হলো না</strong></p>}
          </div>
          <div className="ms-potrow">
            {[0, 1].map(index => (
              <button type="button" key={index} className="ms-slot" data-filled={Boolean(picks[index]) || undefined} data-side={index ? "right" : "left"} data-brewing={brewing || undefined}
                onClick={() => unpick(index)} disabled={!picks[index] || brewing} aria-label={picks[index] ? `${nameOf(picks[index])} সরাও` : `${index ? "দ্বিতীয়" : "প্রথম"} জিনিসের জায়গা, খালি`}>
                {picks[index] ? nameOf(picks[index]) : index ? "২য়" : "১ম"}
              </button>
            ))}
            <Pot brewing={brewing} />
          </div>
          <div className="ms-sayrow">
            <p className="ms-say" role="status">{say}</p>
            <SoundToggle compact />
            <button type="button" className="ms-hint" onClick={askHint} disabled={!hint}>{hint ? hintLevel ? "আরও ইশারা" : "ইশারা দাও" : "সব শেষ!"}</button>
          </div>
        </div>

        <section className="ms-basket" aria-labelledby="basket-title">
          <div className="ms-basket-head">
            <h2 id="basket-title">ঝুড়ি <span>বানানো {bn(made)}/{bn(MAKEABLE)}</span></h2>
            {order.length >= FILTER_FROM && <input type="search" value={filter} onChange={event => setFilter(event.target.value)} placeholder="খুঁজে দেখো…" aria-label="ঝুড়িতে খোঁজো" />}
          </div>
          <div className="ms-chips">
            {visible.map(id => <Chip key={id} id={id} onClick={() => tap(id)} pressed={picks.includes(id)} fresh={id === latest && shown?.mixed.type === "new"}
              hint={Boolean(hint) && !shown && ((hintLevel >= 1 && id === hint!.a) || (hintLevel === 2 && id === hint!.b))} />)}
            {!visible.length && <p className="kit-status">“{query}” এখনো ঝুড়িতে নেই। বানিয়ে ফেলো!</p>}
          </div>
        </section>
      </div>

      <StickyNext show={made > 0 && !resultVisible} title={<><strong>{bn(made)}টা</strong> বানিয়েছ</>} sub={`সর্বশেষ: ${nameOf(own.latest)}`} href="#result" label="কার্ড দেখো" />

      <section className="ms-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="ms-result-head">
          <h2 id="result-title">{made ? <>হাঁড়ি থেকে উঠেছে <em>{bn(made)}টা</em> জিনিস</> : "হাঁড়ি এখনো ঠান্ডা"}</h2>
          <p>{made ? humanLine(made) : "ওপরের ঝুড়ি থেকে দুটো জিনিস মেশাও। একটা কিছু বানালেই কার্ড তৈরি।"}</p>
          {friend && made > 0 && <p className="ms-versus">{versus > 0 ? `${friend.name ? possessive(friend.name) : "বন্ধুর"} চেয়ে ${bn(versus)}টা বেশি! লিংক পাঠিয়ে জানিয়ে দাও।` : versus < 0 ? `${friend.name || "বন্ধু"}কে ধরতে আর ${bn(-versus)}টা লাগবে।` : "সমান সমান! এবার কে আগে পরেরটা পায়?"}</p>}
        </div>

        {made > 0 && <div className="ms-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="ms-sr">{headline(name, made)}, সর্বশেষ {nameOf(own.latest)}।</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা রিলোড করে দেখো।</p>}
          </figure>

          <div className="ms-controls">
            <label className="ms-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="deshi-mishron.png" makeImage={() => cardBlob(own, format, site)} imageKey={`${state}|${format}`} caption={caption(made, own.latest)} state={state} disabled={!made}
              hint={made ? "লিংক খুলে বন্ধু দেখবে তোমার হাঁড়ি থেকে কয়টা উঠল, তারপর নিজের হাঁড়ি চাপাবে।" : "একটা কিছু বানালেই শেয়ার করা যাবে।"} />
            <button type="button" className="kit-link ms-restart" onClick={restart}>নতুন করে শুরু করো</button>
          </div>
        </div>}

        {made >= 5 && (
          <div className="ms-everyone">
            <h3>তোমার কোন জিনিসটা সবচেয়ে কম মানুষ বানিয়েছে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>সবার সাথে মিলিয়ে দেখো। নাম যাবে না, শুধু কোন জিনিসগুলো বানিয়েছ সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : everyone.total < COMPARE_MIN ? <p className="kit-status">এখনো মাত্র {bn(everyone.total)} জন মিলিয়েছে, হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও!</p> : <>
              {rare[0] && <p className="ms-rare">{rare[0].percent < 50 ? "মাত্র " : ""}<strong>{bn(rare[0].percent)}%</strong> খেলোয়াড় <strong>{nameOf(rare[0].id)}</strong> বানাতে পেরেছে, তুমি তাদের একজন!</p>}
              <ul className="ms-bars">{rare.map(row => <li key={row.id}><span>{nameOf(row.id)}</span><i style={{ width: `${Math.max(row.percent, 2)}%` }} /><b>{bn(row.percent)}%</b></li>)}</ul>
              <p className="kit-status">{bn(everyone.total)} জনের সাথে মেলানো।</p>
            </>}
          </div>
        )}
      </section>
    </div>
  );
}
