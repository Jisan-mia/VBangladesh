"use client";

import { useEffect, useRef, useState } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, type Card } from "../lib/draw-card";
import { CHECKED, IF_HOME, bn, clock, dateLine, dhakaToday, districtName, divisions, duration, humanLine, live, monthFor, nextEvent, parseShareHash, season, seasonText, shareHash, showDay, type DistrictId } from "../lib/timetable";

const TOOL = "sehri-iftar";
const SAVED = "sehri-iftar:z";
/** Server render and first paint use the check day, so nothing depends on the server's clock. */
const FIRST_NOW = Date.parse(CHECKED + "T12:00:00+06:00");

const verifiedOn = (date: string) => dateLine(date).split(", ")[1];

export function PocketCard() {
  const [district, setDistrict] = useState<DistrictId>("dhaka");
  const [friend, setFriend] = useState<DistrictId | null>(null);
  const [now, setNow] = useState<number | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  useEffect(() => {
    try { const saved = parseShareHash("z=" + (localStorage.getItem(SAVED) ?? "")); if (saved) setDistrict(saved); } catch { /* private mode: start from ঢাকা */ }
    // In-page anchors (#result) also change the hash, so only a real shared district counts.
    const readFriend = () => { const shared = parseShareHash(window.location.hash); if (shared) { setFriend(shared); setDistrict(shared); } };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setSite(window.location.host);
    setNow(Date.now());
    // The countdown is in minutes; 20 seconds keeps it honest without waking a cheap phone too often.
    const timer = window.setInterval(() => setNow(Date.now()), 20_000);
    return () => { window.removeEventListener("hashchange", readFriend); window.clearInterval(timer); };
  }, []);

  function choose(id: DistrictId) {
    setDistrict(id);
    try { localStorage.setItem(SAVED, id); } catch { /* not saved, still works */ }
  }

  const at = now ?? FIRST_NOW;
  const today = dhakaToday(new Date(at));
  const time = season(live, today);
  const day = showDay(live, district, at);
  const next = nextEvent(live, district, at);
  const line = humanLine(time, next);
  const name = districtName(district);
  const source = live ? `সূত্র: ইসলামিক ফাউন্ডেশন · যাচাই করা: ${verifiedOn(live.checked)}` : "রমজানের তারিখ সম্ভাব্য, চাঁদ দেখার ওপর নির্ভর করে";
  const card: Card = {
    district: name, season: time, line, source,
    times: day ? { sehri: clock(day.sehri), iftar: clock(day.iftar), when: `${day.tomorrow ? "কাল" : "আজ"} · ${bn(day.day)} রমজান · ${dateLine(day.date)}` } : null,
  };
  const state = shareHash(district).slice(1);
  const key = `${state}|${format}|${today}|${card.times?.sehri ?? ""}|${line}`;

  useEffect(() => {
    if (now === null) return;
    let cancelled = false;
    loadCardFonts(name).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, card, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // card is rebuilt every render; key stands in for everything it shows
  }, [key, site, now === null]); // eslint-disable-line react-hooks/exhaustive-deps

  const liveLine = next ? `${next.kind === "iftar" ? "ইফতারের" : "সেহরির শেষ সময়ের"} আর ${duration(next.minutes)}` : seasonText(time);
  const caption = `${name} · ${seasonText(time)}। ${line} তোমার জেলায় ইফতার কখন, দেখে নাও:`;

  return (
    <div className="si-builder">
      {friend && (
        <section className="si-friend" aria-labelledby="si-friend-title">
          <p className="si-friend-kicker">এক বন্ধু রোজার কার্ড পাঠিয়েছে</p>
          <h2 id="si-friend-title">{possessive(districtName(friend))} কার্ড দেখছ। <span>এবার তোমার জেলা বেছে নাও।</span></h2>
        </section>
      )}

      <div className="si-pocket">
        <div className="si-cover">
          <svg className="si-moon" viewBox="0 0 48 48" aria-hidden="true"><path d="M30 6a18 18 0 1 0 12 30A15 15 0 0 1 30 6Z" /><path d="m33 19 1.4 2.9 3.1.4-2.3 2.2.6 3.1-2.8-1.5-2.8 1.5.6-3.1-2.3-2.2 3.1-.4Z" /></svg>
          <p className="si-cover-title">{time.phase === "unknown" ? "রমজান" : `রমজান ${bn(time.hijri)}`} · সেহরি ও ইফতার</p>
          <label className="si-district">
            <span>তোমার জেলা</span>
            <select value={district} onChange={event => choose(event.target.value as DistrictId)}>
              {divisions.map(division => (
                <optgroup key={division.name} label={`${division.name} বিভাগ`}>
                  {division.districts.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
        </div>

        <div className="si-insert" aria-live="polite">
          <p className="si-live">{now === null ? " " : liveLine}</p>
          <div className="si-times" data-pending={!day}>
            <div><span>সেহরির শেষ</span><strong>{day ? clock(day.sehri) : "আসছে"}</strong></div>
            <div><span>ইফতার</span><strong>{day ? clock(day.iftar) : "আসছে"}</strong></div>
          </div>
          {day ? <p className="si-when">{card.times!.when} · {name}</p>
            : live ? <p className="si-when">আজ রমজানের দিন না। রমজানের দিনগুলোতেই সময় দেখাবে।</p>
            : <p className="si-pending"><strong>ইসলামিক ফাউন্ডেশন সময়সূচি প্রকাশ করলেই এখানে যোগ হবে।</strong> আমরা নিজে হিসাব করে কোনো সময় বসাই না।</p>}
          <p className="si-source">
            {live
              ? <>সূত্র: <a href={live.source.url} target="_blank" rel="noopener noreferrer">{live.source.label}</a> · যাচাই করা: {verifiedOn(live.checked)}</>
              : <>সূত্র: <a href={IF_HOME.url} target="_blank" rel="noopener noreferrer">{IF_HOME.label}</a> · যাচাই করা: {verifiedOn(CHECKED)} (১৪৪৮ হিজরির সূচি তখনো আসেনি)</>}
          </p>
          <p className="si-advice">নিজের এলাকার মসজিদের আজান আর স্থানীয় ঘোষণা মেনে চলো।</p>
        </div>
      </div>

      {live && <MonthTable district={district} today={today} />}

      <StickyNext show={now !== null && !resultVisible} title={<><strong>{name}</strong> · {seasonText(time)}</>} sub="রোজার দিন গোনা কার্ড" href="#result" label="কার্ডটা দেখো" />

      <section className="si-result" id="result" ref={result} aria-labelledby="si-result-title">
        <h2 id="si-result-title">{line}</h2>
        <div className="si-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`${name}, ${seasonText(time)}। ${line}`} />
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="si-controls">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName={`sehri-iftar-${district}.png`} makeImage={() => cardBlob(card, format, site)} imageKey={key} caption={caption} state={state} hint="লিংকে শুধু জেলার নাম যায়। যে খুলবে, সে নিজের আজকের সময়টা দেখবে।" />
          </div>
        </div>
      </section>
    </div>
  );
}

/** The whole month for one district, today highlighted. Rendered only from the verified IF table. */
function MonthTable({ district, today }: { district: DistrictId; today: string }) {
  const month = monthFor(live, district);
  return (
    <div className="si-table-wrap">
      <table className="si-table">
        <caption>{districtName(district)} জেলার পুরো মাস</caption>
        <thead><tr><th scope="col">রমজান</th><th scope="col">তারিখ</th><th scope="col">সেহরির শেষ</th><th scope="col">ইফতার</th></tr></thead>
        <tbody>
          {month.map(row => (
            <tr key={row.day} aria-current={row.date === today ? "date" : undefined}>
              <th scope="row">{bn(row.day)}</th>
              <td>{dateLine(row.date).split(", ")[1].replace(/ \S+$/, "")}</td>
              <td>{clock(row.sehri)}</td>
              <td>{clock(row.iftar)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
