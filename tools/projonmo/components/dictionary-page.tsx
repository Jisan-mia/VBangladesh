"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { bn, caption, entriesOf, formula, friendBanner, humanLine, kindLabel, marks, parseShareHash, possessive, sendTo, setById, sets, shareHash, split, splitText, verdict, versusLine, MAX_NAME_LENGTH, PER_SET, type Answer, type Kind, type SetId, type Shared } from "../lib/words";

const TOOL = "projonmo";
// Percentages from a handful of people are noise ("১০০% পেরেছে" after one play).
const COMPARE_MIN = 20;
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

/** Two rows of five boxes: the Gen Z words and the elders' words, filled as they are answered. */
function Ledger({ set, hits, now = -1, label }: { set: SetId; hits: (boolean | null)[]; now?: number; label: string }) {
  const entries = entriesOf(set);
  return <div className="pj-ledger" role="group" aria-label={label}>
    {(["genz", "elder"] as Kind[]).map(kind => (
      <div key={kind} data-kind={kind}>
        <span aria-hidden="true">{kind === "genz" ? "জেন-জি" : "আব্বু-আম্মু"}</span>
        <ol>{entries.map((entry, index) => entry.kind === kind && (
          <li key={entry.id} data-state={hits[index] ? "right" : hits[index] === false ? "wrong" : index === now ? "now" : "pending"}>
            <span className="pj-sr">{kindLabel(kind)} {bn(index + 1)}: {hits[index] ? "পেরেছ" : hits[index] === false ? "হয়নি" : "বাকি"}</span>
          </li>
        ))}</ol>
      </div>
    ))}
  </div>;
}

