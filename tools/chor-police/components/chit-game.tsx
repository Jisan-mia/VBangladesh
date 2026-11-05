"use client";
// IP: what we avoided — no police uniform, cap, badge, insignia or real-police jokes (পুলিশ is only a word on a chit and a magnifying-glass doodle); no app, brand or TV-show look; plate, chits and doodles drawn fresh.
// Thin React over lib/game.ts: every tap becomes an act() call, lib/cues.ts says what it sounds like, and the shared
// player (useGamePlayer) owns pause, resume and restart.

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { confetti, newSeed, sfx, silenceScheduled, useBest, useSlowMode } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { FormatToggle, ShareBar } from "../../../shared/share-kit";
import { cues, type Cue } from "../lib/cues";
import { cardBlob, drawCard } from "../lib/draw-card";
import { act, BABU, bn, clampPoints, dative, dealFor, DEFAULT_POINTS, isFinale, MAX_NAME, MAX_ROUNDS, nameOf, newPlay, occasions, ordinal, PLAYERS, POLICE, DAKAT, restore, roleNames, roundPoints, saveOf, shownRound, standings, suspects, totals, type Action, type Game, type Play, type Role, type Saved } from "../lib/game";
import { evenings, FINALE, FINALE_ROLL_MS, FLIP_GAP_MS, ROLL_MS } from "../lib/levels";
import { caption, eveningStats, friendBanner, gameHash, gameTitle, humanLine, parseGame, recordLine, roundNews, scoreLine, versusLine, winnerLine } from "../lib/result";
import { ClosedEyes, RoleDoodle } from "./art";
import { COUNT_FRAMES, COUNT_MS, paintCount, type CountUp } from "./count.hot";
import { clink, drumroll, flips, rustle, verdict } from "./sound";

const TOOL = "chor-police";
const SAVED = "chor-police-game";
const SLOTS = [{ x: 27, y: 42, r: -14 }, { x: 52, y: 27, r: 8 }, { x: 74, y: 48, r: -6 }, { x: 48, y: 66, r: 15 }];
// Keys the game answers. Anything typed into a field, and the share and setup controls, keep their own keys.
const OWN_KEYS = "input, textarea, select, a, summary, details, [data-own-keys]";

function roleTip(role: Role, points: readonly number[]) {
  if (role === BABU) return `${bn(points[BABU])} পয়েন্ট পাকা। চুপচাপ মজা দেখো।`;
  if (role === POLICE) return "একটু পরে তোমাকেই চোর ধরতে হবে। সবার মুখ খেয়াল করো!";
  if (role === DAKAT) return `${bn(points[DAKAT])} পাকা। মুখ গম্ভীর রাখো, পুলিশ যেন তোমাকেই চোর ভাবে।`;
  return `ধরা না পড়লে পুলিশের ${bn(points[POLICE])} তোমার! হাসি চেপে রাখো।`;
}

function Thala({ count, onPick, label }: { count: number; onPick?: (slot: number) => void; label?: string }) {
  return <div className="cp-thala" role={onPick ? "group" : undefined} aria-label={onPick ? label : undefined}>
    {SLOTS.slice(0, count).map((slot, index) => {
      const style = { "--x": `${slot.x}%`, "--y": `${slot.y}%`, "--r": `${slot.r}deg` } as CSSProperties;
      return onPick
        ? <button key={index} type="button" className="cp-chit" style={style} onClick={event => { event.currentTarget.blur(); onPick(index); }} aria-label={`${bn(index + 1)} নম্বর চিরকুট তোলো`}><span aria-hidden="true">{bn(index + 1)}</span></button>
        : <span key={index} className="cp-chit" style={style} aria-hidden="true" />;
    })}
  </div>;
}

