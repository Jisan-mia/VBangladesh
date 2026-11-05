'use client';
// The parent's one form, behind the gate: whose number, the number, and (only if ticked) keep it on this phone. The number goes into page
// memory, and into localStorage only when the tick is on (lib/saved.ts). A second button forgets it. The inputs are radios and a tick, not
// buttons, so the gate doesn't shut on the first tap inside it.
import { useState } from 'react';
import { parseNumber, whose, type Who } from '../lib/play';

export const PRIVATE = 'নম্বরটা এই ফোনের বাইরে যায় না। নেটে পাঠানো হয় না, লিংকে বা ছবিতে থাকে না।';

export function NumberForm({ onSet, onClear, has, kept }: { onSet: (who: Who, number: string, keep: boolean) => void; onClear: () => void; has: boolean; kept: boolean }) {
  const [who, setWho] = useState<Who>('ammu');
  const [draft, setDraft] = useState('');
  const [keep, setKeep] = useState(kept);
  const [error, setError] = useState('');
  const submit = () => {
    const number = parseNumber(draft);
    if (!number) { setError('০১ দিয়ে শুরু ১১ অঙ্কের মোবাইল নম্বর দাও।'); return; }
    setDraft(''); setError(''); onSet(who, number, keep);
  };
  return <div className="am-form">
    <div className="am-form-who" role="radiogroup" aria-label="কার নম্বর">
      {(['ammu', 'abbu'] as Who[]).map(person => <label key={person}>
        <input type="radio" checked={person === who} onChange={() => setWho(person)} />
        <span>{whose(person)} নম্বর</span>
      </label>)}
    </div>
    <label className="am-field">মোবাইল নম্বর
      {/* No form and autocomplete off, so the browser has nothing to remember. */}
      <input type="tel" inputMode="numeric" autoComplete="off" spellCheck={false} maxLength={20} placeholder="১১ অঙ্ক, ০১ দিয়ে শুরু"
        value={draft} onChange={event => { setDraft(event.target.value); setError(''); }} onKeyDown={event => { if (event.key === 'Enter') submit(); }} />
    </label>
    <label className="am-keep">
      <input type="checkbox" checked={keep} onChange={event => setKeep(event.target.checked)} />
      <span>এই ফোনে রেখে দাও, পরের বার আবার দিতে হবে না</span>
    </label>
    {error && <p className="am-error" role="alert">{error}</p>}
    <button type="button" className="kit-primary" onClick={submit}>নম্বরটা দাও</button>
    <p className="am-private">{PRIVATE}{!keep && ' পাতা বন্ধ করলে মুছে যায়।'}</p>
    {has && <button type="button" className="kk-link" onClick={onClear}>নম্বর মুছে দাও</button>}
  </div>;
}
