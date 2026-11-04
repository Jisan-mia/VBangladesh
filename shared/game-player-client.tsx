'use client';
/**
 * The shared game player: the big stage every game plays in, its pause menu, and immersive (full-screen) mode.
 * The page layout around it is <GamePage> in ./game-player.tsx. Full guide: ai_docs/game-dev/game-player.md.
 *
 * A game inside the player can call:
 *
 *   const player = useGamePlayer({ onPause, onResume, onRestart });
 *
 *   player.paused       true while the pause menu is open (the player opens it on blur, tab hide, Escape, Back, the button)
 *   player.immersive    true while the game fills the screen
 *   player.stage        { width, height } of the play area in CSS px (0 × 0 outside a player or before the first measure)
 *   player.requestRestart()          the same as নতুন করে শুরু in the menu
 *   player.requestPause()            opens the pause menu, the same as the button (use it for the game's own P key)
 *   player.onPause(fn) / onResume(fn) / onRestart(fn)   subscribe; each returns an unsubscribe. The handlers argument does this for you.
 *
 * The same size is on the stage element as CSS variables --stage-w and --stage-h (plus data-immersive), so CSS alone can fit a board:
 *   .gp-stage .my-board { width: min(100%, calc((var(--stage-h, 100svh) - 220px) * .75)); }
 *
 * Rules the player keeps for every game, migrated or not:
 * - Pausing blurs the focused element, sends `pointercancel` to a finger still held on the game, dispatches a synthetic
 *   window `blur` (games drop held keys; useGameLoop stops) and cuts scheduled tones (silenceScheduled). Resuming sends `focus`.
 * - A game with no onPause handler is paused by a soft hide: document.hidden reads true and `visibilitychange` fires, so the
 *   pause most games already have (and useGameLoop's frame stop) kicks in. চালিয়ে যাও undoes it.
 * - Restart calls onRestart handlers if there are any; otherwise the game is remounted, which resets it from scratch.
 * - onRestart replaces onResume: after a restart the game is no longer paused and onResume is not called.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useSlowMode, useSound } from './game-kit';
import { sfx, silenceScheduled } from './game-sound';
import { closedNav, inlineStage, navigate, withRecent, PHONE_QUERY, RECENT_KEY, type Nav, type NavEffect, type StageShape } from './game-player-core';

type Handler = () => void;
type Subscribe = (handler: Handler) => () => void;

export type GamePlayerApi = {
  paused: boolean;
  immersive: boolean;
  stage: { width: number; height: number };
  requestRestart: () => void;
  requestPause: () => void;
  onPause: Subscribe;
  onResume: Subscribe;
  onRestart: Subscribe;
};

const none: Subscribe = () => () => {};
const outside: GamePlayerApi = { paused: false, immersive: false, stage: { width: 0, height: 0 }, requestRestart: () => {}, requestPause: () => {}, onPause: none, onResume: none, onRestart: none };
const PlayerContext = createContext<GamePlayerApi>(outside);

/** The player around this game. Pass handlers to subscribe to them; the latest ones are always called, so no stale closures. */
export function useGamePlayer(handlers?: { onPause?: Handler; onResume?: Handler; onRestart?: Handler }): GamePlayerApi {
  const player = useContext(PlayerContext);
  const latest = useRef(handlers);
  latest.current = handlers;
  const wants = [Boolean(handlers?.onPause), Boolean(handlers?.onResume), Boolean(handlers?.onRestart)] as const;
  const { onPause, onResume, onRestart } = player;
  useEffect(() => {
    const off = [
      wants[0] ? onPause(() => latest.current?.onPause?.()) : null,
      wants[1] ? onResume(() => latest.current?.onResume?.()) : null,
      wants[2] ? onRestart(() => latest.current?.onRestart?.()) : null,
    ];
    return () => off.forEach(stop => stop?.());
  }, [onPause, onResume, onRestart, wants[0], wants[1], wants[2]]);
  return player;
}

type Panel = 'main' | 'howto';

const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode: fine */ } };
const typing = (target: EventTarget | null) => target instanceof HTMLElement && Boolean(target.closest('input, textarea, select, [contenteditable]'));

