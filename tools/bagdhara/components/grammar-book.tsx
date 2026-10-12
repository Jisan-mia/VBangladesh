"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, sfx, shake } from "../../../shared/game-sound";
import { totalStars, useLevels } from "../../../shared/game-kit";
import { LevelGrid, SoundToggle, StarReveal } from "../../../shared/game-ui";
import { addToTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { idiomSvg } from "../lib/art";
import { cardBlob, drawCard, loadPlates } from "../lib/draw-card";
import { bn, caption, dictionaryUrl, humanLine, marks, nearMissLine, parseShareHash, possessive, questionsOf, rank, scoreOf, setById, setStars, sets, shareHash, MAX_NAME_LENGTH, PER_SET, type Answer, type SetId, type Shared } from "../lib/idioms";

const TOOL = "bagdhara";
const LETTERS = ["ক", "খ", "গ"] as const;
// Percentages from a handful of people are noise ("১০০% পেরেছে" after one play).
const COMPARE_MIN = 20;
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

function Marks({ hits, label, now = -1 }: { hits: (boolean | null)[]; label: string; now?: number }) {
  return <ol className="bg-marks" aria-label={label}>
    {hits.map((hit, index) => <li key={index} data-state={hit ? "right" : hit === false ? "wrong" : index === now ? "now" : "pending"}><span className="bg-sr">{bn(index + 1)}: {hit ? "পেরেছ" : hit === false ? "হয়নি" : "বাকি"}</span></li>)}
  </ol>;
}

export function GrammarBook() {
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
  const levels = useLevels(TOOL, sets.length);

  const questions = questionsOf(setId);
  const answers = useMemo(() => answersBy[setId] ?? [], [answersBy, setId]);
  const hits = marks(setId, answers);
  const score = scoreOf(setId, answers);
  const done = answers.length === PER_SET;
  const level = sets.findIndex(item => item.id === setId) + 1;
  const own = useMemo(() => ({ set: setId, answers, name }), [setId, answers, name]);
  const state = done ? shareHash(own).slice(1) : "";
  const rival = friend?.set === setId ? friend : null;
  const rivalName = friend?.name || "তোমার বন্ধু";
  const question = questions[Math.min(pos, PER_SET - 1)];
  const revealed = pos < PER_SET && answers.length > pos;
  const picked = answers[pos];
  const right = picked === question.answer;

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
    Promise.all([loadCardFonts("বাগধারার ছবি ১০-এ ৮"), loadPlates(setId)]).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, { ...own, friend }, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [own, friend, format, site, setId]);

  useEffect(() => { if (revealed) nextButton.current?.focus({ preventScroll: true }); }, [revealed]);

  function pick(option: Answer, button: Element) {
    if (revealed) return;
    if (option === question.answer) sfx.good(); else { sfx.wrong(); shake(button.closest(".bg-page")); }
    setAnswersBy(current => ({ ...current, [setId]: [...(current[setId] ?? []), option] }));
  }

  function next() {
    setPos(pos + 1);
    // Stars are saved per set; StarReveal chimes each star, so the big cheer is only for a perfect 10.
    if (pos + 1 === PER_SET) { levels.record(level, setStars(score)); if (score === PER_SET) { confetti(); sfx.win(); } }
    if (pos + 1 === PER_SET) requestAnimationFrame(() => document.getElementById("result")?.scrollIntoView({ behavior: "smooth" }));
    else requestAnimationFrame(() => document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "nearest" }));
  }

  function chooseSet(id: SetId) {
    setSetId(id);
    setPos(Math.min((answersBy[id] ?? []).length, PER_SET));
    setCompared("idle");
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  }

  function restart() {
    setAnswersBy(current => ({ ...current, [setId]: [] }));
    setPos(0);
    setCompared("idle");
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, [`seen:${setId}`, ...questions.filter((_, index) => hits[index]).map(item => item.id)], "", setId);
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const otherSet = sets.find(item => item.id !== setId)!;
  const seen = everyone?.counts[`seen:${setId}`] ?? 0;
  const known = compared === "done" && everyone ? questions.map((item, index) => ({ item, hit: hits[index], percent: percent(everyone.counts[item.id] ?? 0, seen) })) : [];
  const hardest = [...known].sort((a, b) => a.percent - b.percent)[0];

  return (
    <div className="bg">
      {friend && (
        <p className="bg-friend">
          <strong>{friend.name || "তোমার বন্ধু"} ১০-এ {bn(scoreOf(friend.set, friend.answers))}টা পেরেছে, এবার তোমার পালা!</strong>
          <span>একই ১০টা বাগধারা। কে কী বেছেছে, শেষ হওয়ার আগে দেখাবে না।</span>
        </p>
      )}

      <div className="bg-page" id="book">
        <div className="bg-head">
          <span>বাংলা ব্যাকরণ · বাগধারা</span>
          <p aria-hidden="true"><b>{bn(Math.min(pos + 1, PER_SET))}</b>/১০</p>
          <SoundToggle compact />
        </div>
        <Marks hits={hits} now={pos} label={`${setById(setId).label}: ${bn(answers.length)}টার উত্তর দেওয়া, ${bn(score)}টা ঠিক`} />

        {pos < PER_SET ? <>
          <figure className="bg-plate" key={question.id}>
            <div role="img" aria-label={`ছবি: ${question.scene}`} dangerouslySetInnerHTML={{ __html: idiomSvg(question.id) }} />
            <figcaption>চিত্র {bn(pos + 1)}</figcaption>
          </figure>
          <h2 className="bg-q" id="bg-q"><span>“{question.idiom}”</span> মানে কী?</h2>
          <div className="bg-options" role="group" aria-labelledby="bg-q">
            {question.options.map((option, index) => (
              <button type="button" key={`${question.id}-${index}`} className="bg-opt" aria-pressed={revealed && picked === index} disabled={revealed}
                data-state={revealed ? index === question.answer ? "right" : index === picked ? "wrong" : "dim" : undefined} onClick={event => pick(index as Answer, event.currentTarget)}>
                <i aria-hidden="true">{LETTERS[index]}</i>{option}
              </button>
            ))}
          </div>
          <div className="bg-reveal" role="status" aria-live="polite">
            {revealed && <>
              <p className="bg-verdict" data-right={right}>{right ? "ঠিক! পুরো নম্বর।" : picked === question.trap ? "উঁহু, ছবি যা দেখায় তা না!" : "উঁহু, হলো না।"}</p>
              <p className="bg-meaning"><b>অর্থ:</b> {question.meaning}</p>
              <p className="bg-example"><b>বাক্যে প্রয়োগ:</b> {question.example}</p>
              <a className="bg-source" href={dictionaryUrl(question.head)} target="_blank" rel="noopener noreferrer">বাংলা একাডেমির অভিধানে দেখো ↗</a>
              <button type="button" ref={nextButton} className="kit-primary bg-next" onClick={next}>{pos === PER_SET - 1 ? "ফল দেখো" : "পাতা ওল্টাও"}</button>
            </>}
          </div>
        </> : (
          <div className="bg-end">
            <p className="bg-sub">{setById(setId).label} · পরীক্ষা শেষ</p>
            <h2 className="bg-q">১০-এ <em>{bn(score)}</em> · {rank(score)}</h2>
            <p className="bg-meaning">{humanLine(setId, answers)}</p>
            <a className="kit-primary bg-next" href="#result">কার্ড দেখো</a>
          </div>
        )}
      </div>

      <fieldset className="kit-chips bg-sets">
        <legend>আরও ১০টা চাও? আরেক পাতা খেলো</legend>
        {sets.map(item => {
          const count = (answersBy[item.id] ?? []).length;
          return <button type="button" key={item.id} aria-pressed={item.id === setId} onClick={() => chooseSet(item.id)}>{item.label}{count === PER_SET ? ` · ${bn(scoreOf(item.id, answersBy[item.id]!))}/১০` : count ? ` · ${bn(count)}/১০ চলছে` : ""}</button>;
        })}
      </fieldset>

      <details className="bg-levels">
        <summary>সব সেট <span>★ {bn(totalStars(levels.stars))}/{bn(sets.length * 3)}</span></summary>
        <p>{sets.map((item, index) => `${bn(index + 1)} ${item.label}`).join(" · ")}। ১০টাই ঠিক হলে ৩ তারা, ৭টা বা বেশি ঠিক হলে ২, শেষ করলে ১। সব সেট সব সময় খোলা।</p>
        <LevelGrid count={sets.length} stars={levels.stars} unlocked={sets.length} current={level} noun="সেট" onPick={pick => chooseSet(sets[pick - 1].id)} />
      </details>

      <StickyNext show={done && !resultVisible} title={<><strong>১০-এ {bn(score)}</strong> · {rank(score)}</>} sub={humanLine(setId, answers)} href="#result" label="কার্ড দেখো" />

      <section className="bg-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="bg-result-head">
          <h2 id="result-title">{done ? <>তুমি পেরেছ <em>১০-এ {bn(score)}</em></> : "খাতা এখনো জমা হয়নি"}</h2>
          {done && <p className="bg-reward"><StarReveal count={setStars(score)} />{nearMissLine(score) && <small>{nearMissLine(score)}</small>}</p>}
          <p>{done ? humanLine(setId, answers) : `ওপরের আরও ${bn(PER_SET - answers.length)}টা বাগধারার মানে বললেই কার্ড পুরো হবে, তারপর শেয়ার করতে পারবে।`}</p>
        </div>

        {done && rival && (
          <div className="bg-vs">
            <div><span>তুমি · {bn(score)}</span><Marks hits={hits} label={`তোমার ফল: ${bn(score)}টা ঠিক`} /></div>
            <div><span>{rivalName} · {bn(scoreOf(rival.set, rival.answers))}</span><Marks hits={marks(rival.set, rival.answers)} label={`${rival.name ? possessive(rival.name) : "বন্ধুর"} ফল`} /></div>
            <p>{score > scoreOf(rival.set, rival.answers) ? "তুমি এগিয়ে! লিংকটা ফেরত পাঠাও।" : score === scoreOf(rival.set, rival.answers) ? "সমানে সমান! দুজনেই এক বেঞ্চের।" : `এবার ${rivalName} এগিয়ে। আরেক পাতায় শোধ নাও!`}</p>
          </div>
        )}

        <div className="bg-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="bg-sr">বাগধারার ছবি, {setById(setId).label}: ১০টার মধ্যে {bn(score)}টা পেরেছি{done ? `, ${rank(score)}` : ""}।</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="bg-controls">
            <label className="bg-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`bagdhara-${setId}.png`} makeImage={() => cardBlob({ ...own, friend }, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption(own, friend)} state={state} disabled={!done}
              hint={done ? "একই ১০টা বাগধারা বন্ধুও খেলতে পারবে। তোমার উত্তরগুলো ও দেখবে নিজের খেলা শেষ করার পর।" : "১০টা শেষ হলেই শেয়ার করা যাবে।"} />
            {done && <div className="bg-again">
              <button type="button" className="kit-secondary" onClick={() => chooseSet(otherSet.id)}>{otherSet.label} খেলো</button>
              <button type="button" className="kit-link" onClick={restart}>এই পাতা আবার খেলো</button>
            </div>}
          </div>
        </div>

        {done && (
          <div className="bg-everyone">
            <h3>কোন বাগধারাটা সবচেয়ে কঠিন?</h3>
            {compared !== "done" || !everyone ? <>
              <p>সবার সাথে মিলিয়ে দেখো। নাম যাবে না, শুধু কোনগুলো পেরেছ সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : seen < COMPARE_MIN ? <p className="kit-status">এই পাতা এখনো {bn(seen)} জন খেলেছে, হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও!</p> : <>
              {hardest && <p className="bg-rare">{hardest.percent < 50 ? "মাত্র " : ""}<strong>{bn(hardest.percent)}%</strong> পেরেছে <strong>{hardest.item.idiom}</strong>{hardest.hit ? ", তুমি তাদের একজন!" : "।"}</p>}
              <ul className="bg-bars">{known.map(entry => <li key={entry.item.id} data-hit={Boolean(entry.hit)}><span>{entry.item.idiom}</span><i style={{ width: `${entry.percent}%` }} /><b>{bn(entry.percent)}%</b></li>)}</ul>
              <p className="kit-status">{bn(seen)} জনের সাথে মেলানো।</p>
            </>}
          </div>
        )}
      </section>
    </div>
  );
}
