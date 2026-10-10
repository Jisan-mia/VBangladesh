"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { bn, byNearest, calendar, countdown, dateLine, daysBetween, daysText, dhakaToday, humanLine, inRange, occasions, parseShareHash, shareHash, shortDate, sources, MAX_LABEL_LENGTH, type Countdown, type OccasionId, type Pick } from "../lib/countdown";

const TOOL = "koto-din-baki";
/** The day the dates were last checked; the server render shows the table from here. */
export const CHECKED = "2026-10-10";

function caption(count: Countdown) {
  if (!count.date) return `${count.title} কবে, সেটা গুনে রাখছি।`;
  if (count.days === 0) return count.theme === "ekushe" ? "আজ অমর একুশে। ভাষাশহিদদের প্রতি গভীর শ্রদ্ধা।" : `আজই ${count.title}!`;
  if (count.days < 0) return `${count.title} পেরিয়ে গেছে ${bn(-count.days)} দিন।`;
  return `${count.title} আর ${bn(count.days)} দিন! ${count.theme === "ekushe" ? "ভাষাশহিদদের স্মরণের দিন আসছে।" : "তুমি কোন দিনটার অপেক্ষায়?"}`;
}

const plusYears = (date: string, years: number) => `${Number(date.slice(0, 4)) + years}${date.slice(4)}`;
const plusDays = (date: string, days: number) => new Date(Date.parse(date) + days * 86_400_000).toISOString().slice(0, 10);

