"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { sealBlob, sealMark } from "../lib/art";
import { cardBlob, drawCard } from "../lib/draw-card";
import {
  bn, createCard, cricketPick, defaults, displayName, footballPick, matchTitle, pairSplit, parseShareHash, pickText, previewTitle, readPick, runBands, shareHash, sideName, sportLabel, sports, tallyId, tallyIds, teams, verdictLabel, wickets,
  MAX_ENTRIES, MAX_GOALS, MAX_NAME_LENGTH, type Entry, type Match, type SportId,
} from "../lib/seal";

const TOOL = "ami-bolechhilam";
// One counted call per match per browser; the tally API keeps only the latest list, so earlier matches are resent with it.
const CALLS_KEY = "ami-bolechhilam-calls";
const BREAK_MS = 560;
type Mode = "compose" | "sealed" | "opened";

const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function SealArt({ sport }: { sport: SportId }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return <svg viewBox="0 0 100 100" aria-hidden="true">
    <defs><radialGradient id={id} cx="38%" cy="34%" r="62%"><stop offset="0" stopColor="#d8503f" /><stop offset=".55" stopColor="#a3231b" /><stop offset="1" stopColor="#5e0f0a" /></radialGradient></defs>
    <path d={sealBlob} fill={`url(#${id})`} />
    <circle cx="50" cy="50" r="32" fill="none" stroke="#3c0805" strokeOpacity=".55" strokeWidth="3" />
    <circle cx="50.8" cy="51" r="32" fill="none" stroke="#ffaa96" strokeOpacity=".35" strokeWidth="1.6" />
    <path d={sealMark[sport]} fill="none" stroke="#3c0805" strokeOpacity=".6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <path d={sealMark[sport]} transform="translate(.8 .9)" fill="none" stroke="#ffaa96" strokeOpacity=".4" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>;
}

function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <div className="ab-step">
    <span>{label}</span>
    <div>
      <button type="button" aria-label={`${label}: এক গোল কম`} disabled={value <= 0} onClick={() => onChange(value - 1)}>−</button>
      <output aria-live="polite">{bn(value)}</output>
      <button type="button" aria-label={`${label}: এক গোল বেশি`} disabled={value >= MAX_GOALS} onClick={() => onChange(value + 1)}>+</button>
    </div>
  </div>;
}

/** Who wins and by how much: chips for cricket, a little scoreboard for football. `value` "" means nothing picked yet. */
function PickControls({ match, value, onChange, legend, autoMargin = false }: { match: Match; value: string; onChange: (pick: string) => void; legend: string; autoMargin?: boolean }) {
  const read = value ? readPick(match.sport, value) : null;
  const [kind, setKind] = useState<"w" | "r">(read?.margin.startsWith("r") ? "r" : "w");
  if (match.sport === "f") {
    const [a, b] = read?.goals ?? [0, 0];
    return <fieldset className="ab-pick">
      <legend>{legend}</legend>
      <div className="ab-score">
        <Stepper label={sideName(match, "a")} value={a} onChange={next => onChange(footballPick(next, b))} />
        <b aria-hidden="true">–</b>
        <Stepper label={sideName(match, "b")} value={b} onChange={next => onChange(footballPick(a, next))} />
      </div>
    </fieldset>;
  }
  const side = read?.side ?? null;
  const margin = read?.margin ?? "";
  // A prediction starts with a margin to tweak; a result's margin stays blank unless someone adds it.
  const pickSide = (next: "a" | "b" | "d") => onChange(cricketPick(next, next === "d" ? "" : margin || (autoMargin ? (kind === "w" ? "w5" : "r2") : "")));
  return <>
    <fieldset className="ab-pick">
      <legend>{legend}</legend>
      <div className="ab-chips ab-winner">
        {(["a", "b"] as const).map(item => <button type="button" key={item} aria-pressed={side === item} onClick={() => pickSide(item)}>{sideName(match, item)}</button>)}
        <button type="button" aria-pressed={side === "d"} onClick={() => pickSide("d")}>ড্র</button>
      </div>
    </fieldset>
    {side && side !== "d" && <fieldset className="ab-pick ab-margin">
      <legend>কত ব্যবধানে? <small>আবার চাপলে বাদ</small></legend>
      <div className="ab-kind">
        <button type="button" aria-pressed={kind === "w"} onClick={() => { setKind("w"); if (!margin.startsWith("w")) onChange(cricketPick(side, "w5")); }}>উইকেটে</button>
        <button type="button" aria-pressed={kind === "r"} onClick={() => { setKind("r"); if (!margin.startsWith("r")) onChange(cricketPick(side, "r2")); }}>রানে</button>
      </div>
      <div className={`ab-chips ab-nums ab-nums-${kind}`}>
        {kind === "w"
          ? wickets.map(count => { const id = `w${count}`; return <button type="button" key={id} aria-pressed={margin === id} aria-label={`${bn(count)} উইকেটে`} onClick={() => onChange(cricketPick(side, margin === id ? "" : id))}>{bn(count)}</button>; })
          : runBands.map(band => <button type="button" key={band.id} aria-pressed={margin === band.id} aria-label={`${band.label} রানে`} onClick={() => onChange(cricketPick(side, margin === band.id ? "" : band.id))}>{band.label}</button>)}
      </div>
    </fieldset>}
  </>;
}

