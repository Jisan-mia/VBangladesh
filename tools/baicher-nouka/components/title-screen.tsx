"use client";
// The first screen: the ঢোল itself is the start button (long boats either side, খেলো on its head), then the race line with its one
// new thing, who you will race, the three modes with the chosen one's promise, সব বাইচ and তাল মেলাও. A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import { LEVEL_COUNT, levelDef, MODE_INFO, MODES, WORLDS, type Mode } from "../lib/levels";
import { banner, bn, type Shared } from "../lib/link";
import { drawTitleArt, TITLE_ASPECT } from "../lib/paint";

export function TitleScreen({ level, mode, old, friend, stars, lag, note, onStart, onMode, onLevels, onCalib }: {
  level: number; mode: Mode; old: boolean; friend: Shared | null; stars: number; lag: number; note: string;
  onStart: () => void; onMode: (mode: Mode) => void; onLevels: () => void; onCalib: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const def = levelDef(level, old);

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const draw = () => {
      const width = Math.floor(Math.min(element.clientWidth, element.clientHeight / TITLE_ASPECT, 460));
      if (width < 40) return;
      target.style.width = `${width}px`;
      target.style.height = `${Math.round(width * TITLE_ASPECT)}px`;
      drawTitleArt(target, width, Math.min(2, window.devicePixelRatio || 1), "খেলো", old ? 0 : def.world);
    };
    const observer = new ResizeObserver(draw);
    observer.observe(element);
    void document.fonts?.ready.then(draw);
    return () => observer.disconnect();
  }, [def.world, old]);

  const done = (event: { currentTarget: HTMLElement }, run: () => void) => { event.currentTarget.blur(); run(); };
  return (
    <div className="bn-title">
      {friend && <p className="bn-title-friend"><b>{banner(friend)}</b> <span>এটা বন্ধুর নিজের ফোনের সময়। {friend.old ? "পুরোনো লিংক, তাই এটা লম্বা বাইচ। এতে তারা জমা হয় না।" : "একই কচুরিপানা, একই নৌকা, একই ঢোল।"}</span></p>}
      <div className="bn-title-drum" ref={box}>
        <button type="button" className="bn-title-start" onClick={event => done(event, onStart)} aria-label={`খেলো: বাইচ ${bn(level)}, ${def.name}`}>
          <canvas ref={canvas} aria-hidden="true" />
        </button>
      </div>
      <p className="bn-title-level">
        <span>{old ? "বন্ধুর পুরোনো বাইচ" : `${WORLDS[def.world].name} · বাইচ ${bn(level)}: ${def.name}`}</span>
        {!old && <small>{def.boss ? "নদীর শেষ বাইচ। " : ""}{def.teach}</small>}
      </p>
      <ul className="bn-legend" aria-label="কারা কারা দৌড়ায়">
        <li data-kind="1"><i aria-hidden="true" />লাল: শুরুতে ছোটে, শেষে হাঁপায়</li>
        <li data-kind="2"><i aria-hidden="true" />সবুজ: একটানা চলে</li>
        <li data-kind="3"><i aria-hidden="true" />হলুদ: শেষ টানে ধরে ফেলে</li>
        {def.boss && <li data-kind="4"><i aria-hidden="true" />কালো: {def.boss}</li>}
      </ul>
      {!old && (
        <div className="bn-modes" role="radiogroup" aria-label="কতটা কঠিন">
          {MODES.map(item => <button key={item} type="button" role="radio" aria-checked={item === mode} onClick={event => done(event, () => onMode(item))}>{MODE_INFO[item].name}</button>)}
        </div>
      )}
      {!old && <p className="bn-mode-line">{MODE_INFO[mode].line}</p>}
      {note && <p className="bn-mode-line" role="status">{note}</p>}
      <div className="bn-title-more">
        <button type="button" className="bn-link" onClick={event => done(event, onLevels)}>
          সব বাইচ <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
        </button>
        <button type="button" className="bn-link" onClick={event => done(event, onCalib)}>{lag ? "তাল মেলানো আছে · আবার মেলাও" : "চাপ দেরিতে ধরে? তাল মেলাও"}</button>
      </div>
    </div>
  );
}