function OpenChit({ role, name, delta, flip, style }: { role: Role; name: string; delta?: number; flip?: "first" | "second" | "in"; style?: CSSProperties }) {
  return <div className="cp-open" data-role={role} data-flip={flip} style={style}>
    <span className="cp-open-name">{name}</span>
    <RoleDoodle role={role} />
    <b>{roleNames[role]}</b>
    {delta !== undefined && <span className="cp-open-points">+{bn(delta)}</span>}
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

/** Strings for every frame of the end screen's count-up, built once so the frame loop allocates nothing. */
function makeCountUp(targets: readonly number[]): CountUp {
  return {
    nodes: targets.map(() => null),
    frames: targets.map(target => Array.from({ length: COUNT_FRAMES }, (_, frame) => bn(Math.round(target * frame / (COUNT_FRAMES - 1))))),
    last: new Int16Array(targets.length).fill(-1),
  };
}

const blank = (): Game => ({ seed: 1, names: ["", "", "", ""], points: [...DEFAULT_POINTS], caught: [], occasion: "aj" });

export function ChitGame() {
  const [play, setPlay] = useState<Play>(() => newPlay(blank()));
  const [open, setOpen] = useState(false);
  const [friend, setFriend] = useState<Game | null>(null);
  const [undo, setUndo] = useState<Play | null>(null);
  const [slow] = useSlowMode();
  const [best, submitBest] = useBest(TOOL);
  const [record, setRecord] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const current = useRef(play);
  // When the screen last changed, on the event clock, so a key held through the change can't act on the new screen.
  const screenAt = useRef(0);
  const holdingKey = useRef(false);
  const counter = useRef<CountUp | null>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const root = useRef<HTMLDivElement>(null);

  const player = useGamePlayer({
    // The menu covers the screen and the player cuts scheduled notes; here the chit folds and the drum's timer stops (effect below).
    onPause: () => { setOpen(false); holdingKey.current = false; },
    // Back to the same screen, with a fresh tap guard; a drumroll that was cut starts again from its first beat.
    onResume: () => { send({ type: "breath" }); if (current.current.phase === "roll") drumroll(isFinale(current.current)); },
    // নতুন করে শুরু: a new evening on the title screen, names and points kept. The old one stays one tap away.
    onRestart: () => {
      const before = current.current;
      if (before.game.caught.length && before.phase !== "over") setUndo(before);
      send({ type: "reset", seed: newSeed() });
    },
  });

  const { game, phase, turn, seen, limit } = play;
  const rounds = game.caught.length;
  const over = phase === "over";
  const playing = phase !== "setup" && !over;
  const state = rounds ? gameHash(game) : "";
  const scores = totals(game);
  const shown = shownRound(play);
  const roles = dealFor(game.seed, Math.min(shown, MAX_ROUNDS - 1));
  const lastPoints = phase === "reveal" ? roundPoints(roles, game.caught[rounds - 1], game.points) : null;
  const name = (seat: number) => nameOf(game.names, seat);
  const finale = isFinale(play);
  const ranked = standings(game);

  function commit(next: Play) {
    current.current = next;
    setPlay(next);
  }

  function playCue(cue: Cue, after: Play) {
    if (cue === "hush") silenceScheduled();
    else if (cue === "clink") clink();
    else if (cue === "rustle") rustle();
    else if (cue === "flips") flips(2);
    else if (cue === "drum") drumroll(isFinale(after));
    else if (cue === "caught" || cue === "missed") verdict(cue === "caught");
    else if (cue === "fanfare") {
      const top = standings(after.game)[0].total, beaten = submitBest(top) && best !== null;
      setRecord(beaten);
      if (beaten) sfx.levelUp(); else sfx.win();
      if (!slow) confetti();
    }
  }

  /** Every tap and key ends here. Returns false when the flow ignored it (out of turn, or inside the tap guard). */
  function send(action: Action) {
    const before = current.current, now = performance.now();
    const after = act(before, action, now);
    if (after === before) return false;
    commit(after);
    if (after.phase !== before.phase || after.turn !== before.turn) {
      setOpen(false);
      holdingKey.current = false;
      screenAt.current = now;
    }
    if (action.type === "start") setUndo(null);
    for (const cue of cues(before, after)) playCue(cue, after);
    return true;
  }

  const edit = (change: Partial<Game>) => commit({ ...current.current, game: { ...current.current.game, ...change } });
  const rename = (seat: number, value: string) => edit({ names: current.current.game.names.map((old, index) => index === seat ? value.slice(0, MAX_NAME) : old) });

  useEffect(() => {
    // In-page anchors (#result) also change the hash: only a real scoreboard link counts as a friend's game.
    const readFriend = () => { const shared = parseGame(window.location.hash); if (shared) setFriend(shared); };
    readFriend();
    let saved: Saved | null = null;
    try { saved = JSON.parse(localStorage.getItem(SAVED) ?? "null") as Saved | null; } catch { /* private mode or an old save: start fresh */ }
    commit(restore(saved && typeof saved === "object" ? saved : null, hash => parseGame(hash, 0), newSeed()));
    setLoaded(true);
    setSite(window.location.host);
    window.addEventListener("hashchange", readFriend);
    return () => window.removeEventListener("hashchange", readFriend);
  }, []);

  // Keep the evening on this phone, so a reload while the phone goes round doesn't wipe the scores.
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(SAVED, JSON.stringify(saveOf(play, gameHash(game)))); } catch { /* nothing to do */ }
  }, [game, limit, play.done, loaded]);

  // The drumroll's end. It never runs under the pause menu; resuming re-arms it from the start.
  useEffect(() => {
    if (phase !== "roll" || player.paused) return;
    const timer = window.setTimeout(() => send({ type: "open" }), finale ? FINALE_ROLL_MS : ROLL_MS);
    return () => window.clearTimeout(timer);
  }, [phase, player.paused]);

  // A chit never stays open if the window loses focus or the tab hides mid-peek (the player's own blur lands here too).
  useEffect(() => {
    const hide = () => { setOpen(false); holdingKey.current = false; };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("blur", hide);
    return () => { document.removeEventListener("visibilitychange", hide); window.removeEventListener("blur", hide); };
  }, []);

  // The end screen counts its totals up from zero. Frame 0 is painted before the browser shows the scorecard, so the
  // final numbers never flash first.
  useLayoutEffect(() => {
    if (!over) return;
    const count = counter.current;
    if (!count) return;
    count.last.fill(-1);
    paintCount(count, slow ? 1 : 0);
    let frame = 0;
    const started = performance.now();
    const tick = (now: number) => {
      const t = slow ? 1 : (now - started) / COUNT_MS;
      paintCount(count, t);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [over, rounds]);

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

  /** The big button for this screen, if it has one. */
  const main: { label: ReactNode; action: Action; disabled?: boolean } | null =
    phase === "setup" ? null
    : phase === "peek" ? { label: !seen ? "আগে চেপে ধরে দেখো" : turn + 1 < PLAYERS ? <>দেখেছি · ফোনটা <b>{dative(name(turn + 1))}</b> দাও</> : "দেখেছি · ফোনটা মাঝখানে রাখো", action: { type: "done" }, disabled: !seen }
    : phase === "call" ? { label: "বাবু-পুলিশ, চিরকুট খোলো", action: { type: "call" } }
    : phase === "reveal" ? { label: rounds >= limit ? "ফল দেখো" : rounds + 1 === limit ? `${FINALE}!` : "আরেক দান", action: { type: "next" } }
    : phase === "over" ? { label: "আরেক সন্ধ্যা", action: { type: "again", seed: newSeed() } }
    : null;

  function holdStart(event: ReactPointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary) return;
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* the finger already lifted */ }
    reveal(true);
  }
  function reveal(show: boolean) {
    if (current.current.phase !== "peek") return;
    setOpen(show);
    if (show) { rustle(); send({ type: "saw" }); }
  }

  // Game keys live on window, so Enter and Space go to the game, not to whatever button was last focused.
  // A key held through a screen change never acts on the new screen: only a fresh keydown after it appeared counts.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(OWN_KEYS)) return;
      if (target && target !== document.body && !root.current?.contains(target) && !target.closest?.(".gp")) return;
      const now = current.current, key = event.key, down = event.type === "keydown";
      if (now.phase === "peek" && key === " ") {
        event.preventDefault();
        if (down && !event.repeat && event.timeStamp > screenAt.current) { holdingKey.current = true; reveal(true); }
        if (!down && holdingKey.current) { holdingKey.current = false; reveal(false); }
        return;
      }
      const game = key === "Enter" || key === " " || /^[1-4]$/.test(key);
      if (!game) return;
      // The scorecard is the evening's payoff: no stray key leaves it. A keyboard player Tabs to a button and presses it
      // (that button's own click, still behind the 1.2 s guard in act).
      if (now.phase === "over") { if (target?.closest?.("button")) return; event.preventDefault(); return; }
      event.preventDefault();
      if (!down || event.repeat || event.timeStamp <= screenAt.current) return;
      const digit = /^[1-4]$/.test(key) ? Number(key) - 1 : -1;
      if (now.phase === "setup" && digit < 0) send({ type: "start" });
      else if (now.phase === "pass") send({ type: "pick", slot: digit >= 0 ? digit : 0 });
      else if (now.phase === "guess" && digit >= 0 && digit < 2) send({ type: "accuse", seat: suspects(dealFor(now.game.seed, now.game.caught.length))[digit] });
      else if (digit < 0 && main && !main.disabled) send(main.action);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("keyup", onKey); };
  });

  const press = (action: Action) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); send(action); };

  const policeSeat = roles.indexOf(POLICE), babuSeat = roles.indexOf(BABU), accused = play.accused;
  const news = phase === "reveal" ? roundNews(game, roles, game.caught[rounds - 1]) : null;
  const pair = suspects(roles);
  const stats = over ? eveningStats(game) : null;
  if (over && (!counter.current || counter.current.frames.length !== ranked.length || counter.current.frames[0][COUNT_FRAMES - 1] !== bn(ranked[0].total))) counter.current = makeCountUp(ranked.map(row => row.total));
  const announce = phase === "pass" ? `ফোনটা ${dative(name(turn))} দাও। বাকিরা চোখ বন্ধ করো।`
    : phase === "call" ? "সবাই চিরকুট দেখেছে।"
    : phase === "guess" ? `${name(policeSeat)}, চোর কে?`
    : phase === "roll" ? `${name(policeSeat)} বলল, চোর ${name(accused)}!`
    : news ? `${news.title} ${news.sub}` : over ? winnerLine(game) : "";
  const evening = evenings.find(item => item.rounds === limit);

  return (
    <div ref={root} className="cp" data-slow={slow} data-phase={phase} data-edge={phase === "roll" ? "roll" : finale ? "finale" : undefined} style={{ "--gap": `${FLIP_GAP_MS}ms` } as CSSProperties}>
      {(playing || over) && (
        <header className="cp-hud">
          <ol className="cp-board" aria-label="স্কোর">
            {scores.map((total, seat) => (
              <li key={seat} data-lead={rounds > 0 && total === ranked[0].total}>
                <span>{name(seat)}</span>
                <b key={`${seat}-${rounds}`} data-pop={Boolean(lastPoints?.[seat])}>{bn(total)}</b>
                {lastPoints && <small>+{bn(lastPoints[seat])}</small>}
              </li>
            ))}
          </ol>
          <p className="cp-round">{over ? `খেলা শেষ · ${bn(rounds)} দান` : finale ? <><b>{FINALE}</b> · {ordinal(shown)} দান</> : <>{ordinal(shown)} দান · মোট {bn(limit)}</>}</p>
        </header>
      )}

      <div className="cp-stage" data-phase={phase} data-dark={phase === "pass" || phase === "call"}>
        {phase === "setup" && <>
          {friend && (
            <section className="cp-friend" aria-labelledby="cp-friend-title">
              <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`ওদের স্কোরকার্ড: ${gameTitle(friend)}, ${scoreLine(friend)}`} />
              <div>
                <p className="cp-kicker">আরেক বাসা থেকে খেলে পাঠিয়েছে</p>
                <h2 id="cp-friend-title">{friendBanner(friend)} <span>এবার তোমাদের পালা।</span></h2>
              </div>
            </section>
          )}
          <button type="button" className="cp-start" onClick={press({ type: "start" })}>
            <Thala count={PLAYERS} />
            <span className="cp-start-label">{rounds ? `চালিয়ে যাও · ${ordinal(rounds)} দান` : "চিরকুট তোলো"}</span>
          </button>
          <p className="cp-howto">{rounds ? `${bn(rounds)} দান খেলা হয়ে আছে। নাম ঠিক করে চালিয়ে যাও।` : "ফোনটা হাতে হাতে ঘুরবে। সবাই লুকিয়ে চিরকুট দেখবে, তারপর পুলিশ চোর ধরবে।"}</p>
          {undo && <button type="button" className="kit-link cp-undo" data-own-keys onClick={() => { commit({ ...undo, since: performance.now() }); setUndo(null); }}>আগের খেলায় ফেরো ({ordinal(undo.game.caught.length - 1)} দান পর্যন্ত)</button>}
        </>}

        {phase === "pass" && <>
          <p className="cp-step">{finale ? <b className="cp-finale">{FINALE}</b> : `${ordinal(rounds)} দান`} · {bn(turn + 1)} নম্বর চিরকুট</p>
          <ClosedEyes />
          <h2 className="cp-handoff">ফোনটা <b>{dative(name(turn))}</b> দাও</h2>
          <p>বাকিরা চোখ বন্ধ করো।</p>
          <Thala count={PLAYERS - turn} onPick={slot => send({ type: "pick", slot })} label={`থালায় ${bn(PLAYERS - turn)}টা চিরকুট`} />
          <p className="cp-ask-small">{name(turn)}, একটা চিরকুট তোলো</p>
        </>}

        {phase === "peek" && <>
          <button type="button" className="cp-chit-big" data-open={open} autoFocus
            onPointerDown={holdStart} onPointerUp={() => reveal(false)} onPointerCancel={() => reveal(false)} onLostPointerCapture={() => setOpen(false)}
            onBlur={() => setOpen(false)} onContextMenu={event => event.preventDefault()}
            aria-label={open ? undefined : "তোমার চিরকুট। চেপে ধরে রাখলে খুলবে, ছাড়লেই ভাঁজ হবে।"}>
            {open ? (
              <span className="cp-chit-inner" aria-live="assertive">
                <span className="cp-chit-you">{name(turn)}, তুমি</span>
                <RoleDoodle role={roles[turn]} />
                <b>{roleNames[roles[turn]]}</b>
                <span className="cp-chit-tip">{roleTip(roles[turn], game.points)}</span>
              </span>
            ) : (
              <span className="cp-chit-folded" aria-hidden="true"><span>চেপে ধরে রাখো</span></span>
            )}
          </button>
          <p className="cp-hold-hint">{seen ? "আবার দেখতে চাইলে আবার চেপে ধরো।" : "ছাড়লেই ভাঁজ হয়ে যাবে।"}</p>
        </>}

        {phase === "call" && <>
          <h2 className="cp-handoff">সবাই চিরকুট দেখেছে!</h2>
          <p>ফোনটা মাঝখানে রাখো। এবার বাবু আর পুলিশ নিজেদের চিনিয়ে দেবে।</p>
        </>}

        {(phase === "guess" || phase === "roll") && <>
          <div className="cp-pair">
            <OpenChit role={BABU} name={name(babuSeat)} flip="in" />
            <OpenChit role={POLICE} name={name(policeSeat)} flip="in" style={{ animationDelay: "var(--gap)" } as CSSProperties} />
          </div>
          {phase === "guess" ? <>
            <h2 className="cp-ask">পুলিশ {name(policeSeat)}, চোর কে?</h2>
            <p className="cp-sub">এই দুজনের একজন চোর, অন্যজন ডাকাত। মুখ দেখে বোঝো।</p>
          </> : <>
            <h2 className="cp-ask cp-rolling">{name(policeSeat)} বলল, চোর {name(accused)}!</h2>
            <p className="cp-sub">সবাই চিরকুট খোলো…</p>
          </>}
          <div className="cp-suspects">
            {pair.map((seat, index) => <button type="button" key={seat} className="cp-suspect" data-picked={accused === seat} disabled={phase === "roll"} onClick={press({ type: "accuse", seat })}>
              <kbd aria-hidden="true">{bn(index + 1)}</kbd><b>{name(seat)}</b><span>চোর!</span>
            </button>)}
          </div>
        </>}

        {phase === "reveal" && news && lastPoints && <>
          <div className="cp-grid">{roles.map((role, seat) => <OpenChit key={seat} role={role} name={name(seat)} delta={lastPoints[seat]} flip={seat === accused ? "first" : pair.includes(seat) ? "second" : undefined} />)}</div>
          <div className="cp-news">
            <h2 className="cp-ask">{news.title}</h2>
            <p className="cp-sub">{news.sub}</p>
          </div>
        </>}

        {over && stats && <>
          <h2 className="cp-ask cp-winner">{winnerLine(game)}</h2>
          <ol className="cp-final">{ranked.map((row, index) => <li key={row.seat} data-lead={row.total === ranked[0].total}>
            <span>{row.name}</span>
            <b ref={node => { if (counter.current) counter.current.nodes[index] = node; }}>{bn(row.total)}</b>
          </li>)}</ol>
          <ul className="cp-stats">
            <li><b>{bn(stats.caught)}</b> বার চোর ধরা পড়েছে</li>
            <li><b>{bn(stats.escaped)}</b> বার চোর পালিয়েছে</li>
            {stats.babu && <li>সবচেয়ে বেশি বাবু <b>{stats.babu.name}</b>, {bn(stats.babu.times)} বার</li>}
            {stats.police && <li>সেরা পুলিশ <b>{stats.police.name}</b>, {bn(stats.police.caught)} বার ধরেছে</li>}
          </ul>
          <p className="cp-sub">{(friend && versusLine(game, friend)) || humanLine(game)}</p>
          <p className="cp-best">{record ? "নতুন রেকর্ড! এই ফোনে এক খেলায় এটাই সবচেয়ে বেশি।" : best !== null ? recordLine(game, best) : ""}</p>
        </>}
      </div>
      <p className="cp-sr" aria-live="polite">{announce}</p>

      <div className="cp-controls">
        {main && <button type="button" key={phase} className="kit-primary cp-main" disabled={main.disabled} onClick={press(main.action)}>{main.label}</button>}
        {phase === "reveal" && rounds < limit && <button type="button" className="kit-link cp-end" onClick={press({ type: "end" })}>এখানেই শেষ করো, স্কোরকার্ড দেখো</button>}
        {over && rounds < MAX_ROUNDS && <button type="button" className="kit-link cp-end" onClick={press({ type: "more" })}>একই খেলায় আরও ৫ দান</button>}

        {phase === "setup" && <div className="cp-setup" data-own-keys>
          <NameFields names={game.names} onChange={rename} legend="চারজনের নাম (না দিলেও চলবে)" />
          <fieldset className="kit-chips cp-rounds">
            <legend>কতক্ষণ খেলবে?</legend>
            {evenings.map(item => <button type="button" key={item.rounds} aria-pressed={limit === item.rounds} disabled={rounds >= item.rounds} onClick={() => send({ type: "limit", rounds: item.rounds })}>
              {item.name} · {bn(item.rounds)} দান{item.recommended && <small>সুপারিশ</small>}
            </button>)}
            <p className="cp-promise">{evening ? `${bn(evening.rounds)} দান, ${evening.promise}।` : `${bn(limit)} দান।`} শেষ দানের পর স্কোরকার্ড।</p>
          </fieldset>
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
        </div>}
      </div>

      {over && (
        <section className="cp-result" id="result" aria-labelledby="cp-result-title" data-own-keys>
          <h2 id="cp-result-title">খেলা শেষে <em>স্কোরকার্ড</em></h2>
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

