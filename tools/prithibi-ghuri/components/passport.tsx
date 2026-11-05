'use client';
// The passport: every country's stamp, in the order of the trips. A stamp shows once its trip is finished; the rest are dashed circles.
import type { CSSProperties } from 'react';
import { bn } from '../../../shared/kids-kit';
import { COUNTRIES } from '../lib/countries';
import { BackIcon, Pic } from './pictures';

export function PassportPage({ stamped, onClose }: { stamped: readonly string[]; onClose: () => void }) {
  return <div className="pg-passport" role="dialog" aria-label="আমার পাসপোর্ট">
    <div className="pg-levels-head">
      <p>আমার পাসপোর্ট <small>{bn(stamped.length)}/{bn(COUNTRIES.length)}</small></p>
      <button type="button" className="pg-close" onClick={event => { event.currentTarget.blur(); onClose(); }} aria-label="ফিরে যাও"><BackIcon /></button>
    </div>
    <ul>
      {COUNTRIES.map(country => {
        const has = stamped.includes(country.id);
        return <li key={country.id} className={has ? 'has' : ''} style={{ '--ink': country.ink } as CSSProperties} aria-label={has ? `${country.name}, সিল আছে` : 'এখনো সিল নেই'}>
          {has ? <><Pic k={`${country.id}:animal`} /><span>{country.name}</span></> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 14l18-9-6 15-3-6z" /></svg>}
        </li>;
      })}
    </ul>
    <p className="pg-small">সিলগুলো শুধু এই ফোনের ব্রাউজারে থাকে।</p>
  </div>;
}