// Icons are drawn here, stroke only, so they take the text colour.
const paths: Record<string, ReactNode> = {
  pause: <path d="M9 5v14M15 5v14" />,
  play: <path d="M8 5.5v13l10.5-6.5z" className="gp-fill" />,
  restart: <><path d="M4.5 12a7.5 7.5 0 1 0 2.3-5.4" /><path d="M4 4.5v4h4" /></>,
  help: <><circle cx="12" cy="12" r="8.5" /><path d="M9.6 9.6a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.4" /><path d="M12 17h.01" /></>,
  full: <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />,
  small: <path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" />,
  soundOn: <><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" /></>,
  soundOff: <><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" /><path d="m16 10 4 4M20 10l-4 4" /></>,
  slow: <><circle cx="10" cy="12" r="5.5" /><path d="M10 12a2 2 0 1 0 2-2M2.5 18h15a3 3 0 0 0 3-3v-4m0 0-1.2-3m1.2 3 1.8-2.4" /></>,
  exit: <><path d="M14 4h5v16h-5" /><path d="M10 8l-4 4 4 4M6 12h9" /></>,
  back: <path d="M15 5l-7 7 7 7" />,
};
const Icon = ({ name }: { name: keyof typeof paths }) => <svg className="gp-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;

export type GamePlayerProps = {
  slug: string;
  name: string;
  /** The title block with the page's only H1, rendered by GamePage. */
  head: ReactNode;
  lead: string;
  art: ReactNode;
  steps: string[];
  guideTitle: string;
  kids: boolean;
  shape: StageShape;
  /** The parent note for kids' games (shared/kids-kit ParentNote); shown on the launch card and in কীভাবে খেলবে. */
  note?: ReactNode;
  railLeft?: ReactNode;
  railRight?: ReactNode;
  children: ReactNode;
};