export function GenerationDictionary() {
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

  const entries = entriesOf(setId);
  const answers = useMemo(() => answersBy[setId] ?? [], [answersBy, setId]);
  const hits = marks(setId, answers);
  const done = answers.length === PER_SET;
  const mine = split(setId, answers);
  const own = useMemo(() => ({ set: setId, answers, name }), [setId, answers, name]);
  const state = done ? shareHash(own).slice(1) : "";
  const rival = friend?.set === setId ? friend : null;
  const entry = entries[Math.min(pos, PER_SET - 1)];
  const revealed = pos < PER_SET && answers.length > pos;
  const picked = answers[pos];
  const right = picked === entry.answer;

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
    loadCardFonts("প্রজন্মের অভিধান ৭০% জেন-জি").then(() => {
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
    // One vote per page (group), so comparing page 2 never wipes page 1.
    const given = answersBy[setId] ?? [];
    const right = marks(setId, given);
    const items = [`seen:${setId}`, ...setById(setId).entries.filter((_, index) => right[index]).map(word => word.id)];
    const tally = await addToTally(TOOL, items, "", setId);
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  const otherSet = sets.find(item => item.id !== setId)!;
  const seen = everyone?.counts[`seen:${setId}`] ?? 0;
  const known = compared === "done" && everyone ? entries.map((item, index) => ({ item, hit: hits[index], percent: percent(everyone.counts[item.id] ?? 0, seen) })) : [];
  const hardest = [...known].sort((a, b) => a.percent - b.percent)[0];
  const banner = friend ? friendBanner(friend) : null;

  return (
    <div className="pj">
      {banner && (
        <p className="pj-friend">
          <strong>{banner.title}</strong>
          <span>{banner.sub}</span>
        </p>
      )}

      <div className="pj-book" id="book">
        <div className="pj-run" aria-hidden="true">
          <span>{entries[0].word}</span>
          <b>প্রজন্মের অভিধান</b>
          <span>{entries[PER_SET - 1].word}</span>
        </div>
        <Ledger set={setId} hits={hits} now={pos} label={`${setById(setId).label}: ${bn(answers.length)}টার উত্তর দেওয়া, ${bn(mine.total)}টা ঠিক`} />

        {pos < PER_SET ? (
          <article className="pj-entry" data-kind={entry.kind} key={entry.id}>
            <p className="pj-label"><span>{kindLabel(entry.kind)}</span><span>শব্দ {bn(pos + 1)}/১০</span></p>
            <h2 className="pj-word" id="pj-q">{entry.word}</h2>
            <p className="pj-ask" id="pj-ask">মানে কী? তিনটার একটা ঠিক।</p>
            <div className="pj-senses" role="group" aria-labelledby="pj-q pj-ask">
              {entry.options.map((option, index) => (
                <button type="button" key={`${entry.id}-${index}`} className="pj-sense" aria-pressed={revealed && picked === index} disabled={revealed}
                  data-state={revealed ? index === entry.answer ? "right" : index === picked ? "wrong" : "dim" : undefined} onClick={() => pick(index as Answer)}>
                  <i aria-hidden="true">{bn(index + 1)}</i>{option}
                </button>
              ))}
            </div>
            <div className="pj-reveal" role="status" aria-live="polite">
              {revealed && <>
                <p className="pj-verdict" data-right={right}>{right ? `ঠিক! ${entry.kind === "genz" ? "জেন-জির" : "আব্বু-আম্মুর"} ঘরে এক নম্বর।` : picked === entry.trap ? entry.oops : "উঁহু, হলো না।"}</p>
                <p className="pj-meaning"><b>অর্থ</b> {entry.meaning}</p>
                <p className="pj-example"><b>বাক্যে</b> {entry.example}</p>
                <p className="pj-bridge" data-kind={entry.kind}><b>{entry.kind === "genz" ? "আব্বু-আম্মুর ভাষায়" : "জেন-জির ভাষায়"}</b> {entry.bridge}</p>
                {entry.source
                  ? <a className="pj-source" href={entry.source.url} target="_blank" rel="noopener noreferrer">{entry.source.label} ↗</a>
                  : <p className="pj-source">{entry.kind === "genz" ? "সূত্র: সাধারণ ব্যবহারে, ইন্টারনেটের কথ্য শব্দ" : "সূত্র: ঘরোয়া কথা, অভিধানের ভুক্তি না"}</p>}
                <button type="button" ref={nextButton} className="kit-primary pj-next" onClick={next}>{pos === PER_SET - 1 ? "ফল দেখো" : "পরের শব্দ"}</button>
              </>}
            </div>
          </article>
        ) : (
          <div className="pj-end">
            <p className="pj-sub">{setById(setId).label} · দশে {bn(mine.total)} ঠিক</p>
            <h2 className="pj-split"><mark>{bn(mine.genzPct)}% জেন-জি</mark> <span>{bn(mine.elderPct)}% আব্বু-আম্মু</span></h2>
            <div className="pj-bar" aria-hidden="true"><i style={{ width: `${mine.genzPct}%` }} /></div>
            <p className="pj-verdict-big">{verdict(mine)}</p>
            <p className="pj-meaning">{humanLine(setId, answers)}</p>
            <details className="pj-how"><summary>হিসাবটা কীভাবে হলো?</summary><p>{formula(mine)}</p></details>
            <a className="kit-primary pj-next" href="#result">কার্ড দেখো</a>
          </div>
        )}
      </div>

      <fieldset className="kit-chips pj-sets">
        <legend>আরও ১০টা চাও? অভিধানের আরেক পাতা খোলো</legend>
        {sets.map(item => {
          const given = answersBy[item.id] ?? [];
          return <button type="button" key={item.id} aria-pressed={item.id === setId} onClick={() => chooseSet(item.id)}>{item.label}{given.length === PER_SET ? ` · ${bn(split(item.id, given).genzPct)}% জেন-জি` : given.length ? ` · ${bn(given.length)}/১০ চলছে` : ""}</button>;
        })}
      </fieldset>

      <StickyNext show={done && !resultVisible} title={<><strong>{bn(mine.genzPct)}% জেন-জি</strong> · {verdict(mine)}</>} sub={humanLine(setId, answers)} href="#result" label="কার্ড দেখো" />

      <section className="pj-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="pj-result-head">
          <h2 id="result-title">{done ? <>তুমি <em>{bn(mine.genzPct)}% জেন-জি</em>, {bn(mine.elderPct)}% আব্বু-আম্মু</> : "অভিধান এখনো খোলা"}</h2>
          <p>{done ? humanLine(setId, answers) : `ওপরের আরও ${bn(PER_SET - answers.length)}টা শব্দের মানে বললেই কার্ড পুরো হবে, তারপর শেয়ার করতে পারবে।`}</p>
        </div>

        {done && rival && (
          <div className="pj-vs">
            <div><span>তুমি · {splitText(mine)}</span><Ledger set={setId} hits={hits} label={`তোমার ফল: ${splitText(mine)}`} /></div>
            <div><span>{rival.name || "তোমার বন্ধু"} · {splitText(split(rival.set, rival.answers))}</span><Ledger set={rival.set} hits={marks(rival.set, rival.answers)} label={`${rival.name ? possessive(rival.name) : "বন্ধুর"} ফল`} /></div>
            <p>{versusLine(own, rival)}</p>
          </div>
        )}

        <div className="pj-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="pj-sr">প্রজন্মের অভিধান, {setById(setId).label}: {done ? `${splitText(mine)}, ${verdict(mine)}` : `${bn(answers.length)}টা শব্দ দেখা হয়েছে`}।</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>

          <div className="pj-controls">
            <label className="pj-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            {done && <div className="pj-send">
              <h3>এবার {sendTo(mine)}</h3>
              <p>লিংক খুললে ওরা একই ১০টা শব্দ পাবে। তোমার উত্তর দেখবে শুধু নিজে শেষ করলে।</p>
            </div>}
            <ShareBar tool={TOOL} fileName={`projonmo-${setId}.png`} makeImage={() => cardBlob({ ...own, friend }, format, site)} imageKey={`${state}|${format}|${friend ? shareHash(friend) : ""}`} caption={caption(own, friend)} state={state} disabled={!done}
              hint={done ? "" : "১০টা শেষ হলেই শেয়ার করা যাবে।"} />
            {done && <div className="pj-again">
              <button type="button" className="kit-secondary" onClick={() => chooseSet(otherSet.id)}>{otherSet.label} খোলো</button>
              <button type="button" className="kit-link" onClick={restart}>এই পাতা আবার খেলো</button>
            </div>}
          </div>
        </div>

        {done && (
          <div className="pj-everyone">
            <h3>কোন শব্দটা সবচেয়ে কঠিন?</h3>
            {compared !== "done" || !everyone ? <>
              <p>সবার সাথে মিলিয়ে দেখো। নাম যাবে না, শুধু কোন শব্দগুলো পেরেছ সেটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "মেলানো হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : seen < COMPARE_MIN ? <p className="kit-status">এই পাতা এখনো {bn(seen)} জন খেলেছে, হিসাবটা এখনই ঠিক বলা যাবে না। আব্বু-আম্মু আর বন্ধুদের লিংক পাঠাও!</p> : <>
              {hardest && <p className="pj-rare">{hardest.percent < 50 ? "মাত্র " : ""}<strong>{bn(hardest.percent)}%</strong> পেরেছে <strong>{hardest.item.word}</strong>{hardest.hit ? ", তুমি তাদের একজন!" : "।"}</p>}
              <ul className="pj-bars">{known.map(row => <li key={row.item.id} data-kind={row.item.kind} data-hit={Boolean(row.hit)}><span>{row.item.word}</span><i style={{ width: `${row.percent}%` }} /><b>{bn(row.percent)}%</b></li>)}</ul>
              <p className="kit-status">{bn(seen)} জনের সাথে মেলানো।</p>
            </>}
          </div>
        )}
      </section>
    </div>
  );
}
