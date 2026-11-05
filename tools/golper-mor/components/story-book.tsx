'use client';
// IP: what we avoided — no Meena, Sisimpur or TV look-alikes, no NCTB story text or pictures, no Nazrul/Jasimuddin; every story and drawing is original.
// Thin React over the pure machine in lib/session.ts. A kids' page: nothing the child does leaves the phone, nothing speaks,
// and the read marks are saved in the same tap that ends a story. The share link, the picture and the clear button sit behind the parent gate.
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { loadCardFonts } from '../../../shared/card-canvas';
import { confetti, sfx, useSlowMode } from '../../../shared/game-kit';
import { useGamePlayer } from '../../../shared/game-player-client';
import { ParentGate, RestScreen, ShareToolLink, ShowParent, bn, useKidsSession } from '../../../shared/kids-kit';
import { cardBlob, drawCard } from '../lib/draw-card';
import { PROGRESS_KEY, bothCount, empty, isRead, newlyLit, nextToRead, readCount, readProgress, recordFinish, shelfLit, todayOf, type Progress } from '../lib/progress';
import {
  atTurn, choose, createSession, endLive, finish, leave, nextPanel, openStory, pathLength, pause, prevPanel, restShows, restart, resume, returned, tapCounts, toShelf, tryOther, type Session,
} from '../lib/session';
import { lamp, pick, swish, theEnd, turn } from '../lib/sound';
import { STORIES, WORLDS, isFinale, storyOf, worldOf, type Side } from '../lib/stories';
import { Scene } from './art';
import { EndScreen, type EndInfo } from './end-screen';
import { FINGER, ForkIcon, Lamp, NextIcon, PlayIcon, PrevIcon, Ribbon, ShelfIcon, TheEndIcon } from './pictures';

const dhakaDay = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });
/** The saved text, or undefined when storage can't be read at all. */
const readSaved = () => { try { return localStorage.getItem(PROGRESS_KEY); } catch { return undefined; } };

