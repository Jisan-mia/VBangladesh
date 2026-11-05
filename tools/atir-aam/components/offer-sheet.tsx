"use client";
// মালির থলে: a new stage in the garden opens three numbered cards over the bed. Nothing moves while it's open (the rules
// refuse swipes until a pick). Each card says what it does and its exact before → after; one is marked এটা ভালো হবে.
import { useEffect, useRef, type ReactNode } from "react";
import { stageName } from "../lib/board";
import { offerEffect, recommend, type Game, type Offer } from "../lib/rules";
import { bn, OFFER_WORDS } from "../lib/words";

const ICONS: Record<Offer, ReactNode> = {
  undo: <path d="M9 7 4 12l5 5M4 12h10a6 6 0 0 1 0 12h-2" transform="translate(0 -3)" />,
  manure: <><path d="M9 7h6l-1 2.5c3 1.8 4.5 4.8 4.5 7.5a3 3 0 0 1-3 3h-7a3 3 0 0 1-3-3c0-2.7 1.5-5.7 4.5-7.5z" /><path d="M8.5 4.5 12 7l3.5-2.5" /><path d="M9.5 15c1.5 1 3.5 1 5 0" /></>,
  spade: <><path d="M12 3v11" /><path d="M8 14h8l-1 6a3 3 0 0 1-6 0z" /><path d="M10 3h4" /></>,
  rain: <><path d="M7 14a4 4 0 0 1 0-8 5 5 0 0 1 9.5 1.5A3.3 3.3 0 0 1 17 14z" /><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3" /></>,
};

export function OfferSheet({ game, onPick }: { game: Game; onPick: (index: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const options = game.offer ?? [];
  const best = recommend(game, options);
  useEffect(() => { box.current?.querySelector<HTMLElement>("[data-best]")?.focus({ preventScroll: true }); }, []);
  return (
    <div className="aa-offer" ref={box} role="dialog" aria-modal="true" aria-labelledby="aa-offer-title">
      <p className="aa-offer-kicker">নতুন ধাপ: {stageName(game.peak)}</p>
      <h2 id="aa-offer-title">মালির থলে থেকে একটা নাও</h2>
      <ol>
        {options.map((item, index) => {
          const { from, to } = offerEffect(game, item), words = OFFER_WORDS[item];
          return (
            <li key={item}>
              <button type="button" data-best={item === best ? "" : undefined} onClick={event => { event.currentTarget.blur(); onPick(index); }}
                aria-label={`${bn(index + 1)}. ${words.name}: ${words.line} ${words.unit} ${bn(from)} থেকে ${bn(to)}${item === best ? ", এটা ভালো হবে" : ""}`}>
                <kbd aria-hidden="true">{bn(index + 1)}</kbd>
                <svg viewBox="0 0 24 24" aria-hidden="true">{ICONS[item]}</svg>
                <b>{words.name}</b>
                <span>{words.line}</span>
                <i aria-hidden="true">{words.unit} {bn(from)} → {bn(to)}</i>
                {item === best && <em aria-hidden="true">এটা ভালো হবে</em>}
              </button>
            </li>
          );
        })}
      </ol>
      <p className="aa-offer-note">যতক্ষণ বেছে না নাও, বাগান থেমে থাকে।</p>
    </div>
  );
}
