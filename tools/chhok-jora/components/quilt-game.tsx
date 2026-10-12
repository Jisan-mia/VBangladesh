"use client";
// IP: what we avoided — no app or brand name for the pen-and-paper game, no copied board look (grey grid, neon lines, coloured squares); ours is a fresh নকশিকাঁথা with needle holes, running stitches and two hand-drawn flowers, and borrows only the idea of stitch dots from নামের ডিজাইন, none of its lettering.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { possessive } from "../../../shared/bangla";
import { cardSizes, loadCardFonts, type CardFormat } from "../../../shared/card-canvas";
import { buzz, confetti, hiss, newSeed, sfx, tone, useBest, useSlowMode, MAX_NAME } from "../../../shared/game-kit";
import { SoundToggle } from "../../../shared/game-ui";
import { FormatToggle, ShareBar, useInView } from "../../../shared/share-kit";
import { FLOWERS, HEART, palette } from "../lib/art";
import { cardBlob, drawCard, type CardData } from "../lib/draw-card";
import { botMove, canUndo, createGame, hintGap, nearestGap, play, recent, undo, BOARD, EDGE_COUNT, ROW_SPAN, type Game, type Level } from "../lib/game";
import { bannerNote, bn, caption, compareLine, feat, humanLine, initials, levelName, parseShared, playNames, scoreLine, sharedHash, type Shared } from "../lib/link";
import { KatakutiGame } from "./katakuti-game";
import { QuiltBoard } from "./quilt-board";

const TOOL = "chhok-jora";
const MODES: Array<{ level: Level; label: string }> = [{ level: 1, label: "সহজ বট" }, { level: 2, label: "কঠিন বট" }, { level: 0, label: "দুজনে" }];
const COLORS = ["#c23b2a", "#2457a6", "#f3c548", "#fbf3e6", "#3d8a3c"];
/** A stitch pulled through the cloth: a short thread hiss and the needle's tick. The bot's needle ticks a little lower. */
const stitchSound = (who: 0 | 1) => { hiss(0.07, 0.07, who ? 2000 : 2700, "bandpass"); tone(who ? 1150 : 1500, 0.02, 0.035, "square", 0.05); };
/** A box closed: a click, then a bloom chime that climbs with each box in the same turn. */
const boxSound = (chain: number) => { tone(2200, 0.015, 0.05, "square"); sfx.combo(chain); buzz(10); };
const KEY_STEPS: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: ROW_SPAN, ArrowUp: -ROW_SPAN };
const smooth = () => matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" as const : "smooth" as const;

