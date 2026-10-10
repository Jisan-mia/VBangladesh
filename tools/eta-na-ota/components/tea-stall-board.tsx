"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawBoard, type BoardCard } from "../lib/draw-board";
import { bn, caption, enough, humanLine, label, nationalScore, packOf, packs, pairSplit, parseShareHash, percent, possessive, question, rarestPick, sameCount, shareHash, sideId, MAX_NAME_LENGTH, MIN_SAMPLE, PAIRS_PER_PACK, RARE_PERCENT, type PackId, type Shared, type Side } from "../lib/picks";

const TOOL = "eta-na-ota";
const COUNTED_KEY = "eta-na-ota-counted";
// Long enough to read the split, short enough that 12 picks feel quick.
const ADVANCE_MS = 1700;
const DONE = PAIRS_PER_PACK;

type Answers = Record<PackId, (Side | null)[]>;
type Counted = Partial<Record<string, Side>>;
const blank = () => Array<Side | null>(PAIRS_PER_PACK).fill(null);
const emptyAnswers = () => Object.fromEntries(packs.map(pack => [pack.id, blank()])) as Answers;
const firstOpen = (list: readonly (Side | null)[], from = 0) => {
  for (let step = 0; step < list.length; step++) { const index = (from + step) % list.length; if (!list[index]) return index; }
  return DONE;
};

function readCounted(): Counted {
  try { return JSON.parse(localStorage.getItem(COUNTED_KEY) ?? "{}") as Counted; } catch { return {}; }
}

/** The fingerprint on the board itself: the same chalk weave the card draws. */
function Weave({ answers, friend }: { answers: readonly (Side | null)[]; friend?: readonly Side[] }) {
  const path = (list: readonly (Side | null)[], left: number, right: number) => {
    const points = list.flatMap((side, index) => side ? [[side === "L" ? left : right, 8 + index * 16] as const] : []);
    return points.map(([x, y], index) => index ? `C${points[index - 1][0]} ${y - 8} ${x} ${y - 8} ${x} ${y}` : `M${x} ${y}`).join(" ");
  };
  return <svg className="ena-weave" viewBox="0 0 60 192" aria-hidden="true">
    <line x1="30" y1="0" x2="30" y2="192" />
    {friend && <path className="ena-weave-friend" d={path(friend, 14, 46)} />}
    <path d={path(answers, 18, 42)} />
    {answers.map((side, index) => side && <circle key={index} cx={side === "L" ? 18 : 42} cy={8 + index * 16} r="3.2" />)}
  </svg>;
}

