"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { hiss, sfx } from "../../../shared/game-sound";
import { SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawSheet, type SheetCard } from "../lib/draw-sheet";
import { bn, bnPoint, caption, gpaOf, gradeLabel, GRADES, humanLine, ke, mergeVotes, nationalOf, nationalScore, packOf, packs, parseCounted, parseShareHash, possessive, sameCount, shareHash, ITEMS_PER_PACK, MAX_NAME_LENGTH, MIN_SAMPLE, type Counted, type Grade, type PackId, type Sheet } from "../lib/grades";

const TOOL = "grade-dao";
const COUNTED_KEY = "grade-dao-counted";

type AllGrades = Record<PackId, (Grade | null)[]>;
const blank = () => Array<Grade | null>(ITEMS_PER_PACK).fill(null);
const emptyGrades = () => Object.fromEntries(packs.map(pack => [pack.id, blank()])) as AllGrades;

function Ring() {
  return <svg className="gd-ring" viewBox="0 0 60 44" aria-hidden="true"><path pathLength="100" d="M44 6C30 0 8 4 4 20s14 22 28 20 26-10 24-24C54 6 40 3 28 5" /></svg>;
}

export function MarkSheet() {
  const [packId, setPackId] = useState<PackId>("street");
  const [grades, setGrades] = useState<AllGrades>(emptyGrades);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [tally, setTally] = useState<Tally | null>(null);
  const [tallyFailed, setTallyFailed] = useState(false);
  const [counted, setCounted] = useState<Counted>({});
  const [countState, setCountState] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [friend, setFriend] = useState<Sheet | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  const resultVisible = useInView(result);
  const footVisible = useInView(foot, 0.6);

  const pack = packOf(packId)!;
  const current = grades[packId];
  const graded = current.filter(Boolean).length;
  const complete = graded === ITEMS_PER_PACK;
  const rival = friend && friend.pack === packId ? friend : null;
  const national = useMemo(() => pack.items.map((item, index) => nationalOf(tally, packId, item.id, counted[packId]?.[index])), [pack, packId, tally, counted]);
  const score = useMemo(() => nationalScore(current, national), [current, national]);
  const line = humanLine(pack, current, national);
  const gpa = gpaOf(current);
  const match = rival ? sameCount(current, rival.grades) : 0;
  const card: SheetCard = useMemo(() => ({ pack, grades: current, name, national: national.map(average => average?.grade ?? null), score, line, friend: rival && { name: rival.name, grades: rival.grades } }), [pack, current, name, national, score, line, rival]);
  const sheet: Sheet | null = complete ? { pack: packId, grades: current as Grade[], name, score } : null;
  const state = sheet ? shareHash(sheet).slice(1) : "";
  const anyNational = national.some(Boolean);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared sheet opens the friend's pack.
    const readFriend = () => {
      const link = parseShareHash(window.location.hash);
      if (!link) return;
      setFriend(link);
      setPackId(link.pack);
      setGrades(emptyGrades());
    };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    try { setCounted(parseCounted(localStorage.getItem(COUNTED_KEY))); } catch { /* storage blocked: nothing remembered */ }
    readTally(TOOL).then(next => { if (next) setTally(next); setTallyFailed(!next); });
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("রেজাল্ট শিট A+").then(() => {
      if (cancelled || !preview.current) return;
      drawSheet(preview.current, card, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site]);

  function give(index: number, grade: Grade) {
    // The red pen scratches the circle; the eighth mark gets a small chime. No right grade, so no confetti.
    hiss(0.1, 0.12, 3800, "highpass");
    if (graded === ITEMS_PER_PACK - 1 && !current[index]) setTimeout(sfx.good, 120);
    setGrades(all => ({ ...all, [packId]: all[packId].map((value, position) => position === index ? grade : value) }));
    setCountState(now => now === "done" ? "idle" : now);
  }

  function choosePack(id: PackId) {
    setPackId(id);
    setCountState("idle");
  }

  async function count() {
    if (!sheet) return;
    setCountState("sending");
    const merged = mergeVotes(counted, packId, sheet.grades);
    const next = await addToTally(TOOL, merged.items);
    if (!next) { setCountState("failed"); return; }
    setTally(next);
    setCounted(merged.counted);
    setCountState("done");
    try { localStorage.setItem(COUNTED_KEY, JSON.stringify(merged.counted)); } catch { /* private mode: the vote counts, only the resend memory is lost */ }
  }

  const friendName = friend?.name || "";
  const friendWho = friendName ? possessive(friendName) : "তোমার বন্ধুর";

  return (
    <div className="gd">
      {friend && (
        <section className="gd-friend" aria-labelledby="friend-title">
          <p className="gd-friend-kicker">একটা রেজাল্ট শিট এসেছে · {packOf(friend.pack)!.label}</p>
          <h2 id="friend-title">{friendName || "তোমার বন্ধু"} ৮টা খাতায় গ্রেড দিয়েছে। <span>এবার তুমি পরীক্ষক: গ্রেড দাও, দেখো দুজনের কয়টা মেলে।</span></h2>
          {friend.score && <p className="gd-friend-note">{friendWho} গ্রেড দেশের সাথে মিলেছিল {bn(friend.score.match)}/{bn(friend.score.of)}।</p>}
        </section>
      )}

      <fieldset className="gd-packs">
        <legend className="gd-sr">কোন বিষয়ের পরীক্ষা?</legend>
        {packs.map(item => (
          <button type="button" key={item.id} aria-pressed={packId === item.id} onClick={() => choosePack(item.id)}>
            {item.label}{grades[item.id].every(Boolean) && <span className="gd-pack-done" aria-label="শেষ"> ✓</span>}
          </button>
        ))}
      </fieldset>

      <div className="gd-sheet">
        <div className="gd-paper">
          <header className="gd-head">
            <SoundToggle compact />
            <p className="gd-head-kicker">দেশি পরীক্ষা · বিষয়: {pack.label}</p>
            <h2 className="gd-head-title">রেজাল্ট শিট</h2>
            <p className="gd-head-meta" aria-live="polite">পরীক্ষক: <b>তুমি</b> · <span>{bn(graded)}/{bn(ITEMS_PER_PACK)}টা খাতা দেখা হয়েছে</span></p>
          </header>

          <div className="gd-table-head" aria-hidden="true"><span>বিষয়</span><span>লাল কলমে গ্রেড দাও</span></div>
          <ol className="gd-rows">
            {pack.items.map((item, index) => {
              const mine = current[index];
              const average = national[index];
              const theirs = rival?.grades[index];
              return (
                <li className="gd-row" key={`${packId}-${item.id}`} data-graded={Boolean(mine)}>
                  <div className="gd-item">
                    <span className="gd-serial" aria-hidden="true">{bn(index + 1)}</span>
                    <span className="gd-name">{item.name}</span>
                    {mine && (
                      <span className="gd-sub">
                        <span className="gd-nation">দেশ: {average ? gradeLabel[average.grade] : "—"}</span>
                        {theirs && <span className="gd-rival" data-same={theirs === mine}>{friendName || "বন্ধু"}: {gradeLabel[theirs]}{theirs === mine ? " ✓" : ""}</span>}
                      </span>
                    )}
                  </div>
                  <div className="gd-grades" role="group" aria-label={`${ke(item.name)} কত দেবে?`}>
                    {GRADES.map(grade => (
                      <button type="button" key={grade} className="gd-grade" data-grade={grade} aria-pressed={mine === grade} onClick={() => give(index, grade)}>
                        <span>{gradeLabel[grade]}</span><Ring />
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="gd-foot" ref={foot}>
            {complete ? (
              <div className="gd-result">
                <div className="gd-gpa"><small>জিপিএ</small><b>{gpa === null ? "—" : bnPoint(gpa)}</b><small>৫-এর মধ্যে</small></div>
                <div className="gd-verdict">
                  {rival && <p className="gd-stamp" data-kind="friend">দুজনের মিল {bn(match)}/{bn(ITEMS_PER_PACK)}</p>}
                  {score && <p className="gd-stamp">দেশের সাথে মিল {bn(score.match)}/{bn(score.of)}</p>}
                  <p className="gd-remark"><span>মন্তব্য:</span> {line}</p>
                  <a className="kit-primary" href="#result">কার্ডটা দেখো</a>
                </div>
              </div>
            ) : (
              <p className="gd-remark"><span>মন্তব্য:</span> {line}</p>
            )}
            <p className="gd-legend">
              {tallyFailed ? "দেশের গড় এখন আনা গেল না।" : anyNational ? `দেশের গড়: একটুখানিতে যারা গ্রেড দিয়েছে, তাদের হিসাব, জরিপ না।${national.every(Boolean) ? "" : " “—” মানে ওটায় এখনো যথেষ্ট ভোট নেই।"}` : `দেশের গড়: এখনো যথেষ্ট ভোট নেই। যারা গ্রেড দিয়েছে, এমন অন্তত ${bn(MIN_SAMPLE)} জন হলে দেখাব।`}
              {" "}গ্রেড পয়েন্ট স্কুলের মতো: A+ ৫, A ৪, B ৩, C ২, F ০।
            </p>
          </div>
        </div>
      </div>

      <StickyNext show={complete && !resultVisible && !footVisible} title={rival ? <><strong>{bn(match)}/{bn(ITEMS_PER_PACK)}</strong> দুজনের মিল</> : score ? <><strong>{bn(score.match)}/{bn(score.of)}</strong> দেশের সাথে মিল</> : <>জিপিএ <strong>{gpa === null ? "" : bnPoint(gpa)}</strong></>} sub={line} href="#result" label="কার্ডটা দেখো" />

      <section className="gd-result-card" id="result" ref={result} aria-labelledby="result-title">
        <div className="gd-result-head">
          <h2 id="result-title">{complete ? <>তোমার <em>রেজাল্ট শিট</em></> : "রেজাল্ট শিট তৈরি হচ্ছে…"}</h2>
          <p>{complete ? "লাল কলমের দাগসহ পুরো শিটটা ছবি হয়ে গেছে। নাম দিলে ওপরে বসবে।" : `আর ${bn(ITEMS_PER_PACK - graded)}টা খাতা বাকি। সবগুলোতে গ্রেড দিলেই শেয়ার করতে পারবে।`}</p>
        </div>
        <div className="gd-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="gd-sr">{line} {pack.items.map((item, index) => current[index] ? `${item.name} ${gradeLabel[current[index]!]}` : "").filter(Boolean).join(", ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">শিটের ছবিটা দেখানো যাচ্ছে না। পাতাটা রিলোড করে দেখো।</p>}
          </figure>
          <div className="gd-controls">
            <label className="gd-field">
              <span>পরীক্ষকের নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="grade-dao.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${rival ? rival.grades.join("") : ""}|${card.national.join("")}`} caption={sheet ? caption(sheet, rival) : ""} state={state || undefined} disabled={!complete} hint={complete ? "লিংকে একই ৮টা খাতা যায়। বন্ধু গ্রেড দিলে দেখবে কয়টা মিলল।" : "আগে ৮টা খাতায় গ্রেড দাও।"} />
            {complete && (
              <div className="gd-count">
                <h3>দেশের গড়ে তোমার গ্রেডও যোগ করবে?</h3>
                {countState === "done" ? <p>গোনা হয়ে গেছে, ধন্যবাদ! গ্রেড বদলালে আবার গুনতে পারো, আগেরটা বাদ যাবে।</p> : <>
                  <p>শুধু কোন জিনিসে কোন গ্রেড দিয়েছ, সেটা গোনা হয়। নাম যায় না।</p>
                  <button type="button" className="kit-secondary" onClick={count} disabled={countState === "sending"}>{countState === "sending" ? "গোনা হচ্ছে…" : "আমার গ্রেডগুলোও গোনো"}</button>
                  {countState === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
                </>}
              </div>
            )}
            {graded > 0 && <button type="button" className="kit-link" onClick={() => setGrades(all => ({ ...all, [packId]: blank() }))}>এই শিটটা মুছে আবার দাও</button>}
          </div>
        </div>
      </section>
    </div>
  );
}
