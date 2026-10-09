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
    catch (failure) { setError(failure instanceof Error ? failure.message : 'নামটি যোগ করা যায়নি। আবার দেখুন।'); }
  }
  return <form className="split-name-form" onSubmit={submit} noValidate><label className="screen-reader-only" htmlFor={inputId}>{initialName ? 'নতুন নাম' : 'আরেকজনের নাম'}</label><div><input id={inputId} value={name} onChange={event => setName(event.target.value)} maxLength={24} placeholder="আরেকজনের নাম" autoComplete="off" aria-describedby={error ? `${inputId}-error` : undefined} aria-invalid={Boolean(error)} /><button type="submit">{initialName ? 'নাম রাখুন' : 'যোগ করুন'}</button>{onCancel && <button type="button" onClick={onCancel}>বাতিল</button>}</div>{error && <p className="split-error" id={`${inputId}-error`} role="alert">{error}</p>}</form>;
}

function PersonRow({ person, index, onRename, onRemove, canRemove }: { person: Person; index: number; onRename: (name: string) => void; onRemove: () => void; canRemove: boolean }) {
  const [editing, setEditing] = useState(false);
  return <li><div className="split-person-line"><span className="split-person-number" aria-hidden="true">{bnNumber(index + 1)}</span><strong>{person.name}</strong><button type="button" onClick={() => setEditing(!editing)} aria-label={`${person.name}-এর নাম বদলান`}>{editing ? 'বন্ধ করুন' : 'বদলান'}</button><button type="button" onClick={onRemove} disabled={!canRemove} aria-label={`${person.name}-কে তালিকা থেকে বাদ দিন`}>বাদ দিন</button></div>{editing && <NameForm initialName={person.name} onSave={name => { onRename(name); setEditing(false); }} onCancel={() => setEditing(false)} />}</li>;
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
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'খরচটি যোগ করা যায়নি। তথ্য মিলিয়ে নিন।'); }
  }
  return <form className="split-expense-form" onSubmit={submit} noValidate aria-label={initial ? `${initial.label} বদলান` : 'নতুন খরচ'}>
    <label htmlFor={`${formId}-label`}>কিসের খরচ?<input id={`${formId}-label`} value={label} onChange={event => setLabel(event.target.value)} placeholder="যেমন: দুপুরের খাবার" maxLength={50} autoComplete="off" /></label>
    <div className="split-form-row"><label htmlFor={`${formId}-amount`}>কত টাকা?<input id={`${formId}-amount`} value={amount} onChange={event => setAmount(event.target.value)} placeholder="যেমন: ১২৫০.৫০" inputMode="decimal" autoComplete="off" aria-describedby={`${formId}-hint`} /></label><label htmlFor={`${formId}-payer`}>কে দিয়েছেন?<select id={`${formId}-payer`} value={selectedPayer} onChange={event => setPayerId(event.target.value)}><option value="">নাম বেছে নিন</option>{people.map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label></div>
    <p className="split-field-hint" id={`${formId}-hint`}>বাংলা বা ইংরেজি অঙ্কে লিখুন। কমা দেবেন না।</p>
    {error && <p className="split-error" role="alert">{error}</p>}
    <div className="split-form-actions"><button className="button" type="submit">{initial ? 'বদল রাখুন' : 'খরচ যোগ করুন'}</button>{onCancel && <button type="button" className="button-secondary" onClick={onCancel}>বাতিল</button>}</div>
  </form>;
}