export function TeaStallBoard() {
  const [packId, setPackId] = useState<PackId>("food");
  const [answers, setAnswers] = useState<Answers>(emptyAnswers);
  const [index, setIndex] = useState(0);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [tally, setTally] = useState<Tally | null>(null);
  const [tallyFailed, setTallyFailed] = useState(false);
  const [counted, setCounted] = useState<Counted>({});
  const [countState, setCountState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const board = useRef<HTMLDivElement>(null);
  const chips = useRef<HTMLFieldSetElement>(null);
  const resultVisible = useInView(result);
  const boardVisible = useInView(board, 0.4);

  const pack = packOf(packId)!;
  const current = answers[packId];
  const answered = current.filter(Boolean).length;
  const complete = answered === PAIRS_PER_PACK;
  const rival = friend && friend.pack === packId ? friend : null;
  const score = useMemo(() => nationalScore(pack, current, tally, counted), [pack, current, tally, counted]);
  const rare = useMemo(() => complete ? rarestPick(pack, current, tally, counted) : null, [complete, pack, current, tally, counted]);
  const line = humanLine(pack, current, score, rare);
  const card: BoardCard = useMemo(() => ({ pack, answers: current, name, score, line, friend: rival && { name: rival.name, answers: rival.answers } }), [pack, current, name, score, line, rival]);
  const shared: Shared | null = complete ? { pack: packId, answers: current as Side[], name, score } : null;
  const state = shared ? shareHash(shared).slice(1) : "";

  function refreshTally() {
    readTally(TOOL).then(next => { if (next) setTally(next); setTallyFailed(!next); });
  }

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared board opens the friend's pack.
    const readFriend = () => {
      const link = parseShareHash(window.location.hash);
      if (!link) return;
      setFriend(link);
      setPackId(link.pack);
      setAnswers(emptyAnswers());
      setIndex(0);
    };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    setCounted(readCounted());
    refreshTally();
    return () => { window.removeEventListener("hashchange", readFriend); if (timer.current) clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("আজকের তর্ক").then(() => {
      if (cancelled) return;
      if (preview.current) drawBoard(preview.current, card, format, site);
      if (friend && friendPreview.current) {
        const friendPack = packOf(friend.pack)!;
        drawBoard(friendPreview.current, { pack: friendPack, answers: friend.answers, name: friend.name, score: friend.score, line: humanLine(friendPack, friend.answers, friend.score, null), friend: null }, "feed", site);
      }
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend]);

  useEffect(() => {
    // A friend's link can open a topic that sits off-screen in the chip row; slide it into view without moving the page.
    const active = chips.current?.querySelector<HTMLElement>("[aria-pressed=true]");
    if (chips.current && active) chips.current.scrollLeft = active.offsetLeft - chips.current.offsetLeft - 16;
  }, [packId]);

  function stopTimer() { if (timer.current) { clearTimeout(timer.current); timer.current = null; } }

  function pick(side: Side) {
    if (index >= DONE) return;
    stopTimer();
    const next = current.map((value, position) => position === index ? side : value);
    setAnswers(all => ({ ...all, [packId]: next }));
    setCountState(stateNow => stateNow === "done" ? "idle" : stateNow);
    const target = firstOpen(next, index + 1);
    timer.current = setTimeout(() => setIndex(target), ADVANCE_MS);
  }

  function go(target: number) {
    stopTimer();
    setIndex(Math.max(0, Math.min(DONE, target)));
  }

  function choosePack(id: PackId) {
    if (id === packId) return;
    stopTimer();
    setPackId(id);
    setIndex(firstOpen(answers[id]));
    refreshTally();
  }

  function restart() {
    stopTimer();
    setAnswers(all => ({ ...all, [packId]: blank() }));
    setIndex(0);
    board.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function count() {
    if (!complete) return;
    setCountState("sending");
    // One vote per browser for the whole tool, so send every pack counted so far, not just this one.
    const merged: Counted = { ...counted };
    pack.pairs.forEach((pair, position) => { merged[pair.id] = current[position]!; });
    const items = packs.flatMap(item => item.pairs.flatMap(pair => merged[pair.id] ? [sideId(pair, merged[pair.id]!)] : []));
    const next = await addToTally(TOOL, items);
    if (!next) { setCountState("failed"); return; }
    setTally(next);
    setCounted(merged);
    setCountState("done");
    try { localStorage.setItem(COUNTED_KEY, JSON.stringify(merged)); } catch { /* private mode: the vote is still counted, only the de-dup hint is lost */ }
  }

  const pair = index < DONE ? pack.pairs[index] : null;
  const side = pair ? current[index] : null;
  const split = pair ? pairSplit(tally, pair, counted[pair.id]) : null;
  const showSplit = Boolean(side && enough(split));
  const friendName = friend?.name || "";
  const friendWho = friendName ? possessive(friendName) : "তোমার বন্ধুর";
  const match = rival ? sameCount(current, rival.answers) : 0;

  return (
    <div className="ena">
      {friend && (
        <section className="ena-friend" aria-labelledby="friend-title">
          <p className="ena-friend-kicker">চায়ের দোকান থেকে একটা বোর্ড এসেছে · {packOf(friend.pack)!.label}</p>
          <h2 id="friend-title">{friend.score ? `${friendWho} পছন্দ দেশের সাথে ${bn(friend.score.match)}/${bn(friend.score.of)} মেলে।` : `${friendWho} বোর্ডে ১২টা টিক পড়েছে।`} <span>এবার তোমার পালা, দেখো কয়টা মেলে।</span></h2>
          <details>
            <summary>{friendWho} বোর্ডটা দেখো</summary>
            <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendWho} বাছাই: ${packOf(friend.pack)!.pairs.map((item, position) => label(item, friend.answers[position])).join(", ")}`} />
          </details>
        </section>
      )}

      <fieldset className="ena-packs" ref={chips}>
        <legend className="ena-sr">কোন বিষয়ের তর্ক?</legend>
        {packs.map(item => {
          const done = answers[item.id].every(Boolean);
          return <button type="button" key={item.id} aria-pressed={packId === item.id} onClick={() => choosePack(item.id)}>{item.label}{done && <span className="ena-pack-done" aria-label="শেষ"> ✓</span>}</button>;
        })}
      </fieldset>

      <div className="ena-frame" ref={board}>
        <div className="ena-board">
          <div className="ena-board-head">
            <p className="ena-board-title">আজকের তর্ক</p>
            <p className="ena-progress" aria-live="polite">{index < DONE ? <><b>{bn(index + 1)}</b>/{bn(PAIRS_PER_PACK)}</> : "শেষ!"}</p>
          </div>

          {pair ? (
            <div className="ena-pair" key={`${packId}-${pair.id}`}>
              <div className="ena-halves" role="group" aria-label={question(pair)}>
                {(["L", "R"] as const).map(option => (
                  <button type="button" key={option} className="ena-half" data-side={option} aria-pressed={side === option} data-dim={Boolean(side && side !== option)} onClick={() => pick(option)}>
                    <span className="ena-word">{label(pair, option)}</span>
                    <svg className="ena-ring" viewBox="0 0 200 90" preserveAspectRatio="none" aria-hidden="true"><path d="M30 18C70 2 160 4 186 30c18 26-26 52-92 54C30 86 6 66 12 44 16 28 50 14 96 10" /></svg>
                    {showSplit && split && <span className="ena-percent">{bn(percent(split, option))}%</span>}
                  </button>
                ))}
                <span className="ena-or" aria-hidden="true">না</span>
              </div>

              <div className="ena-reveal" aria-live="polite">
                {!side ? <p className="ena-hint">যেটা তোমার পছন্দ, সেদিকে টোকা দাও</p> : showSplit && split ? <>
                  <p className="ena-verdict"><strong>{bn(percent(split, side))}%</strong> বাঙালির সাথে মিলেছে{percent(split, side) <= RARE_PERCENT && <em> · সাহস আছে!</em>}</p>
                  <div className="ena-bar" aria-hidden="true">{(["L", "R"] as const).map(option => <i key={option} data-mine={option === side} style={{ width: `${percent(split, option)}%` }} />)}</div>
                  <small>যারা খেলেছে তাদের মধ্যে · {bn(split.total)} জন · জরিপ না</small>
                </> : <>
                  <p className="ena-verdict"><strong>{label(pair, side)}</strong> দলে নাম লেখালে!</p>
                  <small>{tallyFailed || !split ? "দেশের হিসাব এখন আনা গেল না।" : `দেশের ভাগ দেখাতে আর ${bn(MIN_SAMPLE - split.total)} জনের ভোট লাগবে।`}</small>
                </>}
                {side && rival && <p className="ena-rival" data-same={rival.answers[index] === side}>{friendName || "বন্ধু"}: {label(pair, rival.answers[index])} {rival.answers[index] === side ? "· মিলেছে!" : "· মেলেনি"}</p>}
              </div>
            </div>
          ) : (
            <div className="ena-done">
              <Weave answers={current} friend={rival?.answers} />
              <div>
                <p className="ena-done-kicker">{bn(PAIRS_PER_PACK)}টা তর্ক শেষ!</p>
                <p className="ena-done-big">{score ? `দেশের সাথে মিল ${bn(score.match)}/${bn(score.of)}` : rival ? `দুজনের মিল ${bn(match)}/${bn(PAIRS_PER_PACK)}` : "তোমার রুচির রেখা তৈরি"}</p>
                {score && rival && <p className="ena-done-rival">{friendName ? possessive(friendName) : "বন্ধুর"} সাথে মিল {bn(match)}/{bn(PAIRS_PER_PACK)}</p>}
                <p className="ena-done-line">{line}</p>
                <a className="kit-primary" href="#result">কার্ডটা দেখো</a>
              </div>
            </div>
          )}

          <div className="ena-nav">
            <button type="button" onClick={() => go(index - 1)} disabled={index === 0}>← আগেরটা</button>
            <ol className="ena-ticks" aria-label={`${bn(answered)}টা তর্কে টিক দিয়েছ`}>
              {current.map((value, position) => <li key={position} data-done={Boolean(value)} data-current={position === index} />)}
            </ol>
            <button type="button" onClick={() => go(firstOpen(current, index + 1))} disabled={!side}>পরেরটা →</button>
          </div>
        </div>
        <div className="ena-tray" aria-hidden="true"><i /><i /><b /></div>
      </div>

      <StickyNext show={complete && !resultVisible && !boardVisible} title={score ? <><strong>{bn(score.match)}/{bn(score.of)}</strong> দেশের সাথে মিল</> : <><strong>১২টা</strong> তর্ক শেষ</>} sub={line} href="#result" label="কার্ডটা দেখো" />

      <section className="ena-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="ena-result-head">
          <h2 id="result-title">{complete ? <>তোমার <em>রুচির রেখা</em></> : "তোমার বোর্ড ভরছে…"}</h2>
          <p>{complete ? "হলুদ দাগটা তোমার ১২টা বাছাইয়ের পথ। ৪০৯৬ রকম রেখা হয়, এটা তোমারটা।" : `আর ${bn(PAIRS_PER_PACK - answered)}টা তর্ক বাকি। শেষ হলেই শেয়ার করতে পারবে।`}</p>
        </div>
        <div className="ena-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="ena-sr">{line} {pack.pairs.map((item, position) => current[position] ? label(item, current[position]) : "").filter(Boolean).join(", ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">বোর্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="ena-controls">
            <label className="ena-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="eta-na-ota.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${rival ? rival.answers.join("") : ""}`} caption={shared ? caption(shared, rival) : ""} state={state || undefined} disabled={!complete} hint={complete ? "লিংক পেলে বন্ধু একই ১২টা তর্ক খেলবে, আর দেখবে তোমাদের কয়টা মেলে।" : "আগে ১২টা তর্ক শেষ করো।"} />
            {complete && (
              <div className="ena-count">
                <h3>দেশের হিসাবে তোমার ভোটও যোগ করবে?</h3>
                {countState === "done" ? <p>গোনা হয়ে গেছে, ধন্যবাদ! বাছাই বদলালে আবার গুনতে পারো, আগেরটা বাদ যাবে।</p> : <>
                  <p>শুধু কোন দিকে টিক দিয়েছ সেটা গোনা হয়। নাম যায় না।</p>
                  <button type="button" className="kit-secondary" onClick={count} disabled={countState === "sending"}>{countState === "sending" ? "গোনা হচ্ছে…" : "আমার ভোটগুলোও গোনো"}</button>
                  {countState === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
                </>}
              </div>
            )}
            {answered > 0 && <button type="button" className="kit-link" onClick={restart}>এই তর্কগুলো আবার খেলো</button>}
          </div>
        </div>
      </section>
    </div>
  );
}
