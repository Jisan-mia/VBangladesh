"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { chitBlob, drawChit } from "../lib/draw-chit";
import { bnGpa, defaultResult, exams, fourthHint, grades, groups, humanLine, parseResult, possessive, resultHash, score, subjectsFor, switchTrack, thanks, MAX_NAME_LENGTH, type GradeId, type Result } from "../lib/gpa";

const TOOL = "gpa";

function GradeRow({ id, name, hint, value, onPick }: { id: string; name: string; hint?: string; value: GradeId; onPick: (grade: GradeId) => void }) {
  return (
    <fieldset className="gpa-row" data-grade={value}>
      <legend id={id}><span>{name}</span>{hint && <small>{hint}</small>}</legend>
      <div className="gpa-grades">
        {grades.map(grade => <button type="button" key={grade.id} aria-pressed={value === grade.id} aria-label={`${name}: ${grade.label}`} onClick={() => onPick(grade.id)}>{grade.label}</button>)}
      </div>
    </fieldset>
  );
}

export function GpaBoard() {
  const [result, setResult] = useState<Result>(() => defaultResult());
  const [friend, setFriend] = useState<Result | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const resultVisible = useInView(resultBox);
  const value = useMemo(() => score(result), [result]);
  const subjects = subjectsFor(result.exam, result.group);
  const state = resultHash(result);

  useEffect(() => {
    const year = new Date().getFullYear();
    setResult(current => ({ ...current, year }));
    // In-page anchors (#card) also change the hash, so only a real shared result replaces the friend.
    const readFriend = () => { const shared = parseResult(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("জিপিএ ৪.৮৩").then(() => {
      if (cancelled) return;
      if (preview.current) drawChit(preview.current, result, format, site);
      if (friend && friendPreview.current) drawChit(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [result, format, site, friend]);

  const pick = (index: number, grade: GradeId) => setResult(current => ({ ...current, grades: current.grades.map((old, at) => at === index ? grade : old) }));
  const friendScore = friend ? score(friend) : null;
  const caption = value.failed
    ? "এবার হয়নি। আবার হবে। পরের বার দেখিয়ে দেব।"
    : `রেজাল্ট এসেছে! ${result.exam === "hsc" ? "এইচএসসিতে" : "এসএসসিতে"} আমার জিপিএ ${bnGpa(value.gpa)}। পাশে থাকার জন্য সবাইকে ধন্যবাদ।`;

  return (
    <div className="gpa">
      {friend && friendScore && (
        <section className="gpa-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name ? possessive(friend.name) : "বন্ধুর"} রেজাল্টের চিরকুট`} />
          <div>
            <p className="gpa-kicker">তোমার জন্য একটা চিরকুট এসেছে</p>
            <h2 id="friend-title">{friendScore.failed ? <>{friend.name || "বন্ধু"} বলছে: পরের বার দেখিয়ে দেব।</> : <>{friend.name ? possessive(friend.name) : "বন্ধুর"} জিপিএ {bnGpa(friendScore.gpa)}।</>}<br /><span>এবার তোমারটা হিসাব করো</span></h2>
            <a className="kit-primary" href="#board">আমারটা হিসাব করি</a>
          </div>
        </section>
      )}

      <div className="gpa-board" id="board">
        <div className="gpa-pick">
          <div className="kit-chips gpa-chips" role="group" aria-label="পরীক্ষা">
            {exams.map(exam => <button type="button" key={exam.id} aria-pressed={result.exam === exam.id} onClick={() => setResult(current => switchTrack(current, exam.id, current.group))}>{exam.label}</button>)}
          </div>
          <div className="kit-chips gpa-chips" role="group" aria-label="বিভাগ">
            {groups.map(group => <button type="button" key={group.id} aria-pressed={result.group === group.id} onClick={() => setResult(current => switchTrack(current, current.exam, group.id))}>{group.label}</button>)}
          </div>
        </div>

        <div className="gpa-live" aria-live="polite" data-failed={value.failed}>
          <span className="gpa-pin" aria-hidden="true" />
          {value.failed ? <>
            <p className="gpa-live-label">এবার হয়নি</p>
            <p className="gpa-live-fail">আবার হবে।</p>
            <p className="gpa-live-note">আবশ্যিক কোনো বিষয়ে F থাকলে জিপিএ আসে না। একটা বিষয়ে আটকেছ, জীবনে না।</p>
          </> : <>
            <p className="gpa-live-label">তোমার জিপিএ</p>
            <p className="gpa-live-number">{bnGpa(value.gpa)}</p>
            <p className="gpa-live-note">{value.without >= 5 ? "৪র্থ বিষয় ছাড়াই ৫.০০!" : <>৪র্থ বিষয় ছাড়া {bnGpa(value.without)}{value.bonus > 0 && <> · ৪র্থ বিষয় থেকে +{bnGpa(value.bonus)}</>}</>}</p>
          </>}
        </div>

        <div className="gpa-sheet">
          <p className="gpa-sheet-head">প্রতিটা বিষয়ের গ্রেড বেছে নাও</p>
          {subjects.map((subject, index) => <GradeRow key={`${result.exam}-${result.group}-${index}`} id={`subject-${index}`} name={subject.name} hint={subject.hint} value={result.grades[index]} onPick={grade => pick(index, grade)} />)}
          <GradeRow id="subject-fourth" name="৪র্থ বিষয়" hint={`${fourthHint(result.exam, result.group)} · ২-এর ওপরের পয়েন্টটুকু যোগ হয়`} value={result.fourth} onPick={grade => setResult(current => ({ ...current, fourth: grade }))} />
        </div>
      </div>

      <StickyNext show={!resultVisible} title={value.failed ? <>এবার হয়নি</> : <>জিপিএ <strong>{bnGpa(value.gpa)}</strong></>} sub={humanLine(value)} href="#card" label="চিরকুটটা দেখো" />

      <section className="gpa-result" id="card" ref={resultBox} aria-labelledby="card-title">
        <div className="gpa-result-head">
          <h2 id="card-title">{value.failed ? "এবার হয়নি। আবার হবে।" : <>নোটিশ বোর্ডে তোমার চিরকুট: <em>{bnGpa(value.gpa)}</em></>}</h2>
          <p>{value.failed ? "চাইলে এই চিরকুটটা রেখে দাও। পরের বার যখন দেখিয়ে দেবে, তখন নতুনটা বানাবে।" : humanLine(value)}</p>
        </div>
        <div className="gpa-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="gpa-sr">{result.name || "আমার রেজাল্ট"}। {value.failed ? "পরের বার দেখিয়ে দেব।" : `জিপিএ ${bnGpa(value.gpa)}।`} {humanLine(value)}</figcaption>
            {previewError && <p className="kit-status" role="alert">চিরকুটের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="gpa-controls">
            <label className="gpa-field">
              <span>নাম <small>না দিলেও চলবে</small></span>
              <input value={result.name} maxLength={MAX_NAME_LENGTH} onChange={event => setResult(current => ({ ...current, name: event.target.value }))} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <fieldset className="kit-chips">
              <legend>চিরকুটে একটা লাইন <small>চাইলে</small></legend>
              {thanks.map(item => <button type="button" key={item.id} aria-pressed={result.thanks === item.id} onClick={() => setResult(current => ({ ...current, thanks: current.thanks === item.id ? "" : item.id }))}>{item.label}</button>)}
            </fieldset>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="jipie-chirkut.png" makeImage={() => chitBlob(result, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint="বন্ধুকে লিংক পাঠালে সে তোমার চিরকুট দেখে নিজেরটা হিসাব করতে পারবে।" />
          </div>
        </div>
      </section>

      <aside className="gpa-source" aria-label="হিসাবের নিয়ম আর সূত্র">
        <h2>হিসাবটা যেভাবে হয়</h2>
        <p>A+ ৫, A ৪, A- ৩.৫, B ৩, C ২, D ১, F ০। আবশ্যিক বিষয়গুলোর পয়েন্ট যোগ হয়, ৪র্থ বিষয়ের শুধু ২-এর ওপরের অংশটুকু যোগ হয়, তারপর ভাগ হয় আবশ্যিক বিষয়ের সংখ্যা দিয়ে (এসএসসিতে ৯, এইচএসসিতে ৬)। সর্বোচ্চ জিপিএ ৫.০০। আবশ্যিক কোনো বিষয়ে F থাকলে জিপিএ আসে না। ৪র্থ বিষয়ে F হলে আসে।</p>
        <p className="gpa-source-line"><strong>সূত্র:</strong> <a href="http://www.educationboard.gov.bd/dhaka/rules_business.php" rel="noopener" target="_blank">শিক্ষা বোর্ডের গ্রেডিং নিয়ম</a>, আর ঢাকা বোর্ডের প্রকাশিত <a href="https://dhakaeducationboard.gov.bd/data/20251116123034975415.pdf" rel="noopener" target="_blank">এইচএসসি ২০২৫</a> ও <a href="https://dhakaeducationboard.gov.bd/site/Sresc_result_final_ssc_2026.pdf" rel="noopener" target="_blank">এসএসসি ২০২৬</a>-এর ফল মিলিয়ে যাচাই করা (অক্টোবর ২০২৬)। এটা শুধু হিসাব, অফিসিয়াল রেজাল্ট না। আসল রেজাল্ট দেখো <a href="http://www.educationboardresults.gov.bd" rel="noopener" target="_blank">educationboardresults.gov.bd</a>-তে।</p>
      </aside>
    </div>
  );
}
