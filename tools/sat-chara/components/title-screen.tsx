"use client";
// The first screen. The biggest thing on it is the pile of seven চাড়া with the red ball beside it, drawn in code, with
// খেলো on it. Under it, small: the place and level with its one new thing and star rule (or the finale's rival), the three
// difficulties with the chosen one's promise, and সব লেভেল. A friend's challenge sits on top.
import { useEffect, useRef } from "react";
import { defOf, LEVEL_COUNT, WORLDS } from "../lib/levels";
import { HAND_LINE, HAND_NAME, HANDS, type Hand } from "../lib/save";
import { drawBallSprite, drawStone, STONE_SHADES } from "../lib/scene";
import { bannerNote, bn, feat, roundLabel, type Claim } from "../lib/words";
import type { Kind } from "../lib/game";

const WIDTHS = [46, 43, 41, 39, 36, 33, 30];

/** The start button's art: seven pieces stacked, the ball about to fly at them, a chalk line. */
function paintPile(canvas: HTMLCanvasElement, size: number, ratio: number) {
  canvas.width = Math.round(size * ratio); canvas.height = Math.round(size * 0.78 * ratio);
  const c = canvas.getContext("2d");
  if (!c) return;
  const k = (size / 150) * ratio;
  c.setTransform(k, 0, 0, k, 0, 0);
  c.fillStyle = "rgba(43,29,20,0.18)";
  c.beginPath(); c.ellipse(92, 112, 40, 5, 0, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 7; i++) {
    c.save(); c.translate(92 + (i % 2 ? 0.8 : -0.6), 106 - i * 9.4);
    c.scale(1.18, 1.18);
    drawStone(c, WIDTHS[i], 8, STONE_SHADES[i], 77 + i, false);
    c.restore();
  }
  c.save(); c.translate(26, 84); c.scale(1.5, 1.5); drawBallSprite(c); c.restore();
  c.strokeStyle = "rgba(43,29,20,0.45)"; c.lineWidth = 2; c.setLineDash([3, 5]);
  c.beginPath(); c.moveTo(40, 78); c.quadraticCurveTo(52, 62, 64, 92); c.stroke();
}

export function TitleScreen({ kind, level, hand, stars, friend, onStart, onHand, onLevels }: {
  kind: Kind; level: number; hand: Hand; stars: number; friend: Claim | null;
  onStart: () => void; onHand: (hand: Hand) => void; onLevels: () => void;
}) {
  const box = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null);
  const def = defOf(level);

  useEffect(() => {
    const element = box.current, target = canvas.current;
    if (!element || !target) return;
    const paint = () => {
      const size = Math.floor(Math.min(element.clientWidth * 0.8, (element.clientHeight - 10) / 0.78, 330));
      if (size < 60) return;
      target.style.width = `${size}px`; target.style.height = `${Math.round(size * 0.78)}px`;
      paintPile(target, size, Math.min(2, window.devicePixelRatio || 1));
    };
    const observer = new ResizeObserver(paint);
    observer.observe(element);
    paint();
    return () => observer.disconnect();
  }, []);

  const blurThen = (run: () => void) => (event: { currentTarget: HTMLElement }) => { event.currentTarget.blur(); run(); };
  return (
    <div className="sc-title">
      {friend && <p className="sc-title-friend"><b>{feat(friend)}।</b> <span>{bannerNote(friend)}</span></p>}
      <p className="sc-title-place">{kind === "old" ? "বন্ধুর পুরোনো সাজানো" : `${WORLDS[def.world].name} · ${WORLDS[def.world].scene}`}</p>
      <div className="sc-title-art" ref={box}>
        <button type="button" className="sc-title-go" onClick={blurThen(onStart)} aria-label={`খেলো: ${roundLabel(kind, level)}`}>
          <canvas ref={canvas} aria-hidden="true" />
          <span>খেলো</span>
        </button>
      </div>
      <div className="sc-title-card" data-finale={kind === "level" && def.finale ? "" : undefined}>
        {kind === "level" ? (
          <p className="sc-title-level">
            <span>লেভেল {bn(level)}: {def.name}{def.finale && <i>শেষ ধাপ</i>}</span>
            <small>{def.finale ? def.finale.line : def.teach}</small>
            {def.finale && <small>{def.teach}</small>}
            <small className="sc-title-target">★★★ এক বলে · ★★ দুই বলে · ★ তিন বলে</small>
          </p>
        ) : (
          <p className="sc-title-level"><span>বন্ধুর পুরোনো সাজানো</span><small>আগের খেলার একই চাড়া। এখানে তারা জমে না, শুধু বলের হিসাব।</small></p>
        )}
        {kind === "level" && (
          <>
            <div className="sc-chips" role="radiogroup" aria-label="কতটা পথ দেখাবে">
              {HANDS.map((item, index) => (
                <button key={item} type="button" role="radio" aria-checked={item === hand} onClick={blurThen(() => onHand(item))}>
                  <kbd aria-hidden="true">{bn(index + 1)}</kbd>{HAND_NAME[item]}
                </button>
              ))}
            </div>
            <p className="sc-chip-line">{HAND_LINE[hand]}</p>
          </>
        )}
        <button type="button" className="sc-title-more" onClick={blurThen(onLevels)}>
          সব লেভেল <span aria-label={`মোট ${bn(stars)}টা তারা`}>★ {bn(stars)}/{bn(LEVEL_COUNT * 3)}</span>
        </button>
      </div>
    </div>
  );
}
