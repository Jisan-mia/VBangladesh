'use client';

import { useEffect, useId, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { cardSizes, loadCardFonts, type CardFormat } from '../../../shared/card-canvas';
import { HistoryButtons } from '../../../shared/history-buttons';
import { FormatToggle, ShareBar, StickyNext, useInView } from '../../../shared/share-kit';
import { useHistory } from '../../../shared/use-history';
import { cardBlob, drawCard } from '../lib/draw-slip';
import { calculateLedger, cleanTrip, exampleLedger, formatMoney, formatTaka, initialLedger, inputAmount, ledgerHash, ledgerLine, ledgerReport, MAX_EXPENSES, MAX_PEOPLE, MAX_TRIP_LENGTH, parseLedgerHash, parsePoisha, perPerson, removePerson, tripIdeas, validateLedger, type Expense, type Ledger, type Person } from '../lib/ledger';

const TOOL = 'bhagabhagi';
const bnNumber = (value: number) => new Intl.NumberFormat('bn-BD').format(value);
type Result = ReturnType<typeof calculateLedger>;

function NameForm({ initialName = '', onSave, onCancel }: { initialName?: string; onSave: (name: string) => void; onCancel?: () => void }) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');
  const inputId = useId();
  function submit(event: FormEvent) {
    event.preventDefault();
    try { onSave(name); setName(''); setError(''); }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'নামটা যোগ হলো না। আরেকবার দেখো।'); }
  }
  return <form className="split-name-form" onSubmit={submit} noValidate><label className="screen-reader-only" htmlFor={inputId}>{initialName ? 'নতুন নাম' : 'আরেকজনের নাম'}</label><div><input id={inputId} value={name} onChange={event => setName(event.target.value)} maxLength={24} placeholder="আরেকজনের নাম" autoComplete="off" aria-describedby={error ? `${inputId}-error` : undefined} aria-invalid={Boolean(error)} /><button type="submit">{initialName ? 'নাম রাখো' : 'যোগ করো'}</button>{onCancel && <button type="button" onClick={onCancel}>বাতিল</button>}</div>{error && <p className="split-error" id={`${inputId}-error`} role="alert">{error}</p>}</form>;
}

function PersonChip({ person, onRename, onRemove, canRemove }: { person: Person; onRename: (name: string) => void; onRemove: () => void; canRemove: boolean }) {
  const [editing, setEditing] = useState(false);
  return <li data-editing={editing}>
    <button type="button" className="split-chip" aria-expanded={editing} onClick={() => setEditing(!editing)}>{person.name}<span aria-hidden="true">✎</span><span className="screen-reader-only">, নাম বদলাও বা বাদ দাও</span></button>
    {editing && <div className="split-chip-edit"><NameForm initialName={person.name} onSave={name => { onRename(name); setEditing(false); }} onCancel={() => setEditing(false)} /><button type="button" className="kit-link" onClick={onRemove} disabled={!canRemove}>{person.name}-কে বাদ দাও</button></div>}
  </li>;
}

function ExpenseForm({ people, initial, onSave, onCancel }: { people: Person[]; initial?: Expense; onSave: (expense: Expense) => void; onCancel?: () => void }) {
  const [label, setLabel] = useState(initial?.label ?? '');
  const [amount, setAmount] = useState(initial ? inputAmount(initial.amount) : '');
  const [payerId, setPayerId] = useState(initial?.payerId ?? people[0].id);
  const [error, setError] = useState('');
  const formId = useId();
  const selectedPayer = people.some(person => person.id === payerId) ? payerId : '';
  function submit(event: FormEvent) {
    event.preventDefault();
    try {
      onSave({ id: initial?.id ?? crypto.randomUUID(), label, payerId: selectedPayer, amount: parsePoisha(amount) });
      if (!initial) { setLabel(''); setAmount(''); }
      setError('');
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'খরচটা যোগ হলো না। ঘরগুলো আরেকবার দেখো।'); }
  }
  return <form className="split-expense-form" onSubmit={submit} noValidate aria-label={initial ? `${initial.label} বদলাও` : 'নতুন খরচ'}>
    <label htmlFor={`${formId}-label`}>কিসের খরচ?<input id={`${formId}-label`} value={label} onChange={event => setLabel(event.target.value)} placeholder="যেমন: বাসের টিকিট" maxLength={50} autoComplete="off" /></label>
    <div className="split-form-row"><label htmlFor={`${formId}-amount`}>কত টাকা?<input id={`${formId}-amount`} value={amount} onChange={event => setAmount(event.target.value)} placeholder="যেমন: ১২৫০" inputMode="decimal" autoComplete="off" aria-describedby={`${formId}-hint`} /></label><label htmlFor={`${formId}-payer`}>কে দিয়েছে?<select id={`${formId}-payer`} value={selectedPayer} onChange={event => setPayerId(event.target.value)}><option value="">নাম বেছে নাও</option>{people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label></div>
    <p className="split-field-hint" id={`${formId}-hint`}>বাংলা বা ইংরেজি অঙ্কে লেখো, কমা ছাড়া।</p>
    {error && <p className="split-error" role="alert">{error}</p>}
    <div className="split-form-actions"><button className="kit-primary" type="submit">{initial ? 'বদলটা রাখো' : 'খরচ যোগ করো'}</button>{onCancel && <button type="button" className="kit-secondary" onClick={onCancel}>বাতিল</button>}</div>
  </form>;
}

