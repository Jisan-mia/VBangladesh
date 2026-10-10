"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { stallSvg } from "../lib/art";
import { cardBlob, drawCard, loadStall } from "../lib/draw-card";
import { bn, caption, humanLine, marks, parseShareHash, possessive, questionsOf, rank, scoreOf, setById, sets, shareHash, MAX_NAME_LENGTH, PER_SET, type Answer, type SetId, type Shared } from "../lib/pitha";

const TOOL = "pitha";
// Percentages from a handful of people are noise ("১০০% চিনেছে" after one play).
const COMPARE_MIN = 20;
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

function Baskets({ hits, label, now = -1 }: { hits: (boolean | null)[]; label: string; now?: number }) {
  return <ol className="pt-baskets" aria-label={label}>
    {hits.map((hit, index) => <li key={index} data-state={hit ? "right" : hit === false ? "wrong" : index === now ? "now" : "pending"}><span className="pt-sr">{bn(index + 1)}: {hit ? "চিনেছ" : hit === false ? "হয়নি" : "বাকি"}</span></li>)}
  </ol>;
}

export function PithaStall() {
  const [setId, setSetId] = useState<SetId>("w1");
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
    Promise.all([loadCardFonts("পিঠা চেনো? ১০-এ ৮"), loadStall()]).then(() => {
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
    else requestAnimationFrame(() => document.getElementById("board")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
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
  const known = compared === "done" && everyone ? questions.map((item, index) => ({ item, hit: hits[index], percent: percent(everyone.counts[item.id] ?? 0, seen) })) : [];
  const hardest = [...known].sort((a, b) => a.percent - b.percent)[0];

  return (
    <div className="pt">
      {friend && (
        <p className="pt-friend">
          <strong>{friend.name || "তোমার বন্ধু"} ১০-এ {bn(scoreOf(friend.set, friend.answers))}টা চিনেছে, তুমি?</strong>
          <span>একই ১০টা পিঠা, শেষে দুজনের ডালা পাশাপাশি।</span>
        </p>
      )}

      <div className="pt-stall" id="board">
        <div className="pt-top">
          <p aria-hidden="true"><span>পিঠা</span><b>{bn(Math.min(pos + 1, PER_SET))}</b><i>/১০</i></p>
          <Baskets hits={hits} now={pos} label={`${setById(setId).label}: ${bn(answers.length)}টার উত্তর দেওয়া, ${bn(score)}টা চিনেছ`} />
        </div>

        {pos < PER_SET ? <>
          <div className="pt-scene" role="img" aria-label={revealed ? `ডালায় ${question.name}` : "ডালায় একটা পিঠা, নাম বলো"} dangerouslySetInnerHTML={{ __html: stallSvg(question.id) }} />
          <h2 className="pt-q" id="pt-q">এটা কোন পিঠা?</h2>
          <p className="pt-clue">{question.clue}</p>
          <div className="pt-options" role="group" aria-labelledby="pt-q">
            {question.options.map((option, index) => (
              <button type="button" key={`${question.id}-${index}`} className="pt-opt" aria-pressed={revealed && picked === index} disabled={revealed}
                data-state={revealed ? index === question.answer ? "right" : index === picked ? "wrong" : "dim" : undefined} onClick={() => pick(index as Answer)}>
                {option}
              </button>
            ))}
          </div>
          <div className="pt-reveal" role="status" aria-live="polite">
            {revealed && <>
              <p className="pt-verdict" data-right={picked === question.answer}>{picked === question.answer ? "ঠিক চিনেছ!" : `উঁহু, এটা ${question.name}।`}</p>
              {question.alt && <p className="pt-alt">অন্য নামে: {question.alt}</p>}
              <p className="pt-about">{question.about}</p>
              <a className="pt-source" href={question.source} target="_blank" rel="noopener noreferrer">সূত্র দেখো ↗</a>
              <button type="button" ref={nextButton} className="kit-primary pt-next" onClick={next}>{pos === PER_SET - 1 ? "ফল দেখো" : "পরের পিঠা"}</button>
            </>}
          </div>
        </> : (
          <div className="pt-end">
            <p className="pt-clue">{setById(setId).label} · খেলা শেষ</p>
            <h2 className="pt-q">১০-এ {bn(score)} · <em>{rank(score)}</em></h2>
            <p className="pt-about">{humanLine(setId, answers)}</p>
            <a className="kit-primary pt-next" href="#result">কার্ড দেখো</a>
          </div>
        )}
      </div>

      <fieldset className="kit-chips pt-sets">
        <legend>আরও ১০টা পিঠা চাও? আরেক ডালা খেলো</legend>
        {sets.map(item => {
          const count = (answersBy[item.id] ?? []).length;
          return <button type="button" key={item.id} aria-pressed={item.id === setId} onClick={() => chooseSet(item.id)}>{item.label}{count === PER_SET ? ` · ${bn(scoreOf(item.id, answersBy[item.id]!))}/১০` : count ? ` · ${bn(count)}/১০ চলছে` : ""}</button>;
        })}
      </fieldset>

      <StickyNext show={done && !resultVisible} title={<><strong>১০-এ {bn(score)}</strong> · {rank(score)}</>} sub={humanLine(setId, answers)} href="#result" label="কার্ড দেখো" />

      <section className="pt-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="pt-result-head">
          <h2 id="result-title">{done ? <>তুমি চিনেছ <em>১০-এ {bn(score)}</em></> : "তোমার ডালা এখনো ভরছে"}</h2>
          <p>{done ? humanLine(setId, answers) : `ওপরের আরও ${bn(PER_SET - answers.length)}টা পিঠা চিনলেই কার্ড পুরো হবে, তারপর শেয়ার করতে পারবে।`}</p>
        </div>

        {done && rival && (
          <div className="pt-vs">
            <div><span>তুমি · {bn(score)}</span><Baskets hits={hits} label={`তোমার ফল: ${bn(score)}টা চিনেছ`} /></div>
            <div><span>{rivalName} · {bn(scoreOf(rival.set, rival.answers))}</span><Baskets hits={marks(rival.set, rival.answers)} label={`${rival.name ? possessive(rival.name) : "বন্ধুর"} ফল`} /></div>
            <p>{score > scoreOf(rival.set, rival.answers) ? "তুমি এগিয়ে! লিংকটা ফেরত পাঠাও।" : score === scoreOf(rival.set, rival.answers) ? "সমানে সমান! দুজনেই সমান পিঠাখোর।" : `এবার ${rivalName} এগিয়ে। আরেক ডালায় শোধ নাও!`}</p>
          </div>
        )}

        <div className="pt-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="pt-sr">পিঠা চেনো, {setById(setId).label}: ১০টার মধ্যে {bn(score)}টা চিনেছি{done ? `, ${rank(score)}` : ""}।</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="pt-controls">
            <label className="pt-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`pitha-${setId}.png`} makeImage={() => cardBlob({ ...own, friend }, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption(own, friend)} state={state} disabled={!done}
              hint={done ? "লিংক পেলে বন্ধু একই ১০টা পিঠা পাবে, শেষে দুজনের ফল পাশাপাশি দেখবে।" : "১০টা পিঠা শেষ হলেই শেয়ার করা যাবে।"} />
            {done && <div className="pt-again">
              <button type="button" className="kit-secondary" onClick={() => chooseSet(otherSet.id)}>{otherSet.label} খেলো</button>
              <button type="button" className="kit-link" onClick={restart}>এই ডালা আবার খেলো</button>
            </div>}
          </div>
        </div>

        {done && (
          <div className="pt-everyone">
            <h3>কোন পিঠাটা কম লোকে চেনে?</h3>
            {compared !== "done" || !everyone ? <>
              <p>সবার সাথে মিলিয়ে দেখো। নাম যাবে না, শুধু কোন পিঠাগুলো চিনেছ সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : seen < COMPARE_MIN ? <p className="kit-status">এই ডালা এখনো {bn(seen)} জন খেলেছে, হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও!</p> : <>
              {hardest && <p className="pt-rare">{hardest.percent < 50 ? "মাত্র " : ""}<strong>{bn(hardest.percent)}%</strong> চিনেছে <strong>{hardest.item.name}</strong>{hardest.hit ? ", তুমি তাদের একজন!" : "।"}</p>}
              <ul className="pt-bars">{known.map(entry => <li key={entry.item.id} data-hit={Boolean(entry.hit)}><span>{entry.item.name}</span><i style={{ width: `${entry.percent}%` }} /><b>{bn(entry.percent)}%</b></li>)}</ul>
              <p className="kit-status">{bn(seen)} জনের সাথে মেলানো।</p>
            </>}
          </div>
        )}
      </section>
    </div>
  );
}
