'use client';
// The children's section kit (ছোটদের খেলাঘর): parent note, parent gate, "আব্বু-আম্মুকে দেখাও", a gentle daily play limit
// with a breathing rest screen, and Bangla speech only where the phone really has a Bangla voice. Styles: kids-kit.css.
// Rules it enforces: nothing about the child leaves the phone, no share or outbound action without the parent gate.
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { sfx } from './game-sound';

const bnDigits = new Intl.NumberFormat('bn-BD', { useGrouping: false });
export const bn = (value: number) => bnDigits.format(value);
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode */ } };

/** "আব্বু-আম্মুর জন্য": what the game teaches, for which age, and one way to play together. Open on the first visit, folded after. */
export function ParentNote({ slug, learns, age, together, school }: { slug: string; learns: string; age: string; together: string; school?: string }) {
  const [open, setOpen] = useState(true);
  const seen = useRef<boolean | null>(null);
  // Read the "seen" flag once: dev Strict Mode runs effects twice and would otherwise fold the note on a first visit.
  useEffect(() => { seen.current ??= Boolean(read(`ektukhani-kids-note-${slug}`)); if (seen.current) setOpen(false); write(`ektukhani-kids-note-${slug}`, '1'); }, [slug]);
  return <details className="kk-note" open={open} onToggle={event => setOpen((event.target as HTMLDetailsElement).open)}>
    <summary>আব্বু-আম্মুর জন্য</summary>
    <dl>
      <dt>কী শেখে</dt><dd>{learns}</dd>
      <dt>বয়স</dt><dd>{age}</dd>
      <dt>একসাথে খেলো</dt><dd>{together}</dd>
      {school && <><dt>স্কুলের পড়ায়</dt><dd>{school}</dd></>}
    </dl>
  </details>;
}

const WORDS = ['শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];

/** A gate a 3–6 year old can't pass: a sum written in words, answered on a pad, opened by a 2-second hold. */
export function ParentGate({ label = 'বড়দের জন্য', children }: { label?: string; children: ReactNode }) {
  const [stage, setStage] = useState<'closed' | 'ask' | 'open'>('closed');
  const [pair, setPair] = useState<[number, number]>([7, 5]);
  const [answer, setAnswer] = useState('');
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);
  const start = () => { setHolding(true); hold.current = setTimeout(() => { setHolding(false); setPair([3 + Math.floor(Math.random() * 7), 3 + Math.floor(Math.random() * 7)]); setAnswer(''); setStage('ask'); }, 2000); };
  const stop = () => { setHolding(false); if (hold.current) clearTimeout(hold.current); };
  useEffect(() => stop, []);
  const press = (digit: number) => {
    const next = (answer + digit).slice(-2);
    setAnswer(next);
    if (Number(next) === pair[0] + pair[1]) setStage('open');
    else if (next.length >= 2) setAnswer('');
  };
  if (stage === 'open') return <div className="kk-gate-open">{children}<button type="button" className="kk-link" onClick={() => setStage('closed')}>বন্ধ করো</button></div>;
  if (stage === 'ask') return <div className="kk-gate" role="dialog" aria-label="বড়দের জন্য প্রশ্ন">
    <p>{WORDS[pair[0]]} আর {WORDS[pair[1]]} যোগ করলে কত?</p>
    <p className="kk-gate-answer" aria-live="polite">{answer ? bn(Number(answer)) : '…'}</p>
    <div className="kk-pad">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => <button type="button" key={digit} onClick={() => press(digit)}>{bn(digit)}</button>)}</div>
    <button type="button" className="kk-link" onClick={() => setStage('closed')}>থাক</button>
  </div>;
  return <button type="button" className={`kk-gate-button${holding ? ' holding' : ''}`} onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); start(); } }} onKeyUp={stop}
    aria-label={`${label}: দুই সেকেন্ড চেপে ধরো`}>{label} <small>চেপে ধরো</small></button>;
}

/** Shares the tool's plain address (never a result or a name). Use inside ParentGate. */
export function ShareToolLink({ title, text }: { title: string; text: string }) {
  const [done, setDone] = useState('');
  const share = async () => {
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title, text, url });
      else { await navigator.clipboard.writeText(`${text} ${url}`); setDone('লিংক কপি হয়েছে'); }
    } catch { /* closed the share sheet */ }
  };
  return <button type="button" className="kit-secondary" onClick={share}>{done || 'খেলাটার লিংক পাঠাও'}</button>;
}

/** Full-screen "আব্বু-আম্মুকে দেখাও": what the child did today, no name, no photo. A saved picture is behind the gate. */
export function ShowParent({ open, onClose, children, picture }: { open: boolean; onClose: () => void; children: ReactNode; picture?: { fileName: string; make: () => Promise<Blob> } }) {
  if (!open) return null;
  const save = async () => {
    if (!picture) return;
    const blob = await picture.make(), link = document.createElement('a');
    link.href = URL.createObjectURL(blob); link.download = picture.fileName; link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  };
  return <div className="kk-show" role="dialog" aria-modal="true" aria-label="আব্বু-আম্মুকে দেখাও">
    <div className="kk-show-body">{children}</div>
    <button type="button" className="kit-primary" onClick={onClose}>দেখানো শেষ</button>
    {picture && <ParentGate label="ছবিটা রাখো"><button type="button" className="kit-secondary" onClick={save}>ফোনে ছবি রাখো</button></ParentGate>}
  </div>;
}