function TeamSelect({ match, side, onChange }: { match: Match; side: "a" | "b"; onChange: (id: string) => void }) {
  const sport = sports.find(item => item.id === match.sport)!;
  const options = (group: string) => teams[match.sport].filter(team => team.group === group).map(team => <option key={team.id} value={team.id}>{team.name}</option>);
  return <label className="ab-team">
    <span>{side === "a" ? "এক দল" : "আরেক দল"}</span>
    <select value={match[side]} onChange={event => onChange(event.target.value)}>
      {options("")}
      {sport.groups.map(group => <optgroup key={group.id} label={group.label}>{options(group.id)}</optgroup>)}
    </select>
  </label>;
}

export function Envelope() {
  const [match, setMatch] = useState<Match>({ sport: "c", a: defaults.c.a, b: defaults.c.b });
  const [draft, setDraft] = useState<Entry>({ pick: defaults.c.pick, name: "" });
  // Calls already sealed in a friend's envelope; your own draft joins them when you seal.
  const [others, setOthers] = useState<Entry[]>([]);
  const [mine, setMine] = useState(false);
  const [mode, setMode] = useState<Mode>("compose");
  const [breaking, setBreaking] = useState(false);
  const [fromLink, setFromLink] = useState(false);
  const [result, setResult] = useState("");
  const [resultDraft, setResultDraft] = useState("");
  const [touched, setTouched] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [everyone, setEveryone] = useState<Tally | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [announce, setAnnounce] = useState("");
  const desk = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const sealRef = useRef<HTMLDivElement>(null);
  const resultVisible = useInView(resultRef);
  const sealVisible = useInView(sealRef);

  const locked = others.length > 0;
  const entries = useMemo(() => (mode === "compose" || mine ? [...others, draft] : others), [mode, mine, others, draft]);
  const shared = useMemo(() => ({ ...match, entries, result: mode === "opened" ? result : "" }), [match, entries, mode, result]);
  const card = useMemo(() => createCard(shared, mode === "opened"), [shared, mode]);
  const state = shareHash(shared).slice(1);
  const full = others.length >= MAX_ENTRIES;
  const split = everyone ? pairSplit(match, everyone.counts) : null;

  useEffect(() => {
    // In-page anchors (#result, #ab-seal) also change the hash, so only a real shared envelope replaces the state.
    const readLink = () => {
      const link = parseShareHash(window.location.hash);
      if (!link) return;
      setMatch({ sport: link.sport, a: link.a, b: link.b });
      setOthers(link.entries);
      setDraft({ pick: defaults[link.sport].pick, name: "" });
      setMine(false);
      setResult(link.result);
      setResultDraft(link.result || (link.sport === "f" ? "00" : ""));
      setMode(link.result ? "opened" : "sealed");
      setFromLink(true);
    };
    readLink();
    window.addEventListener("hashchange", readLink);
    setSite(window.location.host);
    readTally(TOOL).then(setEveryone);
    return () => window.removeEventListener("hashchange", readLink);
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("আমি বলেছিলাম! বাংলাদেশ জিতবে ৫ উইকেটে").then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, card, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [card, format, site]);

  function edit(next: Partial<Entry>) {
    setDraft(current => ({ ...current, ...next }));
    setTouched(true);
    setCounted(current => (current === "done" ? "idle" : current));
  }

  function changeSport(sport: SportId) {
    if (sport === match.sport) return;
    setMatch({ sport, a: defaults[sport].a, b: defaults[sport].b });
    edit({ pick: defaults[sport].pick });
  }

  function changeTeam(side: "a" | "b", id: string) {
    const other = side === "a" ? "b" : "a";
    // Picking the team already on the other side swaps the two instead of making "বাংলাদেশ বনাম বাংলাদেশ".
    setMatch(current => (current[other] === id ? { ...current, [side]: id, [other]: current[side] } : { ...current, [side]: id }));
    setTouched(true);
    setCounted(current => (current === "done" ? "idle" : current));
  }

  function seal() {
    if (full && !mine) return;
    setMine(true);
    setMode("sealed");
    setAnnounce("খাম সিল হয়ে গেছে।");
    desk.current?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  }

  function breakSeal() {
    if (mode !== "sealed" || breaking) return;
    try { navigator.vibrate?.(30); } catch { /* not every phone allows it */ }
    const open = () => { setMode("opened"); setBreaking(false); setAnnounce("সিল ভাঙা হলো। খেলার আগে যা লেখা হয়েছিল, এখন দেখা যাচ্ছে।"); };
    if (reducedMotion()) { open(); return; }
    setBreaking(true);
    window.setTimeout(open, BREAK_MS);
  }

  function startAdding() {
    setMode("compose");
    setTouched(true);
    window.setTimeout(() => document.getElementById("ab-compose")?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" }), 0);
  }

  function startFresh() {
    setMatch({ sport: "c", a: defaults.c.a, b: defaults.c.b });
    setDraft({ pick: defaults.c.pick, name: "" });
    setOthers([]);
    setMine(false);
    setResult("");
    setResultDraft("");
    setFromLink(false);
    setMode("compose");
    setCounted("idle");
    history.replaceState(null, "", window.location.pathname);
    desk.current?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  }

  async function countMine() {
    setCounted("sending");
    let calls: Record<string, string> = {};
    try { calls = JSON.parse(localStorage.getItem(CALLS_KEY) ?? "{}") ?? {}; } catch { /* private mode: count just this one */ }
    const id = tallyId(match, draft.pick);
    calls[id.slice(0, id.lastIndexOf("."))] = id;
    const tally = await addToTally(TOOL, Object.values(calls).filter(item => tallyIds.includes(item)));
    if (!tally) { setCounted("failed"); return; }
    try { localStorage.setItem(CALLS_KEY, JSON.stringify(calls)); } catch { /* fine */ }
    setEveryone(tally);
    setCounted("done");
  }

  const myLabel = draft.name.trim() ? possessive(draft.name.trim()) : locked ? "তোমার" : "আমার";
  // Seen from the friend's side, an unnamed sender is "এক বন্ধু", not "আমি".
  const senderNames = others.map((entry, index) => entry.name || (index ? `বন্ধু ${bn(index + 1)}` : "এক বন্ধু"));
  const senders = senderNames.length > 3 ? `${senderNames[0]}সহ ${bn(senderNames.length)} জন` : senderNames.length > 1 ? `${senderNames.slice(0, -1).join(", ")} আর ${senderNames.at(-1)}` : senderNames[0];
  const linkCard = fromLink && !mine ? createCard({ ...match, entries: others, result }, Boolean(result)) : null;
  const heading = mode === "compose" ? "সিল করলে কার্ডটা এমন হবে" : mode === "sealed" ? "খাম সিল হয়ে গেছে" : card.title;
  const sticky = mode === "compose"
    ? { show: touched && !sealVisible && !resultVisible, title: <strong>{pickText(match, draft.pick)}</strong>, sub: matchTitle(match), href: "#ab-seal", label: "সিল করো" }
    : { show: (mine || touched) && !resultVisible, title: <strong>{mode === "opened" ? card.title : "খাম সিল হয়ে গেছে"}</strong>, sub: matchTitle(match), href: "#result", label: "কার্ডটা দেখো" };

  return (
    <div className="ab">
      {linkCard && (mode === "sealed" || result) && (
        <section className="ab-banner" aria-labelledby="ab-banner-title">
          {mode === "sealed" || breaking ? <>
            <p className="ab-kicker">তোমার জন্য একটা সিল করা খাম এসেছে</p>
            <h2 id="ab-banner-title">{senders} খেলার আগেই ভবিষ্যদ্বাণী সিল করে রেখেছে: {matchTitle(match)}। <span>তুমি কী বলো? তোমারটাও খামে ভরো।</span></h2>
            <div className="ab-banner-actions">
              <button type="button" className="kit-primary" onClick={startAdding} disabled={full}>তোমারটাও যোগ করো</button>
              <button type="button" className="kit-link" onClick={startFresh}>অন্য ম্যাচ ধরো</button>
            </div>
            {full && <p className="kit-status">খামে {bn(MAX_ENTRIES)} জনের বেশি ধরে না। চাইলে নিজের আলাদা খাম বানাও।</p>}
          </> : <>
            <p className="ab-kicker">খাম খোলা হয়েছে</p>
            <h2 id="ab-banner-title">{previewTitle({ ...match, entries: others, result })} <span>{linkCard.result}</span></h2>
            <div className="ab-banner-actions"><button type="button" className="kit-primary" onClick={startFresh}>পরের খেলারটা আমি বলি</button></div>
          </>}
        </section>
      )}

      <div className="ab-desk" ref={desk} data-mode={mode}>
        {mode === "compose" && !locked && (
          <div className="ab-sport" role="group" aria-label="কোন খেলা?">
            {sports.map(item => <button type="button" key={item.id} aria-pressed={match.sport === item.id} onClick={() => changeSport(item.id)}>{item.label}</button>)}
          </div>
        )}

        {mode !== "opened" ? (
          <div className="ab-stage" data-mode={mode} data-breaking={breaking || undefined}>
            <div className="ab-env">
              <div className="ab-env-back" />
              <div className="ab-flap" />
              <div className="ab-mouth">
                <div className="ab-slip" aria-hidden={mode !== "compose"}>
                  <p className="ab-slip-who">{myLabel} কথা:</p>
                  <p className="ab-slip-pick">{pickText(match, draft.pick)}</p>
                </div>
              </div>
              <div className="ab-front">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M1 99L40 60M99 99L60 60" /></svg>
              </div>
              <p className="ab-label">
                <strong>{matchTitle(match)}</strong>
                <span>{mode === "compose" ? (locked ? `ভেতরে আছে: ${others.map(displayName).join(", ")}` : sportLabel(match.sport)) : card.inside}</span>
              </p>
              {mode === "sealed" && <span className="ab-stamp" aria-hidden="true">খেলার পর খুলবে</span>}
              {mode === "sealed" && (
                <button type="button" className="ab-seal" onClick={breakSeal} aria-label="সিল ভাঙো, খাম খোলো">
                  <span className="ab-half ab-half-l"><SealArt sport={match.sport} /></span>
                  <span className="ab-half ab-half-r"><SealArt sport={match.sport} /></span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="ab-open">
            <div className="ab-chit">
              {card.rows.length === 1 ? <>
                <p className="ab-chit-who">{card.rows[0].name === "আমি" ? "আমার" : possessive(card.rows[0].name)} কথা, খেলার আগে:</p>
                <p className="ab-chit-big">{card.rows[0].text}</p>
                {card.rows[0].verdict && <b key={result} className="ab-verdict ab-verdict-big" data-verdict={card.rows[0].verdict}>{verdictLabel[card.rows[0].verdict]}</b>}
              </> : <>
                <p className="ab-chit-who">খেলার আগে যা লেখা হয়েছিল</p>
                <ol>{card.rows.map((row, index) => <li key={index}><strong>{row.name}</strong><span>{row.text}</span>{row.verdict && <b key={result} className="ab-verdict" data-verdict={row.verdict}>{verdictLabel[row.verdict]}</b>}</li>)}</ol>
              </>}
            </div>
            <div className="ab-open-env">
              <div className="ab-open-flap" />
              <div className="ab-open-front" />
              <span className="ab-half ab-half-l ab-fallen"><SealArt sport={match.sport} /></span>
              <span className="ab-half ab-half-r ab-fallen"><SealArt sport={match.sport} /></span>
            </div>
          </div>
        )}

        {mode === "sealed" && <p className="ab-hint">খেলা শেষ? <strong>সিলে চাপ দাও</strong></p>}
      </div>
      <p className="ab-sr" role="status" aria-live="polite">{announce}</p>

      {mode === "compose" && (
        <div className="ab-controls" id="ab-compose">
          {locked
            ? <p className="ab-locked"><strong>{matchTitle(match)}</strong> · {sportLabel(match.sport)} <span>খামের দল দুটো বদলানো যাবে না</span></p>
            : <div className="ab-teams">
              <TeamSelect match={match} side="a" onChange={id => changeTeam("a", id)} />
              <b aria-hidden="true">বনাম</b>
              <TeamSelect match={match} side="b" onChange={id => changeTeam("b", id)} />
            </div>}
          <PickControls key={match.sport} match={match} value={draft.pick} onChange={pick => edit({ pick })} legend={match.sport === "f" ? "স্কোর কত হবে?" : "কে জিতবে?"} autoMargin />
          <p className="ab-call">{split?.text ? <>এখানে <strong>{split.text}</strong> <small>({bn(split.total)} জনের কথা)</small></> : <>খামে যাবে: <strong>{pickText(match, draft.pick)}</strong></>}</p>
          <label className="ab-field">
            <span>{locked ? "তোমার নাম" : "নাম"} <small>{locked ? "যাতে সবাই চেনে" : "না দিলেও চলবে"}</small></span>
            <input value={draft.name} maxLength={MAX_NAME_LENGTH} onChange={event => edit({ name: event.target.value })} placeholder={locked ? "যেমন: মিম" : "যেমন: রাফি"} autoComplete="nickname" />
          </label>
          <div className="ab-seal-step" id="ab-seal" ref={sealRef}>
            <button type="button" className="kit-primary ab-seal-cta" onClick={seal} disabled={full && !mine}>
              <i aria-hidden="true" />{locked ? `আমারটাও খামে ভরো (${bn(others.length + 1)}/${bn(MAX_ENTRIES)})` : "খামে ভরে সিল করো"}
            </button>
            {locked && <button type="button" className="kit-link" onClick={() => setMode("sealed")}>থাক, শুধু খামটা দেখি</button>}
          </div>
        </div>
      )}

      {mode === "sealed" && mine && (
        <div className="ab-after">
          <p>{locked ? `তোমারটাও খামে ঢুকেছে, এখন ভেতরে ${bn(entries.length)} জন।` : "সিল হয়ে গেছে!"} কার্ডটা শেয়ার করো, আর খেলা শেষে এই লিংক খুলে সিল ভেঙো।</p>
          <button type="button" className="kit-link" onClick={() => setMode("compose")}>খাম খুলে বদলাও</button>
        </div>
      )}

      {mode === "opened" && (
        <div className="ab-controls ab-real">
          <PickControls key={`r-${match.sport}`} match={match} value={resultDraft} onChange={setResultDraft} legend={match.sport === "f" ? "আসলে স্কোর কত হলো?" : "আসলে কে জিতল?"} />
          <button type="button" className="kit-primary" disabled={!resultDraft} onClick={() => { setResult(resultDraft); setTouched(true); }}>{result ? "ফল বদলাও" : "ফল মিলিয়ে দেখো"}</button>
          <p className="ab-honour">সিলটা সম্মানের: আমরা খেলার ফল জানি না, তুমি যা বসাবে, তাই।</p>
        </div>
      )}

      <StickyNext show={sticky.show} title={sticky.title} sub={sticky.sub} href={sticky.href} label={sticky.label} />

      <section className="ab-result" id="result" ref={resultRef} aria-labelledby="result-title">
        <h2 id="result-title">{heading}</h2>
        <p className="ab-line">{card.result ? `${card.result}। ` : ""}{card.line}</p>
        <div className="ab-result-body">
          <figure className="kit-card" data-format={format}>
            <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="ab-card-summary" />
            <figcaption id="ab-card-summary" className="ab-sr">{card.kicker}। {card.title}। {card.opened ? card.rows.map(row => `${row.name}: ${row.text}${row.verdict ? `, ${verdictLabel[row.verdict]}` : ""}`).join("। ") : `${card.match}, ${card.inside}। ভবিষ্যদ্বাণী সিল করা।`} {card.line}</figcaption>
            {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
          </figure>
          <div className="ab-share">
            <FormatToggle value={format} onChange={setFormat} />
            <ShareBar tool={TOOL} fileName="ami-bolechhilam.png" makeImage={() => cardBlob(card, format, site)} imageKey={`${state}|${format}|${mode}`} caption={card.caption} state={state}
              hint={mode === "opened" ? "লিংক খুললে সবাই খোলা খাম আর ফল দেখবে।" : `লিংক পেলে বন্ধু খামটা দেখবে, নিজের ভবিষ্যদ্বাণীও যোগ করতে পারবে (${bn(MAX_ENTRIES)} জন পর্যন্ত)।`} />
            {(mode !== "compose" || fromLink) && <button type="button" className="kit-link ab-again" onClick={startFresh}>নতুন ম্যাচের খাম বানাও</button>}
          </div>
        </div>

        {(mode === "compose" || mine) && (
          <div className="ab-everyone">
            <h3>{matchTitle(match)}: সবাই কী বলছে?</h3>
            {split?.text && <p>এখন পর্যন্ত <strong>{split.text}</strong> <small>({bn(split.total)} জনের কথা)</small></p>}
            {counted === "done"
              ? <p className="kit-status">তোমার কথাটা গোনা হয়েছে!{split?.text ? "" : " এখনো খুব কম মানুষ গুনিয়েছে, বন্ধুদের লিংক পাঠাও।"}</p>
              : <>
                <p className="ab-muted">চাইলে তোমার কথাটা সবার হিসাবে যোগ করো। শুধু কে জিতবে সেটা গোনা হবে; নাম, ব্যবধান বা স্কোর না।</p>
                <button type="button" className="kit-secondary" onClick={countMine} disabled={counted === "sending"}>{counted === "sending" ? "যোগ হচ্ছে…" : "আমার কথাটাও গোনো"}</button>
                {counted === "failed" && <p className="kit-status" role="alert">এখন যোগ করা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
              </>}
          </div>
        )}
      </section>
    </div>
  );
}