export function StoryBook() {
  const [session] = useState<Session>(createSession);
  const [, setVersion] = useState(0);
  const redraw = () => setVersion(value => value + 1);
  const [progress, setProgress] = useState<Progress>(empty);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const [info, setInfo] = useState<EndInfo | null>(null);
  const [showing, setShowing] = useState(false);
  const showingRef = useRef(false);
  showingRef.current = showing;
  const [host, setHost] = useState('');
  const [touched, setTouched] = useState(false);
  const [slow] = useSlowMode();
  const { resting, atBreak, extend } = useKidsSession();
  session.resting = resting;
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLCanvasElement>(null);
  /** The book's keys work only while the stage is on screen, so Space still scrolls the page below it. */
  const inView = useRef(true);

  // The saved marks, read again whenever another tab may have changed them.
  useEffect(() => {
    const refresh = () => { const raw = readSaved(); if (raw !== undefined) setProgress(readProgress(raw)); };
    refresh();
    setHost(location.host);
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);

  // On the shelf the time can run out while the child looks at covers: the rest comes then, never inside a story.
  const screen = session.screen;
  useEffect(() => {
    if (screen !== 'shelf' || resting) return;
    const check = setInterval(() => { atBreak(); }, 1000);
    return () => clearInterval(check);
  }, [screen, resting, atBreak]);

  // The card, drawn only when a grown-up opens আব্বু-আম্মুকে দেখাও.
  useEffect(() => {
    if (!showing) return;
    let live = true;
    loadCardFonts('গল্পের মোড় আজ গল্প পড়লাম দুই মোড়ই').then(() => { if (live && card.current) drawCard(card.current, todayOf(progress, dhakaDay()), progress, host); }).catch(() => {});
    return () => { live = false; };
  }, [showing, progress, host]);

  const rootHz = () => worldOf(session.id).root;

  /** A cover (or the big one): the story from its first picture. Past today's limit the rest comes instead. */
  function open(id: string) {
    if (session.screen !== 'shelf' || session.paused) return;
    setTouched(true);
    if (!openStory(session, id, atBreak(), performance.now())) { redraw(); return; }
    swish(); setInfo(null); setShowing(false); redraw();
  }

  /** The story's last picture: the mark is saved and the limit checked in this very tap, never in a timer. */
  function finishUp() {
    const over = atBreak();
    if (!finish(session, over, performance.now())) return;
    const raw = readSaved(), before = raw === undefined ? progressRef.current : readProgress(raw);
    const next = recordFinish(raw, progressRef.current, session.id, session.side as Side, dhakaDay());
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(next)); } catch { /* private mode: the marks live until the page closes */ }
    setProgress(next);
    const lit = newlyLit(before, next, session.id) !== null;
    setInfo({ id: session.id, side: session.side as Side, today: todayOf(next, dhakaDay()).length, total: readCount(next), both: bothCount(next), otherUnread: (next.read[session.id] ?? []).length < 2, lit });
    theEnd(rootHz());
    if (lit) { lamp(rootHz(), 1); confetti({ count: 60 }); }
  }

  /** Which way the pictures are going, and whether the last input was a key (a key press never animates). */
  const mark = (dir: 'fwd' | 'back') => { if (root.current) root.current.dataset.dir = dir; };

  /** → : the next picture, the মোড়, or the end. */
  function forward() {
    if (tapCounts(session) !== 'counts') return;
    setTouched(true);
    const result = nextPanel(session);
    mark('fwd');
    if (result === 'panel') swish();
    else if (result === 'turn') turn(rootHz());
    else if (result === 'last') finishUp();
    redraw();
  }
  function backOne() {
    if (tapCounts(session) !== 'counts') return;
    if (prevPanel(session)) { mark('back'); swish(); redraw(); }
  }
  function takePath(side: Side) {
    if (tapCounts(session) !== 'counts') return;
    setTouched(true);
    if (choose(session, side)) { pick(rootHz()); redraw(); }
  }
  function shelf() {
    if (session.paused) return;
    sfx.tap(); toShelf(session); setInfo(null); setShowing(false); redraw();
  }
  function other() {
    if (!endLive(session, performance.now())) return;
    if (tryOther(session, atBreak(), performance.now())) { turn(rootHz()); setInfo(null); }
    redraw();
  }
  function again() {
    if (!endLive(session, performance.now())) return;
    if (openStory(session, session.id, atBreak(), performance.now())) { swish(); setInfo(null); }
    redraw();
  }
  function done() {
    if (!endLive(session, performance.now())) return;
    sfx.tap(); toShelf(session); setInfo(null); setShowing(false); redraw();
  }
  function clearMarks() {
    try { localStorage.removeItem(PROGRESS_KEY); } catch { /* none */ }
    setProgress(empty());
  }

  const player = useGamePlayer({
    onPause: () => { pause(session); redraw(); },
    onResume: () => { resume(session); redraw(); },
    onRestart: () => { setInfo(null); setShowing(false); restart(session, atBreak()); redraw(); },
    onLevels: () => { toShelf(session); setInfo(null); setShowing(false); redraw(); },
  });
  const playerPaused = useRef(false);
  playerPaused.current = player.paused;

  useEffect(() => {
    const element = root.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => { inView.current = entry.isIntersecting; }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Away and back: blur and a hidden tab mean the next tap mid-story only wakes the book.
  useEffect(() => {
    const away = () => { leave(session); };
    const here = () => { returned(session); };
    const seen = () => { if (document.hidden) away(); else here(); };
    window.addEventListener('blur', away);
    window.addEventListener('focus', here);
    document.addEventListener('visibilitychange', seen);
    return () => { window.removeEventListener('blur', away); window.removeEventListener('focus', here); document.removeEventListener('visibilitychange', seen); };
  }, []);

  // ---- keys, at the window: the book's own keys never fall through to a button clicked earlier ----
  const keys = useRef<(event: KeyboardEvent) => void>(() => {});
  keys.current = event => {
    if (root.current) root.current.dataset.input = 'key';
    const target = event.target as HTMLElement | null;
    if (event.altKey || event.ctrlKey || event.metaKey || target?.closest?.('input, textarea, select, [contenteditable], .kk-show, .kk-rest, .kk-gate, .kk-gate-open, .kk-note')) return;
    if (!inView.current || playerPaused.current || restShows(session) || showingRef.current) return;
    const key = event.key, onButton = Boolean(target?.closest?.('button, a, summary')), go = key === ' ' || key === 'Enter';
    const digit = /^[1-9]$/.test(key) ? Number(key) : 0;
    if ((key === 'p' || key === 'P') && session.screen === 'read') { event.preventDefault(); player.requestPause(); return; }
    if (session.screen === 'shelf') {
      if (event.repeat) return;
      if (go && !onButton) { event.preventDefault(); open(nextToRead(progressRef.current)); }
      else if (digit && STORIES[digit - 1]) { event.preventDefault(); open(STORIES[digit - 1].id); }
      return;
    }
    if (session.screen === 'end') {
      // A fresh press only: a key held through the last picture never starts the next reading.
      if (event.repeat || event.timeStamp < session.endAt || !endLive(session, performance.now())) return;
      if (go && !onButton) { event.preventDefault(); if (info?.otherUnread && !resting) other(); else done(); }
      else if (digit === 1 && !resting) { event.preventDefault(); other(); }
      else if (digit === 2 && !resting) { event.preventDefault(); again(); }
      else if (digit === 3 || (digit === 1 && resting)) { event.preventDefault(); done(); }
      return;
    }
    if (event.repeat) return;
    if (atTurn(session)) {
      if (digit === 1 || digit === 2) { event.preventDefault(); takePath((digit - 1) as Side); }
      else if (key === 'ArrowLeft') { event.preventDefault(); backOne(); }
      return;
    }
    if ((go && !onButton) || key === 'ArrowRight') { event.preventDefault(); forward(); }
    else if (key === 'ArrowLeft') { event.preventDefault(); backOne(); }
  };
  useEffect(() => {
    const listen = (event: KeyboardEvent) => keys.current(event);
    const touch = () => { if (root.current) root.current.dataset.input = 'touch'; };
    window.addEventListener('keydown', listen);
    window.addEventListener('pointerdown', touch, true);
    return () => { window.removeEventListener('keydown', listen); window.removeEventListener('pointerdown', touch, true); };
  }, []);

  const blurAfter = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  // The rest screen is a real modal that blocks every tap outside it. On a phone the book sits hidden behind the launch card until
  // খেলো, so it mounts only once the stage is on screen; otherwise its blocker would make that খেলো dead with nothing to show.
  const showRest = restShows(session) && player.stage.width > 0;
  const worldStyle = (id: string) => { const world = worldOf(id); return { '--paper': world.paper, '--edge': world.edge, '--deep': world.deep, '--glow': world.glow } as CSSProperties; };
  const firstEver = readCount(progress) === 0 && !touched;

  let body;
  if (session.screen === 'shelf') {
    const next = storyOf(nextToRead(progress))!;
    body = <div className="gm-shelf-screen">
      <div className="gm-top">
        <p className="gm-lamps" aria-hidden="true">{WORLDS.map(world => <span key={world.id} className={`gm-lamp${shelfLit(progress, world.id) ? ' lit' : ''}`}><Lamp lit={shelfLit(progress, world.id)} /></span>)}</p>
        <p className="gm-count" aria-label={`${bn(STORIES.length)}টার মধ্যে ${bn(readCount(progress))}টা পড়া হয়েছে`}>{bn(readCount(progress))}<small>/{bn(STORIES.length)}</small></p>
      </div>
      <button type="button" className="gm-hero" style={worldStyle(next.id)} onClick={blurAfter(() => open(next.id))} aria-label={`পড়ো: ${next.title}`}>
        <Scene panel={next.intro[2]} view="0 16 320 184" slice className="gm-hero-pic" />
        <span className="gm-hero-strip">
          <span className="gm-hero-title"><small>{worldOf(next.id).name}</small>{next.title}</span>
          <span className="gm-play"><PlayIcon />{firstEver && <span className="gm-finger" aria-hidden="true">{FINGER}</span>}</span>
        </span>
      </button>
      {WORLDS.map(world => <section key={world.id} className="gm-world" style={worldStyle(world.ids[0])} aria-label={`${world.name} তাক`}>
        <h2><span className={`gm-lamp${shelfLit(progress, world.id) ? ' lit' : ''}`}><Lamp lit={shelfLit(progress, world.id)} /></span>{world.name}</h2>
        <ul>
          {world.ids.map(id => {
            const story = storyOf(id)!, sides = progress.read[id] ?? [];
            return <li key={id}>
              <button type="button" className={`gm-book${id === next.id ? ' next' : ''}${isFinale(id) ? ' finale' : ''}`} style={{ '--book': story.color } as CSSProperties} onClick={blurAfter(() => open(id))}
                aria-label={`${story.title}${sides.length === 2 ? ', দুই মোড়ই পড়া হয়েছে' : sides.length ? ', পড়া হয়েছে' : ''}`}>
                <Scene panel={story.intro[2]} view="22 30 276 170" slice className="gm-cover" />
                <span className="gm-book-title">{story.title}</span>
                <span className="gm-marks" aria-hidden="true"><Ribbon on={sides.includes(0)} /><Ribbon on={sides.includes(1)} /></span>
              </button>
            </li>;
          })}
        </ul>
      </section>)}
      <div className="gm-grown">
        <ParentGate label="বড়দের জন্য">
          <ShareToolLink title="গল্পের মোড়" text="ছোটদের ৯টা ছোট গল্প, প্রতিটায় একটা মোড়। ফ্রি, অ্যাকাউন্ট লাগে না।" />
          <button type="button" className="kit-secondary" onClick={clearMarks}>পড়ার দাগ মুছে দাও</button>
        </ParentGate>
      </div>
    </div>;
  } else if (session.screen === 'end' && info) {
    body = <div className="gm-end-wrap" style={worldStyle(info.id)}>
      <EndScreen info={info} resting={resting} onOther={other} onAgain={again} onDone={done} onShow={() => setShowing(true)} />
    </div>;
  } else {
    const story = storyOf(session.id)!;
    const path = session.side === null ? story.intro : [...story.intro, ...story.choices[session.side].panels];
    const step = Math.min(session.step, path.length - 1), panel = path[step];
    const asking = atTurn(session), last = session.side !== null && step === pathLength(session) - 1;
    const total = story.intro.length + story.choices[session.side ?? 0].panels.length;
    const seen = progress.read[story.id] ?? [];
    body = <div className="gm-read" style={worldStyle(story.id)} data-asking={asking || undefined}>
      <div className="gm-top">
        <button type="button" className="gm-shelf-btn" onClick={blurAfter(shelf)} aria-label="সব গল্প"><ShelfIcon /></button>
        <span className="gm-dots" role="img" aria-label={`${bn(total)}টা ছবির ${bn(step + 1)} নম্বর`}>{Array.from({ length: total }, (_, index) => <i key={index} className={index === step ? 'now' : index < step ? 'past' : ''} />)}</span>
        <p className="gm-story-name">{story.title}</p>
      </div>
      <div className="gm-panel" key={`${session.serial}-${session.side}-${step}`}>
        <div className="gm-art"><Scene panel={panel} tall bubble={story.other} className="gm-scene" /></div>
        <p className="gm-text">{panel.text}</p>
      </div>
      {asking
        ? <div className="gm-ask">
          <div className="gm-ask-head">
            {step > 0 ? <button type="button" className="gm-prev" onClick={blurAfter(backOne)} aria-label="আগের ছবি"><PrevIcon /></button> : <span />}
            <p className="gm-question"><ForkIcon />{story.question}</p>
          </div>
          <div className="gm-choices">
            {story.choices.map((choice, index) => {
              const side = index as Side, read = seen.includes(side);
              return <button type="button" key={choice.label} className={`gm-choice${!read && seen.length > 0 ? ' glow' : ''}`} onClick={blurAfter(() => takePath(side))}
                aria-label={`${bn(index + 1)}. ${choice.label}${read ? ', দেখা হয়েছে' : ''}`}>
                <Scene panel={choice.panels[0]} view="10 10 300 190" slice className="gm-choice-pic" />
                <i className="gm-key" aria-hidden="true">{bn(index + 1)}</i>
                {read && <i className="gm-seen" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" /></svg></i>}
                <span>{choice.label}</span>
              </button>;
            })}
          </div>
        </div>
        : <div className="gm-nav">
          <button type="button" className="gm-prev" disabled={step === 0} onClick={blurAfter(backOne)} aria-label="আগের ছবি"><PrevIcon /></button>
          <button type="button" className={`gm-next${last ? ' last' : ''}`} onClick={blurAfter(forward)}>
            {last ? <><TheEndIcon /><span>গল্প শেষ</span></> : <><span>পরের ছবি</span><NextIcon /></>}
            {firstEver && step === 0 && <span className="gm-finger" aria-hidden="true">{FINGER}</span>}
          </button>
        </div>}
    </div>;
  }

  return <div className={`gm${slow ? ' gm-still' : ''}`} ref={root} data-screen={session.screen} data-paused={player.paused || undefined}>
    {body}
    <ShowParent open={showing && session.screen === 'end'} onClose={() => setShowing(false)} picture={{ fileName: 'golper-mor.png', make: () => cardBlob(todayOf(progress, dhakaDay()), progress, host) }}>
      <div className="kit-card"><canvas ref={card} width={1080} height={1350} aria-label="আজকের গল্পের হিসাব" /></div>
    </ShowParent>
    {showRest && <RestScreen onExtend={extend} />}
  </div>;
}
