"use client";
// IP: what we avoided — no police uniform, cap, badge, insignia or real-police jokes (পুলিশ is only a word on a chit and a magnifying-glass doodle); no app, brand or TV-show look; plate, chits and doodles drawn fresh.

import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, confetti, hiss, newSeed, sfx, tone, useBest, useSlowMode } from "../../../shared/game-kit";
import { SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cardBlob, drawCard } from "../lib/draw-card";
import { act, BABU, bn, CHOR, DAKAT, clampPoints, dative, dealFor, DEFAULT_POINTS, MAX_NAME, MAX_ROUNDS, nameOf, newPlay, occasions, ordinal, PLAYERS, POLICE, ROUND_CHOICES, roleNames, roundPoints, standings, suspects, totals, type Action, type Game, type Play, type Role } from "../lib/game";
import { caption, friendBanner, gameHash, gameTitle, humanLine, parseGame, recordLine, roundNews, scoreLine, versusLine, winnerLine } from "../lib/result";
import { ClosedEyes, RoleDoodle } from "./art";

const TOOL = "chor-police";
const SAVED = "chor-police-game";
// A second tap that lands within this long after a screen changes is ignored, so a double tap on "দেখেছি" can't skip the hand-off.
const SETTLE_MS = 450;
// The drumroll before the chits open after the police names someone.
const ROLL_MS = 750;
const SLOTS = [{ x: 27, y: 42, r: -14 }, { x: 52, y: 27, r: 8 }, { x: 74, y: 48, r: -6 }, { x: 48, y: 66, r: 15 }];

/** A folded paper chit: one dry rustle for every role, so the sound never gives a chit away. */
const rustle = () => { hiss(0.08, 0.1, 3600, "highpass"); hiss(0.1, 0.07, 2400, "bandpass", 0.06); };
/** Quick low taps that speed up, the way a reveal is drummed on a table. */
function drumroll() {
  let at = 0;
  for (let hit = 0; hit < 12; hit++) { tone(120 + hit * 6, 0.07, 0.11, "triangle", at); at += 0.085 - hit * 0.004; }
}
/** The police named the ডাকাত: a falling whistle, a joke on the police, not a buzzer. */
const whiff = () => { tone(620, 0.42, 0.09, "triangle", 0, 240); buzz(30); };

const freshGame = (): Game => ({ seed: newSeed(), names: ["", "", "", ""], points: [...DEFAULT_POINTS], caught: [], occasion: "aj" });

function roleTip(role: Role, points: readonly number[]) {
  if (role === BABU) return `${bn(points[0])} পয়েন্ট পাকা। চুপচাপ মজা দেখো।`;
  if (role === POLICE) return "একটু পরে তোমাকেই চোর ধরতে হবে। সবার মুখ খেয়াল করো!";
  if (role === DAKAT) return `${bn(points[DAKAT])} পাকা। মুখ গম্ভীর রাখো, পুলিশ যেন তোমাকেই চোর ভাবে।`;
  return `ধরা না পড়লে পুলিশের ${bn(points[1])} তোমার! হাসি চেপে রাখো।`;
}

function Thala({ count, onPick, interactive }: { count: number; onPick?: (slot: number) => void; interactive?: boolean }) {
  return <div className="cp-thala" aria-label={interactive ? `থালায় ${bn(count)}টা চিরকুট` : undefined} role={interactive ? "group" : undefined}>
    {SLOTS.slice(0, count).map((slot, index) => {
      const style = { "--x": `${slot.x}%`, "--y": `${slot.y}%`, "--r": `${slot.r}deg` } as CSSProperties;
      return interactive
        ? <button key={index} type="button" className="cp-chit" style={style} onClick={() => onPick?.(index)} aria-label={`${bn(index + 1)} নম্বর চিরকুট তোলো`} />
        : <span key={index} className="cp-chit" style={style} aria-hidden="true" />;
    })}
  </div>;
}

