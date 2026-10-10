"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat, type Photo } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, PhotoPicker, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { possessive } from "../../../shared/bangla";
import { addDays, bn, clockIn, clockText, countdownLine, countries, countryOf, createCard, gapText, homeNote, homes, months, parseShareHash, placeOf, relations, replyLine, sampleTrip, shareHash, todayInDhaka, validBack, validLeft, zonesOf, MAX_AHEAD_DAYS, MAX_NAME_LENGTH, MIN_LEFT, type Card, type Place, type RelationId, type Trip } from "../lib/deshe";
import { cardBlob, drawCard } from "../lib/draw-card";

const TOOL = "deshe-fera";
const SAVED = "deshe-fera-trip";
// Percentages from a handful of people are noise.
const COMPARE_MIN = 20;

function ClockLine({ place, now }: { place: Place; now: Date }) {
  const home = clockIn("Asia/Dhaka", now);
  if (!place.zone) return <p className="tag-clock">দেশে এখন <strong>{clockText(home)}</strong>। {homeNote(home.hour)}</p>;
  const here = clockIn(place.zone, now);
  return <p className="tag-clock">{place.at} এখন <strong>{clockText(here)}</strong>, দেশে <strong>{clockText(home)}</strong><span>{gapText(here, home)}। {homeNote(home.hour)}</span></p>;
}

/** The paper luggage tag, tied to the suitcase handle. */
function LuggageTag({ card, now, label }: { card: Card; now: Date; label: string }) {
  return (
    <div className="tag-stage" role="group" aria-label={label}>
      <span className="tag-handle" aria-hidden="true" />
      <div className="tag">
        <span className="tag-hole" aria-hidden="true" />
        {card.name && <p className="tag-name"><small>যাত্রী</small>{card.name}</p>}
        <div className="tag-row">
          <p className="tag-from"><small>থেকে</small>{card.from}</p>
          <p key={card.stamp} className="tag-stamp" aria-live="polite"><span>{card.stamp.split(" ")[0]}</span>{card.stamp.split(" ").slice(1).join(" ")}</p>
        </div>
        <p className="tag-to"><span aria-hidden="true">→ </span><span className="screen-reader-only">বাড়ি: </span>{card.to}</p>
        <p className="tag-abroad">{card.abroad}</p>
        <p className="tag-eid">{card.eidText}{card.eids > 0 && <small> (প্রায়)</small>}</p>
        <ClockLine place={card.place} now={now} />
      </div>
    </div>
  );
}

function Chips<T extends string>({ legend, items, value, onChange, className = "" }: { legend: string; items: ReadonlyArray<{ id: T; label: string }>; value: T; onChange: (id: T) => void; className?: string }) {
  return (
    <fieldset className={`df-chips ${className}`}>
      <legend>{legend}</legend>
      <div>{items.map(item => <button key={item.id} type="button" aria-pressed={item.id === value} onClick={() => onChange(item.id)}>{item.label}</button>)}</div>
    </fieldset>
  );
}

/** What family at home sees when they open the link: the live countdown, and a one-tap reply card. */
function FamilyView({ trip, today, now, site }: { trip: Trip; today: string; now: Date; site: string }) {
  const [waiting, setWaiting] = useState<RelationId | "">(trip.waiting ?? "");
  const canvas = useRef<HTMLCanvasElement>(null);
  const card = useMemo(() => createCard(trip, today), [trip, today]);
  const label = relations.find(relation => relation.id === waiting)?.label ?? "";
  const state = shareHash({ ...trip, waiting }).slice(1);
  const from = relations.find(relation => relation.id === trip.waiting)?.label;

  useEffect(() => {
    if (!label || !canvas.current) return;
    let cancelled = false;
    loadCardFonts("আমরা অপেক্ষায়").then(() => { if (!cancelled && canvas.current) drawCard(canvas.current, card, "feed", site, null, label); }).catch(() => {});
    return () => { cancelled = true; };
  }, [card, label, site]);

  return (
    <section className="df-family" aria-labelledby="family-title">
      <p className="df-kicker">{from ? "বাড়ি থেকে খবর এসেছে" : "প্রবাস থেকে একটা লিংক এসেছে"}</p>
      <h2 id="family-title">{from && <>{from} অপেক্ষায় আছে।<br /></>}{card.daysLeft !== null && card.daysLeft > 0
        ? <span className="df-days">{card.name ? `${card.name} দেশে ফিরছে` : "দেশে ফিরছি"} <span>আর <b>{bn(card.daysLeft)}</b> দিন</span></span>
        : <span>{countdownLine(card)}</span>}</h2>
      <LuggageTag card={card} now={now} label={`${card.name ? possessive(card.name) : "প্রবাসীর"} লাগেজ ট্যাগ`} />
      <p className="df-note">লিংকটা যতবার খুলবে, দিন গোনা আজকের তারিখ ধরে নতুন করে হবে।</p>
      <Chips legend={card.name ? `তুমি ${possessive(card.name)} কে? একটা উত্তর পাঠাও` : "তুমি কে? একটা উত্তর পাঠাও"} items={relations} value={waiting} onChange={setWaiting} className="df-relations" />
      {label && (
        <div className="df-reply">
          <figure className="kit-card" data-format="feed">
            <canvas ref={canvas} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={replyLine(card, label)} />
          </figure>
          <ShareBar tool={TOOL} fileName="deshe-fera-opekkha.png" makeImage={() => cardBlob(card, "feed", site, null, label)} imageKey={`${state}|${today}`} caption={replyLine(card, label)} state={state} hint="ইমো, হোয়াটসঅ্যাপ বা মেসেঞ্জারে পাঠিয়ে দাও।" />
        </div>
      )}
    </section>
  );
}