function ExpenseRow({ expense, people, onSave, onRemove }: { expense: Expense; people: Person[]; onSave: (expense: Expense) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false);
  return <li className="split-expense" data-editing={editing}>
    <button type="button" className="split-expense-line" aria-expanded={editing} onClick={() => setEditing(!editing)}><span><strong>{expense.label}</strong><small>দিয়েছে {people.find(person => person.id === expense.payerId)?.name} · {editing ? 'বন্ধ করো' : 'বদলাও'}</small></span><b>{formatTaka(expense.amount)}</b></button>
    {editing && <div className="split-expense-edit"><ExpenseForm people={people} initial={expense} onSave={updated => { onSave(updated); setEditing(false); }} onCancel={() => setEditing(false)} /><button type="button" className="kit-link" onClick={onRemove}>এই খরচটা বাদ দাও</button></div>}
  </li>;
}

function Transfers({ result }: { result: Result }) {
  if (!result.transfers.length) return <p className="split-settled">{result.total ? 'হিসাব মিলে আছে! কারও কাছে কারও পাওনা নেই।' : 'খরচ লিখলেই এখানে দেখবে কে কাকে কত দেবে।'}</p>;
  return <ol className="split-transfers">{result.transfers.map(transfer => <li key={`${transfer.from.id}-${transfer.to.id}`}><span><strong>{transfer.from.name}</strong><span className="split-arrow" aria-label="দেবে"> → </span><strong>{transfer.to.name}</strong></span><b>{formatTaka(transfer.amount)}</b></li>)}</ol>;
}

function Balances({ result }: { result: Result }) {
  const largest = Math.max(1, ...result.balances.map(balance => Math.abs(balance.net)));
  return <ul className="split-balances">{result.balances.map(balance => <li key={balance.person.id}>
    <div className="split-balance-line"><strong>{balance.person.name}</strong><span>{balance.net === 0 ? 'মিলে গেছে' : `${balance.net > 0 ? 'পাবে' : 'দেবে'} ${formatTaka(Math.abs(balance.net))}`}</span></div>
    <div className="split-balance-track" aria-hidden="true"><span className={balance.net < 0 ? 'split-debit' : 'split-credit'} style={{ width: `${Math.abs(balance.net) / largest * 50}%` }} /></div>
    <p>দিয়েছে {formatTaka(balance.paid)} · ভাগে পড়ে {formatTaka(balance.share)}</p>
  </li>)}</ul>;
}

