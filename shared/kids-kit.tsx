'use client';
// The children's section kit (ছোটদের খেলাঘর): parent note, parent gate, "আব্বু-আম্মুকে দেখাও", a gentle daily play limit
// with a breathing rest screen, and Bangla speech only where the phone really has a Bangla voice. Styles: kids-kit.css.
// Rules it enforces: nothing about the child leaves the phone, no share or outbound action without the parent gate.
import { useCallback, useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { sfx, soundOn } from './game-sound';

const bnDigits = new Intl.NumberFormat('bn-BD', { useGrouping: false });
export const bn = (value: number) => bnDigits.format(value);
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const write = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* private mode */ } };

/** "আব্বু-আম্মুর জন্য": what the game teaches, for which age, and one way to play together. Folded to one line so the game stays on the first screen. */
export function ParentNote({ learns, age, together, school }: { slug?: string; learns: string; age: string; together: string; school?: string }) {
  return <details className="kk-note">
    <summary>আব্বু-আম্মুর জন্য <small>· {age}</small></summary>
    <dl>
      <dt>কী শেখে</dt><dd>{learns}</dd>
      <dt>বয়স</dt><dd>{age}</dd>
      <dt>একসাথে খেলো</dt><dd>{together}</dd>
      {school && <><dt>স্কুলের পড়ায়</dt><dd>{school}</dd></>}
    </dl>
  </details>;
}

const WORDS = ['শূন্য', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];

/**
 * A gate a 3–6 year old can't pass: a 2-second hold, then a sum written in words, answered on a pad.
 * Key auto-repeat never counts as a hold; a wrong answer closes the gate and the hold rests for 10 seconds;
 * once open it closes itself after 20 seconds or when the page is left, so a phone handed back is locked again.
 */
export function ParentGate({ label = 'বড়দের জন্য', children }: { label?: string; children: ReactNode }) {
  const [stage, setStage] = useState<'closed' | 'ask' | 'open'>('closed');
  const [pair, setPair] = useState<[number, number]>([7, 5]);
  const [answer, setAnswer] = useState('');
  const lockedUntil = useRef(0);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [holding, setHolding] = useState(false);
  // Sums are always 10–18, so the answer is two digits: random taps open it about 1 time in 100.
  const ask = () => { const a = 3 + Math.floor(Math.random() * 7), b = Math.max(3, 10 - a) + Math.floor(Math.random() * (10 - Math.max(3, 10 - a))); setPair([a, b]); setAnswer(''); };
  const start = () => {
    if (hold.current || Date.now() < lockedUntil.current) return;
    setHolding(true);
    hold.current = setTimeout(() => { hold.current = null; setHolding(false); ask(); setStage('ask'); }, 2000);
  };
  const stop = () => { setHolding(false); if (hold.current) { clearTimeout(hold.current); hold.current = null; } };
  useEffect(() => stop, []);
  useEffect(() => {
    if (stage !== 'open') return;
    const close = () => setStage('closed');
    const timer = setTimeout(close, 20000);
    const away = () => { if (document.hidden) close(); };
    document.addEventListener('visibilitychange', away);
    window.addEventListener('pagehide', close);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', away); window.removeEventListener('pagehide', close); };
  }, [stage]);
  const press = (digit: number) => {
    const sum = pair[0] + pair[1], next = answer + digit;
    if (next.length < String(sum).length) { setAnswer(next); return; }
    if (Number(next) === sum) { setStage('open'); return; }
    lockedUntil.current = Date.now() + 10000;
    setStage('closed');
  };
  // One grown-up action per opening: after any button or link inside, the gate shuts again.
  const afterAction = (event: MouseEvent) => { if ((event.target as HTMLElement).closest('button, a')) setTimeout(() => setStage('closed'), 0); };
  if (stage === 'open') return <div className="kk-gate-open"><div onClickCapture={afterAction}>{children}</div><button type="button" className="kk-link" onClick={() => setStage('closed')}>বন্ধ করো</button></div>;
  if (stage === 'ask') return <div className="kk-gate" role="dialog" aria-label="বড়দের জন্য প্রশ্ন">
    <p>{WORDS[pair[0]]} আর {WORDS[pair[1]]} যোগ করলে কত?</p>
    <p className="kk-gate-answer" aria-live="polite">{answer ? bn(Number(answer)) : '…'}</p>
    <div className="kk-pad">{[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(digit => <button type="button" key={digit} onClick={() => press(digit)}>{bn(digit)}</button>)}</div>
    <button type="button" className="kk-link" onClick={() => setStage('closed')}>থাক</button>
  </div>;
  return <button type="button" className={`kk-gate-button${holding ? ' holding' : ''}`} onPointerDown={start} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (!event.repeat) start(); } }} onKeyUp={stop} onBlur={stop}
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
  return <button type="button" className="kit-primary kk-show-button" onClick={() => { sfx.pop(); onClick(); }}><svg className="kk-show-icon" viewBox="0 0 32 32" aria-hidden="true"><circle cx="11" cy="9" r="4" /><circle cx="22" cy="12" r="3" /><path d="M4 27c0-6 3-10 7-10s7 4 7 10zM16 27c0-5 2.5-8 6-8s6 3 6 8z" /></svg>আব্বু-আম্মুকে দেখাও</button>;
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
function pastLimit() {
  const limit = readLimit();
  let seconds = 0;
  try { const saved = JSON.parse(read(SESSION_KEY) ?? 'null'); if (saved?.date === today()) seconds = saved.seconds; } catch { /* none */ }
  return limit > 0 && seconds >= limit * 60;
}

