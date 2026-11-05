'use client';
// The guessing screens: the porthole (which planet?), the football Sun (how big?) and the field strip (how far?). The
// picture takes the top half, the choices are big pictures below it, and a round ▶ button goes on after a right answer.
import type { ReactNode } from 'react';
import { bn } from '../../../shared/kids-kit';
import { FIELD_M, footballScale, PLANETS, THINGS, ZONES, type Planet } from '../lib/planets';
import { glowOn, isLast, itemOf, planetOf, rightKey, type Round } from '../lib/round';
import { ClueArt, Football, GhostFinger, PlanetArt, ThingArt, ZoneArt } from './art';
import type { Tap } from './board';

type QuizProps = { round: Round; slow: boolean; ghost: boolean; wobble: { key: string; n: number } | null; tap: Tap; onNext: () => void; children?: ReactNode };

export function Quiz({ round, slow, ghost, wobble, tap, onNext, children }: QuizProps) {
  const item = itemOf(round), planet = planetOf(round), right = rightKey(round), glow = glowOn(round);
  const wobbleClass = (key: string) => wobble?.key === key && !slow ? ` sj-wobble sj-w${wobble.n % 2}` : '';
  const state = (key: string) => round.solved ? (key === right ? ' right' : ' dim') : '';
  return <div className="sj-quiz" data-kind={item.kind}>
    {item.kind === 'know' && <Porthole planet={planet} solved={round.solved} />}
    {item.kind === 'size' && <SizeView planet={planet} solved={round.solved} />}
    {item.kind === 'far' && <FarView planet={planet} solved={round.solved} seen={round.items.slice(0, round.index).filter(other => other.kind === 'far').map(other => other.planet)} />}
    {children}
    <div className="sj-choices" data-n={round.choices.length} data-kind={item.kind}>
      {round.choices.map((key, at) => {
        const gl = glow && key === right && !round.solved ? ' sj-glow' : '';
        const common = { type: 'button' as const, 'data-choice': key, disabled: round.wrong.includes(key), className: `sj-choice${state(key)}${gl}${wobbleClass(key)}`, ...tap(key) };
        const number = <span className="sj-key" aria-hidden="true">{bn(at + 1)}</span>;
        if (item.kind === 'know') {
          const choice = PLANETS.find(other => other.id === key)!;
          return <button key={key} {...common} aria-label={`${bn(at + 1)}: ${choice.name}`}>{number}<span className="sj-choice-art"><PlanetArt planet={choice} box={100} r={30} ring={1.6} /></span><span className="sj-choice-name">{choice.name}</span></button>;
        }
        if (item.kind === 'size') {
          const thing = THINGS.find(other => other.id === key)!;
          return <button key={key} {...common} aria-label={`${bn(at + 1)}: ${thing.name}`}>{number}<span className="sj-choice-art"><ThingArt thing={thing} /></span><span className="sj-choice-name">{thing.name}</span></button>;
        }
        const zone = ZONES.find(other => other.id === key)!;
        return <button key={key} {...common} aria-label={`${bn(at + 1)}: ${zone.name}`}>{number}<span className="sj-choice-art"><ZoneArt zone={zone.id} /></span><span className="sj-choice-name">{zone.name}</span></button>;
      })}
      {ghost && !round.solved && <span className="sj-ghost sj-below"><GhostFinger /></span>}
    </div>
    <div className="sj-next-row">
      {round.solved && <button type="button" className="sj-next" onClick={event => { event.currentTarget.blur(); onNext(); }} aria-label={isLast(round) ? 'শেষ দেখো' : 'পরের গ্রহ'}>
        {isLast(round)
          ? <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 42V8" /><path d="M12 9c8-5 14 5 24 0v16c-10 5-16-5-24 0z" /></svg>
          : <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M16 9v30l24-15z" /></svg>}
      </button>}
    </div>
  </div>;
}

/** A round window on the rocket, with a clue in it. After the right pick the planet itself fills it. */
function Porthole({ planet, solved }: { planet: Planet; solved: boolean }) {
  return <div className="sj-porthole" role="img" aria-label={solved ? planet.name : 'জানালার বাইরের ছবি'}>
    <div className="sj-porthole-glass" key={solved ? 'planet' : planet.id}>
      {solved ? <PlanetArt planet={planet} box={100} r={Math.min(46, planet.drawR + 14)} ring={1.0} /> : <ClueArt planet={planet.id} />}
    </div>
  </div>;
}

/** The football Sun and, after the right pick, the planet's true size as a dot with a magnifier bubble beside it. */
function SizeView({ planet, solved }: { planet: Planet; solved: boolean }) {
  const ball = 62, mm = footballScale(planet).sizeMm, dot = Math.max(0.9, ball * mm / 220);
  return <svg className="sj-scale" viewBox="0 0 360 200" role="img" aria-label={solved ? `ফুটবলের পাশে ${planet.name}, আসল অনুপাতে` : `ফুটবলের পাশে ${planet.name}`}>
    <Football cx={86} cy={96} r={ball} />
    <text x="86" y="186" textAnchor="middle" className="sj-svg-label">সূর্য</text>
    {solved ? <g className="sj-pop">
      <path d={`M ${220 + dot} ${96 - dot - 2} L 288 44 M ${220 + dot} ${96 + dot + 2} L 288 148`} stroke="#2c3768" strokeWidth="1.4" strokeDasharray="4 4" fill="none" />
      <circle cx="214" cy="96" r={dot + 6} fill="none" stroke="#2c3768" strokeWidth="1.5" strokeDasharray="3 3" />
      <circle cx="214" cy="96" r={dot} fill={planet.shade} />
      <circle cx="288" cy="96" r="52" fill="#fffdf5" stroke="#2c3768" strokeWidth="2.5" />
      <svg x="244" y="52" width="88" height="88" viewBox="0 0 100 100" overflow="hidden"><PlanetArt planet={planet} box={100} r={Math.min(40, planet.drawR + 10)} ring={1.0} /></svg>
      <text x="288" y="186" textAnchor="middle" className="sj-svg-label">{planet.name}, বড় করে</text>
      <text x="214" y="130" textAnchor="middle" className="sj-svg-label sj-small">আসল মাপ</text>
    </g> : <g>
      <circle cx="262" cy="96" r="46" fill="none" stroke="#2c3768" strokeWidth="2.5" strokeDasharray="6 6" />
      <text x="262" y="112" textAnchor="middle" className="sj-svg-q">?</text>
      <text x="262" y="186" textAnchor="middle" className="sj-svg-label">{planet.name}</text>
    </g>}
  </svg>;
}

/** The strip from the football Sun: the school field, a few houses, some trees; the planet's flag lands at its true place. */
function FarView({ planet, solved, seen }: { planet: Planet; solved: boolean; seen: readonly number[] }) {
  const x = (metres: number) => 22 + metres * (338 - 22) / 750, place = footballScale(planet).distanceM;
  return <svg className="sj-scale" viewBox="0 0 360 200" role="img" aria-label={solved ? `${planet.name} থাকত ${bn(Math.round(place))} মিটার দূরে` : 'মাঠের এক মাথায় ফুটবল-সূর্য'}>
    <rect x={x(0)} y="78" width={x(FIELD_M) - x(0)} height="52" rx="4" fill="#69b65a" stroke="#2c3768" strokeWidth="1.5" />
    <line x1={(x(0) + x(FIELD_M)) / 2} y1="78" x2={(x(0) + x(FIELD_M)) / 2} y2="130" stroke="#fff" strokeWidth="1.5" />
    <text x={(x(0) + x(FIELD_M)) / 2} y="68" textAnchor="middle" className="sj-svg-label">মাঠ</text>
    {[150, 200, 250].map(at => <g key={at}><path d={`M ${x(at) - 9} 130 V112 L ${x(at)} 102 L ${x(at) + 9} 112 V130 Z`} fill="#f2d7a6" stroke="#2c3768" strokeWidth="1.3" /><rect x={x(at) - 2.5} y="118" width="5" height="12" fill="#b5652d" /></g>)}
    {[420, 520, 640].map(at => <g key={at}><circle cx={x(at)} cy="108" r="11" fill="#4a9d40" stroke="#2c3768" strokeWidth="1.2" /><rect x={x(at) - 1.5} y="117" width="3" height="13" fill="#7a4a24" /></g>)}
    <line x1={x(0)} y1="130" x2={x(750)} y2="130" stroke="#2c3768" strokeWidth="2" />
    <circle cx={x(0)} cy="118" r="9" fill="#fff" stroke="#2c3768" strokeWidth="2" />
    <text x={x(0) - 4} y="160" textAnchor="start" className="sj-svg-label">সূর্য</text>
    {seen.map(index => <circle key={index} cx={x(footballScale(PLANETS[index]).distanceM)} cy="142" r="5" fill={PLANETS[index].color} stroke="#2c3768" strokeWidth="1" />)}
    {solved && <g className="sj-drop">
      <line x1={x(place)} y1="40" x2={x(place)} y2="130" stroke="#2c3768" strokeWidth="2" />
      <circle cx={x(place)} cy="34" r="13" fill={planet.color} stroke="#2c3768" strokeWidth="2" />
      <text x={place > 420 ? 352 : place < 120 ? 20 : x(place)} y="186" textAnchor={place > 420 ? "end" : place < 120 ? "start" : "middle"} className="sj-svg-label">{planet.name}: {bn(Math.round(place))} মিটার</text>
    </g>}
    {!solved && <text x="190" y="40" textAnchor="middle" className="sj-svg-q">{planet.name} কোথায়?</text>}
  </svg>;
}
