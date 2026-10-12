"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { addToTally, readTally, type Tally } from "../../../shared/share-client";
import { FormatToggle, ShareBar, StickyNext, useInView } from "../../../shared/share-kit";
import { cardBlob, drawCard, loadScene } from "../lib/draw-card";
import { fanScore, scoreLine } from "../lib/fan";
import { bn, caption, divisions, divisionSplit, isFanTeam, laneTitle, nationalSplit, parseShareHash, possessive, roofTitle, shareHash, splitText, supportLine, teamOf, teams, voteItems, years, MAX_NAME_LENGTH, type DivisionId, type Roof, type Split, type TeamId, type Year } from "../lib/roof";
import { sceneSvg } from "../lib/scene";
import { FanTest } from "./fan-test";

const TOOL = "argentina-na-brazil";
const others = teams.filter(team => team.id !== "arg" && team.id !== "bra");

function SplitBar({ split, label }: { split: Split | null; label: string }) {
  if (!split) return <p className="abn-split abn-split-wait">{label}: <strong>গোনা চলছে…</strong></p>;
  return <div className="abn-split">
    <p>{label}: <strong>{splitText(split)}</strong></p>
    <div className="abn-split-bar" aria-hidden="true"><i data-team="arg" style={{ width: `${split.arg}%` }} /><i data-team="bra" style={{ width: `${split.bra}%` }} /><i style={{ width: `${split.other}%` }} /></div>
    <small>একটুখানিতে {bn(split.total)} জনের দেওয়া হিসাব, জরিপ না</small>
  </div>;
}

