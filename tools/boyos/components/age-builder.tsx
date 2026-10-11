"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, PhotoPicker, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { age, ageLimit, ageText, banglaDate, banglaText, bn, bnPlain, compareLine, createCard, dateline, daysBetween, englishText, isDate, months, parseLimit, parseShareHash, ruleNote, seasonOf, seasons, shareHash, todayInDhaka, toDate, validBirth, weekday, weekdays, MAX_NAME_LENGTH, type Age, type Shared } from "../lib/boyos";
import { cardBlob, drawCard, drawRituCard, rituBlob } from "../lib/draw-card";

const TOOL = "boyos";
// Percentages from a handful of people are noise ("১০০% মানুষ বর্ষায়" after one vote).
const COMPARE_MIN = 20;

type Pick = { d: string; m: string; y: string };
const empty: Pick = { d: "", m: "", y: "" };
const pickDate = ({ d, m, y }: Pick) => d && m && y ? toDate(Number(y), Number(m), Number(d)) : "";

function dateProblem(date: string, today: string) {
  if (!date || !today) return "";
  const [y, m, d] = date.split("-").map(Number);
  if (!isDate(date)) return `${months[m - 1]} ${bnPlain(y)}-এ ${bnPlain(d)} তারিখ নেই। দিনটা আরেকবার দেখো।`;
  if (date > today) return "এই তারিখটা এখনো আসেনি।";
  return "";
}

function DateSelect({ id, legend, value, onChange, fromYear, toYear }: { id: string; legend: string; value: Pick; onChange: (pick: Pick) => void; fromYear: number; toYear: number }) {
  const years = Array.from({ length: toYear - fromYear + 1 }, (_, index) => toYear - index);
  const set = (key: keyof Pick) => (event: React.ChangeEvent<HTMLSelectElement>) => onChange({ ...value, [key]: event.target.value });
  return (
    <fieldset className="by-date" id={id}>
      <legend>{legend}</legend>
      <label><span>দিন</span><select value={value.d} onChange={set("d")}><option value="">দিন</option>{Array.from({ length: 31 }, (_, index) => <option key={index} value={index + 1}>{bnPlain(index + 1)}</option>)}</select></label>
      <label><span>মাস</span><select value={value.m} onChange={set("m")}><option value="">মাস</option>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
      <label><span>সাল</span><select value={value.y} onChange={set("y")}><option value="">সাল</option>{years.map(year => <option key={year} value={year}>{bnPlain(year)}</option>)}</select></label>
    </fieldset>
  );
}