export function TagBuilder() {
  const [now, setNow] = useState<Date | null>(null);
  const [trip, setTrip] = useState<Trip>(sampleTrip);
  const [name, setName] = useState("");
  const [format, setFormat] = useState<CardFormat>("feed");
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [shared, setShared] = useState<Trip | null>(null);
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [compared, setCompared] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const today = now ? todayInDhaka(now) : "";
  const backProblem = Boolean(today && trip.back && !(validBack(trip.back, trip.left, today) && trip.back >= today));
  // A half-typed or out-of-range return date is shown as a problem and left off the card and the link.
  const own = useMemo(() => ({ ...trip, name, back: backProblem ? "" : trip.back }), [trip, name, backProblem]);
  const card = useMemo(() => today ? createCard(own, today) : null, [own, today]);
  const state = shareHash(own).slice(1);

  useEffect(() => {
    const start = new Date();
    setNow(start);
    // Clocks tick every half minute; the countdown follows the date in Bangladesh.
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    const day = todayInDhaka(start);
    try {
      const saved = parseShareHash(localStorage.getItem(SAVED) ?? "", day);
      if (saved) { setTrip({ ...saved, back: saved.back >= day ? saved.back : "", waiting: "" }); setName(saved.name); }
    } catch { /* private mode: start from the sample */ }
    // In-page anchors (#result) also change the hash, so only a real shared trip replaces the family view.
    const readShared = () => { const trip = parseShareHash(window.location.hash, todayInDhaka()); if (trip) setShared(trip); };
    readShared();
    window.addEventListener("hashchange", readShared);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => { window.clearInterval(timer); window.removeEventListener("hashchange", readShared); };
  }, []);

  useEffect(() => {
    if (!now) return;
    try { localStorage.setItem(SAVED, state); } catch { /* not saved; fine */ }
  }, [state, now]);

  useEffect(() => {
    if (!card || !preview.current) return;
    let cancelled = false;
    loadCardFonts("দেশে ফেরা").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, card, format, site, photo);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site, photo]);

  const set = (patch: Partial<Trip>) => { setTrip(current => ({ ...current, ...patch })); setCompared(current => current === "done" ? "idle" : current); };
  const [leftYear, leftMonth] = trip.left.split("-");
  const thisYear = today.slice(0, 4), thisMonth = Number(today.slice(5, 7));
  function setLeft(year: string, month: string) {
    const capped = year === thisYear && Number(month) > thisMonth ? String(thisMonth).padStart(2, "0") : month;
    const left = `${year}-${capped}`;
    if (today && validLeft(left, today)) set({ left, back: trip.back && trip.back.slice(0, 7) < left ? "" : trip.back });
  }

  async function compareWithEveryone() {
    setCompared("sending");
    const tally = await addToTally(TOOL, [countryOf(trip.place)]);
    if (tally) { setEveryone(tally); setCompared("done"); } else setCompared("failed");
  }

  if (!now || !card) return <div className="df df-loading" aria-busy="true"><div className="tag-stage"><span className="tag-handle" aria-hidden="true" /><div className="tag" /></div></div>;

    const years = Array.from({ length: Number(thisYear) - Number(MIN_LEFT.slice(0, 4)) + 1 }, (_, index) => String(Number(thisYear) - index));
  const zones = zonesOf(trip.place);
  const countdown = card.daysLeft !== null && card.daysLeft > 0 ? ` দেশে ফিরছি আর ${bn(card.daysLeft)} দিন!` : "";
  const caption = `${card.abroad}, ${card.eidText}।${countdown || ` ${card.line}`} তুমি কত দিন দেশের বাইরে?`;
  const topCountry = compared === "done" && everyone && everyone.total >= COMPARE_MIN ? [...countries].sort((a, b) => (everyone.counts[b.id] ?? 0) - (everyone.counts[a.id] ?? 0))[0] : null;

  return (
    <div className="df">
      {shared && <FamilyView trip={shared} today={today} now={now} site={site} />}
      {shared && <h2 className="df-turn">তুমিও প্রবাসে? <span>নিজের ট্যাগটা বানাও</span></h2>}

      <div className="df-builder">
        <LuggageTag card={card} now={now} label="তোমার লাগেজ ট্যাগ" />
        <div className="df-controls">
          <Chips legend="কোথায় থাকো?" items={countries.map(place => ({ id: place.id, label: place.country }))} value={countryOf(trip.place) as Trip["place"]} onChange={place => set({ place })} className="df-countries" />
          {zones.length > 1 && <Chips legend="কোন শহরের সময়?" items={zones.map(place => ({ id: place.id, label: "city" in place ? place.city : place.country }))} value={trip.place} onChange={place => set({ place })} className="df-zones" />}

          <fieldset className="df-left">
            <legend>কবে দেশ ছেড়েছিলে?</legend>
            <label><span>মাস</span><select value={leftMonth} onChange={event => setLeft(leftYear, event.target.value)}>{months.map((month, index) => { const value = String(index + 1).padStart(2, "0"); return <option key={month} value={value} disabled={leftYear === thisYear && index + 1 > thisMonth}>{month}</option>; })}</select></label>
            <label><span>সাল</span><select value={leftYear} onChange={event => setLeft(event.target.value, leftMonth)}>{years.map(year => <option key={year} value={year}>{bn(year)}</option>)}</select></label>
          </fieldset>

          <div className="df-back">
            <label htmlFor="df-back">দেশে ফেরার তারিখ <small>জানা থাকলে</small></label>
            <div>
              <input id="df-back" type="date" value={trip.back} min={today} max={addDays(today, MAX_AHEAD_DAYS)} onChange={event => set({ back: event.target.value })} />
              {trip.back && <button type="button" className="kit-link" onClick={() => set({ back: "" })}>মুছে দাও</button>}
            </div>
            {backProblem
              ? <p className="df-problem" role="alert">আজ থেকে দুই বছরের মধ্যে একটা তারিখ দাও।</p>
              : <p className="df-hint">ফ্লাইট পিছালে শুধু তারিখটা বদলে নতুন লিংক পাঠিয়ো। পুরোনো লিংক আগের তারিখই দেখাবে।</p>}
          </div>

          <Chips legend="নামবে কোথায়?" items={homes} value={trip.home} onChange={home => set({ home })} className="df-homes" />
        </div>
      </div>

      <StickyNext show={!shared && !resultVisible} title={<strong>{card.abroad}</strong>} sub={card.daysLeft !== null && card.daysLeft > 0 ? `দেশে ফিরতে আর ${bn(card.daysLeft)} দিন` : card.eidText} href="#result" label="কার্ড দেখো" />

      <section className="df-result" id="result" ref={result} aria-labelledby="result-title">
        <h2 id="result-title">তোমার <em>লাগেজ ট্যাগ</em></h2>
        <p className="df-line">{card.line}</p>
        <div className="df-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="card-summary" />
            <figcaption id="card-summary" className="screen-reader-only">{card.from} থেকে {card.to}। {card.abroad}। {card.eidText}। {card.stamp}। {card.line}</figcaption>
            {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="df-share">
            <label className="df-field">
              <span>ট্যাগে তোমার নাম <small>না দিলেও চলবে</small></span>
              <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <PhotoPicker value={photo} onChange={setPhoto} />
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="deshe-fera.png" makeImage={() => cardBlob(card, format, site, photo)} imageKey={`${state}|${format}|${photo?.width ?? 0}|${today}`} caption={caption} state={state} hint="লিংকটা বাড়িতে পাঠাও। খুললেই দেখবে আর কত দিন, আর রোজ নিজে থেকেই এক দিন কমবে।" />
          </div>
        </div>

        <div className="df-everyone">
          <h3>প্রবাসীরা সবচেয়ে বেশি কোন দেশে?</h3>
          {compared !== "done" || !everyone ? <>
            <p>তোমার দেশ ({placeOf(trip.place).country}) সবার হিসাবে যোগ করো। নাম বা তারিখ যাবে না, শুধু দেশটা গোনা হবে।</p>
            <button type="button" className="kit-secondary" onClick={compareWithEveryone} disabled={compared === "sending"}>{compared === "sending" ? "যোগ হচ্ছে…" : "সবার সাথে মেলাও"}</button>
            {compared === "failed" && <p className="kit-status" role="alert">এখন মেলানো গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : !topCountry ? (
            <p className="kit-status">যোগ হয়েছে! এখনো খুব কম মানুষ মিলিয়েছে। বন্ধুদের লিংক পাঠাও, তারপর দেখো।</p>
          ) : <>
            <p>এখন পর্যন্ত সবচেয়ে বেশি এসেছে <strong>{topCountry.country}</strong> থেকে ({bn(everyone.total)} জনের হিসাব)।</p>
            <ul className="df-bars">{countries.filter(country => everyone.counts[country.id]).map(country => { const percent = Math.round(((everyone.counts[country.id] ?? 0) / everyone.total) * 100); return <li key={country.id} data-mine={country.id === countryOf(trip.place)}><span>{country.country}</span><i style={{ width: `${percent}%` }} /><b>{bn(percent)}%</b></li>; })}</ul>
          </>}
        </div>
      </section>
    </div>
  );
}
