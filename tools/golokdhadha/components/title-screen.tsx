"use client";
// The first screen: the level's own maze on a paper card is the start button (খেলো on a banner across it), then the level
// line with its one new thing, the three modes with the chosen one's promise, সব লেভেল and আজকের ধাঁধা. A friend's
// challenge sits on top.
import { useEffect, useRef } from "react";
import { boardOf, darkFor, levelDef, LEVEL_COUNT, MODE_INFO, MODES, WORLDS, type Mode, type Where } from "../lib/levels";
import { drawTitle } from "../lib/art";
import { bn, dayLabel, feat, friendClaim, type Shared } from "../lib/link";

export function TitleScreen({ where, mode, friend, stars, today, onStart, onMode, onLevels, onDaily }: {
  where: Where; mode: Mode; friend: Shared | null; stars: number; today: number;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void; onDaily: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const { board } = boardOf(where), def = where.level && !where.old ? levelDef(where.level) : null;
  const playing = friend && friend.level === where.level && friend.seed === where.seed && friend.old === where.old;
  const shownMode = playing ? friend.mode : mode, dark = darkFor(board, shownMode);

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight, 440));
      if (width < 60) return;
      target.style.width = `${width}px`; target.style.height = `${width}px`;
      drawTitle(target, board, width, Math.min(2, window.devicePixelRatio || 1), "খেলো", dark);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [board, dark]);

  const label = where.old ? `বন্ধুর পুরোনো ${where.level ? `লেভেল ${bn(where.level)}` : "ধাঁধা"}`
    : def ? `${WORLDS[def.world].name} · লেভেল ${bn(where.level)}: ${def.name}`
    : `আজকের ধাঁধা · ${dayLabel(where.seed)}`;
  const teach = where.old ? "বন্ধু ঠিক যে ধাঁধাটা খেলেছিল, সেটাই। সময় মেলাও।"
    : def ? `${def.finale ? "শেষ ধাপ। " : ""}${def.teach}`
    : `${bn(board.size)}×${bn(board.size)} ঘর, আজ ${WORLDS[board.world].piece}-এর দিন। সবার ফোনে একই ধাঁধা।`;

  return (
    <div className="gd-title" data-world={board.world}>
      {friend && (
        <p className="gd-title-friend"><b>{feat(friend)}।</b> <span>{friendClaim(friend)}</span></p>
      )}
      <div className="gd-title-art" ref={box}>
        <button type="button" className="gd-title-start" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: ${label}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <p className="gd-title-level"><span>{label}</span><small>{teach}</small></p>
      {!playing && (
        <>
          <div className="gd-modes" role="radiogroup" aria-label="কতটা কঠিন">
            {MODES.map(item => (
              <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => { event.currentTarget.blur(); onMode(item); }}>{MODE_INFO[item].name}</button>
            ))}
          </div>
          <p className="gd-mode-line">{MODE_INFO[mode].line}</p>
        </>
      )}
      <div className="gd-title-links">
        <button type="button" onClick={event => { event.currentTarget.blur(); onLevels(); }}>
          সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
        </button>
        {(where.level > 0 || where.seed !== today) && (
          <button type="button" onClick={event => { event.currentTarget.blur(); onDaily(); }}>আজকের ধাঁধা</button>
        )}
      </div>
    </div>
  );
}