export function QuiltGame() {
  const [game, setGame] = useState<Game>(() => createGame(1, 1));
  const [paused, setPaused] = useState(false);
  const [friend, setFriend] = useState<Shared | null>(null);
  const [names, setNames] = useState<[string, string]>(["", ""]);
  const [ghost, setGhost] = useState(-1);
  const [cursor, setCursor] = useState(-1);
  const [slow, setSlow] = useSlowMode();
  const [bestEasy, submitEasy] = useBest(`${TOOL}-sohoj`);
  const [bestHard, submitHard] = useBest(`${TOOL}-kothin`);
  const [record, setRecord] = useState(false);
  const [format, setFormat] = useState<CardFormat>("feed");
  const [site, setSite] = useState("");
  const [previewError, setPreviewError] = useState(false);
  const [katakuti, setKatakuti] = useState(false);
  const chain = useRef(0);
  const board = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  const friendPreview = useRef<HTMLCanvasElement>(null);
  const resultBox = useRef<HTMLElement>(null);
  const pointer = useRef(-1);
  const finished = useRef<Game | null>(null);
  const gameRef = useRef(game);
  gameRef.current = game;
  const boardInView = useInView(board);

  const { level } = game;
  const phase = game.over ? "over" : paused ? "paused" : game.moves.length ? "playing" : "ready";
  const shown = playNames(level, names);
  const marks = initials(shown);
  const botTurn = level !== 0 && game.turn === 1 && !game.over;
  const canPlay = !game.over && !paused && !botTurn;
  const best = level === 1 ? bestEasy : level === 2 ? bestHard : null;
  const rival = friend && friend.level === level && friend.seed === game.seed && level ? friend : null;
  const result: CardData | null = game.over ? { level, score: game.score, name: names[0], other: names[1], owner: game.owner } : null;
  const state = game.over ? sharedHash({ seed: game.seed, level, moves: game.moves, name: names[0], other: names[1], score: game.score }) : "";

  /** The sounds of one stitch: who sewed it, and any box it closed (a chain of boxes climbs in pitch). */
  function sew(before: Game, next: Game) {
    stitchSound(before.turn);
    if (next.lastClosed) { boxSound(chain.current); chain.current += next.lastClosed; }
    else chain.current = 0;
  }

  function fresh(next: Level) {
    setKatakuti(false);
    chain.current = 0;
    setGame(createGame(friend && friend.level === next ? friend.seed : newSeed(), next));
    setPaused(false);
    setGhost(-1);
    setRecord(false);
  }

  function stitch(edge: number) {
    if (!canPlay || edge < 0) return;
    const next = play(game, edge);
    if (!next) return;
    sew(game, next);
    setGame(next);
    setGhost(-1);
  }

  function takeBack() {
    if (!canUndo(game)) return;
    sfx.whoosh();
    chain.current = 0;
    setGame(undo(game));
    setGhost(-1);
    setPaused(false);
  }

  // The bot answers after a short beat, one stitch at a time, so each of its moves can be seen. Paused or hidden: it waits.
  useEffect(() => {
    if (!botTurn || paused) return;
    const timer = window.setTimeout(() => {
      const current = gameRef.current, bot = current.level;
      const next = bot && current.turn === 1 && !current.over ? play(current, botMove(current, bot)) : null;
      if (next) { sew(current, next); setGame(next); }
    }, slow ? 1100 : 560);
    return () => window.clearTimeout(timer);
  }, [game, botTurn, paused, slow]);

  useEffect(() => {
    if (!game.over || finished.current === game) return;
    finished.current = game;
    const [mine, theirs] = game.score;
    const before = game.level === 1 ? bestEasy : game.level === 2 ? bestHard : null;
    const beaten = before !== null && mine > before;
    if (game.level) { setRecord(beaten); (game.level === 1 ? submitEasy : submitHard)(mine); }
    // A cheer for a real win (beating the bot, a new best, or either person in a two-player game), a soft one for a draw.
    window.setTimeout(() => {
      if (game.level ? mine > theirs || beaten : mine !== theirs) { sfx.win(); confetti({ colors: COLORS }); }
      else if (mine === theirs) sfx.good();
      else sfx.lose();
    }, 450);
  }, [game]);

  useEffect(() => {
    // Only a real challenge link counts; in-page jumps never touch the hash.
    const readFriend = () => {
      const shared = parseShared(window.location.hash);
      if (!shared) return false;
      setFriend(shared);
      setGame(createGame(shared.seed, shared.level));
      setPaused(false);
      return true;
    };
    setSite(window.location.host);
    if (!readFriend()) setGame(createGame(newSeed(), 1));
    const onHash = () => { readFriend(); };
    const hide = () => { if (document.hidden && gameRef.current.moves.length && !gameRef.current.over) setPaused(true); };
    window.addEventListener("hashchange", onHash);
    document.addEventListener("visibilitychange", hide);
    return () => { window.removeEventListener("hashchange", onHash); document.removeEventListener("visibilitychange", hide); };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts("ছক-জোড়া রাফি মিম ১২৩").then(() => {
      if (cancelled) return;
      if (result && preview.current) drawCard(preview.current, result, format, site);
      if (friend && friendPreview.current) drawCard(friendPreview.current, friend, "feed", site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` encodes everything the card draws.
  }, [state, format, site, friend]);

  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  keyHandler.current = event => {
    const target = event.target as HTMLElement | null;
    if (katakuti || event.altKey || event.ctrlKey || event.metaKey || !boardInView || target?.closest?.("input, textarea, select, [contenteditable]")) return;
    const step = KEY_STEPS[event.key];
    if (step !== undefined) {
      event.preventDefault();
      setCursor(current => current < 0 ? Math.max(0, hintGap(game)) : current + step >= 0 && current + step < EDGE_COUNT ? current + step : current);
      return;
    }
    if (event.key === "Backspace" || event.key === "z" || event.key === "Z") { if (canUndo(game)) { event.preventDefault(); takeBack(); } return; }
    if (event.key !== " " && event.key !== "Enter") return;
    if (target?.closest?.("button, a, summary")) return;
    event.preventDefault();
    if (phase === "paused") setPaused(false);
    else if (phase === "over") fresh(level);
    else if (cursor >= 0) stitch(cursor);
    else setCursor(Math.max(0, hintGap(game)));
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  function gapAt(event: ReactPointerEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return nearestGap((event.clientX - box.left) / box.width * BOARD, (event.clientY - box.top) / box.height * BOARD, game.drawn);
  }
  // Press to see the ghost stitch, release to sew it: a quick tap sews at once, a slide picks a different gap first. Touch keeps the pointer on the board by itself.
  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || !canPlay || (event.target as Element).closest("button")) return;
    pointer.current = event.pointerId;
    setCursor(-1);
    setGhost(gapAt(event));
  }
  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!canPlay) return;
    if (event.pointerId === pointer.current || (event.pointerType === "mouse" && pointer.current < 0)) setGhost(gapAt(event));
  }
  function onPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerId !== pointer.current) return;
    pointer.current = -1;
    const edge = gapAt(event);
    setGhost(-1);
    stitch(edge);
  }
  function seeCard() { resultBox.current?.scrollIntoView({ behavior: smooth(), block: "start" }); }
  function playFromCard() {
    fresh(level);
    board.current?.scrollIntoView({ behavior: smooth(), block: "center" });
  }

  function status() {
    const last = game.by[game.by.length - 1];
    if (!game.moves.length) return "দুই ফোঁড়ের মাঝে চাপো, সেলাই পড়বে। ঘর পূরণ করলে আরেকটা চাল।";
    if (level) {
      if (game.turn === 1) return game.lastClosed && last === 1 ? "বট ঘর নিল, আবার ফোঁড় দিচ্ছে…" : "বট ভাবছে…";
      if (game.lastClosed && last === 0) return "ঘর পেয়েছ! আরেকটা চাল দাও।";
      return game.lastClosed ? "বট ঘর নিল। তিন পাশ সেলাই হলে পরের জন ঘরটা পেয়ে যায়।" : "তোমার পালা।";
    }
    const who = shown[game.turn];
    return game.lastClosed ? `${who} ঘর পেয়েছে! আবার ${possessive(who)} পালা।` : `${possessive(who)} পালা।`;
  }

  function verdict() {
    const [mine, theirs] = game.score;
    if (mine === theirs) return "সমান সমান!";
    if (level) return mine > theirs ? "জিতে গেছ!" : "এবার বট জিতল।";
    return `${shown[mine > theirs ? 0 : 1]} জিতেছে!`;
  }

  const friendNames = friend ? feat(friend) : "";
  const turnLabel = (player: 0 | 1) => level ? (player === 0 ? "তোমার পালা" : "বটের পালা") : `${possessive(shown[player])} পালা`;

  return (
    <div className="cj" data-calm={slow}>
      {friend && (
        <section className="cj-friend" aria-labelledby="cj-friend-title">
          <canvas ref={friendPreview} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${friendNames}। পুরো কাঁথার ছবি।`} />
          <div>
            <h2 id="cj-friend-title">{friendNames}।</h2>
            <p>{bannerNote(friend)}</p>
          </div>
        </section>
      )}

      <fieldset className="cj-modes">
        <legend className="cj-sr">কার সাথে খেলবে?</legend>
        {MODES.map(mode => <button key={mode.level} type="button" aria-pressed={!katakuti && level === mode.level} onClick={() => { sfx.tap(); fresh(mode.level); }}>{mode.label}</button>)}
        <button type="button" aria-pressed={katakuti} onClick={() => { if (!katakuti) { sfx.tap(); setKatakuti(true); setPaused(false); } }}>কাটাকুটি</button>
      </fieldset>

      {katakuti ? <KatakutiGame slow={slow} setSlow={setSlow} /> : <>

      <div className="cj-hud">
        {([0, 1] as const).map(player => (
          <p key={player} className="cj-pill" data-player={player} data-active={!game.over && game.turn === player}>
            <svg viewBox="-40 -40 80 80" aria-hidden="true"><path d={FLOWERS[player]} fill={palette.players[player]} /><circle r={HEART} fill={palette.heart} /></svg>
            <span className="cj-pill-name">{shown[player]}</span>
            <b>{bn(game.score[player])}</b>
            {!game.over && game.turn === player && <span className="cj-sr">, {turnLabel(player)}</span>}
          </p>
        ))}
      </div>

      <div
        className="cj-board" ref={board} data-phase={phase} data-bot={botTurn}
        role="application" aria-label="নকশিকাঁথার ছক। দুই ফোঁড়ের মাঝে চাপো, বা তীর-চিহ্ন দিয়ে বেছে এন্টার চাপো।"
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
        onPointerCancel={() => { pointer.current = -1; setGhost(-1); }}
        onPointerLeave={event => { if (event.pointerType === "mouse") { pointer.current = -1; setGhost(-1); } }}
      >
        <QuiltBoard game={game} marks={marks} ghost={canPlay ? ghost : -1} cursor={cursor} hint={phase === "ready" && !slow ? hintGap(game) : -1} recent={game.moves.length && !game.over ? recent(game) : []} mover={game.turn} />
        {phase === "paused" && (
          <div className="cj-overlay">
            <div className="cj-note">
              <p>থেমে আছে। তৈরি হলে চাপো।</p>
              <button type="button" className="kit-primary" onClick={() => setPaused(false)}>চালিয়ে যাও</button>
            </div>
          </div>
        )}
      </div>

      {phase === "over" ? (
        <div className="cj-over" role="status">
          <p className="cj-over-score">{scoreLine(shown, game.score)}</p>
          <p className="cj-over-verdict">{verdict()} <span>{rival ? compareLine(game.score[0], rival.score[0], rival.name) : record ? "এই ফোনে নতুন রেকর্ড!" : best !== null && level ? `${levelName(level)} বটের সাথে এই ফোনে সেরা ${bn(best)} ঘর।${game.score[0] <= best && best < 16 ? ` আর ${bn(best - game.score[0] + 1)}টা পেলে নতুন রেকর্ড।` : ""}` : ""}</span></p>
        </div>
      ) : (
        <p className="cj-status" role="status" aria-live="polite">{status()}</p>
      )}

      <div className="cj-controls">
        {phase === "over" ? (
          <>
            <button type="button" className="kit-primary cj-again" onClick={() => fresh(level)}>আরেকবার</button>
            <button type="button" className="kit-link cj-see" onClick={seeCard}>কার্ড দেখো ↓</button>
          </>
        ) : (
          <>
            <button type="button" className="cj-tool" onClick={takeBack} disabled={!canUndo(game)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></svg>ফিরিয়ে আনো
            </button>
            <button type="button" className="cj-tool" onClick={() => fresh(level)} disabled={phase === "ready"}>নতুন খেলা</button>
            <button type="button" className="cj-tool cj-slow" aria-pressed={slow} onClick={() => setSlow(!slow)}>ধীরে খেলো</button>
            <SoundToggle compact className="cj-sound" />
          </>
        )}
      </div>

      <section className="cj-result" id="result" ref={resultBox} aria-labelledby="cj-result-title">
        <div className="cj-result-head">
          <h2 id="cj-result-title">{result ? <><em>{scoreLine(shown, game.score)}</em>, কাঁথা তৈরি</> : "খেলা শেষে তোমার কাঁথার কার্ড"}</h2>
          <p>{result ? rival ? compareLine(game.score[0], rival.score[0], rival.name) : humanLine(level, game.score, shown) : "সব ঘর ভরলেই পুরো কাঁথাটা কার্ড হয়ে এখানে আসবে। বন্ধুকে পাঠালে সে একই শুরু থেকে একই বটের সাথে খেলবে।"}</p>
        </div>
        {result && (
          <div className="cj-result-body">
            <figure className="kit-card" data-format={format}>
              <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="cj-card-summary" />
              <figcaption id="cj-card-summary" className="cj-sr">ছক-জোড়ার কার্ড: {scoreLine(shown, game.score)}। {humanLine(level, game.score, shown)}</figcaption>
              {previewError && <p className="kit-status" role="alert">কার্ডের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
            </figure>
            <div className="cj-share">
              {level ? (
                <label className="cj-name">
                  <span>তোমার নাম <small>কার্ডে বসবে, না দিলেও চলবে</small></span>
                  <input value={names[0]} maxLength={MAX_NAME} onChange={event => setNames([event.target.value, names[1]])} placeholder="যেমন: রাফি" autoComplete="nickname" />
                </label>
              ) : (
                <div className="cj-names">
                  {([0, 1] as const).map(player => (
                    <label key={player} className="cj-name" data-player={player}>
                      <span>{player ? "নীল সুতোর নাম" : "লাল সুতোর নাম"}</span>
                      <input value={names[player]} maxLength={MAX_NAME} onChange={event => setNames(player ? [names[0], event.target.value] : [event.target.value, names[1]])} placeholder={player ? "যেমন: মিম" : "যেমন: রাফি"} autoComplete="off" />
                    </label>
                  ))}
                </div>
              )}
              <FormatToggle value={format} onChange={setFormat} />
              <ShareBar tool={TOOL} fileName="chhok-jora.png" makeImage={() => cardBlob(result, format, site)} imageKey={`${state}|${format}`} caption={caption(result)} state={state} hint={level ? "বন্ধু লিংক খুললে একই শুরু থেকে একই বটের সাথে খেলবে। চালগুলো মিলিয়ে দেখা হয়, তাই ফলটা সত্যি।" : "লিংক খুললে পুরো কাঁথাটা দেখা যাবে, চালগুলো মিলিয়ে।"} />
              <button type="button" className="kit-link cj-again-link" onClick={playFromCard}>আরেকবার খেলো</button>
            </div>
          </div>
        )}
      </section>
      </>}
    </div>
  );
}
