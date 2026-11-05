'use client';
// The board of one serving: the basket (or the leftover রুটি and its knives), the guests at their plates, the choices for the
// last piece, and the quiz for naming. It only draws what the round says and forwards presses; game.tsx decides what they mean.
// Every cue is a picture: faces, a glowing extra piece, an arrow back out of the plate, heads over pieces for a wrong cut.
import type { MouseEvent, PointerEvent } from 'react';
import { bn } from '../../../shared/kids-kit';
import { glows, moods, type Round, type Target } from '../lib/round';
import { FOOD_NAME, FRACTIONS, MOOD_NAME } from '../lib/people';
import { BACK_ART, CHOICE_ART, cutRuti, faceArt, FOOD_ART, pieceArt, rutiLeft, wedgeCenter } from '../lib/shapes';
import { Finger, Frac, CutWhy, Pic } from './pieces';

export type Where = 'basket' | number | `cut${number}` | `pick${number}` | `choice${string}`;
export type Act = (element: HTMLElement, event: { clientX: number; clientY: number }, pointer: boolean) => void;

/** Acts on the first finger at once (a 50 ms answer), and on keyboard or scripted clicks; ignores a second finger or the palm. */
const press = (action: Act) => ({
  onPointerDown: (event: PointerEvent<HTMLElement>) => { if (event.isPrimary && event.button <= 0) action(event.currentTarget, event, true); },
  onClick: (event: MouseEvent<HTMLElement>) => { if (event.detail === 0) action(event.currentTarget, event, false); },
});

export type BoardProps = {
  round: Round; ghost: (where: Where) => boolean;
  onBasket: Act; onSeat: (seat: number) => Act; onKnife: (parts: number) => Act; onChoice: (id: 'share' | 'small' | 'keep') => Act; onPick: (value: number) => Act;
};

function Counted({ parts, shade, count }: { parts: number; shade?: number; count: boolean }) {
  return <svg className="sb-ruti" viewBox="0 0 100 100" aria-hidden="true">
    {cutRuti(parts, { shade }).map((layer, index) => <path key={index} d={layer.d} fill={layer.fill ?? 'none'} stroke={layer.stroke} strokeWidth={layer.w} strokeLinecap="round" strokeLinejoin="round" />)}
    {count && Array.from({ length: parts }, (_, at) => { const [x, y] = wedgeCenter(parts, at); return <text key={at} className="sb-count-n" x={x} y={y + 6} textAnchor="middle">{bn(at + 1)}</text>; })}
  </svg>;
}

export function Table({ round, ghost, onSeat }: Pick<BoardProps, 'round' | 'ghost' | 'onSeat'>) {
  const item = round.item;
  if (item.kind !== 'share') return null;
  const art = FOOD_ART[item.food], { choice } = round, faces = moods(round), n = item.guests.length;
  return <div className={`sb-table sb-n${n}`} data-served={round.stage === 'done' || undefined}>
    {item.guests.map((guest, seat) => {
      const count = round.plates[seat], held = round.hand === seat;
      const bonus = choice === seat || (choice === 'small' && guest.small);
      const over = faces[seat] === 'oh';
      return <button type="button" key={`${round.index}-${seat}`} data-seat={seat} data-k=""
        className={`sb-seat${held ? ' is-held' : ''}${over ? ' is-over' : ''}${round.hand !== null && !held ? ' is-open' : ''}`}
        style={{ '--i': seat } as React.CSSProperties}
        aria-label={`${bn(seat + 1)}: ${guest.name}, ${MOOD_NAME[faces[seat]]}। প্লেটে ${bn(count)}টা ${FOOD_NAME[item.food]}${round.pieces[seat] || choice === 'share' ? ', আর এক টুকরো' : ''}`}
        {...press(onSeat(seat))}>
        <Pic layers={faceArt(guest, faces[seat])} className={`sb-face${guest.small ? ' is-small' : ''} sb-mood-${faces[seat]}`} key={faces[seat]} />
        <span className="sb-name">{guest.name}</span>
        <span className="sb-plate">
          {Array.from({ length: count }, (_, index) => <Pic key={index} layers={art} className={`sb-food${held && index === count - 1 ? ' is-up' : ''}${over && index === count - 1 && glows(round) ? ' is-glow' : ''}${over && index === count - 1 ? ' is-extra' : ''}`} />)}
          {bonus && <Pic layers={art} className="sb-food" />}
          {choice === 'share' && <Pic layers={art} className="sb-food sb-bit" />}
          {round.pieces[seat] && <Pic layers={pieceArt(round.cutInto)} className="sb-food sb-piece" />}
        </span>
        {over && round.miss?.kind === 'over' && round.miss.plate === seat && <Pic layers={BACK_ART} className="sb-back" />}
        {ghost(seat) && <span className="sb-ghost"><Finger /></span>}
      </button>;
    })}
  </div>;
}

