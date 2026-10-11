'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cardSizes, loadCardFonts, type CardFormat } from '../../../shared/card-canvas';
import { FormatToggle, ShareBar, StickyNext, useInView } from '../../../shared/share-kit';
import { drawMessCard, messCardBlob } from '../lib/draw-slip';
import { cleanTrip, formatTaka, MAX_TRIP_LENGTH } from '../lib/ledger';
import { balanceText, blankMessDraft, calculateMess, cashNote, cleanName, draftFromMess, exampleMessDraft, formatMeals, MAX_MEMBERS, MAX_NAME_LENGTH, memberLabel, messFromDraft, messHash, messIdeas, messLine, messReport, parseMessHash, roundingNote, tk, type MemberDraft, type Mess, type MessDraft, type MessResult } from '../lib/meal-rate';

const TOOL = 'bhagabhagi';
const bn = (value: number) => new Intl.NumberFormat('bn-BD').format(value);

function MessTotals({ result }: { result: MessResult }) {
  return <div className="split-totals"><p><span>মোট বাজার</span><strong>{tk(result.mess.bazar)}</strong></p><p><span>{formatMeals(result.totalHalf)} মিল · মিল রেট</span><strong>{formatTaka(result.rate)}</strong></p></div>;
}

function MessTable({ result }: { result: MessResult }) {
  const largest = Math.max(1, ...result.members.map(member => Math.abs(member.net)));
  return <ul className="split-balances">{result.members.map((member, index) => <li key={index}>
    <div className="split-balance-line"><strong>{member.label}</strong><span>{balanceText(member.net)}</span></div>
    <div className="split-balance-track" aria-hidden="true"><span className={member.net < 0 ? 'split-debit' : 'split-credit'} style={{ width: `${Math.abs(member.net) / largest * 50}%` }} /></div>
    <p>{formatMeals(member.halfMeals)} মিল · ভাগে পড়ে {tk(member.share)}{member.roundedUp ? ' (রাউন্ডে +১)' : ''} · দিয়েছে {tk(member.paid)}</p>
  </li>)}</ul>;
}