function OpenChit({ role, name, points, delta }: { role: Role; name: string; points?: number; delta?: number }) {
  return <div className="cp-open" data-role={role}>
    <span className="cp-open-name">{name}</span>
    <RoleDoodle role={role} />
    <b>{roleNames[role]}</b>
    {delta !== undefined ? <span className="cp-open-points">+{bn(delta)}</span> : points !== undefined && <span className="cp-open-points">{bn(points)}</span>}
  </div>;
}

function NameFields({ names, onChange, legend }: { names: string[]; onChange: (seat: number, value: string) => void; legend: string }) {
  return <fieldset className="cp-names">
    <legend>{legend}</legend>
    {names.map((name, seat) => (
      <label key={seat}>
        <span aria-hidden="true">{bn(seat + 1)}</span>
        <input value={name} maxLength={MAX_NAME} onChange={event => onChange(seat, event.target.value)} placeholder={["আম্মু", "ভাইয়া", "আপু", "আমি"][seat]} aria-label={`${bn(seat + 1)} নম্বর খেলোয়াড়ের নাম`} autoComplete="off" />
      </label>
    ))}
  </fieldset>;
}

export function ChitGame() {
  const [play, setPlay] = useState<Play>(() => newPlay({ seed: 1, names: ["", "", "", ""], points: [...DEFAULT_POINTS], caught: [], occasion: "aj" }));
  const [picked, setPicked] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [friend, setFriend] = useState<Game | null>(null);
  const [slow, setSlow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL);
  const [record, setRecord] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [rolling, setRolling] = useState<number | null>(null);
  const changedAt = useRef(0);
  const rollTimer = useRef(0);
  const stage = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);

  const { game, phase, turn, seen, limit } = play;
  const rounds = game.caught.length;
  const over = phase === "over";
  const state = rounds ? gameHash(game) : "";
  const scores = totals(game);
  // The round being dealt; on the reveal screen, the one just scored.
  const shown = phase === "reveal" ? rounds - 1 : rounds;
  const roles = dealFor(game.seed, Math.min(shown, MAX_ROUNDS - 1));
  const lastPoints = phase === "reveal" ? roundPoints(roles, game.caught[rounds - 1], game.points) : null;
  const name = (seat: number) => nameOf(game.names, seat);
  const versus = over && friend ? versusLine(game, friend) : "";

  function dispatch(action: Action, guard = true) {
    if (guard && performance.now() - changedAt.current < SETTLE_MS) return;
    changedAt.current = performance.now();
    window.clearTimeout(rollTimer.current);
    setRolling(null);
    setOpen(false);
    setPicked(null);
    setPlay(current => act(current, action));
  }

  const edit = (change: Partial<Game>) => setPlay(current => ({ ...current, game: { ...current.game, ...change } }));
  const rename = (seat: number, value: string) => edit({ names: game.names.map((old, index) => index === seat ? value.slice(0, MAX_NAME) : old) });

  useEffect(() => {
    // In-page anchors (#result) also change the hash: only a real scoreboard link counts as a friend's game.
    const readFriend = () => { const shared = parseGame(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    let start = freshGame(), startLimit: number = ROUND_CHOICES[0];
    try {
      const saved = JSON.parse(localStorage.getItem(SAVED) ?? "null") as { h?: string; l?: number } | null;
      const game = saved?.h ? parseGame(saved.h, 0) : null;
      const savedLimit = Math.min(MAX_ROUNDS, Math.max(1, Math.round(Number(saved?.l)) || ROUND_CHOICES[0]));
      // An unfinished evening comes back paused; a finished one keeps only the names and house points.
      if (game) {
        start = game.caught.length && game.caught.length < savedLimit ? game : { ...game, seed: newSeed(), caught: [] };
        startLimit = savedLimit;
      }
    } catch { /* private mode or an old save: start fresh */ }
    setPlay(newPlay(start, startLimit));
    setLoaded(true);
    setSite(window.location.host);
    window.addEventListener("hashchange", readFriend);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  // Keep the evening on this phone, so a reload while the phone goes round doesn't wipe the scores.
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(SAVED, JSON.stringify({ h: gameHash(game), l: limit })); } catch { /* nothing to do */ }
  }, [game, limit, loaded]);

  useEffect(() => {
    if (!over) return;
    const top = standings(game)[0].total, beaten = submitBest(top) && best !== null;
    setRecord(beaten);
    // A finished evening is the one real win here: a fanfare and confetti (a new record gets the bigger one).
    if (beaten) sfx.levelUp(); else sfx.win();
    if (!slow) confetti();
    // Only when an evening ends or grows; `best` changing must not re-run it.
  }, [over, rounds]);

  // A chit never stays open if the phone locks or the tab is switched mid-peek.
  useEffect(() => {
    const hide = () => setOpen(false);
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", hide);
    return () => { document.removeEventListener("visibilitychange", hide); window.removeEventListener("blur", hide); window.clearTimeout(rollTimer.current); };
  }, []);

  useEffect(() => {
    if (!over && !friend) return;
    let cancelled = false;
    loadCardFonts("চোর-পুলিশ আম্মু ২৩০০").then(() => {
      if (cancelled) return;
      if (over && preview.current) drawCard(preview.current, game, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, over, format, site, friend]);

  const main: { label: string; action: Action; disabled?: boolean } | null =
    phase === "setup" ? { label: rounds ? `চালিয়ে যাও · ${ordinal(rounds)} দান` : "চিরকুট তোলো", action: { type: "start" } }
    : phase === "pass" ? { label: `আমি ${name(turn)}, চিরকুট তুলব`, action: { type: "ready" } }
    : phase === "peek" ? { label: picked === null ? "আগে একটা চিরকুট তোলো" : seen ? "দেখেছি, ভাঁজ করে রাখলাম" : "আগে চেপে ধরে দেখো", action: { type: "done" }, disabled: !seen }
    : phase === "call" ? { label: "বাবু-পুলিশ কে, দেখাও", action: { type: "call" } }
    : phase === "reveal" ? { label: rounds >= limit ? "ফল দেখো" : "আরেক দান", action: { type: "next" } }
    : phase === "over" ? { label: "আরেকবার", action: { type: "next" } }
    : null;
  function press() {
    if (over) { sfx.tap(); again(); return; }
    if (!main || performance.now() - changedAt.current < SETTLE_MS) return;
    if (phase === "setup" || phase === "peek") rustle(); else if (phase === "call") sfx.pop(); else sfx.tap();
    dispatch(main.action);
  }

  /** The police points: a drumroll, then everyone's chit opens. */
  function accuse(seat: number) {
    if (rolling !== null || performance.now() - changedAt.current < SETTLE_MS) return;
    setRolling(seat);
    drumroll();
    rollTimer.current = window.setTimeout(() => {
      const caught = roles[seat] === CHOR;
      if (caught) sfx.good(); else whiff();
      dispatch({ type: "guess", seat }, false);
    }, ROLL_MS);
  }

  function again() {
    dispatch({ type: "again", seed: newSeed() }, false);
    if ((stage.current?.getBoundingClientRect().top ?? 0) < 0) stage.current?.scrollIntoView({ block: "start" });
  }

  function reset() {
    if (rounds && !window.confirm("এই খেলার স্কোর মুছে নতুন করে শুরু করবে?")) return;
    dispatch({ type: "reset", seed: newSeed() }, false);
  }

  function pickChit(slot: number) {
    if (performance.now() - changedAt.current < SETTLE_MS) return;
    setPicked(slot);
    rustle();
    if (!slow) buzz(10);
  }

  function reveal(show: boolean) {
    setOpen(show);
    if (show) rustle();
    if (show && !seen) setPlay(current => act(current, { type: "saw" }));
  }
  function holdStart(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary) return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* the finger already lifted */ }
    reveal(true);
  }
  function holdKey(event: ReactKeyboardEvent<HTMLButtonElement>, down: boolean) {
    if (event.key !== " " && event.key !== "Enter") return;
    event.preventDefault();
    if (!down || !event.repeat) reveal(down);
  }

  // Enter or Space presses the big button from anywhere on the page (typing and focused buttons are left alone).
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      if ((event.target as HTMLElement).closest?.("input, textarea, select, button, a, summary, [contenteditable]")) return;
      if ((event.key === "Enter" || event.key === " ") && main && !main.disabled) { event.preventDefault(); press(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const policeSeat = roles.indexOf(POLICE), babuSeat = roles.indexOf(BABU);
  const news = phase === "reveal" ? roundNews(game, roles, game.caught[rounds - 1]) : null;
  const announce = phase === "pass" ? `ফোনটা ${dative(name(turn))} দাও। বাকিরা চোখ বন্ধ করো।`
    : phase === "call" ? "সবাই চিরকুট দেখেছে।"
    : phase === "guess" ? rolling !== null ? `${name(policeSeat)} বলল, চোর ${name(rolling)}!` : `${name(policeSeat)}, চোর কে?`
    : news ? `${news.title} ${news.sub}` : over ? winnerLine(game) : "";
  const playing = phase !== "setup" && !over;
  const ranked = standings(game);

  return (
    <div className="cp" data-slow={slow}>
      {friend && (
        <section className="cp-friend" aria-labelledby="cp-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`ওদের স্কোরকার্ড: ${gameTitle(friend)}, ${scoreLine(friend)}`} />
          <div>
            <p className="cp-kicker">আরেক বাসা থেকে খেলে পাঠিয়েছে</p>
            <h2 id="cp-friend-title">{friendBanner(friend)} <span>এবার তোমাদের বাসার পালা।</span></h2>
            <p>নিচে চারজনের নাম লেখো, চিরকুট তোলো।</p>
          </div>
        </section>
      )}

      {(playing || (phase === "setup" && rounds > 0)) && (
        <div className="cp-board-wrap">
          <ol className="cp-board" aria-label="স্কোর">
            {scores.map((total, seat) => (
              <li key={seat} data-lead={rounds > 0 && total === ranked[0].total}>
                <span>{name(seat)}</span>
                <b key={`${seat}-${rounds}`} data-pop={Boolean(lastPoints?.[seat])}>{bn(total)}</b>
                {lastPoints && <small>+{bn(lastPoints[seat])}</small>}
              </li>
            ))}
          </ol>
          <p className="cp-round">{ordinal(shown)} দান · মোট {bn(limit)} দান</p>
        </div>
      )}

      <div className="cp-stage" ref={stage} data-phase={phase} data-dark={phase === "pass" || phase === "call"}>
        {phase === "setup" && <>
          <Thala count={PLAYERS} />
          <p className="cp-howto">{rounds ? "খেলা থামানো আছে। নাম ঠিক করে চালিয়ে যাও।" : "ফোনটা হাতে হাতে ঘুরবে। সবাই লুকিয়ে চিরকুট দেখবে, তারপর পুলিশ চোর ধরবে।"}</p>
        </>}

        {phase === "pass" && <>
          <p className="cp-step">{ordinal(rounds)} দান · {bn(turn + 1)} নম্বর চিরকুট</p>
          <ClosedEyes />
          <h2 className="cp-handoff">ফোনটা <b>{dative(name(turn))}</b> দাও</h2>
          <p>বাকিরা চোখ বন্ধ করো, অন্য দিকে তাকাও।</p>
        </>}

        {phase === "peek" && picked === null && <>
          <h2 className="cp-ask">{name(turn)}, থালা থেকে একটা চিরকুট তোলো</h2>
          <Thala count={PLAYERS - turn} onPick={pickChit} interactive />
        </>}

        {phase === "peek" && picked !== null && <>
          <button type="button" className="cp-chit-big" data-open={open} autoFocus
            onPointerDown={holdStart} onPointerUp={() => reveal(false)} onPointerCancel={() => reveal(false)} onLostPointerCapture={() => setOpen(false)}
            onKeyDown={event => holdKey(event, true)} onKeyUp={event => holdKey(event, false)} onBlur={() => setOpen(false)} onContextMenu={event => event.preventDefault()}
            aria-label={open ? undefined : "তোমার চিরকুট। চেপে ধরে রাখলে খুলবে, ছাড়লেই ভাঁজ হবে।"}>
            {open ? (
              <span className="cp-chit-inner" aria-live="assertive">
                <span className="cp-chit-you">তুমি</span>
                <RoleDoodle role={roles[turn]} />
                <b>{roleNames[roles[turn]]}</b>
                <span className="cp-chit-tip">{roleTip(roles[turn], game.points)}</span>
              </span>
            ) : (
              <span className="cp-chit-folded" aria-hidden="true"><span>চেপে ধরে রাখো</span></span>
            )}
          </button>
          <p className="cp-hold-hint">ছাড়লেই ভাঁজ হয়ে যাবে। স্ক্রিন রিডার চালু থাকলে হেডফোন লাগাও।</p>
        </>}

        {phase === "call" && <>
          <h2 className="cp-handoff">সবাই চিরকুট দেখেছে!</h2>
          <p>ফোনটা মাঝখানে রাখো। এবার বাবু আর পুলিশ নিজেদের চিনিয়ে দেবে।</p>
        </>}

        {phase === "guess" && <>
          <div className="cp-pair">
            <OpenChit role={BABU} name={name(babuSeat)} />
            <OpenChit role={POLICE} name={name(policeSeat)} />
          </div>
          {rolling === null ? <>
            <h2 className="cp-ask">{name(policeSeat)}, চোর কে?</h2>
            <p className="cp-sub">নিচের দুজনের একজন চোর, অন্যজন ডাকাত। মুখ দেখে বোঝো, তারপর নাম চাপো।</p>
          </> : <>
            <h2 className="cp-ask cp-rolling">{name(policeSeat)} বলল, চোর {name(rolling)}!</h2>
            <p className="cp-sub">সবাই চিরকুট খোলো।</p>
          </>}
        </>}

        {phase === "reveal" && news && lastPoints && <>
          <h2 className="cp-ask">{news.title}</h2>
          <p className="cp-sub">{news.sub}</p>
          <div className="cp-grid">{roles.map((role, seat) => <OpenChit key={seat} role={role} name={name(seat)} delta={lastPoints[seat]} />)}</div>
        </>}

        {over && <>
          <p className="cp-step">খেলা শেষ · {bn(rounds)} দান</p>
          <h2 className="cp-ask">{winnerLine(game)}</h2>
          <ol className="cp-final">{ranked.map(row => <li key={row.seat} data-lead={row.total === ranked[0].total}><span>{row.name}</span><b>{bn(row.total)}</b></li>)}</ol>
          <p className="cp-sub">{versus || humanLine(game)}</p>
          <p className="cp-best">{record ? "নতুন রেকর্ড! এই ফোনে এক খেলায় এটাই সবচেয়ে বেশি।" : best !== null ? recordLine(game, best) : ""}</p>
        </>}
      </div>
      <p className="cp-sr" aria-live="polite">{announce}</p>

      <div className="cp-controls">
        {phase === "setup" && <>
          <NameFields names={game.names} onChange={rename} legend="চারজনের নাম (না দিলেও চলবে)" />
          <fieldset className="kit-chips cp-rounds">
            <legend>কয় দান খেলবে?</legend>
            {ROUND_CHOICES.map(choice => <button type="button" key={choice} aria-pressed={limit === choice} disabled={rounds >= choice} onClick={() => setPlay(current => ({ ...current, limit: choice }))}>{bn(choice)} দান</button>)}
          </fieldset>
        </>}

        {phase === "guess" ? (
          <div className="cp-suspects">
            {suspects(roles).map(seat => <button type="button" key={seat} className="cp-suspect" data-picked={rolling === seat} disabled={rolling !== null} onClick={() => accuse(seat)}><b>{name(seat)}</b><span>চোর!</span></button>)}
          </div>
        ) : main && (
          <button type="button" className="kit-primary cp-main" disabled={main.disabled} onClick={press}>{main.label}</button>
        )}

        {phase === "reveal" && rounds < limit && <button type="button" className="kit-link cp-end" onClick={() => dispatch({ type: "end" }, false)}>এখানেই শেষ করো, স্কোরকার্ড দেখো</button>}
        {over && rounds < MAX_ROUNDS && <button type="button" className="kit-link cp-end" onClick={() => dispatch({ type: "more" }, false)}>আরও ৫ দান খেলো</button>}

        {phase === "setup" && (
          <details className="cp-points">
            <summary>নম্বর: {roleNames.map((role, index) => `${role} ${bn(game.points[index])}`).join(" · ")}</summary>
            <p>পুলিশ ঠিক চোর ধরলে সবাই নিজের চিরকুটের নম্বর পায়। ভুল ধরলে পুলিশ আর চোরের নম্বর অদলবদল হয়। তোমাদের বাসায় অন্য নম্বরে খেললে বদলে নাও।</p>
            <div className="cp-point-inputs">
              {roleNames.map((role, index) => (
                <label key={role}><span>{role}</span>
                  <input inputMode="numeric" value={String(game.points[index])} disabled={rounds > 0} maxLength={4}
                    onChange={event => edit({ points: game.points.map((old, at) => at === index ? clampPoints(Number(event.target.value.replace(/\D/g, ""))) : old) })} />
                </label>
              ))}
            </div>
            {rounds > 0 ? <p className="cp-note">খেলার মাঝে নম্বর বদলানো যায় না। নতুন খেলায় বদলাও।</p>
              : <button type="button" className="kit-link" onClick={() => edit({ points: [...DEFAULT_POINTS] })}>আগের নম্বরে ফেরো</button>}
          </details>
        )}

        <div className="cp-toggles">
          <SoundToggle compact />
          <button type="button" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
          {playing && <button type="button" onClick={() => dispatch({ type: "pause" }, false)}>থামাও</button>}
          {(rounds > 0 || playing) && <button type="button" onClick={reset}>নতুন খেলা</button>}
        </div>
      </div>

      {over && (
        <section className="cp-result" id="result" aria-labelledby="cp-result-title">
          <h2 id="cp-result-title">খেলা শেষে <em>স্কোরকার্ড</em></h2>
          <p>{humanLine(game)}</p>
          <div className="cp-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="cp-card-summary" />
              <figcaption id="cp-card-summary" className="cp-sr">স্কোরকার্ড: {gameTitle(game)}, {scoreLine(game, ", ")}। {humanLine(game)}</figcaption>
              {previewError && <p className="kit-status" role="alert">স্কোরকার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="cp-result-controls">
              <NameFields names={game.names} onChange={rename} legend="কার্ডে নামগুলো ঠিক আছে?" />
              <fieldset className="kit-chips">
                <legend>কবেকার খেলা?</legend>
                {occasions.map(item => <button type="button" key={item.id} aria-pressed={game.occasion === item.id} onClick={() => edit({ occasion: item.id })}>{item.label}</button>)}
              </fieldset>
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="chor-police.png" makeImage={() => cardBlob(game, format, site)} imageKey={`${state}|${format}`} caption={caption(game)} state={state} hint="লিংক খুললে ওরা শুধু নাম আর স্কোর দেখবে, কার কী চিরকুট ছিল তা না।" />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