export function RoofBuilder() {
  const [team, setTeam] = useState<TeamId | null>(null);
  const [year, setYear] = useState<Year | null>(null);
  const [name, setName] = useState("");
  const [showOthers, setShowOthers] = useState(false);
  const [neighbour, setNeighbour] = useState<Roof | null>(null);
  const [linkSeed, setLinkSeed] = useState<number | null>(null);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [tally, setTally] = useState<Tally | null>(null);
  const [division, setDivision] = useState<DivisionId | null>(null);
  const [counted, setCounted] = useState<"idle" | "sending" | "done" | "failed">("idle");
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  // Once the fan test is on screen the roof card is behind you; the pinned bar would cover the answer buttons.
  const fanBox = useRef<HTMLDivElement>(null);
  const fanVisible = useInView(fanBox, 0.01);

  const shared = useMemo(() => team ? { own: { team, year, name }, neighbour } : null, [team, year, name, neighbour]);
  const state = shared ? shareHash(shared).slice(1) : "";
  const split = useMemo(() => nationalSplit(tally), [tally]);
  const stage = useMemo(() => sceneSvg({ width: 1080, height: 720, ground: 664, poleTop: 104, houses: neighbour ? [{ team: neighbour.team }, { team }] : [{ team }], id: "stage" }), [team, neighbour]);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared card sets the house next door.
    const readLink = () => { const link = parseShareHash(window.location.hash); if (link) { setNeighbour(link.own); setLinkSeed(link.seed ?? null); } };
    readLink();
    window.addEventListener("hashchange", readLink);
    setSite(window.location.host);
    readTally(TOOL).then(setTally);
    return () => window.removeEventListener("hashchange", readLink);
  }, []);

  useEffect(() => {
    if (!shared) return;
    let cancelled = false;
    Promise.all([loadScene(shared, format), loadCardFonts("আর্জেন্টিনা ব্রাজিল")]).then(([scene]) => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, scene, shared, format, site, split);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [shared, format, site, split]);

  function pick(id: TeamId) {
    setTeam(id);
    // A changed team makes the earlier count stale; let them count again.
    setCounted(current => current === "done" ? "idle" : current);
  }

  async function count() {
    if (!team) return;
    setCounted("sending");
    const next = await addToTally(TOOL, voteItems(team, division));
    if (next) { setTally(next); setCounted("done"); } else setCounted("failed");
  }

  const neighbourName = neighbour ? (neighbour.name ? possessive(neighbour.name) : "বন্ধুর") : "";

  return (
    <div className="abn">
      {neighbour && <p className="abn-friend" role="status">
        <span>{neighbourName} ছাদে {possessive(teamOf(neighbour.team).label)} পতাকা উড়ছে।</span>
        {neighbour.quiz && linkSeed !== null && <span>আসল ফ্যান পরীক্ষায় {neighbour.name || "বন্ধু"} পেয়েছে {scoreLine(fanScore(neighbour.team, linkSeed, neighbour.quiz))}।</span>}
        <strong>পাশের বাসাটা তোমার। কোন পতাকা তুলবে?</strong>
      </p>}

      <div className={`abn-stage${neighbour ? " abn-stage-pair" : ""}`}>
        <div className="abn-scene" key={`${team}-${neighbour?.team}`} dangerouslySetInnerHTML={{ __html: stage }} />
        {neighbour && <><span className="abn-tag abn-tag-left">{neighbour.name || "পাশের বাসা"}</span><span className="abn-tag abn-tag-right">{name.trim() || "তোমার বাসা"}</span></>}
        {!team && <p className="abn-stage-hint">{neighbour ? "তোমার খুঁটি খালি" : "খুঁটি খালি। পতাকা বেছে নাও"}</p>}
      </div>

      <fieldset className="abn-teams">
        <legend className="abn-sr">তোমার দল বেছে নাও</legend>
        <div className="abn-big">
          {(["arg", "bra"] as const).map(id => <button type="button" key={id} data-team={id} aria-pressed={team === id} onClick={() => pick(id)}><span>{teamOf(id).label}</span></button>)}
        </div>
        <button type="button" className="abn-more" aria-expanded={showOthers} aria-controls="abn-others" onClick={() => setShowOthers(open => !open)}>{showOthers ? "অন্য দল লুকাও" : "অন্য দল?"}</button>
        <div className="abn-others" id="abn-others" hidden={!showOthers}>
          {others.map(item => <button type="button" key={item.id} data-team={item.id} aria-pressed={team === item.id} onClick={() => pick(item.id)}><i aria-hidden="true" />{item.label}</button>)}
        </div>
      </fieldset>

      <SplitBar split={split} label="দেশে এখন" />

      {shared && <>
        <div className="abn-details">
          <fieldset className="abn-years">
            <legend>কবে থেকে {teamOf(shared.own.team).label}?</legend>
            <div>{years.map(item => <button type="button" key={item} aria-pressed={year === item} onClick={() => setYear(current => current === item ? null : item)}>{bn(item)}</button>)}</div>
            <small>যে বিশ্বকাপ থেকে মন দিয়েছ</small>
          </fieldset>
          <label className="abn-field">
            <span>নাম <small>না দিলেও চলবে</small></span>
            <input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" />
          </label>
        </div>

        <StickyNext show={!resultVisible && !fanVisible} title={<><strong>{teamOf(shared.own.team).label}</strong> উড়ছে</>} sub={supportLine(year)} href="#result" label="কার্ডটা দেখো" />

        <section className="abn-result" id="result" ref={result} aria-labelledby="result-title">
          <h2 id="result-title">{neighbour ? `${laneTitle(shared.own, neighbour)}, একই গলিতে` : roofTitle(shared.own)}</h2>
          <div className="abn-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={caption(shared)} />
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="abn-controls">
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="chhader-pataka.png" makeImage={() => cardBlob(shared, format, site, split)} imageKey={`${state}|${format}|${split?.total ?? 0}`} caption={caption(shared)} state={state} hint="লিংক পেলে বন্ধু দেখবে তোমার ছাদ, আর পাশের বাসায় নিজের পতাকা তুলবে।" />

              <div className="abn-count">
                <h3>দেশের গোনায় তোমার দলও যোগ করবে?</h3>
                {counted !== "done" ? <>
                  <p>শুধু দল আর (দিলে) বিভাগ গোনা হয়। নাম যায় না।</p>
                  <fieldset className="kit-chips">
                    <legend>কোথা থেকে দেখছ? <small>না দিলেও চলবে</small></legend>
                    {divisions.map(item => <button type="button" key={item.id} aria-pressed={division === item.id} onClick={() => setDivision(current => current === item.id ? null : item.id)}>{item.label}</button>)}
                  </fieldset>
                  <button type="button" className="kit-secondary" onClick={count} disabled={counted === "sending"}>{counted === "sending" ? "গোনা হচ্ছে…" : "আমার দলটাও গোনো"}</button>
                  {counted === "failed" && <p className="kit-status" role="alert">এখন গোনা গেল না। একটু পরে আবার চেষ্টা করো।</p>}
                </> : <>
                  <p className="abn-counted">গোনা হয়েছে। দল বদলালে আবার গুনিয়ে নিও, আগেরটা বাদ যাবে।</p>
                  {division && <SplitBar split={divisionSplit(tally, division)} label={division === "bidesh" ? "বিদেশে" : `${divisions.find(item => item.id === division)!.label} বিভাগে`} />}
                </>}
              </div>
            </div>
          </div>
        </section>

        {isFanTeam(shared.own.team) && <div ref={fanBox}><FanTest key={`${shared.own.team}-${linkSeed}`} own={shared.own} team={shared.own.team} neighbour={neighbour} linkSeed={linkSeed} site={site} /></div>}
      </>}

      <p className="abn-safety">পতাকা টাঙাতে ছাদে উঠলে বিদ্যুতের তার থেকে দূরে থেকো। খেলা খেলার জায়গায়, বন্ধুত্ব আগে।</p>
    </div>
  );
}
