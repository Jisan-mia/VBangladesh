// Drawn fresh: six neighbours at the counter, plain play-money chits and a shop shelf. No real note art, no real brands.
import { useId, type CSSProperties } from 'react';
import { CHIT_COLORS, isCoin } from '../lib/draw-card';
import { bn, PEOPLE } from '../lib/game';

export type Mood = 'normal' | 'happy' | 'puzzled';

const SKIN = ['#c68a5b', '#d6a07a', '#a8693f', '#c98e62', '#d9a273', '#b07a52'];
const INK = '#2a1d12';

function Face({ mood, big }: { mood: Mood; big?: boolean }) {
  const eye = big ? 2.9 : 2.4;
  return <g>
    {mood === 'happy'
      ? <path d="M48.5 55q3.5-4.5 7 0M64.5 55q3.5-4.5 7 0" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" />
      : <><circle cx="52" cy="54" r={eye} fill={INK} /><circle cx="68" cy="54" r={eye} fill={INK} /></>}
    {mood === 'puzzled' && <path d="M47 46.5l9 1.5M64 47.5q4-3 9-1" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />}
    <circle cx="46" cy="62" r="3.6" fill="#e86a5a" opacity=".28" /><circle cx="74" cy="62" r="3.6" fill="#e86a5a" opacity=".28" />
    {mood === 'happy' ? <path d="M51 63q9 11 18 0z" fill="#8a2b1f" />
      : mood === 'puzzled' ? <ellipse cx="62" cy="66.5" rx="2.6" ry="3.2" fill="#8a2b1f" />
      : <path d="M53 64.5q7 6 14 0" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" />}
  </g>;
}

const head = (skin: string) => <>
  <rect x="53" y="72" width="14" height="16" rx="4" fill={skin} />
  <circle cx="39.5" cy="57" r="4.5" fill={skin} /><circle cx="80.5" cy="57" r="4.5" fill={skin} />
  <ellipse cx="60" cy="54" rx="21" ry="23" fill={skin} />
</>;
const SHOULDERS = 'M16 122C16 98 33 87 60 87S104 98 104 122Z';

/** One neighbour at the counter, from the chest up. `who` indexes PEOPLE. */
export function Person({ who, mood }: { who: number; mood: Mood }) {
  const id = useId().replace(/:/g, '');
  const skin = SKIN[who % SKIN.length];
  return <svg className="bt-person" viewBox="0 0 120 120" role="img" aria-label={PEOPLE[who]} data-mood={mood}>
    {who === 0 && <>{/* school student: white shirt, bag straps, side parting */}
      <path d={SHOULDERS} fill="#f4f3ec" />
      <path d="M50 88l10 12 10-12" fill="none" stroke="#c9c6b8" strokeWidth="2" />
      <path d="M33 93l7 29M87 93l-7 29" stroke="#b8402f" strokeWidth="7" strokeLinecap="round" />
      {head(skin)}
      <path d="M38 53C36 33 49 27 61 27c14 0 23 8 21 26-4-8-12-14-25-13-8 1-14 5-19 13z" fill="#1f1a17" />
      <path d="M57 30q-6 4-8 12" stroke="#3a312b" strokeWidth="1.6" fill="none" />
    </>}
    {who === 1 && <>{/* grandmother: sari over the head, green border, round glasses */}
      <path d="M33 66C29 36 45 21 60 21s31 15 27 45l7 56H26z" fill="#f2e9d4" />
      <path d={SHOULDERS} fill="#f2e9d4" />
      <path d="M26 112q34-14 68-30" stroke="#2f7d50" strokeWidth="4" fill="none" />
      {head(skin)}
      <path d="M41 45c6-9 32-9 38 0-9-4-29-4-38 0z" fill="#ebe7e1" />
      <path d="M37 67C35 41 46 29 60 29s25 12 23 38" fill="none" stroke="#2f7d50" strokeWidth="3.2" />
      <g fill="none" stroke="#5c4632" strokeWidth="1.7"><circle cx="52" cy="54" r="6" /><circle cx="68" cy="54" r="6" /><path d="M58 54h4" /></g>
    </>}
    {who === 2 && <>{/* rickshaw-puller: checked gamchha on the shoulder, moustache, big smile */}
      <defs><pattern id={`g${id}`} width="11" height="11" patternUnits="userSpaceOnUse"><rect width="11" height="11" fill="#c63d2d" /><path d="M0 3h11M3 0v11" stroke="#f6eee2" strokeWidth="2.6" /><path d="M0 8.5h11M8.5 0v11" stroke="#8f2a1f" strokeWidth="1.2" /></pattern></defs>
      <path d={SHOULDERS} fill="#7aa3c4" />
      <path d="M29 90c13 13 49 13 62 0l4 13c-15 14-55 14-70 0z" fill={`url(#g${id})`} stroke="#8f2a1f" strokeWidth="1" />
      <path d="M74 99l13-2 6 25H76z" fill={`url(#g${id})`} stroke="#8f2a1f" strokeWidth="1" />
      {head(skin)}
      <path d="M39 50c0-16 10-23 21-23s22 6 21 23c-5-7-13-11-21-11s-16 4-21 11z" fill="#262019" />
      <path d="M52 61.5q8-4 16 0q-8 3.5-16 0z" fill="#262019" />
    </>}
    {who === 3 && <>{/* office worker: long hair, kameez with dupatta, ID card on a lanyard */}
      <path d="M36 58C34 32 48 25 60 25s26 7 24 33l5 32H31z" fill="#2a1c17" />
      <path d={SHOULDERS} fill="#8e3b4f" />
      <path d="M28 104l62-15 3 8-63 16z" fill="#f2c14e" />
      <path d="M53 88l7 18 7-18" fill="none" stroke="#3567b5" strokeWidth="2" />
      <rect x="54" y="105" width="12" height="10" rx="1.5" fill="#fff" stroke="#3567b5" strokeWidth="1.5" />
      {head(skin)}
      <path d="M39 50c3-15 16-20 27-18 10 2 16 9 15 18-7-8-19-12-30-8-5 2-9 5-12 8z" fill="#2a1c17" />
    </>}
    {who === 4 && <>{/* little girl: two pigtails with ribbons, yellow frock */}
      <path d={SHOULDERS} fill="#f5c842" />
      <path d="M48 88q12 9 24 0" fill="#fff" stroke="#e2d3a0" strokeWidth="1.5" />
      <circle cx="30" cy="62" r="8" fill="#241a15" /><circle cx="90" cy="62" r="8" fill="#241a15" />
      <g fill="#e0453a"><ellipse cx="36" cy="58" rx="3.6" ry="2.4" transform="rotate(35 36 58)" /><ellipse cx="38" cy="64" rx="3.6" ry="2.4" transform="rotate(-35 38 64)" /><ellipse cx="84" cy="58" rx="3.6" ry="2.4" transform="rotate(-35 84 58)" /><ellipse cx="82" cy="64" rx="3.6" ry="2.4" transform="rotate(35 82 64)" /></g>
      {head(skin)}
      <path d="M39 52c0-16 9-24 21-24s21 8 21 24c-2-6-8-10-13-10-2 3-6 5-9 5-3-2-4-5-4-5-8 1-13 5-16 10z" fill="#241a15" />
    </>}
    {who === 5 && <>{/* the uncle next door: fatua, grey moustache, glasses, a shiny top */}
      <path d={SHOULDERS} fill="#7d8a4a" />
      <path d="M60 89v33" stroke="#5f6a36" strokeWidth="2" /><circle cx="63" cy="98" r="1.4" fill="#e9e3c9" /><circle cx="63" cy="108" r="1.4" fill="#e9e3c9" />
      {head(skin)}
      <path d="M39 58c-1-9 1-15 5-18l1 18zM81 58c1-9-1-15-5-18l-1 18z" fill="#bdb8b0" />
      <path d="M50 62q10-6 20 0q-10 5-20 0z" fill="#c9c4bb" />
      <g fill="none" stroke="#3b2e22" strokeWidth="1.8"><rect x="45.5" y="49" width="12" height="9" rx="2.5" /><rect x="62.5" y="49" width="12" height="9" rx="2.5" /><path d="M57.5 53h5" /></g>
    </>}
    <g transform={who === 4 ? 'translate(0 1)' : undefined}><Face mood={mood} big={who === 4} /></g>
  </svg>;
}

/** A play-money chit: coins round, notes as slips, each with its own colour and a big Bangla numeral. */
export function Chit({ value, small }: { value: number; small?: boolean }) {
  return <span className="bt-chit" data-coin={isCoin(value)} data-small={small} style={{ '--c': CHIT_COLORS[value] } as CSSProperties} aria-hidden="true"><b>{bn(value)}</b></span>;
}

/** The shelf behind the counter: jars of lozenges, packets on a string. Static, drawn once. */
export function Shelf() {
  return <svg className="bt-shelf" viewBox="0 0 360 190" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
    <path d="M0 6q45 14 90 0t90 0 90 0 90 0" fill="none" stroke="#e7d6a8" strokeWidth="1.5" opacity=".7" />
    {[20, 62, 104, 146, 230, 272, 314].map((x, index) => <g key={x} transform={`translate(${x} 8) rotate(${index % 2 ? 6 : -5})`}>
      <path d="M0 0h22l-2 30H2z" fill={['#e85d4a', '#f1b93b', '#4b9bd1', '#7cc36a'][index % 4]} opacity=".85" />
      <path d="M4 10h14" stroke="#fff" strokeWidth="2.5" opacity=".7" />
    </g>)}
    <rect x="0" y="96" width="360" height="8" fill="#9c6b3f" opacity=".75" />
    {[180, 205, 300, 330].map((x, index) => <g key={x} transform={`translate(${x} 58)`} opacity=".9">
      <rect x="0" y="6" width="22" height="32" rx="6" fill="#ffffff55" stroke="#ffffff88" />
      <rect x="2" y="0" width="18" height="7" rx="2" fill={['#d9534f', '#3d8b5a', '#e0a83a', '#4c7fc0'][index]} />
      {[0, 1, 2, 3].map(dot => <circle key={dot} cx={6 + (dot % 2) * 9} cy={20 + Math.floor(dot / 2) * 9} r="3" fill={['#f08a3c', '#f4d35e', '#e85d75', '#7ac36a'][(dot + index) % 4]} />)}
    </g>)}
  </svg>;
}