export function useKidsSession() {
  const [resting, setResting] = useState(false);
  useEffect(() => {
    const tick = setInterval(() => {
      if (document.hidden || !document.hasFocus()) return; // one count per child, not per open tab
      let state = { date: today(), seconds: 0 };
      try { const saved = JSON.parse(read(SESSION_KEY) ?? 'null'); if (saved?.date === state.date) state = saved; } catch { /* fresh day */ }
      state.seconds += 10;
      write(SESSION_KEY, JSON.stringify(state));
    }, 10000);
    return () => clearInterval(tick);
  }, []);
  const atBreak = useCallback(() => {
    const over = pastLimit();
    setResting(over);
    return over;
  }, []);
  // Opening a kids' game is a break too: past today's limit, it starts on the rest screen, not a fresh round.
  useEffect(() => { if (pastLimit()) setResting(true); }, []);
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
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    // A real modal: nothing behind the rest screen hears a key, tap or focus while it is up.
    // It holds the page only while it is actually on screen: inside a game player's hidden stage (a phone's launch
    // card shows instead) it must not freeze the খেলো button that brings it into view.
    const node = box.current;
    if (!node) return;
    const shown = () => node.getClientRects().length > 0;
    const block = (event: Event) => {
      if (!shown()) return;
      if (event.target instanceof Node && node.contains(event.target)) return;
      event.stopImmediatePropagation(); event.preventDefault();
      if (event.type === 'focusin') node.focus();
    };
    const kinds = ['keydown', 'keyup', 'keypress', 'pointerdown', 'pointerup', 'click', 'focusin'];
    for (const kind of kinds) window.addEventListener(kind, block, true);
    // Everything else on the page goes inert while it shows, so Tab can't even land on it.
    let quiet: HTMLElement[] = [];
    const hold = () => {
      if (quiet.length) return;
      node.focus();
      for (let at: HTMLElement | null = node; at && at !== document.body; at = at.parentElement) {
        for (const sibling of Array.from(at.parentElement?.children ?? [])) {
          if (sibling !== at && sibling instanceof HTMLElement && !sibling.inert) { sibling.inert = true; quiet.push(sibling); }
        }
      }
    };
    const release = () => { for (const sibling of quiet) sibling.inert = false; quiet = []; };
    const sync = () => { if (shown()) hold(); else release(); };
    sync();
    const watch = new ResizeObserver(sync);
    watch.observe(node);
    return () => {
      watch.disconnect();
      for (const kind of kinds) window.removeEventListener(kind, block, true);
      release();
    };
  }, []);
  return <div ref={box} tabIndex={-1} className="kk-rest" role="dialog" aria-modal="true" aria-label="আজকের খেলা শেষ">
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

// No voices on the site: phone text-to-speech reads Bangla badly, so every cue is a picture, a sound effect or text instead.
// These stay exported so older game code keeps compiling; they do nothing.

/** Always false: the site uses no spoken voice. */
export function useBanglaVoice() { return false; }

/** Does nothing: the site uses no spoken voice. */
export function speak(_text: string) { /* no voice */ }

/** Renders nothing: the site uses no spoken voice. */
export function SpeakButton(_props: { text: string; label?: string }) { return null; }