/** The "আব্বু-আম্মুকে দেখাও" button the child sees at the end of a round, in place of any share button. */
export function ShowParentButton({ onClick }: { onClick: () => void }) {
  return <button type="button" className="kit-primary kk-show-button" onClick={() => { sfx.pop(); onClick(); }}>আব্বু-আম্মুকে দেখাও</button>;
}

const SESSION_KEY = 'ektukhani-kids-time';
const LIMIT_KEY = 'ektukhani-kids-limit';
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

/** Minutes of play allowed per day across the kids' section (0 = off). Parents change it behind the gate. */
export function readLimit() { const saved = Number(read(LIMIT_KEY)); return read(LIMIT_KEY) === null || !Number.isFinite(saved) ? 15 : saved; }

/**
 * Counts visible play time across every kids' tool for today. Call `atBreak()` at the end of a round: it returns true (and the
 * hook shows `resting`) once today's limit has passed, so the child stops at a natural break, never mid-task.
 */
export function useKidsSession() {
  const [resting, setResting] = useState(false);
  useEffect(() => {
    const tick = setInterval(() => {
      if (document.hidden) return;
      let state = { date: today(), seconds: 0 };
      try { const saved = JSON.parse(read(SESSION_KEY) ?? 'null'); if (saved?.date === state.date) state = saved; } catch { /* fresh day */ }
      state.seconds += 10;
      write(SESSION_KEY, JSON.stringify(state));
    }, 10000);
    return () => clearInterval(tick);
  }, []);
  const atBreak = useCallback(() => {
    const limit = readLimit();
    let seconds = 0;
    try { const saved = JSON.parse(read(SESSION_KEY) ?? 'null'); if (saved?.date === today()) seconds = saved.seconds; } catch { /* none */ }
    const over = limit > 0 && seconds >= limit * 60;
    setResting(over);
    return over;
  }, []);
  const extend = useCallback((minutes: number) => {
    let state = { date: today(), seconds: 0 };
    try { const saved = JSON.parse(read(SESSION_KEY) ?? 'null'); if (saved?.date === state.date) state = saved; } catch { /* none */ }
    state.seconds = Math.max(0, state.seconds - minutes * 60);
    write(SESSION_KEY, JSON.stringify(state));
    setResting(false);
  }, []);
  return { resting, atBreak, extend };
}

/** "আজ এটুকুই, কাল আবার।" with five slow balloon breaths. Parents can give more time or change the daily limit behind the gate. */
export function RestScreen({ onExtend }: { onExtend: (minutes: number) => void }) {
  const [breath, setBreath] = useState(0);
  const [limit, setLimit] = useState(15);
  useEffect(() => { setLimit(readLimit()); }, []);
  useEffect(() => {
    if (breath >= 5) return;
    const timer = setTimeout(() => { setBreath(count => count + 1); sfx.note(breath % 5, 0.6); }, 8000);
    return () => clearTimeout(timer);
  }, [breath]);
  const choose = (minutes: number) => { write(LIMIT_KEY, String(minutes)); setLimit(minutes); };
  return <div className="kk-rest" role="dialog" aria-modal="true" aria-label="আজকের খেলা শেষ">
    <div className={`kk-balloon${breath >= 5 ? ' away' : ''}`} aria-hidden="true" />
    <p className="kk-rest-cue">{breath >= 5 ? 'বেলুন উড়ে গেল।' : 'বেলুনের সাথে শ্বাস নাও… আস্তে ছাড়ো।'}</p>
    <h2>আজ এটুকুই, কাল আবার।</h2>
    <p>এবার উঠে একটু পানি খাও, জানালা দিয়ে আকাশ দেখো।</p>
    <ParentGate label="বড়দের জন্য">
      <button type="button" className="kit-secondary" onClick={() => onExtend(10)}>আজ আরও ১০ মিনিট</button>
      <p className="kk-small">রোজ কতক্ষণ খেলবে:</p>
      <div className="kk-choices">{[10, 15, 30, 0].map(minutes => <button type="button" key={minutes} aria-pressed={limit === minutes} onClick={() => choose(minutes)}>{minutes ? `${bn(minutes)} মিনিট` : 'সীমা নেই'}</button>)}</div>
    </ParentGate>
  </div>;
}

/** True once the phone offers a Bangla voice (bn-BD / bn-IN / bn_BD). Many cheap phones have none: then stay silent, never read Bangla in English. */
export function useBanglaVoice() {
  const [voice, setVoice] = useState(false);
  useEffect(() => {
    if (typeof speechSynthesis === 'undefined') return;
    const check = () => setVoice(speechSynthesis.getVoices().some(item => /^bn[-_]/i.test(item.lang)));
    check();
    speechSynthesis.addEventListener('voiceschanged', check);
    return () => speechSynthesis.removeEventListener('voiceschanged', check);
  }, []);
  return voice;
}

/** Speaks a short Bangla word or phrase if a Bangla voice exists; otherwise does nothing. Never blocks the game. */
export function speak(text: string) {
  if (typeof speechSynthesis === 'undefined') return;
  const voice = speechSynthesis.getVoices().find(item => /^bn[-_]/i.test(item.lang));
  if (!voice) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = 0.85;
  speechSynthesis.speak(utterance);
}

/** A speaker button that only appears when a Bangla voice exists. */
export function SpeakButton({ text, label = 'শোনো' }: { text: string; label?: string }) {
  const voice = useBanglaVoice();
  if (!voice) return null;
  return <button type="button" className="kk-speak" onClick={() => speak(text)} aria-label={`${label}: ${text}`}><span aria-hidden="true">🔈</span></button>;
}
