'use client';
// The title inside the stage: the toy phone is the start button, the biggest thing on screen, with খেলো across its foot. Under it,
// small: whose number (when two are set), the level chip (opens the list), one line, and the grown-up gate (the number form, the link).
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { levelOf, placeOf, worldOf } from '../lib/levels';
import { whose, WHO_NAME, type Who } from '../lib/play';
import { Backdrop, Face, MiniLevel, Menu, PhoneArt, Play } from './pictures';

type Props = { level: number; who: Who; both: boolean; demo: boolean; onStart: () => void; onLevels: () => void; onWho: (who: Who) => void; children?: ReactNode };

export function Title({ level, who, both, demo, onStart, onLevels, onWho, children }: Props) {
  const spec = levelOf(level), world = worldOf(level);
  return <div className="am-title">
    <Backdrop world={spec.world} tall />
    <button type="button" className="am-card" onClick={event => { event.currentTarget.blur(); onStart(); }} aria-label={`খেলো: লেভেল ${bn(placeOf(level))}, ${spec.title}`}>
      <PhoneArt />
      <span className="am-card-go" aria-hidden="true"><Play />খেলো</span>
    </button>
    {both && <div className="am-who" role="group" aria-label="কার নম্বর">
      {(['ammu', 'abbu'] as Who[]).map(person => <button type="button" key={person} aria-pressed={person === who} onClick={event => { event.currentTarget.blur(); onWho(person); }}>
        <Face who={person} className="am-who-face" />{WHO_NAME[person]}
      </button>)}
    </div>}
    <button type="button" className="am-chip" onClick={event => { event.currentTarget.blur(); onLevels(); }} aria-label={`লেভেল ${bn(placeOf(level))}, ${spec.title}। সব লেভেল দেখো`}>
      <MiniLevel hide={spec.hide} pieces={spec.pieces} eyes={spec.eyes} className="am-chip-mini" />
      <span><b>লেভেল {bn(placeOf(level))} · {spec.title}</b><small>{world.name}</small></span>
      <Menu className="am-chip-more" />
    </button>
    <p className="am-title-line">{demo ? 'নমুনা নম্বরে খেলছ। আম্মু বা আব্বু নম্বর দিলে আসল নম্বর আসবে।' : `${whose(who)} নম্বর মনে রাখার খেলা।`}</p>
    {children}
  </div>;
}