function ExpenseRow({ expense, people, onSave, onRemove }: { expense: Expense; people: Person[]; onSave: (expense: Expense) => void; onRemove: () => void }) {
  const [editing, setEditing] = useState(false);
  return <li className="split-expense"><div className="split-expense-summary"><div><strong>{expense.label}</strong><span>দিয়েছেন {people.find(person => person.id === expense.payerId)?.name}</span></div><strong>{formatMoney(expense.amount)} <small>টাকা</small></strong></div><div className="split-expense-actions"><button type="button" onClick={() => setEditing(!editing)} aria-label={`${expense.label} খরচ বদলান`}>{editing ? 'বদলানো বন্ধ করুন' : 'বদলান'}</button><button type="button" onClick={onRemove} aria-label={`${expense.label} খরচ বাদ দিন`}>বাদ দিন</button></div>{editing && <ExpenseForm people={people} initial={expense} onSave={updated => { onSave(updated); setEditing(false); }} onCancel={() => setEditing(false)} />}</li>;
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
    setNotice('হিসাব বদলে গেছে। নতুন ফল নিচে দেখুন।');
  }

  function deletePerson(personId: string) {
    try { commit(removePerson(ledger, personId)); }
    catch (failure) { setNotice(failure instanceof Error ? failure.message : 'নামটি বাদ দেওয়া যায়নি।'); }
  }

  async function copyReport() {
    try { await navigator.clipboard.writeText(report); setNotice('হিসাব কপি করা হয়েছে।'); }
    catch { setReportOpen(true); setNotice('সরাসরি কপি করা যায়নি। নিচের লেখা বেছে কপি করুন।'); }
  }

  function downloadReport() {
    try { saveBlob(new Blob([report], { type: 'text/plain;charset=utf-8' }), 'ভাগাভাগি-হিসাব.txt'); setNotice('হিসাবের ফাইল ডাউনলোডের জন্য পাঠানো হয়েছে।'); }
    catch { setReportOpen(true); setNotice('ফাইল তৈরি করা যায়নি। নিচের লেখা কপি করে রাখুন।'); }
  }

  return <div className="split-editor">
    <div className="split-editor-heading"><div><p className="eyebrow">আপনাদের খরচের খাতা</p><h2>কে আছেন, কে খরচ করেছেন?</h2></div><HistoryButtons {...history} /></div>
    <div className="split-columns"><div className="split-entry-column">
      <section className="split-people" aria-labelledby="split-people-heading"><div className="split-section-title"><h3 id="split-people-heading">প্রথমে নামগুলো</h3><span>{bnNumber(ledger.people.length)} / ৮ জন</span></div><p className="split-hint">নাম যোগ বা বাদ দিলে মোট খরচ সবার মধ্যে নতুন করে ভাগ হবে।</p><ol className="split-people-list">{ledger.people.map((person, index) => <PersonRow key={person.id} person={person} index={index} canRemove={ledger.people.length > 2} onRename={name => commit({ ...ledger, people: ledger.people.map(item => item.id === person.id ? { ...item, name } : item) })} onRemove={() => deletePerson(person.id)} />)}</ol>{ledger.people.length < MAX_PEOPLE ? <NameForm onSave={name => commit({ ...ledger, people: [...ledger.people, { id: crypto.randomUUID(), name }] })} /> : <p className="split-hint">আটজনের নাম আছে। নতুন নাম যোগ করতে আগে একজনকে বাদ দিন।</p>}</section>
      <section className="split-add-expense" aria-labelledby="split-add-heading"><h3 id="split-add-heading">এবার খরচ লিখুন</h3>{ledger.expenses.length < MAX_EXPENSES ? <ExpenseForm people={ledger.people} onSave={expense => commit({ ...ledger, expenses: [...ledger.expenses, expense] })} /> : <p className="split-hint">১০০টি খরচ লেখা হয়েছে। নতুন খরচ দিতে পুরোনো কোনোটি বাদ দিন।</p>}</section>
      <section className="split-expense-list-section" aria-labelledby="split-list-heading"><div className="split-section-title"><h3 id="split-list-heading">লেখা খরচ</h3><span>{bnNumber(ledger.expenses.length)}টি</span></div>{ledger.expenses.length ? <ul className="split-expense-list">{ledger.expenses.map(expense => <ExpenseRow key={expense.id} expense={expense} people={ledger.people} onSave={updated => commit({ ...ledger, expenses: ledger.expenses.map(item => item.id === updated.id ? updated : item) })} onRemove={() => commit({ ...ledger, expenses: ledger.expenses.filter(item => item.id !== expense.id) })} />)}</ul> : <p className="split-empty">এখনো খরচ লেখা হয়নি। ওপরের ঘরে প্রথম খরচটি যোগ করুন।</p>}</section>
    </div><div className="split-result-column">
      <section className="split-result" aria-labelledby="split-result-heading"><div className="split-total"><p>সব মিলিয়ে খরচ</p><strong>{formatMoney(result.total)} <span>টাকা</span></strong><p>{bnNumber(ledger.people.length)} জনের মধ্যে সমান ভাগ</p></div><h3 id="split-result-heading">কে কাকে দেবেন</h3>{result.transfers.length ? <ol className="split-transfers">{result.transfers.map((transfer, index) => <li key={`${transfer.from.id}-${transfer.to.id}`}><span className="split-transfer-number">{bnNumber(index + 1)}</span><div><div><strong>{transfer.from.name}</strong><span aria-label="দেবেন"> → </span><strong>{transfer.to.name}</strong></div><p>{formatMoney(transfer.amount)} <span>টাকা</span></p></div></li>)}</ol> : <div className="split-settled"><svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="none" stroke="currentColor" strokeWidth="1.5"/><path d="m15 24 6 6 13-14" fill="none" stroke="currentColor" strokeWidth="2"/></svg><p>{ledger.expenses.length ? 'সবার হিসাব মিলে গেছে। কাউকে আর টাকা দিতে হবে না।' : 'খরচ যোগ করলে কে কাকে কত দেবেন, এখানে দেখা যাবে।'}</p></div>}<p className="split-calculation-note">এটি আপনার দেওয়া তথ্যের হিসাব। এখানে টাকা পাঠানো হয় না।</p></section>
      <section className="split-balances" aria-labelledby="split-balances-heading"><h3 id="split-balances-heading">সবার ভাগ, সবার হিসাব</h3><p className="split-balance-key"><span>← দেবেন</span><span>পাবেন →</span></p><ul>{result.balances.map(balance => <li key={balance.person.id}><div className="split-balance-line"><strong>{balance.person.name}</strong><span>{balance.net === 0 ? 'মিলে গেছে' : `${balance.net > 0 ? 'পাবেন' : 'দেবেন'} ${formatMoney(Math.abs(balance.net))} টাকা`}</span></div><div className="split-balance-track" aria-hidden="true"><span className={balance.net < 0 ? 'split-debit' : 'split-credit'} style={{ width: `${Math.abs(balance.net) / largestBalance * 50}%` }} /></div><p>দিয়েছেন {formatMoney(balance.paid)} · ভাগ {formatMoney(balance.share)} টাকা</p></li>)}</ul><details className="split-rounding"><summary>পয়সা বাকি থাকলে কীভাবে ভাগ হয়?</summary><p>মোট খরচ ভাগের পরে অবশিষ্ট পয়সা নামের তালিকার শুরু থেকে এক পয়সা করে যোগ হয়। তাই দুজনের ভাগে সর্বোচ্চ এক পয়সার পার্থক্য থাকতে পারে। খরচগুলো আলাদা করে ভাগ করা হয় না।</p><p>কে কাকে দেবেন, তার তালিকাও নামের ক্রমে তৈরি হয়। এটি হিসাব মেলানোর একটি উপায়।</p></details></section>
      <div className="split-report-actions"><button type="button" className="button" disabled={!ledger.expenses.length} onClick={copyReport}>হিসাব কপি করুন</button><button type="button" className="button-secondary" disabled={!ledger.expenses.length} onClick={downloadReport}>ফাইল রাখুন</button></div><details className="split-report-text" open={reportOpen} onToggle={event => setReportOpen(event.currentTarget.open)}><summary>হিসাবের লেখা দেখুন</summary><label className="screen-reader-only" htmlFor="split-report">কপি করার হিসাব</label><textarea id="split-report" value={report} readOnly rows={12} onFocus={event => event.currentTarget.select()} /></details>
    </div></div>
    <p className="split-notice" role="status">{notice}</p><div className="split-bottom"><p>এই পাতায় কাজ স্থায়ীভাবে সংরক্ষণ হয় না। বন্ধ করার আগে হিসাব কপি করুন বা ফাইল রাখুন।</p><button type="button" onClick={() => { commit(structuredClone(initialLedger)); setNotice('খাতা খালি করা হয়েছে। চাইলে আগের অবস্থায় ফিরতে পারবেন।'); }}>খাতা খালি করুন</button></div>
  </div>;
}