/** মেসের মিল রেট: total bazar ÷ total meals, each member's share in whole taka, and who owes or gets back what. */
export function MealEditor({ tabs, onFriend }: { tabs: ReactNode; onFriend: () => void }) {
  const [draft, setDraft] = useState<MessDraft>(() => structuredClone(exampleMessDraft));
  const [cleared, setCleared] = useState<MessDraft | null>(null);
  const parsed = useMemo(() => {
    try { return { mess: messFromDraft(draft), error: '' }; }
    catch (failure) { return { mess: null, error: failure instanceof Error ? failure.message : 'ঘরগুলো আরেকবার দেখো।' }; }
  }, [draft]);
  const result = useMemo(() => parsed.mess && calculateMess(parsed.mess), [parsed]);
  const [friend, setFriend] = useState<Mess | null>(null);
  const friendResult = useMemo(() => friend && calculateMess(friend), [friend]);
  const [format, setFormat] = useState<CardFormat>('feed');
  const [site, setSite] = useState('');
  const [notice, setNotice] = useState('');
  const [manualReport, setManualReport] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [typing, setTyping] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const resultVisible = useInView(resultRef);
  const [friendSection, setFriendSection] = useState<HTMLElement | null>(null);
  const friendVisible = useInView(useMemo(() => ({ current: friendSection }), [friendSection]));
  const state = parsed.mess ? messHash(parsed.mess).slice(1) : '';
  const count = draft.members.length;

  useEffect(() => {
    const readFriend = () => { const shared = parseMessHash(window.location.hash); if (shared) { setFriend(shared); onFriend(); } };
    readFriend();
    window.addEventListener('hashchange', readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener('hashchange', readFriend);
  }, [onFriend]);

  useEffect(() => {
    if (!result) return; // keep the last good slip on screen while a box is half-typed
    let cancelled = false;
    loadCardFonts(result.mess.title || 'মিলের হিসাব').then(() => {
      if (cancelled || !preview.current) return;
      drawMessCard(preview.current, result, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [result, format, site]);

  function update(next: Partial<MessDraft>) {
    setDraft(current => ({ ...current, ...next }));
    setCleared(null);
    setNotice('');
    setManualReport('');
  }
  const updateMember = (id: string, change: Partial<MemberDraft>) => update({ members: draft.members.map(member => member.id === id ? { ...member, ...change } : member) });

  function clear() {
    setCleared(draft);
    setDraft(blankMessDraft());
    setNotice('খাতা খালি হলো। বাজারের মোট খরচ আর সবার মিল লেখো।');
  }

  function editCopy() {
    if (!friend) return;
    update(draftFromMess(friend));
    setFriend(null);
    window.history.replaceState(null, '', window.location.pathname);
    setNotice('হিসাবটা এখন তোমার খাতায়। যা বদলাতে চাও, বদলে নাও।');
    document.getElementById('mil-khata')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function copyReport(target: Mess) {
    const report = messReport(target);
    try { await navigator.clipboard.writeText(report); setNotice('হিসাব কপি হয়েছে! মেসের গ্রুপে পেস্ট করে দাও।'); setManualReport(''); }
    catch { setManualReport(report); setNotice('সরাসরি কপি হলো না। নিচের লেখাটা চেপে ধরে কপি করো।'); }
  }

  const line = result ? messLine(result) : parsed.error;
  const caption = `${draft.title.trim() ? `${draft.title.trim()}: ` : ''}মেসের মিলের হিসাব মিলেছে! মিল রেট আর কে কত দেবে-পাবে, লিংকে মিলিয়ে নাও:`;

  return <div className="split">
    {friend && friendResult && <section className="split-friend" ref={setFriendSection} aria-labelledby="mil-friend-title">
      <p className="split-kicker">তোমার সাথে একটা মিলের হিসাব শেয়ার করা হয়েছে</p>
      <h2 id="mil-friend-title">{friend.title ? `${friend.title}: ` : ''}{bn(friend.members.length)} জনের মিলের হিসাব</h2>
      <p className="split-friend-sub">শুধু দেখার জন্য। মিল রেট, কার ভাগে কত আর কে কত দেবে বা পাবে, মিলিয়ে নাও।</p>
      <div className="split-slip">
        <MessTotals result={friendResult} />
        <h3>কে কত দেবে, কে কত পাবে</h3>
        <MessTable result={friendResult} />
        <p className="split-hint">{roundingNote(friendResult)} {cashNote(friendResult)}</p>
      </div>
      <div className="split-friend-actions">
        <button type="button" className="kit-primary" onClick={editCopy}>নিজের মতো বদলাও</button>
        <button type="button" className="kit-secondary" onClick={() => copyReport(friend)}>হিসাব কপি করো</button>
      </div>
      <a className="kit-link" href="#mil-khata">নতুন একটা হিসাব শুরু করো</a>
    </section>}

    <div className="split-khata" id="mil-khata" onFocus={() => setTyping(true)} onBlur={() => setTyping(false)}>
      <div className="split-cover">
        <div className="split-khata-top">{tabs}</div>
        <div className="split-cover-label"><label htmlFor="mil-title">কিসের হিসাব?</label><input id="mil-title" className="split-trip" value={draft.title} maxLength={MAX_TRIP_LENGTH} onChange={event => update({ title: cleanTrip(event.target.value) })} placeholder="যেমন: অক্টোবরের মিল" autoComplete="off" /></div>
        <div className="kit-chips split-ideas" role="group" aria-label="চেনা কয়েকটা নাম">{messIdeas.map(idea => <button type="button" key={idea} aria-pressed={draft.title === idea} onClick={() => update({ title: idea })}>{idea}</button>)}</div>
      </div>
      <div className="split-page">
        <label className="meal-bazar" htmlFor="mil-bazar">মাসের মোট বাজার খরচ<span><b aria-hidden="true">৳</b><input id="mil-bazar" value={draft.bazar} onChange={event => update({ bazar: event.target.value })} inputMode="numeric" placeholder="যেমন: ১২৫০০" autoComplete="off" /></span></label>

        <h3 id="mil-members-heading">কার কত মিল <small>{bn(count)} / ১৫ জন</small></h3>
        <p className="meal-head" aria-hidden="true"><span>নাম</span><span>মিল</span><span>দিয়েছে ৳</span></p>
        <ol className="meal-rows" aria-labelledby="mil-members-heading">{draft.members.map((member, index) => {
          const label = memberLabel({ name: member.name.trim() }, index);
          return <li key={member.id}>
            <input className="meal-name" value={member.name} maxLength={MAX_NAME_LENGTH} onChange={event => updateMember(member.id, { name: cleanName(event.target.value) })} placeholder={`সদস্য ${bn(index + 1)}`} aria-label={`${bn(index + 1)} নম্বর জনের নাম (না দিলেও চলবে)`} autoComplete="off" />
            <input className="meal-meals" value={member.meals} onChange={event => updateMember(member.id, { meals: event.target.value })} inputMode="decimal" placeholder="মিল" aria-label={`${label}: কয়টা মিল`} autoComplete="off" />
            <input className="meal-paid" value={member.paid} onChange={event => updateMember(member.id, { paid: event.target.value })} inputMode="numeric" placeholder="টাকা" aria-label={`${label}: বাজারে বা জমায় কত টাকা দিয়েছে`} autoComplete="off" />
            <button type="button" className="meal-remove" onClick={() => update({ members: draft.members.filter(item => item.id !== member.id) })} disabled={count <= 2} aria-label={`${label}-কে বাদ দাও`}>×</button>
          </li>;
        })}</ol>
        {count < MAX_MEMBERS ? <button type="button" className="meal-add" onClick={() => update({ members: [...draft.members, { id: crypto.randomUUID(), name: '', meals: '', paid: '' }] })}>+ আরেকজন যোগ করো</button> : <p className="split-hint">১৫ জন হয়ে গেছে। নতুন কাউকে আনতে আগে একজনকে বাদ দাও।</p>}
        <p className="split-field-hint">আধা মিল লিখতে পারো, যেমন ২৫.৫। বাজার করে বা জমা দিয়ে কে কত টাকা দিয়েছে, ‘দিয়েছে’ ঘরে লেখো; না দিলে খালি রাখো। বাংলা বা ইংরেজি অঙ্কে, পুরো টাকায়।</p>
        {parsed.error && <p className="split-error" aria-live="polite">{parsed.error}</p>}
        <button type="button" className="kit-link split-clear" onClick={clear}>খাতা খালি করে নিজেদের হিসাব লেখো</button>
      </div>
    </div>

    <StickyNext show={Boolean(result) && !resultVisible && !typing && !friendVisible} title={result ? <>মিল রেট <strong>{formatTaka(result.rate)}</strong></> : ''} sub={line} href="#mil-result" label="স্লিপটা দেখো" />

    <section className="split-result" id="mil-result" ref={resultRef} aria-labelledby="mil-result-title">
      <h2 id="mil-result-title">{result ? <>মিল রেট <em>{formatTaka(result.rate)}</em></> : 'হিসাবটা এখনো বাকি'}</h2>
      <p className="split-result-line">{line}</p>
      <div className="split-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="mil-slip-summary" />
          <figcaption id="mil-slip-summary" className="screen-reader-only">{result && `মিলের হিসাবের স্লিপ। মোট বাজার ${tk(result.mess.bazar)}, মোট ${formatMeals(result.totalHalf)} মিল, মিল রেট ${formatTaka(result.rate)}। ${result.members.map(member => `${member.label}: ${formatMeals(member.halfMeals)} মিল, ভাগ ${tk(member.share)}, ${balanceText(member.net)}`).join('। ')}`}</figcaption>
          {previewError && <p className="kit-status" role="alert">স্লিপের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="split-controls">
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={TOOL} fileName="bhagabhagi-mil.png" makeImage={() => messCardBlob(result!, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} disabled={!result} hint={result ? 'লিংক খুললে মেসের সবাই পুরো হিসাবটা দেখে মিলিয়ে নিতে পারবে।' : ''} />
          <button type="button" className="kit-secondary" onClick={() => parsed.mess && copyReport(parsed.mess)} disabled={!result}>হিসাবটা লেখা হিসেবে কপি করো</button>
          {result && <p className="split-hint">{roundingNote(result)} {cashNote(result)}</p>}
          <details className="split-details"><summary>কার কত মিল, কে কত দেবে-পাবে</summary>{result && <MessTable result={result} />}<p className="split-hint">মিল রেট = মোট বাজার ÷ মোট মিল। যার যত মিল, মিল রেট দিয়ে গুণ করলে তার ভাগ। এখান থেকে টাকা পাঠানো যায় না।</p></details>
        </div>
      </div>
    </section>
    <p className="split-notice kit-status" role="status" aria-live="polite">{notice}{cleared && <> <button type="button" className="kit-link" onClick={() => { setDraft(cleared); setCleared(null); setNotice(''); }}>আগের হিসাব ফিরিয়ে আনো</button></>}</p>
    {manualReport && <textarea className="split-manual" value={manualReport} readOnly rows={10} aria-label="কপি করার হিসাব" onFocus={event => event.currentTarget.select()} />}
  </div>;
}
