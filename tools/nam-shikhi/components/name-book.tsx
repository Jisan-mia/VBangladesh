"use client";
// IP: what we avoided — no flashcard app's, sticker book's, textbook's or TV show's pictures, characters or layout; every drawing is our own flat SVG (a Black Bengal goat, a শুশুক, a tin-roof বাড়ি), and the names are plain dictionary words.
// Thin React over the pure game: lib/book.ts runs the round, lib/session.ts decides which screen shows and what a tap may do.
// A kids' page: nothing the child does leaves the phone, and nothing speaks. The card and the tool's link sit behind the parent gate.

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { loadCardFonts, renderCard } from "../../../shared/card-canvas";
import { confetti, newSeed, sfx, shake, totalStars, useLevels, useSlowMode } from "../../../shared/game-kit";
import { useGamePlayer } from "../../../shared/game-player-client";
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from "../../../shared/kids-kit";
import { advance, answerOf, cardOf, choose, createRound, hinting, learnedLine, lensHelps, namedKind, onFigure, pageCell, pageTitle, spotAt, spotPercent, starsOf, type Card, type Round } from "../lib/book";
import { drawCard, loadPictures, type CardData } from "../lib/draw-card";
import { KIND_TEXT, LEVEL_COUNT, levelLine, levelName, levelOf, placeInWorld, worldLevels, worldOf } from "../lib/levels";
import { PACKS, packFromHash, packOf, type PackId } from "../lib/packs";
import { MOVED_KEY, TOOL, WORLD_KEY, moveOldStars, nextUp, readWorld, recommended } from "../lib/progress";
import {
  back, begin as sessionBegin, choosingAllowed, closeList, createSession, endLive, home, leave, openList, pause, restShows, resume, tapCounts, toEnd, won, type Screen,
} from "../lib/session";
import { boing, stick, swish, worldTune } from "../lib/sound";
import { EndScreen, type Result } from "./end-screen";
import { BookArt, CellPic, FINGER, Figure, KindIcon, NextIcon, PeekPic, Pic, type Ring } from "./pictures";

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const CONFETTI = ["#f2a900", "#e24b3b", "#2e9e44", "#1e63d6", "#f48fb1"];

/** The big card's clue for a card not yet solved (and what stays under the sticker once it lands, which is `children`). */
function Cue({ card, solved, helped, children }: { card: Card; solved: boolean; helped: boolean; children?: ReactNode }) {
  const { kind, target } = card;
  if (target.view) {
    const lens = <span className="ns-lens"><Figure view="body" focus={target.spots![0]} side={target.view === "face" ? 26 : 30} rings={[]} className="ns-pic" /></span>;
    return <div className={`ns-slot ${kind === "lens" ? "ns-slot-lens" : "ns-slot-word"}`}>{(kind === "lens" || helped || solved) && lens}</div>;
  }
  const inner = kind === "match" ? <Pic id={target.art} className="ns-pic ns-faint" />
    : kind === "peek" ? <PeekPic id={target.art} open={solved} />
    : kind === "home" ? <Pic id={target.home!} />
    : kind === "paint" ? <Pic id={target.thing!.art} className="ns-pic ns-grey" />
    : kind === "splat" ? <Pic id={target.id} />
    : null;
  return <div className={`ns-slot ns-slot-${kind}`}>{inner}{children}</div>;
}

/** The word on a name card. */
function wordOf(card: Card) {
  if (card.kind === "bn") return { text: card.target.bn, latin: false };
  if (card.kind === "en") return { text: card.target.en, latin: true };
  if (card.kind === "role") return { text: card.target.role!, latin: false };
  return null;
}

