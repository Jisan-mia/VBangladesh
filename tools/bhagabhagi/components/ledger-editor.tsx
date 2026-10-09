'use client';

import { useId, useState, type FormEvent } from 'react';
import { saveBlob } from '../../../shared/art-export';
import { HistoryButtons } from '../../../shared/history-buttons';
import { useHistory } from '../../../shared/use-history';
import { calculateLedger, formatMoney, initialLedger, inputAmount, ledgerReport, MAX_EXPENSES, MAX_PEOPLE, parsePoisha, removePerson, validateLedger, type Expense, type Ledger, type Person } from '../lib/ledger';

const bnNumber = (value: number) => new Intl.NumberFormat('bn-BD').format(value);

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

function PersonRow({ person, index, onRename, onRemove, canRemove }: { person: Person; index: number; onRename: (name: string) => void; onRemove: () => void; canRemove: boolean }) {
  const [editing, setEditing] = useState(false);
  return <li><div className="split-person-line"><span className="split-person-number" aria-hidden="true">{bnNumber(index + 1)}</span><strong>{person.name}</strong><button type="button" onClick={() => setEditing(!editing)} aria-label={`${person.name}-এর নাম বদলাও`}>{editing ? 'বন্ধ করো' : 'বদলাও'}</button><button type="button" onClick={onRemove} disabled={!canRemove} aria-label={`${person.name}-কে লিস্ট থেকে বাদ দাও`}>বাদ দাও</button></div>{editing && <NameForm initialName={person.name} onSave={name => { onRename(name); setEditing(false); }} onCancel={() => setEditing(false)} />}</li>;
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
    <div className="split-form-row"><label htmlFor={`${formId}-amount`}>কত টাকা?<input id={`${formId}-amount`} value={amount} onChange={event => setAmount(event.target.value)} placeholder="যেমন: ১২৫০.৫০" inputMode="decimal" autoComplete="off" aria-describedby={`${formId}-hint`} /></label><label htmlFor={`${formId}-payer`}>কে দিয়েছে?<select id={`${formId}-payer`} value={selectedPayer} onChange={event => setPayerId(event.target.value)}><option value="">নাম বেছে নাও</option>{people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label></div>
    <p className="split-field-hint" id={`${formId}-hint`}>বাংলা বা ইংরেজি অঙ্কে লেখো, কমা ছাড়া।</p>
    {error && <p className="split-error" role="alert">{error}</p>}
    <div className="split-form-actions"><button className="button" type="submit">{initial ? 'বদলটা রাখো' : 'খরচ যোগ করো'}</button>{onCancel && <button type="button" className="button-secondary" onClick={onCancel}>বাতিল</button>}</div>
  </form>;
}

function ExpenseRow({ expense, people, onSave, onRemove }: { expense: Expense; people: Person[]; onSave: (expense: Expense) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false);
  return <li className="split-expense"><div className="split-expense-summary"><div><strong>{expense.label}</strong><span>দিয়েছে {people.find(person => person.id === expense.payerId)?.name}</span></div><strong>{formatMoney(expense.amount)} <small>টাকা</small></strong></div><div className="split-expense-actions"><button type="button" onClick={() => setEditing(!editing)} aria-label={`${expense.label} খরচ বদলাও`}>{editing ? 'বন্ধ করো' : 'বদলাও'}</button><button type="button" onClick={onRemove} aria-label={`${expense.label} খরচ বাদ দাও`}>বাদ দাও</button></div>{editing && <ExpenseForm people={people} initial={expense} onSave={updated => { onSave(updated); setEditing(false); }} onCancel={() => setEditing(false)} />}</li>;
}

export function LedgerEditor() {
  const history = useHistory<Ledger>(() => structuredClone(initialLedger));
  const ledger = history.value;
  const result = calculateLedger(ledger);
  const [notice, setNotice] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const report = ledgerReport(ledger);
  const largestBalance = Math.max(1, ...result.balances.map(balance => Math.abs(balance.net)));

  function commit(next: Ledger) {
    history.commit(validateLedger(next));
    setNotice('হিসাব আপডেট হয়ে গেছে।');
  }

  function deletePerson(personId: string) {
    try { commit(removePerson(ledger, personId)); }
    catch (failure) { setNotice(failure instanceof Error ? failure.message : 'নামটা বাদ দেওয়া গেল না।'); }
  }

  async function copyReport() {
    try { await navigator.clipboard.writeText(report); setNotice('কপি হয়ে গেছে! মেসেঞ্জার বা হোয়াটসঅ্যাপের গ্রুপে পেস্ট করে দাও।'); }
    catch { setReportOpen(true); setNotice('সরাসরি কপি হলো না। নিচের লেখাটা চেপে ধরে কপি করো।'); }
  }

  function downloadReport() {
    try { saveBlob(new Blob([report], { type: 'text/plain;charset=utf-8' }), 'ভাগাভাগি-হিসাব.txt'); setNotice('হিসাবের ফাইল ডাউনলোড হচ্ছে। ডাউনলোড ফোল্ডারে দেখো।'); }
    catch { setReportOpen(true); setNotice('ফাইলটা বানানো গেল না। নিচের লেখাটা কপি করে রাখো।'); }
  }

  return <div className="split-editor">
    <div className="split-editor-heading"><div><p className="eyebrow">তোমাদের খরচের খাতা</p><h2>কে কে ছিল, কে কত দিল?</h2></div><HistoryButtons {...history} /></div>
    <div className="split-columns"><div className="split-entry-column">
      <section className="split-people" aria-labelledby="split-people-heading"><div className="split-section-title"><h3 id="split-people-heading">আগে নামগুলো লেখো</h3><span>{bnNumber(ledger.people.length)} / ৮ জন</span></div><p className="split-hint">কাউকে যোগ বা বাদ দিলে মোট খরচ আবার সবার মধ্যে সমান ভাগ হবে।</p><ol className="split-people-list">{ledger.people.map((person, index) => <PersonRow key={person.id} person={person} index={index} canRemove={ledger.people.length > 2} onRename={name => commit({ ...ledger, people: ledger.people.map(item => item.id === person.id ? { ...item, name } : item) })} onRemove={() => deletePerson(person.id)} />)}</ol>{ledger.people.length < MAX_PEOPLE ? <NameForm onSave={name => commit({ ...ledger, people: [...ledger.people, { id: crypto.randomUUID(), name }] })} /> : <p className="split-hint">৮ জন হয়ে গেছে, এর বেশি রাখা যায় না। নতুন কাউকে আনতে আগে একজনকে বাদ দাও।</p>}</section>
      <section className="split-add-expense" aria-labelledby="split-add-heading"><h3 id="split-add-heading">এবার খরচগুলো লেখো</h3>{ledger.expenses.length < MAX_EXPENSES ? <ExpenseForm people={ledger.people} onSave={expense => commit({ ...ledger, expenses: [...ledger.expenses, expense] })} /> : <p className="split-hint">১০০টা খরচ হয়ে গেছে, এর বেশি রাখা যায় না। নতুন খরচ লিখতে পুরোনো একটা বাদ দাও।</p>}</section>
      <section className="split-expense-list-section" aria-labelledby="split-list-heading"><div className="split-section-title"><h3 id="split-list-heading">যে খরচগুলো লিখেছ</h3><span>{bnNumber(ledger.expenses.length)}টা</span></div>{ledger.expenses.length ? <ul className="split-expense-list">{ledger.expenses.map(expense => <ExpenseRow key={expense.id} expense={expense} people={ledger.people} onSave={updated => commit({ ...ledger, expenses: ledger.expenses.map(item => item.id === updated.id ? updated : item) })} onRemove={() => commit({ ...ledger, expenses: ledger.expenses.filter(item => item.id !== expense.id) })} />)}</ul> : <p className="split-empty">এখনো কোনো খরচ নেই। ওপরে প্রথম খরচটা লেখো।</p>}</section>
    </div><div className="split-result-column">
      <section className="split-result" aria-labelledby="split-result-heading"><div className="split-total"><p>সব মিলিয়ে খরচ</p><strong>{formatMoney(result.total)} <span>টাকা</span></strong><p>{bnNumber(ledger.people.length)} জনের মধ্যে সমান ভাগ</p></div><h3 id="split-result-heading">কে কাকে দেবে</h3>{result.transfers.length ? <ol className="split-transfers">{result.transfers.map((transfer, index) => <li key={`${transfer.from.id}-${transfer.to.id}`}><span className="split-transfer-number">{bnNumber(index + 1)}</span><div><div><strong>{transfer.from.name}</strong><span aria-label="দেবে"> → </span><strong>{transfer.to.name}</strong></div><p>{formatMoney(transfer.amount)} <span>টাকা</span></p></div></li>)}</ol> : <div className="split-settled"><svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m15 24 6 6 13-14" fill="none" stroke="currentColor" strokeWidth="2"/></svg><p>{ledger.expenses.length ? 'হিসাব মিলে গেছে! কারও কাছে কারও পাওনা নেই।' : 'খরচ লিখলেই এখানে দেখবে কে কাকে কত দেবে।'}</p></div>}<p className="split-calculation-note">তুমি যা লিখেছ, শুধু তার হিসাব। এখান থেকে টাকা পাঠানো যায় না।</p></section>
      <section className="split-balances" aria-labelledby="split-balances-heading"><h3 id="split-balances-heading">সবার ভাগ, সবার হিসাব</h3><p className="split-balance-key"><span>← দেবে</span><span>পাবে →</span></p><ul>{result.balances.map(balance => <li key={balance.person.id}><div className="split-balance-line"><strong>{balance.person.name}</strong><span>{balance.net === 0 ? 'মিলে গেছে' : `${balance.net > 0 ? 'পাবে' : 'দেবে'} ${formatMoney(Math.abs(balance.net))} টাকা`}</span></div><div className="split-balance-track" aria-hidden="true"><span className={balance.net < 0 ? 'split-debit' : 'split-credit'} style={{ width: `${Math.abs(balance.net) / largestBalance * 50}%` }} /></div><p>দিয়েছে {formatMoney(balance.paid)} · ভাগে পড়ে {formatMoney(balance.share)} টাকা</p></li>)}</ul><details className="split-rounding"><summary>ভাগে পয়সা বেঁচে গেলে কী হয়?</summary><p>সমান ভাগের পর কয়েক পয়সা বেঁচে গেলে, লিস্টের প্রথম জন থেকে শুরু করে একেকজনের ভাগে এক পয়সা করে যোগ হয়। তাই কারও ভাগে বড়জোর এক পয়সা বেশি হতে পারে। প্রতিটা খরচ আলাদা করে না, মোট খরচটা একবারে ভাগ হয়।</p><p>কে কাকে দেবে, সেই লিস্টও নামের ক্রম ধরে বানানো। হিসাব মেলানোর এটা একটা উপায়, একমাত্র উপায় না।</p></details></section>
      <div className="split-report-actions"><button type="button" className="button" disabled={!ledger.expenses.length} onClick={copyReport}>হিসাব কপি করো</button><button type="button" className="button-secondary" disabled={!ledger.expenses.length} onClick={downloadReport}>ফাইল ডাউনলোড করো</button></div><details className="split-report-text" open={reportOpen} onToggle={event => setReportOpen(event.currentTarget.open)}><summary>হিসাবের পুরো লেখা দেখো</summary><label className="screen-reader-only" htmlFor="split-report">কপি করার হিসাব</label><textarea id="split-report" value={report} readOnly rows={12} onFocus={event => event.currentTarget.select()} /></details>
    </div></div>
    <p className="split-notice" role="status">{notice}</p><div className="split-bottom"><p>পাতা বন্ধ করলে হিসাব মুছে যাবে। তার আগে কপি করে নাও বা ফাইলটা নামিয়ে রাখো।</p><button type="button" onClick={() => { commit(structuredClone(initialLedger)); setNotice('খাতা খালি হলো। ভুল করে চাপলে ওপরের ফেরানোর বোতামে আগের হিসাব ফিরে পাবে।'); }}>খাতা খালি করো</button></div>
  </div>;
}
