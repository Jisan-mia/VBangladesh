"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { addMonthsNotEarly, bn, bnPlain, caption, createCard, dateText, daysBetween, friendTitle, groups, isDate, months, parseShareHash, shareHash, todayInDhaka, toDate, validLast, DEFAULT_INTERVAL, INTERVALS, MAX_COUNT, MAX_NAME_LENGTH, type Donor, type GroupId, type Interval } from "../lib/rokto";

const TOOL = "rokto";

type Pick = { d: string; m: string; y: string };
const pickOf = (date: string): Pick => { const [y, m, d] = date.split("-").map(Number); return { d: String(d), m: String(m), y: String(y) }; };
const dateOf = ({ d, m, y }: Pick) => d && m && y ? toDate(Number(y), Number(m), Number(d)) : "";

function Drop({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 20 28" aria-hidden="true"><path d="M10 1C11 6 18 12 18 18a8 8 0 0 1-16 0C2 12 9 6 10 1Z" /></svg>;
}

export function RoktoBuilder() {
  const [today, setToday] = useState("");
  const [pick, setPick] = useState<Pick>({ d: "", m: "", y: "" });
  const [group, setGroup] = useState<GroupId | "">("");
  const [countText, setCountText] = useState("1");
  const [interval, setIntervalMonths] = useState<Interval>(DEFAULT_INTERVAL);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [friend, setFriend] = useState<Donor | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const last = dateOf(pick);
  const count = Math.min(MAX_COUNT, Math.max(1, Number.parseInt(countText, 10) || 1));
  const problem = !today || !last ? "" : !isDate(last) ? `${months[Number(pick.m) - 1]} ${bnPlain(Number(pick.y))}-এ ${bnPlain(Number(pick.d))} তারিখ নেই। দিনটা আরেকবার দেখো।` : last > today ? "এই তারিখটা এখনো আসেনি। শেষ যেদিন দিয়েছ, সেই দিনটা দাও।" : "";
  const dated = Boolean(today && last && !problem && validLast(last, today));
  // The countdown needs only the date; the card also needs the blood group, which is never guessed for the person.
  const next = dated ? addMonthsNotEarly(last, interval) : "";
  const own = useMemo<Donor | null>(() => dated && group ? { group, last, count, interval, name } : null, [dated, group, last, count, interval, name]);
  const card = useMemo(() => own ? createCard(own, today) : null, [own, today]);
  const state = own ? shareHash(own).slice(1) : "";

  useEffect(() => {
    const now = todayInDhaka();
    setToday(now);
    // Most people make the card the day they donate, so the date starts on today.
    setPick(pickOf(now));
    // In-page anchors (#result) also change the hash, so only a real shared card replaces the friend.
    const readFriend = () => { const shared = parseShareHash(window.location.hash, now); if (shared) setFriend(shared); };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  useEffect(() => {
    if (!today || (!card && !friend)) return;
    let cancelled = false;
    loadCardFonts("রক্তদাতা কার্ড").then(() => {
      if (cancelled) return;
      if (card && preview.current) drawCard(preview.current, card, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, createCard(friend, today), "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, friend, today]);

  const set = (key: keyof Pick) => (event: ChangeEvent<HTMLSelectElement>) => setPick(current => ({ ...current, [key]: event.target.value }));
  const step = (by: number) => setCountText(String(Math.min(MAX_COUNT, Math.max(1, count + by))));
  const thisYear = Number((today || "2026").slice(0, 4));
  const years = Array.from({ length: 31 }, (_, index) => thisYear - index);

  return (
    <div className="rk">
      {friend && today && (
        <section className="rk-friend" aria-labelledby="friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friend.name || "বন্ধুর"} রক্তদাতা কার্ড`} />
          <div>
            <p className="rk-kicker">তোমার জন্য একটা রক্তদাতা কার্ড এসেছে</p>
            <h2 id="friend-title">{friendTitle(friend.name)}</h2>
            <a className="kit-primary" href="#rk-bag">আমার কার্ড বানাই</a>
          </div>
        </section>
      )}

      <div className="rk-bag" id="rk-bag">
        <div className="rk-label">
          <p className="rk-strip"><Drop className="rk-drop" /><span>রক্তদাতা কার্ড</span><i aria-hidden="true" /></p>

          <fieldset className="rk-date">
            <legend>শেষ কবে রক্ত দিয়েছ?</legend>
            <label><span>দিন</span><select value={pick.d} onChange={set("d")}><option value="">দিন</option>{Array.from({ length: 31 }, (_, index) => <option key={index} value={index + 1}>{bnPlain(index + 1)}</option>)}</select></label>
            <label><span>মাস</span><select value={pick.m} onChange={set("m")}><option value="">মাস</option>{months.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
            <label><span>সাল</span><select value={pick.y} onChange={set("y")}><option value="">সাল</option>{years.map(year => <option key={year} value={year}>{bnPlain(year)}</option>)}</select></label>
          </fieldset>
          {problem ? <p className="rk-problem" role="alert">{problem}</p> : last === today && <p className="rk-hint">আজ দিয়ে থাকলে কিছু বদলাতে হবে না।</p>}

          <div className="rk-next" aria-live="polite">
            {next ? <>
              <p className="rk-next-label">{daysBetween(today, next) > 0 ? "আবার পারবে" : "বিরতি শেষ হয়েছে"}</p>
              <p className="rk-next-date"><strong>{dateText(next)}</strong>{daysBetween(today, next) > 0 && " থেকে"}</p>
              <p className="rk-next-sub">{daysBetween(today, next) > 0 ? <>আর <b>{bn(daysBetween(today, next))} দিন</b> · শেষ দিয়েছ {dateText(last)}</> : <>{bnPlain(interval)} মাস পেরিয়ে গেছে। ব্লাড ব্যাংক পরীক্ষা করে বলবে আজ দেওয়া যাবে কি না।</>}</p>
            </> : <p className="rk-next-label">ওপরে তারিখটা দাও</p>}
          </div>

          <fieldset className="rk-interval">
            <legend>কত মাস পর পর?</legend>
            {INTERVALS.map(value => <button type="button" key={value} aria-pressed={interval === value} onClick={() => setIntervalMonths(value)}><b>{bnPlain(value)} মাস</b><small>{value === 6 ? "মেয়েদের সাধারণত" : "সাধারণ নিয়ম"}</small></button>)}
          </fieldset>

          <fieldset className="rk-groups" id="rk-groups">
            <legend>তোমার রক্তের গ্রুপ <small>কার্ডের জন্য</small></legend>
            {groups.map(item => <button type="button" key={item.id} aria-pressed={group === item.id} aria-label={item.spoken} onClick={() => setGroup(item.id)}>{item.label}</button>)}
          </fieldset>

          <div className="rk-count" role="group" aria-labelledby="rk-count-label">
            <label id="rk-count-label" htmlFor="rk-count-input">সব মিলিয়ে কতবার দিয়েছ? <small>শেষবারেরটা সহ</small></label>
            <div>
              <button type="button" onClick={() => step(-1)} disabled={count <= 1} aria-label="একবার কমাও">−</button>
              <input id="rk-count-input" type="number" inputMode="numeric" min={1} max={MAX_COUNT} value={countText} onChange={event => setCountText(event.target.value.slice(0, 3))} onBlur={() => setCountText(String(count))} />
              <button type="button" onClick={() => step(1)} disabled={count >= MAX_COUNT} aria-label="একবার বাড়াও">+</button>
            </div>
          </div>
        </div>
      </div>
      <p className="rk-final">রক্ত দেওয়ার আগে ব্লাড ব্যাংক তোমাকে পরীক্ষা করবে। ব্লাড ব্যাংক যা বলবে সেটাই চূড়ান্ত। <a href="#niyom">হিসাবটা কোথা থেকে?</a></p>

      <StickyNext show={Boolean(card) && !resultVisible} title={<>আবার পারবে <strong>{card?.nextText ?? ""}</strong></>} sub={card?.pageLine} href="#result" label="কার্ডটা দেখো" />

      {card && (
        <section className="rk-result" id="result" ref={result} aria-labelledby="result-title">
          <h2 id="result-title">ধন্যবাদ, <em>রক্তদাতা!</em></h2>
          <p className="rk-line">{card.pageLine} যে তোমার রক্ত পাবে, সে হয়তো কোনোদিন তোমার নাম জানবে না। তাই আমরাই বলে রাখি।</p>
          <div className="rk-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
              <figcaption id="card-summary" className="rk-sr">{card.headline} রক্তের গ্রুপ {card.group.spoken}। শেষ রক্ত দিয়েছি {card.lastText}, আবার পারব {card.nextText} থেকে।</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="rk-controls">
              <label className="rk-field">
                <span>কার্ডে নাম <small>না দিলেও চলবে</small></span>
                <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
              </label>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="roktodata-card.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${today}`} caption={caption(card)} state={state} local hint="লিংকের ভেতরেই থাকবে গ্রুপ, তারিখ, কতবার আর নাম। আমরা কোথাও জমা রাখি না।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
