'use client';
// A postcard says its fact with a picture first: the greeting in a speech bubble with a waving hand, a big picture of the
// food, place or animal with its name, a picture for how the country is like home. The one line of text is for a parent or an
// older child. The header on every card is the country: its flag, name, continent and capital.
import { FLAGS } from '../lib/art';
import type { Country } from '../lib/countries';
import type { Ask } from '../lib/levels';
import { LIKE_OF } from '../lib/likes';
import { helloLine, inside } from '../lib/text';
import type { Card } from '../lib/trip';
import { Badge, Flag, Pic } from './pictures';

/** The country's badge must never show the answer: on a flag question there is no flag, on an animal question no animal for a country without a flag. */
const hides = (country: Country, ask?: Ask) => ask === 'flag' || (ask === 'animal' && !FLAGS[country.id]);
const Pin = () => <svg className="pg-where-pic" viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4c-11 0-19 8-19 19 0 14 19 37 19 37s19-23 19-37C51 12 43 4 32 4z" fill="#d9480f" stroke="#2b2433" strokeWidth="2" strokeLinejoin="round" /><circle cx="32" cy="23" r="8" fill="#fff" /></svg>;

export function Where({ country, ask }: { country: Country; ask?: Ask }) {
  return <header className="pg-where">
    {hides(country, ask) ? <Pin /> : <Badge id={country.id} flagClass="pg-where-flag" picClass="pg-where-pic" />}
    <div><h2>{country.name}</h2><p>{country.continent} · রাজধানী {country.capital}</p></div>
  </header>;
}

const Hand = () => <svg className="pg-wave" viewBox="0 0 64 64" aria-hidden="true">
  <g stroke="#2b2433" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" fill="#e7b48a">
    <rect x="16" y="30" width="30" height="26" rx="8" /><rect x="16" y="12" width="6" height="24" rx="3" /><rect x="23" y="7" width="6" height="29" rx="3" /><rect x="30" y="6" width="6" height="30" rx="3" /><rect x="37" y="10" width="6" height="26" rx="3" />
    <path d="M45 34c7-5 13 1 8 9l-7 7" />
  </g>
</svg>;

export function Postcard({ country, card }: { country: Country; card: Card }) {
  if (card === 'hello') return <div className="pg-card pg-hello">
    <span className="pg-stamp-corner" aria-hidden="true"><Badge id={country.id} flagClass="pg-corner-flag" picClass="pg-corner-pic" /></span>
    <Hand />
    <p className="pg-bubble"><span>{country.hello.word}</span></p>
    <p className="pg-note">{helloLine(country)}।</p>
  </div>;
  if (card === 'like') return <div className="pg-card pg-like">
    <div className="pg-pair-pics" aria-hidden="true"><Flag id="bd" className="pg-pair-flag" /><span className="pg-equals">=</span><Badge id={country.id} flagClass="pg-pair-flag" picClass="pg-pair-flag" /></div>
    <Pic k={LIKE_OF[country.id]} className="pg-pic pg-pic-big" />
    <p className="pg-note pg-big">{country.like}</p>
    {country.probash && <p className="pg-note pg-small-note">{inside(country.name)} অনেক বাংলাদেশি থাকেন। তোমার কোনো আত্মীয় আছেন? আম্মুকে জিজ্ঞেস করো।</p>}
  </div>;
  const item = country[card];
  return <div className="pg-card" data-kind={card}>
    <span className="pg-stamp-corner" aria-hidden="true"><Badge id={country.id} flagClass="pg-corner-flag" picClass="pg-corner-pic" /></span>
    <Pic k={`${country.id}:${card}`} className="pg-pic pg-pic-big" />
    <h3>{item.name}</h3>
    <p className="pg-note">{item.note}</p>
  </div>;
}
