"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { chitBlob, drawChit } from "../lib/draw-chit";
import { bn, chitTitle, cleanName, cups, decodeOrder, defaultLine, encodeOrder, extras, favourite, lineTally, MAX_LINES, MAX_NAME, orderLine, orderText, sideText, sugars, teaOf, teas, toggleExtra, vessel, steam, type Line } from "../lib/order";

const TOOL = "tong";
// Below this, "দেশের প্রিয়" would be one or two people's taste.
const PROOF_MIN = 30;
const COMPARE_MIN = 20;
const percent = (count: number, total: number) => Math.round((count / Math.max(total, 1)) * 100);

function Vessel({ line, className }: { line: Pick<Line, "tea" | "cup">; className?: string }) {
  const clip = useId();
  const shape = vessel[line.cup];
  return <svg className={className} viewBox="0 0 48 48" aria-hidden="true" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <clipPath id={clip}><path d={shape.body} /></clipPath>
    <path d={shape.body} fill={line.cup === "bhar" ? "#c46a3c" : "#fff"} />
    <rect className="tong-tea" clipPath={`url(#${clip})`} x="0" y={line.cup === "bhar" ? 15 : 16} width="48" height={line.cup === "bhar" ? 5 : 26} fill={teaOf(line.tea).color} />
    {line.tea === "lebu" && <circle cx="33" cy="16" r="4.5" fill="#e9d34f" />}
    <path d={shape.body} stroke="#3a2414" strokeWidth="2.2" />
    <path d={shape.rest} stroke="#3a2414" strokeWidth="2.2" />
    <path className="tong-steam" d={steam} stroke="#8a7a6a" strokeWidth="1.6" />
  </svg>;
}

function Sketch({ drawing }: { drawing: string }) {
  return <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={drawing} /></svg>;
}