export function AgeBuilder() {
  const [today, setToday] = useState("");
  const [pick, setPick] = useState<Pick>(empty);
  const [on, setOn] = useState<Pick>(empty);
  const [limitText, setLimitText] = useState("");
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const rituPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const birth = pickDate(pick);
  const problem = dateProblem(birth, today);
  const valid = Boolean(today && birth && !problem && validBirth(birth, today));
  const own = useMemo(() => ({ birth, name }), [birth, name]);
  const card = useMemo(() => valid ? createCard(own, today, friend) : null, [valid, own, today, friend]);
  const state = valid ? shareHash(own).slice(1) : "";
  const rituState = valid ? shareHash({ ...own, view: "ritu" }).slice(1) : "";
  const todayBangla = today ? banglaDate(today) : null;

  useEffect(() => {
    const now = todayInDhaka();
    setToday(now);
    // In-page anchors (#result) also change the hash, so only a real shared date replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash, now); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    if (!today || (!card && !friend)) return;
    let cancelled = false;
    loadCardFonts("দৈনিক একটুখানি").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site, photo);
      if (card && rituPreview.current) drawRituCard(rituPreview.current, card, format, site);
      if (friend && friendPreview.current) (friend.view === "ritu" ? drawRituCard : drawCard)(friendPreview.current, createCard(friend, today), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, photo, friend, today]);

  function choose(next: Pick) {
    setPick(next);
    setCompared(current => current === "done" ? "idle" : current);
  }

  async function compareWithEveryone() {
    if (!card) return;
    setCompared("sending");
    const tally = await addToTally(TOOL, [card.season.id]);
    if (tally) { setEveryone(tally); setCompared("done"); }
    else setCompared("failed");
  }

  function restart() {
    setPick(empty);
    setCompared("idle");
    document.getElementById("birth")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const target = pickDate(on);
  const targetOk = valid && isDate(target);
  const limit = parseLimit(limitText);
  const check = targetOk && limit && target >= birth ? ageLimit(birth, target, limit) : null;
  const gapText = (gap: Age, days: number) => gap.years || gap.months ? `${ageText(gap)} (${bn(days)} দিন)` : ageText(gap);
  const friendDays = friend && today ? bn(daysBetween(friend.birth, today)) : "";
  const friendWho = friend?.name || "তোমার বন্ধু";
  const friendRitu = friend?.view === "ritu" && today ? createCard(friend, today).ritu.total : 0;
  const rituCaption = card ? `জন্ম থেকে আজ পর্যন্ত আমি ${bn(card.ritu.total)}টা ঋতু দেখেছি, তার মধ্যে ${bn(card.ritu.counts[card.ritu.first % 6])}টা ${card.season.label}! তুমি কয়টা দেখেছ, দেখো তো:` : "";
  const caption = card ? `${card.match ? card.match + "! " : ""}আমি আজ ${bn(card.alive)} দিনের! বাংলায় আমার জন্মতারিখ ${card.banglaText}, আমি ${card.season.people}। তুমি কত দিনের, দেখো তো:` : "";
  const topSeason = compared === "done" && everyone && everyone.total >= COMPARE_MIN ? [...seasons].sort((a, b) => (everyone.counts[b.id] ?? 0) - (everyone.counts[a.id] ?? 0))[0] : null;

  return (
    <div className="by">
      {friend && today && (
        <section className="by-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={friendRitu ? `${friendWho}-এর জীবনের ঋতুর গ্রিড` : `${friendWho}-এর জন্মদিনের প্রথম পাতা`} />
          <div>
            <p className="by-kicker">তোমার জন্য একটা পত্রিকা এসেছে</p>
            {friendRitu
              ? <h2 id="friend-title">{friendWho} এ পর্যন্ত {bn(friendRitu)}টা ঋতু দেখেছে।<br /><span>তুমি কয়টা?</span></h2>
              : <h2 id="friend-title">{friendWho} আজ {friendDays} দিনের।<br /><span>তুমি কত দিনের?</span></h2>}
            {valid ? <p className="by-match">{compareLine(friend, birth)}</p> : <a className="kit-primary" href="#birth">আমার তারিখ দিই</a>}
          </div>
        </section>
      )}

      <div className="np">
        <header className="np-mast">
          <p className="np-ears"><span>প্রথম পাতা</span><span>দাম: এক টুকরো কেক</span></p>
          <p className="np-title" aria-hidden="true">দৈনিক একটুখানি</p>
          <p className="np-dateline">{today ? dateline(today) : " "}</p>
        </header>

        <DateSelect id="birth" legend="তোমার জন্মতারিখ" value={pick} onChange={choose} fromYear={1900} toYear={Number((today || "2026").slice(0, 4))} />
        {problem && <p className="by-problem" role="alert">{problem}</p>}

        <div className="np-lead" aria-live="polite">
          {card ? <>
            <p className="np-kicker">আজ তোমার বয়স</p>
            <p className="np-age">{card.ageText}</p>
            <p className="np-sub">মোট <strong>{bn(card.alive)} দিন</strong> · {card.next.days ? <>পরের জন্মদিন আর <strong>{bn(card.next.days)} দিন</strong> পর</> : <strong>আজ তোমার জন্মদিন!</strong>}</p>
          </> : todayBangla && <>
            <p className="np-kicker">আজ বাংলা কত তারিখ?</p>
            <p className="np-age">{banglaText(todayBangla)}</p>
            <p className="np-sub">{seasonOf(todayBangla).label}কাল · {weekdays[weekday(today)]} · {englishText(today)}</p>
          </>}
        </div>
      </div>

      <StickyNext show={valid && !resultVisible} title={<><strong>{card ? bn(card.alive) : ""}</strong> দিনের</>} sub={card ? card.ageText : ""} href="#result" label="প্রথম পাতা দেখো" />

      {card && (
        <section className="by-result" id="result" ref={result} aria-labelledby="result-title">
          <h2 id="result-title">তোমার জন্মদিনের <em>প্রথম পাতা</em></h2>
          <p className="by-line">{card.line}</p>

          <dl className="by-facts">
            <div className="by-wide"><dt>বয়স</dt><dd>{card.ageText}</dd></div>
            <div><dt>মোট</dt><dd>{bn(card.alive)} দিন</dd></div>
            <div><dt>জন্মবার</dt><dd>{card.weekday}</dd></div>
            <div className="by-wide"><dt>বাংলা জন্মতারিখ</dt><dd>{card.banglaText}<small>{ruleNote[card.bangla.rule]}</small></dd></div>
            <div><dt>জন্মঋতু</dt><dd>{card.season.label}</dd></div>
            <div><dt>{bn(card.milestone.count)} দিন পূর্ণ হবে</dt><dd>{englishText(card.milestone.date)}<small>আর {bn(card.milestone.days)} দিন</small></dd></div>
            <div className="by-wide"><dt>পরের জন্মদিন</dt><dd>{card.next.days ? <>{englishText(card.next.date)}, {weekdays[weekday(card.next.date)]}<small>আর {bn(card.next.days)} দিন, {bn(card.next.turning)}-এ পা দেবে</small></> : <>আজই! শুভ জন্মদিন<small>{bn(card.next.turning)} বছর পূর্ণ হলো</small></>}</dd></div>
          </dl>
          {friend && <p className="by-match">{compareLine(friend, birth)}</p>}

          <div className="by-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
              <figcaption id="card-summary" className="by-sr">{card.headline}। {card.dateline}। {card.subhead}। {card.season.people}।</figcaption>
              {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="by-controls">
              <label className="by-field">
                <span>শিরোনামে নাম <small>না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <PhotoPicker value={photo} onChange={setPhoto} />
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="boyos.png" makeImage={() => cardBlob(card, format, site, photo)} imageKey={`${state}|${format}|${photo?.width ?? 0}|${today}`} caption={caption} state={state} hint="লিংক পেলে বন্ধু দেখবে তোমার প্রথম পাতা, আর নিজের তারিখ দিয়ে দেখবে কে কত বড়।" />
              <button type="button" className="kit-link by-restart" onClick={restart}>অন্য একটা তারিখ দেখি</button>
            </div>
          </div>

          <details className="by-on" id="chakri">
            <summary>অমুক তারিখে বয়স কত? <small>চাকরির বয়সসীমা মেলাও</small></summary>
            <DateSelect id="on-date" legend="কোন তারিখে?" value={on} onChange={setOn} fromYear={Number(birth.slice(0, 4))} toYear={Number(today.slice(0, 4)) + 5} />
            {target && !isDate(target) && <p className="by-problem" role="alert">{dateProblem(target, "9999-12-31")}</p>}
            <label className="by-field by-limit">
              <span>বয়সসীমা <small>বিজ্ঞপ্তিতে যত বছর লেখা</small></span>
              <span><input value={limitText} onChange={event => setLimitText(event.target.value)} inputMode="numeric" maxLength={3} placeholder="যেমন ৩০" autoComplete="off" /> বছর</span>
            </label>
            {limitText.trim() && !limit && <p className="by-problem" role="alert">বয়সসীমা শুধু পুরো বছরে লেখো, যেমন ৩০।</p>}
            {targetOk && <div className="by-on-result" aria-live="polite">
              <p>{target < birth ? "সেদিন তোমার জন্মই হয়নি!" : <>{englishText(target)} তারিখে তোমার বয়স {target < today ? "ছিল" : target === today ? "আজ" : "হবে"} <strong>{ageText(age(birth, target))}</strong></>}</p>
              {check && limit && <p className="by-verdict" data-status={check.status}>{
                check.status === "within" ? <><strong>হ্যাঁ, {bn(limit)} বছরের সীমার মধ্যে।</strong> সেদিন {bn(limit)} বছর পূর্ণ হতে বাকি {gapText(check.gap, check.days)}। সীমার শেষ দিন {englishText(check.lastDay)}।</>
                : check.status === "edge" ? <><strong>ঠিক সেদিনই তোমার {bn(limit)} বছর পূর্ণ।</strong> এখানকার হিসাবে সেদিন আর সীমার মধ্যে নেই, শেষ দিন {englishText(check.lastDay)}। তবে পূর্ণ হওয়ার দিনটা ধরা হবে কি না, বিজ্ঞপ্তির ভাষা দেখে মিলিয়ে নাও।</>
                : <><strong>না, সেদিন {bn(limit)} বছরের সীমা পার।</strong> {bn(limit)} বছর পূর্ণ {englishText(check.turns)}, সেদিনের {gapText(check.gap, check.days)} আগে। বিজ্ঞপ্তিতে বয়সে কোনো ছাড় থাকলে সেই সীমা লিখে আবার দেখো।</>
              }</p>}
            </div>}
            <p className="by-note">হিসাবের নিয়ম: {limit ? bn(limit) : "৩০"} বছরের সীমা মানে {limit ? bn(limit) : "৩০"} বছর পূর্ণ হওয়ার আগের দিন পর্যন্ত। কোন তারিখে বয়স গোনা হবে, সীমা কত, ছাড় আছে কি না, সব বিজ্ঞপ্তিতে লেখা থাকে। বিজ্ঞপ্তির নিয়মই চূড়ান্ত।</p>
          </details>

          <details className="by-on by-ritu" open={friend?.view === "ritu" || undefined}>
            <summary>জীবনের ঋতু <small>জন্ম থেকে আজ {bn(card.ritu.total)}টা ঋতু, গ্রিডে দেখো</small></summary>
            <p className="by-ritu-line">{card.rituLine}</p>
            <figure className="kit-card" data-format={format}>
              <canvas ref={rituPreview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ritu-summary" />
              <figcaption id="ritu-summary" className="by-sr">{card.rituKicker}: {card.rituHeadline}। {seasons.map((season, index) => `${season.label} ${bn(card.ritu.counts[index])}টা`).join(", ")}। এখন চলছে {seasons[card.ritu.now % 6].label}।</figcaption>
            </figure>
            <p className="by-note">প্রতি সারি এক বাংলা বছর, বৈশাখ থেকে চৈত্র। প্রতি ঘর এক ঋতু, মানে দুই বাংলা মাস। জন্মের ঋতু আর আজকের ঋতু দুটোই গোনা। ফাঁকা ঘরগুলো এ বছরের বাকি ঋতু, সামনেই আসছে।</p>
            <div className="by-controls">
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="boyos-ritu.png" makeImage={() => rituBlob(card, format, site)} imageKey={`${rituState}|${format}|${today}`} caption={rituCaption} state={rituState} hint="লিংক পেলে বন্ধু দেখবে তোমার ঋতুর গ্রিড, আর নিজের তারিখ দিয়ে বানাবে নিজেরটা।" />
            </div>
          </details>

          <div className="by-everyone">
            <h3>কোন ঋতুতে সবচেয়ে বেশি মানুষের জন্ম?</h3>
            {compared !== "done" || !everyone ? <>
              <p>তোমার জন্মঋতু ({card.season.label}) সবার হিসাবে যোগ করো। জন্মতারিখ বা নাম যাবে না, শুধু ঋতুটা গোনা হবে।</p>
              <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "যোগ হচ্ছে…" : "সবার সাথে মেলাও"}</button>
              {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
            </> : !topSeason ? (
              <p className="kit-status">যোগ হয়েছে! এখনো খুব কম মানুষ মিলিয়েছে, তাই হিসাবটা এখনই ঠিক বলা যাবে না। বন্ধুদের লিংক পাঠাও।</p>
            ) : <>
              <p>এখন পর্যন্ত সবচেয়ে বেশি মানুষ <strong>{topSeason.in}</strong> জন্মেছে ({bn(everyone.total)} জনের হিসাব)।</p>
              <ul className="by-bars">{seasons.map(season => { const percent = Math.round(((everyone.counts[season.id] ?? 0) / everyone.total) * 100); return <li key={season.id} data-mine={season.id === card.season.id}><span>{season.label}</span><i style={{ width: `${percent}%` }} /><b>{bn(percent)}%</b></li>; })}</ul>
            </>}
          </div>
        </section>
      )}
    </div>
  );
}
