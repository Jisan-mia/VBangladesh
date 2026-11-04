"use client";
// The album, a choice screen: the 20 fish with their habits and the heaviest one this phone has landed, then the four bosses.
// Unknown fish are dark shapes with only where they live.
import { useEffect, useRef } from "react";
import { fitCanvas } from "../../../shared/game-kit";
import { drawFish } from "../lib/art";
import { bn, weightText } from "../lib/lines";
import { BOSSES, FISH, RARITY, traitWords, WATERS, type Album, type Trophies } from "../lib/species";

function FishPic({ index, known, size }: { index: number; known: boolean; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const height = Math.round(size * 0.56), c = fitCanvas(element, size, height);
    c.clearRect(0, 0, size, height);
    drawFish(c, size / 2, height / 2, size * 0.84, FISH[index], known ? undefined : "#2c4a43");
  }, [index, known, size]);
  return <canvas ref={ref} className="cf-pic" style={{ width: size, height: Math.round(size * 0.56) }} aria-hidden="true" />;
}

export function AlbumSheet({ album, trophies, onClose }: { album: Album; trophies: Trophies; onClose: () => void }) {
  const known = FISH.filter(fish => album[fish.id]).length;
  return (
    <div className="cf-sheet" role="dialog" aria-modal="true" aria-labelledby="cf-album-title">
      <div className="cf-sheet-head">
        <h2 id="cf-album-title">মাছের অ্যালবাম <small>{bn(known)}/{bn(FISH.length)}</small></h2>
        <button type="button" className="cf-sheet-close" onClick={onClose} aria-label="বন্ধ করো" autoFocus>✕</button>
      </div>
      <ul className="cf-album">
        {FISH.map((fish, index) => {
          const grams = album[fish.id];
          return (
            <li key={fish.id} data-known={Boolean(grams) || undefined}>
              <FishPic index={index} known={Boolean(grams)} size={88} />
              <b>{grams ? fish.name : "???"}</b>
              <small className="cf-album-trait">{traitWords(fish.traits)}</small>
              <small>{grams ? `সবচেয়ে বড় ${weightText(grams)}` : `${fish.places.map(place => WATERS[place].at).join(", ")} থাকে`}</small>
              {grams ? <small className="cf-note">{fish.note}</small> : <small className="cf-note">{RARITY[fish.rarity]}</small>}
            </li>
          );
        })}
      </ul>
      <h3 className="cf-album-bosses">চার জায়গার চার বড় মাছ</h3>
      <ul className="cf-album" data-bosses="">
        {BOSSES.map(boss => {
          const grams = trophies[boss.id];
          return (
            <li key={boss.id} data-known={Boolean(grams) || undefined}>
              <FishPic index={boss.fish} known={Boolean(grams)} size={88} />
              <b>{boss.name}</b>
              <small className="cf-album-trait">{traitWords(boss.traits)} · {bn(boss.notches)} দাগ দম</small>
              <small>{grams ? `তুলেছ, ${weightText(grams)}` : "এখনো কেউ তোলেনি"}</small>
              <small className="cf-note">{boss.line}</small>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
