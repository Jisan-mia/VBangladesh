"use client";
// The finder's book: every dinosaur found on this phone, a shadow for the rest, and the last page about birds.
import { useState } from "react";
import { sfx } from "../../../shared/game-sound";
import { birdShapes, BOX } from "../lib/art";
import { bn, DINOS } from "../lib/dinos";
import { DinoArt, FactCard, Shapes } from "./pieces";

export function Book({ found, onClose }: { found: readonly string[]; onClose: () => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const dino = DINOS.find(each => each.id === open);
  return <div className="dn-book" role="dialog" aria-modal="true" aria-label="আমার খোঁজার বই">
    <div className="dn-book-inner">
      <header className="dn-book-head">
        <h2>আমার খোঁজার বই</h2>
        <p>{bn(DINOS.length)}টার {bn(found.length)}টা পেয়েছ।</p>
      </header>
      {dino ? <>
        <div className="dn-book-art"><DinoArt dino={dino} /></div>
        <FactCard dino={dino} full><button type="button" className="kit-secondary" onClick={() => { sfx.tap(); setOpen(null); }}>সব পাতা দেখো</button></FactCard>
      </> : <>
        <ul className="dn-pages">
          {DINOS.map(each => {
            const have = found.includes(each.id);
            return <li key={each.id}>
              <button type="button" disabled={!have} onClick={() => { sfx.tap(); setOpen(each.id); }} aria-label={have ? each.name : "এখনো খুঁজে পাওনি"}>
                <span className="dn-page-art"><DinoArt dino={each} tint={have ? undefined : "#d9c9a6"} /></span>
                <span className="dn-page-name">{have ? each.name : "?"}</span>
              </button>
            </li>;
          })}
        </ul>
        <section className="dn-bird" aria-labelledby="dn-bird-title">
          <svg viewBox={`0 0 ${BOX.width} ${BOX.height}`} aria-hidden="true" focusable="false"><Shapes shapes={birdShapes()} /></svg>
          <div>
            <h3 id="dn-bird-title">পাখিরা আসলে এখনকার ডাইনোসর</h3>
            <p>টি-রেক্স যে দলের ডাইনোসর, পাখিরা এসেছে সেই দল থেকে। ৬ কোটি ৬০ লাখ বছর আগে আকাশ থেকে বিশাল এক পাথর পড়ে, বড় ডাইনোসররা হারিয়ে যায়। টিকে থাকে শুধু পাখিরা।</p>
            <p>জানালায় শালিক বসলে একবার দেখো। ও-ও একটা ডাইনোসর।</p>
          </div>
        </section>
      </>}
      <button type="button" className="kit-primary dn-book-close" onClick={onClose}>বই বন্ধ করো</button>
    </div>
  </div>;
}