export function CountdownBuilder() {
  const [today, setToday] = useState<string | null>(null);
  const [picked, setPicked] = useState<OccasionId | "custom" | null>(null);
  const [ownDate, setOwnDate] = useState("");
  const [label, setLabel] = useState("");
  const [friend, setFriend] = useState<Pick | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const send = useRef<HTMLDivElement>(null);
  const sendVisible = useInView(send);

  useEffect(() => {
    const now = dhakaToday(new Date());
    // In-page anchors (#send) also change the hash, so only a real shared day counts.
    const readFriend = () => {
      const shared = parseShareHash(window.location.hash, now);
      if (!shared) return;
      setFriend(shared);
      if ("date" in shared) { setPicked("custom"); setOwnDate(shared.date); setLabel(shared.label); }
      else setPicked(shared.id);
    };
    readFriend();
    window.addEventListener("hashchange", readFriend);
    setToday(now);
    setSite(window.location.host);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  const order = useMemo(() => today ? byNearest(today) : occasions.map(occasion => ({ occasion, count: null })), [today]);
  const day = today ?? CHECKED;
  const ownValid = inRange(ownDate, day);
  const pick: Pick = picked === "custom" && ownValid ? { date: ownDate, label } : { id: picked && picked !== "custom" ? picked : order[0].occasion.id };
  const count = countdown(pick, day);
  const state = shareHash(pick).slice(1);
  const key = state;

  useEffect(() => {
    if (!today) return;
    let cancelled = false;
    loadCardFonts(count.title).then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, count, today, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // count is rebuilt every render; its share state stands in for it
  }, [key, today, format, site]); // eslint-disable-line react-hooks/exhaustive-deps

  function pickCustom() {
    setPicked("custom");
    if (!ownDate) setOwnDate(plusDays(today ?? CHECKED, 30));
  }

  const friendCount = friend && today ? countdown(friend, today) : null;
  const summary = `${count.title}: ${daysText(count)}${count.date ? `, ${dateLine(count.date)}` : ""}।${count.likely ? " তারিখটা সম্ভাব্য।" : ""}`;
  const source = count.source ? sources[count.source] : null;

  return (
    <div className="kdb-builder">
      {friendCount && (
        <section className="kdb-friend" aria-labelledby="kdb-friend-title">
          <p className="kdb-friend-kicker">এবার তোমার পালা</p>
          <h2 id="kdb-friend-title">এক বন্ধু মনে করিয়ে দিল: <span>{friendCount.title} {friendCount.days > 0 ? `আর ${bn(friendCount.days)} দিন` : daysText(friendCount)}</span></h2>
          <p>তুমি কোন দিনটার অপেক্ষায়? <a href="#kdb-days">নিজেরটা বেছে নাও</a></p>
        </section>
      )}

      <div className="kdb-stage">
        <figure className="kit-card kdb-card" data-format={format}>
          <canvas key={key} ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="kdb-summary" />
          <figcaption id="kdb-summary" className="kdb-sr" aria-live="polite">{today ? summary : ""}</figcaption>
          {previewError && <p className="kit-status" role="alert">ক্যালেন্ডারটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <p className="kdb-source">
          {count.likely && <><strong>সম্ভাব্য তারিখ।</strong> </>}
          {source ? <>সূত্র: <a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></> : "তারিখটা তোমার দেওয়া। গোনা হয় বাংলাদেশের সময় ধরে।"}
        </p>
      </div>

      <fieldset className="kdb-days" id="kdb-days">
        <legend>কোন দিনের অপেক্ষা?</legend>
        <div>
          {order.map(({ occasion, count: item }) => (
            <button type="button" key={occasion.id} data-theme={occasion.theme} aria-pressed={picked === occasion.id || (!picked && occasion.id === order[0].occasion.id)} onClick={() => setPicked(occasion.id)}>
              <strong>{occasion.chip}</strong>
              <small>{item ? (item.date ? (item.days === 0 ? "আজ" : `${bn(item.days)} দিন`) : "তারিখ আসছে") : " "}</small>
            </button>
          ))}
          <button type="button" data-theme="custom" aria-pressed={picked === "custom"} onClick={pickCustom}>
            <strong>নিজের দিন</strong><small>বিয়ে, পরীক্ষা…</small>
          </button>
        </div>
      </fieldset>

      {picked === "custom" && (
        <div className="kdb-own">
          <label className="kdb-field">
            <span>কোন দিন?</span>
            <input type="date" value={ownDate} min={plusYears(day, -3)} max={plusYears(day, 3)} onChange={event => setOwnDate(event.target.value)} required />
          </label>
          <label className="kdb-field">
            <span>দিনটার নাম <small>{bn(MAX_LABEL_LENGTH)} অক্ষরের মধ্যে</small></span>
            <input value={label} maxLength={MAX_LABEL_LENGTH} onChange={event => setLabel(event.target.value)} placeholder="যেমন: রাফির বিয়ে" />
          </label>
          {!ownValid && <p className="kit-status" role="alert">আজ থেকে ৩ বছরের মধ্যে একটা তারিখ বেছে নাও।</p>}
          <p className="kdb-note">লিংকে শুধু তারিখ আর এই নামটা যায়। যে খুলবে, সে-ও একই দিন গুনতে পারবে।</p>
        </div>
      )}

      <div className="kdb-send" id="send" ref={send}>
        <h2>{humanLine(count)}</h2>
        <FormatToggle value={format} onChange={setFormat} />
        <ShareBar tool={TOOL} fileName={`koto-din-baki-${"id" in pick ? pick.id : "nijer-din"}.png`} makeImage={() => cardBlob(count, day, format, site)} imageKey={`${state}|${format}|${day}`} caption={caption(count)} state={state} hint="লিংক খুললে দিন গোনা চলতেই থাকবে, যেদিন খুলবে সেদিনের হিসাবে।" />
      </div>

      <StickyNext
        show={Boolean(today) && !sendVisible}
        title={<><strong>{count.date && count.days !== 0 ? `${bn(Math.abs(count.days))} দিন` : daysText(count)}</strong> {count.title}</>}
        sub={count.date ? shortDate(count.date) + (count.likely ? " · সম্ভাব্য" : "") : undefined}
        href="#send"
        label="শেয়ার করো"
      />
    </div>
  );
}

/** "২০২৬–২০২৭ সালের ছুটি আর উৎসব": the server shows every date from the check day, the browser drops the ones gone by. */
export function HolidayTable() {
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => { setToday(dhakaToday(new Date())); }, []);
  const rows = calendar(today ?? CHECKED, "2027-12-31");
  return (
    <div className="kdb-table-wrap">
      <table className="kdb-table">
        <thead><tr><th scope="col">দিন</th><th scope="col">তারিখ</th><th scope="col">বাকি</th></tr></thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id + row.date} data-theme={row.theme}>
              <th scope="row">{row.chip}<small>{row.note}</small></th>
              <td>{dateLine(row.date!)}{row.likely && <span className="kdb-badge">সম্ভাব্য</span>}</td>
              <td>{today ? (row.date === today ? "আজ" : `${bn(daysBetween(today, row.date!))} দিন`) : "…"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