export function NameBook() {
  const [session] = useState(createSession);
  const [screen, setScreen] = useState<Screen>("title");
  const [, setPaused] = useState(false);
  const [world, setWorld] = useState<PackId>("pashu");
  const [level, setLevel] = useState(1);
  const levelRef = useRef(1);
  const worldRef = useRef<PackId>("pashu");
  const [firstRound] = useState(() => createRound(1, 1));
  const round = useRef<Round>(firstRound);
  const [, setVersion] = useState(0);
  const [landing, setLanding] = useState<{ dx: number; dy: number; key: string } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [showing, setShowing] = useState(false);
  const showingRef = useRef(false);
  showingRef.current = showing;
  const [touched, setTouched] = useState(false);
  const [slow] = useSlowMode();
  const levels = useLevels(TOOL, LEVEL_COUNT);
  const starsRef = useRef(levels.stars);
  starsRef.current = levels.stars;
  const { resting, atBreak, extend } = useKidsSession();
  session.resting = resting;
  const chosen = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const cardBox = useRef<HTMLDivElement>(null);
  const figureBox = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLCanvasElement>(null);
  /** The game's keys work only while the stage is on screen, so Space still scrolls the page below it. */
  const inView = useRef(true);

  const sync = () => { setScreen(session.screen); setPaused(session.paused); };
  const redraw = () => setVersion(value => value + 1);

  /** A level ready on the title (nothing starts until খেলো). */
  function prepare(next: number) {
    const spec = levelOf(next);
    levelRef.current = spec.id; worldRef.current = spec.world;
    setLevel(spec.id); setWorld(spec.world);
  }

  /** খেলো or আবার খেলো: a fresh page of the chosen level. Past today's limit the rest screen comes instead. */
  function begin() {
    if (!sessionBegin(session, atBreak(), performance.now())) { sync(); return; }
    chosen.current = true;
    round.current = createRound(levelRef.current, newSeed());
    setLanding(null); setResult(null); setShowing(false);
    swish();
    sync(); redraw();
  }

  /** The last sticker is placed: the stars and today's limit are settled at this tap, never in a timer. */
  function finish(r: Round) {
    const spec = levelOf(r.level), stars = starsOf(r.firstTry, r.cards.length);
    if (!won(session, atBreak())) return;
    levels.record(r.level, stars);
    setResult({ level: r.level, stars, first: r.firstTry, cells: r.cards.map(pageCell), title: pageTitle(r.level, r.cards.length, bn), away: packOf(spec.world).away, finale: spec.finale ?? null });
    if (spec.finale) { worldTune(worldOf(spec.world).root); confetti({ colors: CONFETTI, count: 60 }); }
  }

  /** A sticker (or a part of the figure) is tapped. */
  function pick(id: string, element: Element | null) {
    if (tapCounts(session) !== "counts") return;
    const r = round.current, outcome = choose(r, id);
    if (outcome === "ignored") return;
    setTouched(true);
    if (outcome === "again") { shake(element); return; }
    if (outcome === "wrong") { boing(); shake(element); redraw(); return; }
    stick(worldOf(levelOf(r.level).world).root);
    const from = element?.getBoundingClientRect(), to = cardBox.current?.querySelector(".ns-slot")?.getBoundingClientRect();
    setLanding({
      dx: from && to && !onFigure(levelOf(r.level)) ? from.left + from.width / 2 - (to.left + to.width / 2) : 0,
      dy: from && to && !onFigure(levelOf(r.level)) ? from.top + from.height / 2 - (to.top + to.height / 2) : 0,
      key: `${r.seed}-${r.index}`,
    });
    if (r.full) finish(r);
    redraw();
  }

  /** → (or the solved card): the next card, or the end screen once the page is full. */
  function next() {
    const r = round.current;
    if (!r.solved || tapCounts(session) !== "counts") return;
    if (r.full) { if (toEnd(session, performance.now())) { sfx.pop(); sync(); } return; }
    if (advance(r)) { swish(); setLanding(null); redraw(); }
  }

  /** শেষ: back to the title with the next level ready. */
  function finishUp() {
    if (!endLive(session, performance.now())) return;
    sfx.tap();
    home(session); setResult(null); setShowing(false);
    prepare(nextUp(levelRef.current, worldRef.current));
    sync();
  }

  /** নতুন করে শুরু, a #p= link: this level's title. */
  function toTitle(next: number) {
    home(session); setResult(null); setShowing(false); setLanding(null);
    prepare(next);
    sync();
  }

  function pickWorld(id: PackId) {
    if (!choosingAllowed(session)) return;
    sfx.tap();
    chosen.current = true;
    write(WORLD_KEY, id);
    history.replaceState(history.state, "", `${location.pathname}${location.search}#p=${id}`);
    prepare(recommended(id, starsRef.current));
  }
  const showList = () => { if (openList(session)) { sfx.tap(); sync(); } };
  const pickLevel = (id: number) => { if (session.screen !== "list") return; sfx.tap(); chosen.current = true; closeList(session, true); setResult(null); prepare(id); sync(); };
  const hideList = () => { closeList(session, false); sync(); };

  // A #p= link opens its world's title (even mid-round: the round is left, never a new one started). Otherwise the last world.
  useEffect(() => {
    const readLink = () => {
      const id = packFromHash(location.hash);
      if (!id) return false;
      chosen.current = true;
      write(WORLD_KEY, id);
      toTitle(recommended(id, starsRef.current));
      return true;
    };
    if (!readLink()) prepare(recommended(readWorld(read(WORLD_KEY)), {}));
    const onHash = () => { readLink(); };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // The old per-pack stars move once into this game's levels. Then open at the level to play next, unless a link or a tap chose.
  useEffect(() => {
    if (!levels.loaded) return;
    const moved = moveOldStars(read);
    if (moved) {
      for (const [id, earned] of Object.entries(moved)) if ((levels.stars[Number(id)] ?? 0) < earned) levels.record(Number(id), earned);
      write(MOVED_KEY, "1");
    }
    if (!chosen.current && session.screen === "title") prepare(recommended(worldRef.current, moved ?? levels.stars));
  }, [levels.loaded]);

  // Between rounds is a break: if today's time runs out on the title or the end screen, rest comes now, never mid-round.
  useEffect(() => {
    if (screen === "play" || resting) return;
    const check = setInterval(() => { atBreak(); }, 1000);
    return () => clearInterval(check);
  }, [screen, resting, atBreak]);

  // The card, drawn only when a grown-up opens আব্বু-আম্মুকে দেখাও.
  const cardData: CardData | null = result ? { label: `নাম শিখি · ${packOf(levelOf(result.level).world).bn}`, title: result.title, stars: result.stars, cells: result.cells } : null;
  useEffect(() => {
    if (!showing || !cardData) return;
    let live = true;
    void (async () => {
      await loadCardFonts(`${cardData.label} ${cardData.title} ${cardData.cells.map(cell => `${cell.top} ${cell.bottom}`).join(" ")}`);
      const pictures = await loadPictures(cardData.cells.map(cell => cell.art));
      if (live && preview.current) drawCard(preview.current, cardData, pictures, location.host);
    })().catch(() => {});
    return () => { live = false; };
  }, [showing, result]);

  const player = useGamePlayer({
    onPause: () => { pause(session); sync(); },
    onResume: () => { resume(session); sync(); },
    onRestart: () => { resume(session); toTitle(levelRef.current); },
  });
  const playerPaused = useRef(false);
  playerPaused.current = player.paused;

  useEffect(() => {
    const element = root.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => { inView.current = entry.isIntersecting; }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Away and back: blur and a hidden tab mean the next tap mid-round only wakes the game.
  useEffect(() => {
    const away = () => { leave(session); };
    const here = () => { back(session); };
    const seen = () => { if (document.hidden) away(); else here(); };
    window.addEventListener("blur", away);
    window.addEventListener("focus", here);
    document.addEventListener("visibilitychange", seen);
    return () => { window.removeEventListener("blur", away); window.removeEventListener("focus", here); document.removeEventListener("visibilitychange", seen); };
  }, []);

  // ---- keys, at the window: the game's own keys never fall through to a button clicked earlier ----
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.("input, textarea, select, [contenteditable], .kk-show, .kk-rest, .kk-gate, .kk-gate-open, .kk-note")) return;
    if (!inView.current || playerPaused.current || restShows(session) || showingRef.current) return;
    const key = event.key, onButton = Boolean(target?.closest?.("button, a, summary")), go = key === " " || key === "Enter";
    const digit = /^[1-9]$/.test(key) ? Number(key) : 0;
    if ((key === "p" || key === "P") && session.screen === "play") { event.preventDefault(); player.requestPause(); return; }
    if (session.screen === "title") {
      if (go && !event.repeat && !onButton) { event.preventDefault(); begin(); }
      return;
    }
    if (session.screen === "list") {
      const spec = worldLevels(worldRef.current)[digit - 1];
      if (spec && !event.repeat) { event.preventDefault(); pickLevel(spec.id); }
      return;
    }
    if (session.screen === "end") {
      // A fresh press only: a key held through the last card never starts the next round.
      if (go && !event.repeat && !onButton && event.timeStamp >= session.endAt) { event.preventDefault(); begin(); }
      return;
    }
    const r = round.current;
    if (go && !onButton && r.solved) { event.preventDefault(); if (!event.repeat) next(); return; }
    if (digit && !event.repeat && !r.solved) {
      const choice = r.choices[digit - 1];
      if (choice) { event.preventDefault(); pick(choice.id, root.current?.querySelector(`[data-choice="${choice.id}"]`) ?? null); }
    }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    window.addEventListener("keydown", listen);
    return () => window.removeEventListener("keydown", listen);
  }, []);

  const blurAfter = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  /** A sticker acts on the first finger's touch, not on the lift; Enter or Space on a focused one clicks it. */
  const stickerDown = (id: string) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!event.isPrimary || event.button > 0) return;
    const element = event.currentTarget;
    pick(id, element);
    requestAnimationFrame(() => element.blur());
  };

  const spec = levelOf(level), pack = packOf(world), palette = worldOf(world).palette;
  const r = round.current, card = cardOf(r), playSpec = levelOf(r.level), figure = onFigure(playSpec);
  const answer = answerOf(card), hint = hinting(r), word = wordOf(card);
  // The ghost finger: on the first card of a world's first level never played, on the right sticker, then on →.
  const firstRun = r.index === 0 && placeInWorld(r.level) === 1 && !levels.stars[r.level], firstEver = firstRun && !touched;
  const learned = learnedLine(card), cell = pageCell(card);
  const lastWrong = r.wrong[r.wrong.length - 1];
  const wrongName = lastWrong ? (figure ? packOf("shorir").items.find(item => item.id === lastWrong)?.bn : r.choices.find(choice => choice.id === lastWrong)?.bn) : undefined;
  const worldStars = totalStars(Object.fromEntries(worldLevels(world).map(item => [item.id, levels.stars[item.id] ?? 0])));
  const suggest = recommended(world, levels.stars);
  const style = { "--ns-paper": palette.paper, "--ns-edge": palette.edge, "--ns-deep": palette.deep, "--ns-glow": palette.glow } as CSSProperties;
  // The rest screen is a real modal that blocks every tap outside it. On a phone the game sits hidden behind the launch card until
  // খেলো, so it mounts only once the stage is on screen; otherwise its blocker would make that খেলো dead with nothing to show.
  const showRest = resting && screen !== "play" && player.stage.width > 0;

  /** The sticker's name tag and →: under the card, or inside it on শরীর so the figure stays big. */
  const after = <div className="ns-after" role="status" aria-live="polite">
                <p className="ns-tag gx-pop"><b>{learned.main}</b><span lang="en">{learned.sub}</span></p>
                {learned.fact && <p className="ns-fact">{learned.fact}</p>}
                <button type="button" className="ns-next" onClick={event => { event.stopPropagation(); event.currentTarget.blur(); next(); }} aria-label={r.full ? "পাতা ভরে গেছে, দেখো" : "পরের কার্ড"}>
                  <NextIcon />
                  {firstRun && <span className="ns-ghost-at">{FINGER}</span>}
                </button>
              </div>;

  const rings: Ring[] = [];
  if (figure && card.target.view) {
    for (const id of r.wrong) for (const at of packOf("shorir").items.find(item => item.id === id)?.spots ?? []) rings.push({ at, kind: "wrong" });
    if (r.solved || hint) for (const at of card.target.spots ?? []) rings.push({ at, kind: r.solved ? "right" : "hint" });
  }
  const tapFigure = (x: number, y: number) => {
    const part = spotAt(card.target.view!, x, y);
    if (part) pick(part.id, figureBox.current);
  };

  return (
    <div className="ns" ref={root} style={style} data-world={world} data-screen={screen} data-slow={slow || undefined}>
      <div className="ns-top">
        <p className="ns-badge">
          <b>{packOf(screen === "play" ? playSpec.world : world).bn}</b>
          <span>{bn(placeInWorld(screen === "play" ? r.level : level))} · {(screen === "play" ? playSpec : spec).finale ? <>★ {(screen === "play" ? playSpec : spec).finale}</> : levelName(screen === "play" ? r.level : level)}</span>
        </p>
        {screen === "play"
          ? <ol className="ns-strip" aria-label={`${bn(r.cards.length)}টার মধ্যে ${bn(r.index + (r.solved ? 1 : 0))}টা বসানো`}>
              {r.cards.map((item, index) => {
                const placed = index < r.index || (index === r.index && r.solved), page = pageCell(item);
                return <li key={`${item.target.id}${index}`} className={placed ? "on" : index === r.index ? "now" : ""}>{placed && <CellPic art={page.art} spot={page.spot} />}</li>;
              })}
            </ol>
          : <p className="ns-total" aria-label={`${pack.bn}: মোট ${bn(worldStars)} তারা`}>★ {bn(worldStars)}</p>}
      </div>

      <div className="ns-stage">
        {screen === "title" && <div className="ns-title">
          <button type="button" className="ns-start" onClick={blurAfter(begin)} aria-label={`খেলো: ${pack.bn}, ${levelName(level)}`}>
            <BookArt world={world} />
            <span className="ns-start-label">খেলো</span>
          </button>
          <ul className="ns-worlds" aria-label="কোনটার নাম শিখবে?">
            {PACKS.map(item => <li key={item.id}>
              <button type="button" aria-pressed={item.id === world} onClick={blurAfter(() => pickWorld(item.id))}>
                <Pic id={item.icon} className="ns-world-pic" /><span>{item.bn}</span>
              </button>
            </li>)}
          </ul>
          <button type="button" className="ns-level-chip" onClick={blurAfter(showList)}>
            <b>{bn(placeInWorld(level))}</b> · {spec.finale ?? levelName(level)} <span>সব লেভেল</span>
          </button>
          <p className="ns-line">{levelLine(level)}</p>
        </div>}

        {screen === "list" && <div className="ns-list" role="dialog" aria-label={`${pack.bn}: সব লেভেল`}>
          <div className="ns-list-head"><h2>{pack.bn}: সব লেভেল</h2><button type="button" className="kit-link" onClick={hideList}>ফিরে যাও</button></div>
          <ol>
            {worldLevels(world).map(item => {
              const earned = levels.stars[item.id] ?? 0, place = placeInWorld(item.id);
              return <li key={item.id}>
                <button type="button" aria-current={item.id === level ? "true" : undefined} className={item.id === suggest ? "next" : ""} onClick={() => pickLevel(item.id)}
                  aria-label={`${bn(place)}: ${levelName(item.id)}${earned ? `, ${bn(earned)} তারা` : ""}${item.id === suggest ? ", এটা খেলো" : ""}`}>
                  <b className="ns-list-n">{bn(place)}</b>
                  <KindIcon kind={item.finale ? "finale" : item.kinds[0]} world={world} />
                  <span className="ns-list-text"><strong>{levelName(item.id)}</strong><small>{levelLine(item.id)}</small></span>
                  <span className="ns-stars" aria-hidden="true">{[0, 1, 2].map(k => <i key={k} className={k < earned ? "on" : ""}>★</i>)}</span>
                  {item.id === suggest && <em>এটা খেলো</em>}
                </button>
              </li>;
            })}
          </ol>
        </div>}

        {screen === "play" && <div className="ns-play" data-kind={card.kind} data-figure={figure || undefined} data-solved={r.solved || undefined}>
          <div ref={cardBox} className={`ns-card${r.solved ? " solved" : ""}`} key={`${r.seed}-${r.index}`} onClick={r.solved ? blurAfter(next) : undefined}>
            {figure && r.solved ? after : <><Cue card={card} solved={r.solved} helped={lensHelps(r)}>
              {r.solved && !figure && <div className="ns-landed" key={landing?.key} style={{ "--dx": `${landing?.dx ?? 0}px`, "--dy": `${landing?.dy ?? 0}px` } as CSSProperties}>
                <Pic id={cell.art} />
              </div>}
            </Cue>
            <div className="ns-ask-box">{word && <p className={`ns-word${word.text.length > 8 ? " long" : ""}`} lang={word.latin ? "en" : undefined}>{word.text}</p>}
            {!r.solved && <p className="ns-ask">{figure ? KIND_TEXT.lens.ask : KIND_TEXT[card.kind].ask}</p>}</div></>}
          </div>

          {figure && <div className="ns-figure-wrap"><div ref={figureBox} className={`ns-figure-box ns-${card.target.view}`}>
            <Figure view={card.target.view!} rings={rings} onTap={r.solved ? undefined : tapFigure} />
            {firstEver && !r.solved && <span className="ns-ghost-at" style={spotPercent(card.target.view!, card.target.spots![0])}>{FINGER}</span>}
            <div className="ns-parts">{packOf("shorir").items.filter(item => item.view === card.target.view).map(item =>
              <button type="button" key={item.id} data-ok={item.id === answer ? "1" : undefined} style={spotPercent(item.view!, item.spots![0])} aria-label={`${item.bn}, ${item.en}`}
                onClick={event => { if (event.detail === 0) pick(item.id, figureBox.current); }} disabled={r.solved} />)}</div>
          </div></div>}

          <div className="ns-bottom" data-n={figure ? 0 : r.choices.length}>{r.solved
            ? !figure && after
            : <>
                {!figure && <ul className={`ns-tray n${r.choices.length}`}>
                  {r.choices.map((choice, index) => {
                    const right = choice.id === answer, tried = r.wrong.includes(choice.id), named = namedKind(card.kind);
                    return <li key={choice.id}>
                      <button type="button" className={`ns-sticker${tried ? " tried" : ""}${hint && right ? " glow" : ""}`} data-choice={choice.id} data-ok={right ? "1" : undefined}
                        onPointerDown={stickerDown(choice.id)} onClick={event => { if (event.detail === 0) pick(choice.id, event.currentTarget); }}
                        aria-label={tried || named ? `${choice.bn}, ${choice.en}` : `${bn(index + 1)} নম্বর স্টিকার`}>
                        <i className="ns-key" aria-hidden="true">{bn(index + 1)}</i>
                        <Pic id={choice.art} />
                        {(named || tried) && <span className="ns-name" lang={card.kind === "en" && !tried ? "en" : undefined}>{card.kind === "en" && !tried ? choice.en : choice.bn}</span>}
                        {firstEver && right && <span className="ns-ghost-at">{FINGER}</span>}
                      </button>
                    </li>;
                  })}
                </ul>}
                <p className="ns-try" role="status" aria-live="polite">{hint ? "আলো জ্বলা স্টিকারটা দেখো।" : wrongName ? `এটা ${wrongName}। আরেকবার ভাবো।` : ""}</p>
              </>}</div>
        </div>}

        {screen === "end" && result && <EndScreen result={result} onAgain={begin} onDone={finishUp} onShow={() => setShowing(true)} />}
      </div>

      {cardData && <ShowParent open={showing} onClose={() => setShowing(false)} picture={{
        fileName: `nam-shikhi-${result!.level}.png`,
        make: async () => { const pictures = await loadPictures(cardData.cells.map(item => item.art)); return renderCard(canvas => drawCard(canvas, cardData, pictures, location.host)); },
      }}>
        <div className="kit-card"><canvas ref={preview} width={1080} height={1350} role="img" aria-label={`নাম শিখির কার্ড: ${cardData.title}`} /></div>
        <ParentGate label="খেলাটার লিংক"><ShareToolLink title="নাম শিখি" text="ছবির খাতায় স্টিকার বসিয়ে পশুপাখি, ফল, সবজি, শরীর, রং আর দেশের প্রতীকের নাম শেখার খেলা।" /></ParentGate>
      </ShowParent>}
      {showRest && <RestScreen onExtend={extend} />}
    </div>
  );
}