export function LedgerEditor({ tabs, onFriend }: { tabs: ReactNode; onFriend: () => void }) {
  const history = useHistory<Ledger>(() => structuredClone(exampleLedger));
  // The trip name lives outside undo history so typing it doesn't fill "এক ধাপ পেছাও" with single letters.
  const [trip, setTrip] = useState(exampleLedger.trip ?? '');
  const ledger = useMemo(() => ({ ...history.value, trip }), [history.value, trip]);
  const result = useMemo(() => calculateLedger(ledger), [ledger]);
  const [friend, setFriend] = useState<Ledger | null>(null);
  const [format, setFormat] = useState<CardFormat>('feed');
  const [site, setSite] = useState('');
  const [notice, setNotice] = useState('');
  const [manualReport, setManualReport] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [typing, setTyping] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const resultVisible = useInView(resultRef);
  // The shared section mounts after the first render, so observe it through a ref that changes with it.
  const [friendSection, setFriendSection] = useState<HTMLElement | null>(null);
  const friendVisible = useInView(useMemo(() => ({ current: friendSection }), [friendSection]));
  const friendResult = useMemo(() => friend && calculateLedger(friend), [friend]);
  const hasExpenses = ledger.expenses.length > 0;
  const state = hasExpenses ? ledgerHash(ledger).slice(1) : '';
  const line = ledgerLine(result);
  const count = ledger.people.length;

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared ledger replaces the friend's.
    const readFriend = () => { const shared = parseLedgerHash(window.location.hash); if (shared) { setFriend(shared); onFriend(); } };
    readFriend();
    window.addEventListener('hashchange', readFriend);
    setSite(window.location.host);
    return () => window.removeEventListener('hashchange', readFriend);
  }, [onFriend]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts(ledger.trip || 'হিসাবের স্লিপ').then(() => {
      if (cancelled || !preview.current) return;
      drawCard(preview.current, result, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [result, format, site, ledger.trip]);

  function commit(next: Ledger) {
    history.commit(validateLedger(next));
    setNotice('');
    setManualReport('');
  }

  function tryCommit(next: () => Ledger) {
    try { commit(next()); }
    catch (failure) { setNotice(failure instanceof Error ? failure.message : 'বদলটা রাখা গেল না।'); }
  }

  function editCopy() {
    if (!friend) return;
    commit(friend);
    setTrip(friend.trip ?? '');
    setFriend(null);
    window.history.replaceState(null, '', window.location.pathname);
    setNotice('হিসাবটা এখন তোমার খাতায়। যা বদলাতে চাও, বদলে নাও।');
    document.getElementById('khata')?.scrollIntoView({ behavior: 'smooth' });
  }

  async function copyReport(target: Ledger) {
    const report = ledgerReport(target);
    try { await navigator.clipboard.writeText(report); setNotice('হিসাব কপি হয়েছে! মেসেঞ্জার বা হোয়াটসঅ্যাপের গ্রুপে পেস্ট করে দাও।'); setManualReport(''); }
    catch { setManualReport(report); setNotice('সরাসরি কপি হলো না। নিচের লেখাটা চেপে ধরে কপি করো।'); }
  }

  const caption = `${ledger.trip || 'আমাদের'} হিসাব মিলে গেছে! ${bnNumber(count)} জন, মোট ${formatTaka(result.total)}। কে কাকে কত দেবে, লিংকে মিলিয়ে নাও:`;

  return <div className="split">
    {friend && friendResult && <section className="split-friend" ref={setFriendSection} aria-labelledby="friend-title">
      <p className="split-kicker">তোমার সাথে একটা হিসাব শেয়ার করা হয়েছে</p>
      <h2 id="friend-title">{friend.trip ? `${friend.trip}: ` : ''}{bnNumber(friend.people.length)} জনের হিসাব</h2>
      <p className="split-friend-sub">শুধু দেখার জন্য। কে কত দিয়েছে আর কে কাকে কত দেবে, মিলিয়ে নাও।</p>
      <div className="split-slip">
        <div className="split-totals"><p><span>মোট খরচ</span><strong>{formatTaka(friendResult.total)}</strong></p><p><span>{bnNumber(friend.people.length)} জন · জনপ্রতি</span><strong>{perPerson(friendResult.total, friend.people.length, formatTaka)}</strong></p></div>
        <h3>কে কাকে দেবে</h3>
        <Transfers result={friendResult} />
        <h3>খরচের লিস্ট</h3>
        <ul className="split-friend-expenses">{friend.expenses.map(expense => <li key={expense.id}><span>{expense.label} <small>দিয়েছে {friend.people.find(person => person.id === expense.payerId)?.name}</small></span><b>{formatTaka(expense.amount)}</b></li>)}</ul>
        <details className="split-details"><summary>সবার হিসাব খুলে দেখো</summary><Balances result={friendResult} /></details>
      </div>
      <div className="split-friend-actions">
        <button type="button" className="kit-primary" onClick={editCopy}>নিজের মতো বদলাও</button>
        <button type="button" className="kit-secondary" onClick={() => copyReport(friend)}>হিসাব কপি করো</button>
      </div>
      <a className="kit-link" href="#khata">নতুন একটা হিসাব শুরু করো</a>
    </section>}

    <div className="split-khata" id="khata" onFocus={() => setTyping(true)} onBlur={() => setTyping(false)}>
      <div className="split-cover">
        <div className="split-khata-top">{tabs}{(history.canUndo || history.canRedo) && <HistoryButtons {...history} />}</div>
        <div className="split-cover-label"><label htmlFor="split-trip">কিসের হিসাব?</label><input id="split-trip" className="split-trip" value={trip} maxLength={MAX_TRIP_LENGTH} onChange={event => setTrip(cleanTrip(event.target.value))} placeholder="যেমন: সাজেক ট্যুর" autoComplete="off" /></div>
        <div className="kit-chips split-ideas" role="group" aria-label="চেনা কয়েকটা নাম">{tripIdeas.map(idea => <button type="button" key={idea} aria-pressed={trip === idea} onClick={() => setTrip(idea)}>{idea}</button>)}</div>
      </div>
      <div className="split-page">

      <section className="split-people" aria-labelledby="split-people-heading">
        <h3 id="split-people-heading">কে কে ছিল <small>{bnNumber(count)} / ৮ জন · নাম ছুঁয়ে বদলাও</small></h3>
        <ul className="split-chips">{ledger.people.map(person => <PersonChip key={person.id} person={person} canRemove={count > 2} onRename={name => commit({ ...ledger, people: ledger.people.map(item => item.id === person.id ? { ...item, name } : item) })} onRemove={() => tryCommit(() => removePerson(ledger, person.id))} />)}</ul>
        {count < MAX_PEOPLE ? <NameForm onSave={name => commit({ ...ledger, people: [...ledger.people, { id: crypto.randomUUID(), name }] })} /> : <p className="split-hint">৮ জন হয়ে গেছে। নতুন কাউকে আনতে আগে একজনকে বাদ দাও।</p>}
      </section>

      <section className="split-expenses" aria-labelledby="split-list-heading">
        <h3 id="split-list-heading">কে কোন খরচ দিল <small>{bnNumber(ledger.expenses.length)}টা</small></h3>
        {hasExpenses ? <ul className="split-expense-list">{ledger.expenses.map(expense => <ExpenseRow key={expense.id} expense={expense} people={ledger.people} onSave={updated => commit({ ...ledger, expenses: ledger.expenses.map(item => item.id === updated.id ? updated : item) })} onRemove={() => commit({ ...ledger, expenses: ledger.expenses.filter(item => item.id !== expense.id) })} />)}</ul> : <p className="split-hint">এখনো কোনো খরচ নেই। নিচে প্রথম খরচটা লেখো।</p>}
        {ledger.expenses.length < MAX_EXPENSES ? <><h4>আরেকটা খরচ লেখো</h4><ExpenseForm people={ledger.people} onSave={expense => commit({ ...ledger, expenses: [...ledger.expenses, expense] })} /></> : <p className="split-hint">১০০টা খরচ হয়ে গেছে। নতুন খরচ লিখতে পুরোনো একটা বাদ দাও।</p>}
      </section>
      <button type="button" className="kit-link split-clear" onClick={() => { commit(structuredClone(initialLedger)); setTrip(''); setNotice('খাতা খালি হলো। ভুল করে চাপলে ওপরের “এক ধাপ পেছাও” চাপো।'); }}>খাতা খালি করে নিজেদের হিসাব লেখো</button>
      </div>
    </div>

    <StickyNext show={hasExpenses && !resultVisible && !typing && !friendVisible} title={<><strong>{formatTaka(result.total)}</strong> · {bnNumber(count)} জন</>} sub={line} href="#result" label="স্লিপটা দেখো" />

    <section className="split-result" id="result" ref={resultRef} aria-labelledby="result-title">
      <h2 id="result-title">{hasExpenses ? <>{ledger.trip || 'তোমাদের'} হিসাব <em>মিলেছে</em></> : 'এখনো কোনো খরচ নেই'}</h2>
      <p className="split-result-line">{line}</p>
      <div className="split-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="slip-summary" />
          <figcaption id="slip-summary" className="screen-reader-only">{ledger.trip} হিসাবের স্লিপ। মোট {formatMoney(result.total)} টাকা, {bnNumber(count)} জন। {result.transfers.map(transfer => `${transfer.from.name} দেবে ${transfer.to.name}-কে ${formatMoney(transfer.amount)} টাকা`).join('। ')}</figcaption>
          {previewError && <p className="kit-status" role="alert">স্লিপের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="split-controls">
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={TOOL} fileName="bhagabhagi.png" makeImage={() => cardBlob(result, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} disabled={!hasExpenses} hint={hasExpenses ? 'লিংক খুললে গ্রুপের সবাই পুরো হিসাবটা দেখে মিলিয়ে নিতে পারবে।' : ''} />
          <button type="button" className="kit-secondary" onClick={() => copyReport(ledger)} disabled={!hasExpenses}>হিসাবটা লেখা হিসেবে কপি করো</button>
          <details className="split-details"><summary>কে কত দিয়েছে, কার ভাগে কত</summary><Balances result={result} /><p className="split-hint">মোট খরচ সবার মধ্যে সমান ভাগ হয়। ভাগের পর কয়েক পয়সা বেঁচে গেলে লিস্টের প্রথম জন থেকে এক পয়সা করে যোগ হয়। এখান থেকে টাকা পাঠানো যায় না।</p></details>
        </div>
      </div>
    </section>
    <p className="split-notice kit-status" role="status" aria-live="polite">{notice}</p>
    {manualReport && <textarea className="split-manual" value={manualReport} readOnly rows={10} aria-label="কপি করার হিসাব" onFocus={event => event.currentTarget.select()} />}
  </div>;
}