/** The middle: the basket with its pieces; or the leftover রুটি and its three knives; or the cut রুটি being handed out. */
function Middle({ round, ghost, onBasket, onKnife, onChoice }: Pick<BoardProps, 'round' | 'ghost' | 'onBasket' | 'onKnife' | 'onChoice'>) {
  const item = round.item;
  if (item.kind !== 'share') return null;
  const art = FOOD_ART[item.food];
  if (round.stage === 'cut') {
    const wrong = round.miss?.kind === 'cut' ? round.miss.parts : 0;
    return <div className="sb-cut">
      {wrong ? <div className="sb-why-box" key={wrong}><CutWhy guests={item.guests.length} parts={wrong} /></div> : <Pic layers={FOOD_ART.ruti} className="sb-ruti" />}
      <div className="sb-knives">
        {[2, 3, 4].map(parts => <button type="button" key={parts} data-k="" className={`sb-knife${glows(round) && parts === item.guests.length ? ' is-glow' : ''}${wrong === parts ? ' is-wrong' : ''}`} aria-label={`${bn(parts)} টুকরো`}
          {...press(onKnife(parts))}>
          <Pic layers={cutRuti(parts)} /><span>{bn(parts)} টুকরো</span>{ghost(`cut${parts}`) && <span className="sb-ghost"><Finger /></span>}
        </button>)}
      </div>
    </div>;
  }
  if (round.stage === 'give' || (round.stage === 'done' && item.cut)) return <div className="sb-cut sb-cut-done">
    <Pic layers={rutiLeft(round.cutInto, round.pieces.filter(Boolean).length)} className="sb-ruti is-cut" />
    <p className="sb-named"><Frac parts={round.cutInto} /><span>{FRACTIONS[round.cutInto].word}</span></p>
  </div>;
  const left = round.stage === 'left', small = item.guests.find(guest => guest.small)!;
  return <>
    <button type="button" data-basket="" className={`sb-basket${round.hand === 'basket' ? ' is-held' : ''}${left ? ' is-left' : ''}`} aria-label={`ঝুড়ি, ${bn(round.basket)}টা ${FOOD_NAME[item.food]}`} {...press(onBasket)}>
      <span className="sb-handle" aria-hidden="true" />
      {Array.from({ length: round.basket }, (_, index) => <Pic key={index} layers={art} className={`sb-food${round.hand === 'basket' && index === round.basket - 1 ? ' is-up' : ''}`} />)}
      {round.choice === 'keep' && <Pic layers={CHOICE_ART.keep} className="sb-food sb-kept" />}
      {ghost('basket') && <span className="sb-ghost"><Finger /></span>}
    </button>
    {left && <div className="sb-choices">
      <button type="button" className="sb-choice" data-k="" aria-label="ভেঙে সবাইকে দিই" {...press(onChoice('share'))}><Pic layers={CHOICE_ART.share} /><span>ভেঙে দিই</span></button>
      <button type="button" className="sb-choice" data-k="" aria-label={`ছোটজনকে দিই: ${small.name}`} {...press(onChoice('small'))}>
        <span className="sb-choice-pair"><Pic layers={faceArt(small, 'happy')} /><Pic layers={art} /></span><span>ছোটজনকে</span>
      </button>
      <button type="button" className="sb-choice" data-k="" aria-label="আম্মুর জন্য রাখি" {...press(onChoice('keep'))}><Pic layers={CHOICE_ART.keep} /><span>আম্মুর জন্য</span></button>
    </div>}
  </>;
}

function Quiz({ round, ghost, onPick }: Pick<BoardProps, 'round' | 'ghost' | 'onPick'>) {
  const item = round.item;
  if (item.kind === 'name') {
    const wrong = round.miss?.kind === 'pick' ? round.miss.value : -1;
    return <>
      <div className="sb-board" key={`${round.index}-${round.tries}`}><Counted parts={item.parts} shade={item.shaded} count={round.tries > 0} /></div>
      <div className={`sb-tiles sb-tiles-${item.choices.length}`}>
        {item.choices.map(parts => {
          const right = round.stage === 'done' && parts === item.parts, glow = glows(round) && parts === item.parts;
          return <button type="button" key={parts} data-k="" className={`sb-tile${right ? ' is-right' : ''}${glow ? ' is-glow' : ''}${wrong === parts ? ' is-wrong' : ''}`} aria-label={`${bn(parts)}: ${FRACTIONS[parts].word}`} {...press(onPick(parts))}>
            <Frac parts={parts} /><span>{FRACTIONS[parts].word}</span>{ghost(`pick${parts}`) && <span className="sb-ghost"><Finger /></span>}
          </button>;
        })}
      </div>
    </>;
  }
  if (item.kind !== 'fair') return null;
  const wrong = round.miss?.kind === 'pick' ? round.miss.value : -1;
  return <div className="sb-tiles sb-tiles-2">
    {[0, 1].map(side => {
      const right = round.stage === 'done' && side === item.fairSide, glow = glows(round) && side === item.fairSide;
      return <button type="button" key={side} data-k="" className={`sb-tile sb-fair${right ? ' is-right' : ''}${glow ? ' is-glow' : ''}${wrong === side ? ' is-wrong' : ''}`} aria-label={`${bn(side + 1)}: ${side ? 'ডানের' : 'বাঁয়ের'} রুটি`} {...press(onPick(side))}>
        <Pic layers={cutRuti(item.parts, { unfair: side !== item.fairSide })} />
        {wrong === side && <svg className="sb-neq" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 9h14M5 15h14M16 4L8 20" /></svg>}
        {ghost(`pick${side}`) && <span className="sb-ghost"><Finger /></span>}
      </button>;
    })}
  </div>;
}

export function Board(props: BoardProps) {
  const item = props.round.item;
  return item.kind === 'share' ? <><Middle {...props} /><Table {...props} /></> : <Quiz {...props} />;
}

/** The ghost finger's place: the first serving a child ever sees, an idle wait, or after two tries. */
export const ghostFor = (target: Target, show: boolean) => (where: Where) => {
  if (!show || !target) return false;
  if (where === 'basket') return 'basket' in target;
  if (typeof where === 'number') return 'plate' in target && target.plate === where;
  if (where.startsWith('cut')) return 'cut' in target && target.cut === Number(where.slice(3));
  if (where.startsWith('pick')) return 'pick' in target && target.pick === Number(where.slice(4));
  return false;
};