export function GamePlayer({ slug, name, head, lead, art, steps, guideTitle, kids, shape, note, railLeft, railRight, children }: GamePlayerProps) {
  const [immersive, setImmersive] = useState(false);
  const [menu, setMenu] = useState<Panel | null>(null);
  const [stage, setStage] = useState({ width: 0, height: 0 });
  const [box, setBox] = useState<{ width: number; height: number; rows: number } | null>(null);
  const [run, setRun] = useState(0);
  const [started, setStarted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [sound, setSound] = useSound();
  const [slow, setSlow] = useSlowMode();

  const root = useRef<HTMLElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const nav = useRef<Nav>(closedNav);
  const paused = useRef(false);
  const engaged = useRef(false);
  const recorded = useRef(false);
  const soft = useRef(false);
  const synthetic = useRef(false);
  const askedFullscreen = useRef(false);
  const enteredAt = useRef(0);
  const phone = useRef(false);
  // The finger or mouse button held on the game, so a pause can cancel it (the game never sees its pointerup under the menu).
  const held = useRef<{ target: Element; id: number; type: string } | null>(null);
  const handlers = useRef({ pause: new Set<Handler>(), resume: new Set<Handler>(), restart: new Set<Handler>() });

  const subscribe = (kind: 'pause' | 'resume' | 'restart'): Subscribe => handler => {
    handlers.current[kind].add(handler);
    return () => { handlers.current[kind].delete(handler); };
  };
  const [onPause] = useState(() => subscribe('pause'));
  const [onResume] = useState(() => subscribe('resume'));
  const [onRestart] = useState(() => subscribe('restart'));

  /** Fire an event the player itself must not react to. */
  const quietly = (fire: () => void) => { synthetic.current = true; try { fire(); } finally { synthetic.current = false; } };

  // ---- soft hide: how a game that never heard of the player still pauses ----
  const softHide = () => {
    if (soft.current || document.hidden) return;
    try {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    } catch {
      // Some embedded browsers pin document.hidden. The menu still covers the game and the synthetic blur still went out.
      Reflect.deleteProperty(document, 'hidden');
      return;
    }
    soft.current = true;
    quietly(() => document.dispatchEvent(new Event('visibilitychange')));
  };
  const softShow = () => {
    if (!soft.current) return;
    soft.current = false;
    Reflect.deleteProperty(document, 'hidden');
    Reflect.deleteProperty(document, 'visibilityState');
    if (!document.hidden) quietly(() => document.dispatchEvent(new Event('visibilitychange')));
  };

  const record = () => {
    engaged.current = true;
    if (recorded.current) return;
    recorded.current = true;
    write(RECENT_KEY, JSON.stringify(withRecent(read(RECENT_KEY), slug)));
  };

  const openMenu = useCallback((panel: Panel = 'main') => {
    setMenu(panel);
    if (paused.current) return;
    paused.current = true;
    const active = document.activeElement;
    if (active instanceof HTMLElement && shell.current?.contains(active)) active.blur();
    const pointer = held.current;
    held.current = null;
    if (pointer) quietly(() => {
      try { if (pointer.target.hasPointerCapture?.(pointer.id)) pointer.target.releasePointerCapture(pointer.id); } catch { /* already released */ }
      pointer.target.dispatchEvent(new PointerEvent('pointercancel', { pointerId: pointer.id, pointerType: pointer.type, isPrimary: true, bubbles: true }));
    });
    quietly(() => window.dispatchEvent(new Event('blur')));
    silenceScheduled();
    handlers.current.pause.forEach(handler => handler());
    if (!handlers.current.pause.size) softHide();
  }, []);

  const resume = useCallback(() => {
    setMenu(null);
    if (!paused.current) return;
    paused.current = false;
    // Resuming from the bar with the stage scrolled away would play unseen: bring the stage back into view first.
    const box = stageRef.current?.getBoundingClientRect();
    if (box && !nav.current.immersive && (box.top < 0 || box.bottom > innerHeight)) stageRef.current?.scrollIntoView({ block: 'nearest' });
    softShow();
    quietly(() => window.dispatchEvent(new Event('focus')));
    handlers.current.resume.forEach(handler => handler());
    shell.current?.focus({ preventScroll: true });
  }, []);

  const restart = useCallback(() => {
    setMenu(null);
    paused.current = false;
    softShow();
    quietly(() => window.dispatchEvent(new Event('focus')));
    if (handlers.current.restart.size) handlers.current.restart.forEach(handler => handler());
    else setRun(count => count + 1);
    shell.current?.focus({ preventScroll: true });
  }, []);

  // ---- immersive mode and the Back button ----
  const lockPage = (on: boolean) => document.documentElement.classList.toggle('gp-locked', on);
  const leaveFullscreen = () => {
    askedFullscreen.current = false;
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
  };
  const apply = (effects: NavEffect[]) => {
    for (const effect of effects) {
      if (effect === 'push') history.pushState({ gamePlayer: slug }, '');
      else if (effect === 'back') history.back();
      else if (effect === 'enter') {
        setImmersive(true);
        setStarted(true);
        lockPage(true);
        enteredAt.current = performance.now();
        record();
        const target = shell.current;
        // Android Chrome and desktops go truly full screen; iPhones keep the fixed overlay.
        if (target?.requestFullscreen && !document.fullscreenElement) {
          askedFullscreen.current = true;
          target.requestFullscreen({ navigationUI: 'hide' }).then(() => {
            if (phone.current && shape === 'portrait') {
              const orientation = screen.orientation as ScreenOrientation & { lock?: (to: string) => Promise<void> };
              void orientation.lock?.('portrait')?.catch(() => {});
            }
          }).catch(() => { askedFullscreen.current = false; });
        }
        // Coming back to a paused game: চালিয়ে যাও is chosen, as when the menu first opened.
        requestAnimationFrame(() => (menuRef.current?.querySelector<HTMLElement>('[data-first]') ?? shell.current)?.focus({ preventScroll: true }));
      } else {
        setImmersive(false);
        lockPage(false);
        leaveFullscreen();
        openMenu();
      }
    }
  };
  const step = (event: 'enter' | 'leave' | 'pop') => {
    const next = navigate(nav.current, event);
    nav.current = next.nav;
    apply(next.effects);
  };
  const enter = () => { sfx.tap(); step('enter'); };
  const leave = () => step('leave');

  /** Away (blur, tab hidden, stage scrolled off): pause with the menu, but only once someone has played. */
  const away = () => {
    if (!engaged.current || paused.current) return;
    if (performance.now() - enteredAt.current < 600) return;
    if (phone.current && !nav.current.immersive) return;
    openMenu();
  };
  const awayRef = useRef(away);
  awayRef.current = away;

  useEffect(() => {
    const media = matchMedia(PHONE_QUERY);
    const sync = () => { phone.current = media.matches; };
    sync();
    media.addEventListener('change', sync);

    const onBlur = () => { if (!synthetic.current) awayRef.current(); };
    const onVisibility = () => { if (!synthetic.current && !soft.current && document.hidden) awayRef.current(); };
    // Back pressed in full screen can arrive as fullscreenchange and then popstate. Wait a moment so the popstate closes
    // the player itself; going back here too would leave the page. Android's Back in full screen sends no popstate.
    let pending = 0;
    const onPop = () => { window.clearTimeout(pending); step('pop'); };
    const onFullscreen = () => {
      setFullscreen(Boolean(document.fullscreenElement));
      if (document.fullscreenElement || !askedFullscreen.current || !nav.current.immersive) return;
      askedFullscreen.current = false;
      pending = window.setTimeout(() => { if (nav.current.immersive) step('leave'); }, 250);
    };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('popstate', onPop);
    document.addEventListener('fullscreenchange', onFullscreen);

    // An entry left by a reload in immersive mode is just this page again; stop treating it as ours.
    if ((history.state as { gamePlayer?: string } | null)?.gamePlayer) history.replaceState({ ...history.state, gamePlayer: undefined }, '');

    return () => {
      media.removeEventListener('change', sync);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('popstate', onPop);
      document.removeEventListener('fullscreenchange', onFullscreen);
      window.clearTimeout(pending);
      softShow();
      lockPage(false);
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    };
    // step, softShow and lockPage only touch refs.
  }, []);

  // Keys: Escape belongs to the player; while the menu is open no key reaches the game.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const open = menuRef.current;
      if (open) {
        event.stopPropagation();
        if (event.type !== 'keydown') return;
        if (event.key === 'Escape') { event.preventDefault(); if (nav.current.immersive) leave(); else resume(); return; }
        const items = [...open.querySelectorAll<HTMLElement>('button:not(:disabled), summary')];
        const at = items.indexOf(document.activeElement as HTMLElement);
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Tab') {
          event.preventDefault();
          const back = event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey);
          items[(at + (back ? items.length - 1 : 1) + items.length) % items.length]?.focus();
        }
        return;
      }
      if (event.type !== 'keydown' || event.altKey || event.ctrlKey || event.metaKey || typing(event.target)) return;
      const inside = event.target instanceof Node && (shell.current?.contains(event.target) || event.target === document.body);
      if (inside && !phone.current) record();
      if (event.key !== 'Escape') return;
      if (nav.current.immersive) { event.stopPropagation(); event.preventDefault(); leave(); }
      else if (engaged.current && !phone.current) { event.stopPropagation(); event.preventDefault(); openMenu(); }
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', onKey, true);
    return () => { window.removeEventListener('keydown', onKey, true); window.removeEventListener('keyup', onKey, true); };
  }, [openMenu, resume]);

  // The menu's first button is chosen when it opens, like tibo.dog's gold Resume.
  useEffect(() => {
    if (!menu) return;
    const first = menuRef.current?.querySelector<HTMLElement>('[data-first]');
    first?.focus({ preventScroll: true });
  }, [menu]);

  // Scrolled away from the stage on a desktop: pause, so nothing is lost off-screen.
  useEffect(() => {
    const element = shell.current;
    if (!element) return;
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting && !nav.current.immersive) awayRef.current(); }, { threshold: 0.2 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The play area's size, for the hook and for CSS.
  useEffect(() => {
    const element = stageRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width), height = Math.round(entry.contentRect.height);
      setStage(current => current.width === width && current.height === height ? current : { width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // The desktop stage: fit the window under the header, above the control bar.
  useEffect(() => {
    const measure = () => {
      const element = root.current, under = bar.current;
      if (!element || !under) return;
      const top = element.getBoundingClientRect().top + window.scrollY;
      const size = inlineStage({ viewWidth: window.innerWidth, viewHeight: window.innerHeight, top, bar: under.offsetHeight, shape });
      // Rail tiles stretch a little so whole rows fill the stage height exactly.
      const rows = Math.max(1, Math.round((size.height + 12) / 124));
      setBox(current => current && current.width === size.width && current.height === size.height ? current : { ...size, rows });
    };
    measure();
    const observer = new ResizeObserver(measure);
    if (bar.current) observer.observe(bar.current);
    window.addEventListener('resize', measure);
    return () => { observer.disconnect(); window.removeEventListener('resize', measure); };
  }, [shape]);

  const api = useMemo<GamePlayerApi>(() => ({ paused: menu !== null, immersive, stage, requestRestart: restart, requestPause: () => openMenu(), onPause, onResume, onRestart }), [menu, immersive, stage, restart, openMenu, onPause, onResume, onRestart]);
  const style = box ? { '--gp-w': `${box.width}px`, '--gp-h': `${box.height}px`, '--gp-rows': box.rows } as CSSProperties : undefined;
  const stageStyle = stage.width ? { '--stage-w': `${stage.width}px`, '--stage-h': `${stage.height}px` } as CSSProperties : undefined;

  return (
    <section ref={root} id="tool" className="gp" data-immersive={immersive || undefined} data-kids={kids || undefined} data-shape={shape} style={style} aria-label={`${name} খেলো`}>
      <div className="gp-arena">
        {railLeft && <nav className="gp-rail gp-rail-left" aria-label={kids ? 'ছোটদের আরও খেলা' : 'আরও খেলা'}>{railLeft}</nav>}
        <div ref={shell} className="gp-shell" tabIndex={-1}
          onPointerDownCapture={event => { record(); held.current = event.target instanceof Element ? { target: event.target, id: event.pointerId, type: event.pointerType } : null; }}
          onPointerUpCapture={() => { held.current = null; }} onPointerCancelCapture={() => { held.current = null; }}>
          <div className="gp-screen">
            <div className="gp-band">
              <button type="button" className="gp-fab" onClick={() => openMenu()} aria-label="থামাও, মেনু খোলো" aria-haspopup="dialog"><Icon name="pause" /></button>
              <span className="gp-band-title">{name}</span>
            </div>
            <div ref={stageRef} className="gp-stage" data-immersive={immersive || undefined} style={stageStyle}>
              <div className="gp-game" key={run} inert={menu !== null}>
                <PlayerContext.Provider value={api}>{children}</PlayerContext.Provider>
              </div>
            </div>
            {menu && (
              <div ref={menuRef} className="gp-menu" role="dialog" aria-modal="true" aria-labelledby="gp-menu-title">
                {menu === 'main' ? (
                  <div className="gp-menu-card">
                    <p className="gp-menu-name">{name}</p>
                    <h2 id="gp-menu-title">থেমে আছে</h2>
                    <button type="button" className="gp-resume" data-first onClick={resume}><Icon name="play" />চালিয়ে যাও</button>
                    <button type="button" onClick={restart}><Icon name="restart" />নতুন করে শুরু</button>
                    <button type="button" onClick={() => setMenu('howto')}><Icon name="help" />কীভাবে খেলবে</button>
                    <button type="button" role="switch" aria-checked={sound} onClick={() => { setSound(!sound); if (!sound) sfx.tap(); }}>
                      <Icon name={sound ? 'soundOn' : 'soundOff'} />শব্দ<span className="gp-state">{sound ? 'চালু' : 'বন্ধ'}</span>
                    </button>
                    <button type="button" role="switch" aria-checked={slow} onClick={() => setSlow(!slow)}>
                      <Icon name="slow" />ধীরে খেলো<span className="gp-state">{slow ? 'চালু' : 'বন্ধ'}</span>
                    </button>
                    {immersive && <button type="button" onClick={leave}><Icon name="exit" />বের হও</button>}
                  </div>
                ) : (
                  <div className="gp-menu-card gp-howto">
                    <h2 id="gp-menu-title">{guideTitle}</h2>
                    <ol>{steps.map(text => <li key={text}>{text}</li>)}</ol>
                    {note}
                    <button type="button" className="gp-resume" data-first onClick={resume}><Icon name="play" />চালিয়ে যাও</button>
                    <button type="button" onClick={() => setMenu('main')}><Icon name="back" />মেনুতে ফেরো</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {railRight && <nav className="gp-rail gp-rail-right" aria-label={kids ? 'ছোটদের আরও খেলা, আরও কয়েকটা' : 'আরও কয়েকটা খেলা'}>{railRight}</nav>}
        <div ref={bar} className="gp-bar">
          <div className="gp-art">{art}</div>
          <div className="gp-head">{head}<p className="gp-lead">{lead}</p></div>
          <div className="gp-actions" role="toolbar" aria-label="খেলার বোতাম">
            <button type="button" onClick={restart} aria-label="নতুন করে শুরু" title="নতুন করে শুরু"><Icon name="restart" /></button>
            <button type="button" onClick={() => openMenu()} aria-label="থামাও" title="থামাও (Esc)" aria-haspopup="dialog"><Icon name="pause" /></button>
            <button type="button" onClick={() => setSound(!sound)} aria-pressed={sound} aria-label={sound ? 'শব্দ চালু' : 'শব্দ বন্ধ'} title={sound ? 'শব্দ চালু' : 'শব্দ বন্ধ'}><Icon name={sound ? 'soundOn' : 'soundOff'} /></button>
            <button type="button" onClick={() => (immersive ? leave() : enter())} aria-label={fullscreen || immersive ? 'ছোট করো' : 'পুরো পর্দায় খেলো'} title={immersive ? 'ছোট করো' : 'পুরো পর্দায় খেলো'}><Icon name={immersive ? 'small' : 'full'} /></button>
            <button type="button" onClick={() => openMenu('howto')} aria-label="কীভাবে খেলবে" title="কীভাবে খেলবে" aria-haspopup="dialog"><Icon name="help" /></button>
          </div>
          <button type="button" className="gp-play" onClick={enter}><Icon name="play" />{started ? 'খেলায় ফেরো' : 'খেলো'}</button>
          {note && <div className="gp-note">{note}</div>}
        </div>
      </div>
    </section>
  );
}
