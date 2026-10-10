"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { bn, caption, humanLine, marks, parseShareHash, possessive, questionsOf, rank, scoreOf, setById, sets, shareHash, MAX_NAME_LENGTH, PER_SET, type Answer, type SetId, type Shared } from "../lib/quiz";

const TOOL = "dom-atkano";
// Percentages from a handful of people are noise ("১০০% মানুষের মনে আছে" after one vote).
const COMPARE_MIN = 20;
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

function Plates({ hits, label, now = -1 }: { hits: (boolean | null)[]; label: string; now?: number }) {
  return <ol className="dom-plates" aria-label={label}>
    {hits.map((hit, index) => <li key={index} data-state={hit ? "right" : hit === false ? "wrong" : index === now ? "now" : "pending"}><span className="dom-sr">{bn(index + 1)}: {hit ? "ঠিক" : hit === false ? "ভুল" : "বাকি"}</span></li>)}
  </ol>;
}

export function Scoreboard() {
  const [setId, setSetId] = useState<SetId>("s1");
  const [answersBy, setAnswersBy] = useState<Partial<Record<SetId, Answer[]>>>({});
  const [pos, setPos] = useState(0);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Shared | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const questions = questionsOf(setId);
  const answers = useMemo(() => answersBy[setId] ?? [], [answersBy, setId]);
  const hits = marks(setId, answers);
  const score = scoreOf(setId, answers);
  const done = answers.length === PER_SET;
  const own = useMemo(() => ({ set: setId, answers, name }), [setId, answers, name]);
  const state = done ? shareHash(own).slice(1) : "";
  const rival = friend?.set === setId ? friend : null;
  const rivalName = friend?.name || "তোমার বন্ধু";
  const question = questions[Math.min(pos, PER_SET - 1)];
  const revealed = pos < PER_SET && answers.length > pos;
  const picked = answers[pos];

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared result replaces the friend.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash);
      if (!shared) return;
      setFriend(shared);
      setSetId(shared.set);
      setPos(0);
    };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("দম আটকানো ম্যাচ ১০").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, { ...own, friend }, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [own, friend, format, site]);

  useEffect(() => { if (revealed) nextButton.current?.focus({ preventScroll: true }); }, [revealed]);

  function pick(option: Answer) {
    if (revealed) return;
    setAnswersBy(current => ({ ...current, [setId]: [...(current[setId] ?? []), option] }));
  }

  function next() {
    setPos(pos + 1);
    if (pos + 1 === PER_SET) requestAnimationFrame(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }));
  }

  function chooseSet(id: SetId) {
    setSetId(id);
    setPos(Math.min((answersBy[id] ?? []).length, PER_SET));
    setCompared("idle");
    document.getElementById("board")?.scrollIntoView({ behavior: "smooth" });
  }

  function restart() {
    setAnswersBy(current => ({ ...current, [setId]: [] }));
    setPos(0);
    setCompared("idle");
    document.getElementById("board")?.scrollIntoView({ behavior: "smooth" });
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, [`seen:${setId}`, ...questions.filter((_, index) => hits[index]).map(item => item.id)]);
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const otherSet = sets.find(item => item.id !== setId)!;
  const seen = everyone?.counts[`seen:${setId}`] ?? 0;
  const remembered = compared === "done" && everyone ? questions.map((item, index) => ({ item, hit: hits[index], percent: percent(everyone.counts[item.id] ?? 0, seen) })) : [];
  const rarest = remembered.filter(entry => entry.hit).sort((a, b) => a.percent - b.percent)[0];

  return (
    <div className="dom">
      {friend && (
        <p className="dom-friend">
          <strong>{friend.name || "তোমার বন্ধু"} ১০-এ {bn(scoreOf(friend.set, friend.answers))} পেয়েছে, তুমি?</strong>
          <span>একই ১০টা প্রশ্ন নিচে। শেষে পাশাপাশি দেখবে।</span>
        </p>
      )}

      <div className="dom-board" id="board">
        <div className="dom-board-top" aria-hidden="true">
          <p><span>প্রশ্ন</span><b>{bn(Math.min(pos + 1, PER_SET))}</b><i>/১০</i></p>
          <p><span>ঠিক</span><b>{bn(score)}</b></p>
        </div>
        <Plates hits={hits} now={pos} label={`${setById(setId).label}: ${bn(answers.length)}টার উত্তর দেওয়া, ${bn(score)}টা ঠিক`} />

        {pos < PER_SET ? <>
          <p className="dom-meta"><span>{question.year}</span> {question.where}</p>
          <h2 className="dom-q" id="dom-q">{question.prompt}</h2>
          <div className="dom-options" role="group" aria-labelledby="dom-q">
            {question.options.map((option, index) => (
              <button type="button" key={`${question.id}-${index}`} className="dom-opt" aria-pressed={revealed && picked === index} disabled={revealed}
                data-state={revealed ? index === question.answer ? "right" : index === picked ? "wrong" : "dim" : undefined} onClick={() => pick(index as Answer)}>
                {option}
              </button>
            ))}
          </div>
          <div className="dom-reveal" role="status" aria-live="polite">
            {revealed && <>
              <p className="dom-verdict" data-right={picked === question.answer}>{picked === question.answer ? "ঠিক ধরেছ!" : "উঁহু, হলো না।"}</p>
              <p className="dom-memory">{question.memory}</p>
              <a className="dom-source" href={question.source} target="_blank" rel="noopener noreferrer">সূত্র: ম্যাচের স্কোরকার্ড (ESPNcricinfo) ↗</a>
              <button type="button" ref={nextButton} className="kit-primary dom-next" onClick={next}>{pos === PER_SET - 1 ? "স্কোরকার্ড দেখো" : "পরের প্রশ্ন"}</button>
            </>}
          </div>
        </> : (
          <div className="dom-end">
            <p className="dom-meta"><span>খেলা শেষ</span> {setById(setId).label}</p>
            <h2 className="dom-q">১০-এ {bn(score)} · <em>{rank(score)}</em></h2>
            <p className="dom-memory">{humanLine(setId, answers)}</p>
            <a className="kit-primary dom-next" href="#result">স্কোরকার্ড দেখো</a>
          </div>
        )}
      </div>

      <fieldset className="kit-chips dom-sets">
        <legend>আরও প্রশ্ন চাও? আরেক সেট খেলো</legend>
        {sets.map(item => {
          const count = (answersBy[item.id] ?? []).length;
          return <button type="button" key={item.id} aria-pressed={item.id === setId} onClick={() => chooseSet(item.id)}>{item.label}{count === PER_SET ? ` · ${bn(scoreOf(item.id, answersBy[item.id]!))}/১০` : count ? ` · ${bn(count)}/১০ চলছে` : ""}</button>;
        })}
      </fieldset>

      <StickyNext show={done && !resultVisible} title={<><strong>১০-এ {bn(score)}</strong> · {rank(score)}</>} sub={humanLine(setId, answers)} href="#result" label="স্কোরকার্ড" />

      <section className="dom-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="dom-result-head">
          <h2 id="result-title">{done ? <>তোমার স্কোরকার্ড: <em>১০-এ {bn(score)}</em></> : "স্কোরকার্ড এখনো চলছে"}</h2>
          <p>{done ? humanLine(setId, answers) : `ওপরের ${bn(PER_SET - answers.length)}টা প্রশ্নের উত্তর দিলেই স্কোরকার্ড পুরো হবে, তারপর শেয়ার করতে পারবে।`}</p>
        </div>

        {done && rival && (
          <div className="dom-vs">
            <div><span>তুমি · {bn(score)}</span><Plates hits={hits} label={`তোমার ফল: ${bn(score)}টা ঠিক`} /></div>
            <div><span>{rivalName} · {bn(scoreOf(rival.set, rival.answers))}</span><Plates hits={marks(rival.set, rival.answers)} label={`${rival.name ? possessive(rival.name) : "বন্ধুর"} ফল`} /></div>
            <p>{score > scoreOf(rival.set, rival.answers) ? "তুমি এগিয়ে! লিংকটা ফেরত পাঠাও।" : score === scoreOf(rival.set, rival.answers) ? "সমানে সমান! ম্যাচ টাই।" : `এবার ${rivalName} এগিয়ে। আরেক সেটে শোধ নাও!`}</p>
          </div>
        )}

        <div className="dom-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="dom-sr">দম আটকানো ম্যাচ, {setById(setId).label}: ১০টার মধ্যে {bn(score)}টা ঠিক{done ? `, ${rank(score)}` : ""}।</figcaption>
            {previewError && <p className="kit-status" role="alert">স্কোরকার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="dom-controls">
            <label className="dom-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`dom-atkano-${setId}.png`} makeImage={() => cardBlob({ ...own, friend }, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption(own, friend)} state={state} disabled={!done}
              hint={done ? "লিংক পেলে বন্ধু একই ১০টা প্রশ্ন পাবে, শেষে দুজনের ফল পাশাপাশি দেখবে।" : "১০টা প্রশ্ন শেষ হলেই শেয়ার করা যাবে।"} />
            {done && <div className="dom-again">
              <button type="button" className="kit-secondary" onClick={() => chooseSet(otherSet.id)}>{otherSet.label} খেলো</button>
              <button type="button" className="kit-link" onClick={restart}>এই সেট আবার খেলো</button>
            </div>}
          </div>
        </div>

        {done && (
          <div className="dom-everyone">
            <h3>কোন ম্যাচটা সবার মনে আছে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>সবার সাথে মিলিয়ে দেখো কোন মুহূর্তটা খুব কম মানুষের মনে আছে। নাম যাবে না, শুধু কোন প্রশ্নগুলো ঠিক হয়েছে সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : seen < COMPARE_MIN ? <p className="kit-status">এই সেটে এখনো {bn(seen)} জন খেলেছে, হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও!</p> : <>
              {rarest && <p className="dom-rare"><strong>{rarest.item.year}, {rarest.item.where}</strong> {rarest.percent < 50 ? "মাত্র " : ""}{bn(rarest.percent)}% মানুষের মনে আছে, তোমার আছে!</p>}
              <ul className="dom-bars">{remembered.map(entry => <li key={entry.item.id} data-hit={Boolean(entry.hit)}><span>{entry.item.year}, {entry.item.where}</span><i style={{ width: `${entry.percent}%` }} /><b>{bn(entry.percent)}%</b></li>)}</ul>
              <p className="kit-status">{bn(seen)} জনের সাথে মেলানো।</p>
            </>}
          </div>
        )}
      </section>
    </div>
  );
}