export function OrderBuilder() {
  const [own, setOwn] = useState<Line>(defaultLine);
  const [friends, setFriends] = useState<Line[]>([]);
  const [joined, setJoined] = useState(true);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [voted, setVoted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const full = friends.length >= MAX_LINES;
  const group = joined && !full && friends.length > 0;
  const mine: Line = { ...own, name: cleanName(own.name) };
  const lines = group ? [...friends, mine] : [mine];
  const state = encodeOrder(lines);
  const proof = everyone ? favourite(everyone.counts, everyone.total, PROOF_MIN) : null;

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared chit replaces the friends.
    const readShared = () => { const shared = decodeOrder(window.location.hash); if (shared) { setFriends(shared); setJoined(true); } };
    readShared();
    window.addEventListener("hashchange", readShared);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readShared);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("মামার টং অর্ডার").then(() => {
      if (cancelled || !preview.current) return;
      drawChit(preview.current, lines, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes every line the card draws.
  }, [state, format, site]);

  function change(next: Partial<Line> | ((line: Line) => Partial<Line>)) {
    setOwn(current => ({ ...current, ...(typeof next === "function" ? next(current) : next) }));
    // A changed order makes the earlier comparison stale.
    setVoted(current => current === "done" ? "idle" : current);
  }

  async function vote() {
    setVoted("sending");
    const tally = await addToTally(TOOL, lineTally(own));
    if (tally) { setEveryone(tally); setVoted("done"); } else setVoted("failed");
  }

  const who = friends.map(line => line.name).filter(Boolean);
  const whoText = who.length ? (who.length > 2 ? `${who.slice(0, 2).join(", ")} আর ${bn(who.length - 2)} জন` : who.join(" আর ")) : friends.length > 1 ? `${bn(friends.length)} জন বন্ধু` : "তোমার বন্ধু";
  const caption = group ? `আড্ডার চিরকুটে এখন ${bn(lines.length)} জনের অর্ডার। তোমারটা কী? যোগ করো:` : `আমার টং-এর অর্ডার: ${orderText(mine).replaceAll(" · ", ", ")}, ${sideText(mine)}। মামা, তোমারটা কী?`;

  return (
    <div className="tong">
      {friends.length > 0 && (
        <section className="tong-friend" aria-labelledby="friend-title">
          <p className="tong-kicker">তোমার জন্য একটা চিরকুট এসেছে</p>
          <h2 id="friend-title">{whoText} অর্ডার দিয়েছে।<br /><span>মামা, তোমারটা কী?</span></h2>
          {full
            ? <p>চিরকুটে {bn(MAX_LINES)} জনের জায়গা ভরে গেছে, তাই তোমারটা নতুন চিরকুটে উঠবে।</p>
            : <p>তোমার লাইনটা ওদের চিরকুটে যোগ হবে। <button type="button" className="kit-link" onClick={() => setJoined(value => !value)}>{joined ? "আলাদা চিরকুট বানাও" : "ওদের চিরকুটে যোগ করো"}</button></p>}
        </section>
      )}

      {proof && <p className="tong-proof">দেশের প্রিয়: <strong>{proof}</strong></p>}

      <div className="tong-stall" id="order">
        <div className="tong-bench"><div className="tong-chit" aria-live="polite">
          <p className="tong-chit-head"><b>মামার টং</b> · অর্ডারের চিরকুট</p>
          {group && <ul className="tong-chit-friends">{friends.map((line, index) => <li key={index}><Vessel line={line} /><span>{line.name && <b>{line.name}: </b>}{orderText(line)} <small>{sideText(line)}</small></span></li>)}</ul>}
          <div className="tong-chit-mine">
            <Vessel line={own} className="tong-cup" />
            <p><strong key={own.tea}>{teaOf(own.tea).label}</strong><span>{sugars.find(item => item.id === own.sugar)!.label} · {cups.find(item => item.id === own.cup)!.label}</span><span>{own.extras.length ? `সাথে ${own.extras.map(id => extras.find(extra => extra.id === id)!.label).join(", ")}` : "শুধু চা"}</span></p>
          </div>
        </div></div>

        <div className="tong-picks">
          <fieldset className="tong-group">
            <legend>কোন চা?</legend>
            <div className="tong-teas">{teas.map(tea => <button type="button" key={tea.id} aria-pressed={own.tea === tea.id} onClick={() => change({ tea: tea.id })}><i style={{ background: tea.color }} aria-hidden="true" />{tea.label}</button>)}</div>
          </fieldset>
          <fieldset className="tong-group">
            <legend>চিনি</legend>
            <div className="tong-row">{sugars.map(sugar => <button type="button" key={sugar.id} aria-pressed={own.sugar === sugar.id} onClick={() => change({ sugar: sugar.id })}>{sugar.label.replace("চিনি ", "")}</button>)}</div>
          </fieldset>
          <fieldset className="tong-group">
            <legend>কিসে খাবে?</legend>
            <div className="tong-row">{cups.map(cup => <button type="button" key={cup.id} aria-pressed={own.cup === cup.id} onClick={() => change({ cup: cup.id })}>{cup.label}</button>)}</div>
          </fieldset>
          <fieldset className="tong-group">
            <legend>সাথে কী? <small>তিনটা পর্যন্ত</small></legend>
            <div className="tong-sides">
              {extras.map(extra => <button type="button" key={extra.id} aria-pressed={own.extras.includes(extra.id)} onClick={() => change(line => ({ extras: toggleExtra(line.extras, extra.id) }))}><Sketch drawing={extra.drawing} />{extra.label}</button>)}
              <button type="button" aria-pressed={!own.extras.length} onClick={() => change({ extras: [] })}><Vessel line={own} />শুধু চা</button>
            </div>
          </fieldset>
        </div>
      </div>

      <StickyNext show={!resultVisible} title={<><strong>অর্ডার রেডি!</strong></>} sub={orderText(own)} href="#result" label="চিরকুটটা দেখো" />

      <section className="tong-result" id="result" ref={result} aria-labelledby="result-title">
        <div className="tong-result-head">
          <h2 id="result-title">{chitTitle(lines)}</h2>
          <p>{orderLine(lines)}</p>
        </div>
        <div className="tong-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="chit-summary" />
            <figcaption id="chit-summary" className="tong-sr">{chitTitle(lines)}। {lines.map(line => `${line.name ? line.name + ": " : ""}${orderText(line)}, ${sideText(line)}`).join("। ")}</figcaption>
            {previewError && <p className="kit-status" role="alert">চিরকুটের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="tong-controls">
            <label className="tong-field">
              <span>তোমার নাম <small>চিরকুটে বসবে, না দিলেও চলবে</small></span>
              <input value={own.name} maxLength={MAX_NAME} onChange={event => change({ name: event.target.value })} placeholder="যেমন: রাফি" autoComplete="nickname" />
            </label>
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="tong-order.png" makeImage={() => chitBlob(lines, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint={lines.length < MAX_LINES ? `চিরকুটটা পাঠাও, বন্ধুরাও নিজের অর্ডার যোগ করুক। ${bn(MAX_LINES)} জন পর্যন্ত।` : "চিরকুট ভরে গেছে! এবার শুধু শেয়ার।"} />
          </div>
        </div>

        <div className="tong-everyone">
          <h3>দেশের টং-এ তোমার অর্ডারটা দেবে?</h3>
          {voted !== "done" || !everyone ? <>
            <p>শুধু তোমার চা, চিনি, কাপ আর সাথের খাবারগুলো গোনা হবে। নাম যাবে না।</p>
            <button type="button" className="kit-secondary" onClick={vote} disabled={voted === "sending"}>{voted === "sending" ? "দিচ্ছি…" : "অর্ডারটা দাও"}</button>
            {voted === "failed" && <p className="kit-status" role="alert">এখন দেওয়া গেল না। একটু পরে আবার চেষ্টা করো।</p>}
          </> : everyone.total < COMPARE_MIN
            ? <p className="kit-status">দেওয়া হয়েছে! এখনো মাত্র {bn(everyone.total)} জন দিয়েছে, তাই হিসাবটা এখনই বলা যাবে না। বন্ধুদের লিংক পাঠাও।</p>
            : <ul className="tong-bars">
              {[teaOf(own.tea), sugars.find(item => item.id === own.sugar)!, ...own.extras.map(id => extras.find(extra => extra.id === id)!)].map(item => {
                const value = percent(everyone.counts[item.id] ?? 0, everyone.total);
                return <li key={item.id}><span>{item.label}</span><i style={{ width: `${value}%` }} /><b>{bn(value)}%</b></li>;
              })}
              <li className="tong-bars-note">{bn(everyone.total)} জনের অর্ডারের মধ্যে, তোমার মতো যারা নিয়েছে।</li>
            </ul>}
        </div>
      </section>
    </div>
  );
}
