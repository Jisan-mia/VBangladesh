"use client";
// The first-run story: three panels. A tap shows the next one; holding (a finger, Space or Enter) for 0.6 s skips them all.
// The caller owns the hold timer, so blur and the player's pause can clear it.
import { drawStoryPanel, STORY } from "../lib/story-art";
import { ArtCanvas } from "./art-canvas";

export const HOLD_SKIP_MS = 600;

export function Story({ panel, holding, onDown, onUp, onCancel }: {
  panel: number; holding: boolean; onDown: () => void; onUp: () => void; onCancel: () => void;
}) {
  return (
    <div className="jc-story" onPointerDown={event => { if (event.isPrimary) onDown(); }} onPointerUp={onUp} onPointerCancel={onCancel} aria-live="polite">
      <ArtCanvas className="jc-panel" deps={String(panel)} label={STORY[panel]} draw={(canvas, width, height) => drawStoryPanel(canvas, width, height, panel)} />
      <p key={panel} className="jc-caption">{STORY[panel]}</p>
      <p className="jc-dots" aria-hidden="true">{STORY.map((line, index) => <i key={line} data-on={index <= panel || undefined} />)}</p>
      <p className="jc-skip" data-holding={holding || undefined}><span aria-hidden="true" />চেপে ধরো: বাদ দাও</p>
    </div>
  );
}
