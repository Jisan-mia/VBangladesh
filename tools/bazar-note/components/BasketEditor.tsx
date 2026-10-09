'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { basketTotal, exportList, formatMoney, formatQuantity, lineTotal, MAX_ITEMS, MAX_QUANTITY, parseHundredths, units, validateBasket, type Basket, type Item, type Unit } from '../lib/basket';
import { loadBasket, saveBasket, STORAGE_KEY } from '../lib/storage';

type Draft = { name: string; quantity: string; unit: Unit; unitPrice: string };
const emptyDraft: Draft = { name: '', quantity: '১', unit: 'kg', unitPrice: '' };
const emptyBasket: Basket = { items: [], budget: null };

function budgetValue(value: string): { value: number | null; error: string } {
  if (!value.trim()) return { value: null, error: '' };
  try { return { value: parseHundredths(value), error: '' }; }
  catch { return { value: null, error: 'বাজেটটা ঠিক করে লেখো, যেমন ১০০০ বা ১৫০০.৫০। দশমিকের পরে দুই ঘরের বেশি না, আর ৯,৯৯,৯৯৯.৯৯ টাকার মধ্যে।' }; }
}

export function BasketEditor() {
  const [items, setItems] = useState<Item[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [budget, setBudget] = useState('');
  const [formError, setFormError] = useState('');
  const [status, setStatus] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(emptyBasket));
  const [hasSaved, setHasSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [confirmation, setConfirmation] = useState<'clear' | 'stored' | 'reopen' | null>(null);
  const [includeMoney, setIncludeMoney] = useState(false);
  const [exportStatus, setExportStatus] = useState('');
  const nameInput = useRef<HTMLInputElement>(null);
  const parsedBudget = budgetValue(budget);
  const basket: Basket = { items, budget: parsedBudget.value };
  const total = basketTotal(basket);
  const difference = basket.budget === null ? null : basket.budget - total;
  const dirty = !!parsedBudget.error || savedSnapshot !== JSON.stringify(basket);
  const hasDraft = editingId !== null || draft.name.trim() !== '' || draft.unitPrice.trim() !== '' || draft.unit !== emptyDraft.unit || !['১', '1'].includes(draft.quantity.trim());
  const exportedText = exportList(basket, includeMoney ? 'money' : 'items');

  useEffect(() => {
    try {
      const saved = loadBasket(window.localStorage);
      if (saved) {
        setItems(saved.items);
        setBudget(saved.budget === null ? '' : formatQuantity(saved.budget));
        setSavedSnapshot(JSON.stringify(saved));
        setHasSaved(true);
        setStatus('আগের রাখা লিস্টটা খুলেছে।');
      }
    } catch {
      setStorageError(true);
      setStatus('আগের রাখা লিস্টটা পড়া গেল না। ওটা যেমন ছিল তেমনই আছে। নতুন লিস্ট বানিয়ে ফাইল নামিয়ে রাখতে পারো।');
    }
    setReady(true);
  }, []);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    try {
      const quantity = parseHundredths(draft.quantity);
      if (quantity === 0 || quantity > MAX_QUANTITY) throw new Error('পরিমাণ ০-এর বেশি আর ৯৯৯৯.৯৯-এর মধ্যে লেখো।');
      if (!draft.name.trim() || /[\u0000-\u001f\u007f]/.test(draft.name)) throw new Error('জিনিসের নামটা লেখো।');
      if (!editingId && items.length >= MAX_ITEMS) throw new Error('এক লিস্টে ১০০টার বেশি জিনিস রাখা যায় না।');
      const item: Item = { id: editingId ?? crypto.randomUUID(), name: draft.name.trim(), quantity, unit: draft.unit, unitPrice: parseHundredths(draft.unitPrice) };
      const nextItems = editingId ? items.map(existing => existing.id === editingId ? item : existing) : [...items, item];
      setItems(validateBasket({ items: nextItems, budget: basket.budget }).items);
      setExportStatus('');
      setStatus(editingId ? `${item.name} বদলে গেছে। রাখতে চাইলে আবার “লিস্টটা রেখে দাও” চাপো।` : `${item.name} লিস্টে উঠেছে।`);
      setEditingId(null);
      setDraft(emptyDraft);
      nameInput.current?.focus();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'জিনিসটা যোগ করা গেল না। লেখাগুলো একবার দেখে নাও।');
    }
  }

  function editItem(item: Item) {
    setDraft({ name: item.name, quantity: formatQuantity(item.quantity), unit: item.unit, unitPrice: formatQuantity(item.unitPrice) });
    setEditingId(item.id);
    setFormError('');
    nameInput.current?.focus();
  }

  function removeItem(item: Item) {
    setItems(items.filter(existing => existing.id !== item.id));
    setExportStatus('');
    if (editingId === item.id) { setEditingId(null); setDraft(emptyDraft); setFormError(''); }
    setStatus(`${item.name} লিস্ট থেকে বাদ গেছে। রাখতে চাইলে আবার “লিস্টটা রেখে দাও” চাপো।`);
  }

  function saveCurrent() {
    if (parsedBudget.error) { setStatus('রাখার আগে বাজেটটা ঠিক করে নাও।'); return; }
    try {
      saveBasket(window.localStorage, basket);
      setSavedSnapshot(JSON.stringify(basket));
      setHasSaved(true);
      setStorageError(false);
      setStatus('রাখা হয়ে গেছে! পরে কিছু বদলালে আবার চেপে দিও।');
    } catch {
      setStorageError(true);
      setStatus('লিস্টটা রাখা গেল না। হয়তো ব্রাউজারে জায়গা কম বা অনুমতি নেই, নয়তো আগের রাখা লিস্টটা পড়া যাচ্ছে না। পর্দার লিস্ট ঠিক আছে, চাইলে ফাইলটা নামিয়ে রাখো।');
    }
  }

  function reopen() {
    setConfirmation(null);
    try {
      const saved = loadBasket(window.localStorage);
      if (!saved) {
        setHasSaved(false);
        setSavedSnapshot(JSON.stringify(emptyBasket));
        setStorageError(false);
        setStatus('এই ব্রাউজারে কোনো লিস্ট রাখা নেই। এখনকার লিস্ট যেমন ছিল তেমনই আছে।');
        return;
      }
      setItems(saved.items);
      setBudget(saved.budget === null ? '' : formatQuantity(saved.budget));
      setSavedSnapshot(JSON.stringify(saved));
      setHasSaved(true);
      setDraft(emptyDraft);
      setEditingId(null);
      setFormError('');
      setIncludeMoney(false);
      setExportStatus('');
      setStorageError(false);
      setStatus('রাখা লিস্টটা খুলেছে।');
    } catch {
      setStorageError(true);
      setStatus('রাখা লিস্টটা খোলা গেল না। পর্দার লিস্ট আর রাখা লিস্ট, দুটোই যেমন ছিল তেমনই আছে।');
    }
  }

  function clearStored() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setHasSaved(false);
      setStorageError(false);
      setSavedSnapshot(JSON.stringify(emptyBasket));
      if (confirmation === 'clear') {
        setItems([]); setBudget(''); setDraft(emptyDraft); setEditingId(null); setFormError(''); setIncludeMoney(false); setExportStatus('');
        setStatus('সব মুছে গেছে। এবার নতুন করে শুরু করো।');
      } else setStatus('আগের রাখা লিস্টটা মুছে গেছে। পর্দার লিস্ট ঠিক আছে, চাইলে এবার এটা রেখে দাও।');
    } catch {
      setStatus('রাখা লিস্টটা মোছা গেল না, কিছুই বদলায়নি। ব্রাউজারের সেটিংসে এই সাইটের ডেটা রাখার অনুমতি আছে কি না, একবার দেখো।');
    }
    setConfirmation(null);
  }

  function downloadList() {
    try {
      const url = URL.createObjectURL(new Blob([exportedText], { type: 'text/plain;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'bazar-note.txt';
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setExportStatus('হয়ে গেছে! ফাইলটা ব্রাউজারের ডাউনলোডে দেখো।');
    } catch {
      setExportStatus('ফাইলটা নামানো গেল না। প্রিভিউর লেখাটা কপি করো বা প্রিন্ট করো। তোমার লিস্ট ঠিকই আছে।');
    }
  }

  return <div className="bazar-tool" id="tool">
    <div className="bazar-tool-heading">
      <div><p className="eyebrow">তোমার বাজারের হিসাব</p><h2>বাজারের লিস্টটা বানিয়ে ফেলো</h2></div>
      <p>প্রথম জিনিসটা দিয়ে শুরু করো।<br />দাম তুমিই বসাবে, এটা বাজারের আজকের দর না।</p>
    </div>
    <div className="bazar-workspace">
      <div className="bazar-entry">
        <form onSubmit={addItem} noValidate>
          <div className="bazar-form-heading"><span aria-hidden="true">+</span><h3>{editingId ? 'জিনিসটা ঠিক করো' : 'কী কী লাগবে?'}</h3></div>
          <label htmlFor="item-name">জিনিসের নাম</label>
          <input ref={nameInput} id="item-name" value={draft.name} maxLength={80} placeholder="যেমন: চাল" autoComplete="off" onChange={event => setDraft({ ...draft, name: event.target.value })} required />
          <div className="bazar-input-pair">
            <div><label htmlFor="item-quantity">পরিমাণ</label><input id="item-quantity" inputMode="decimal" value={draft.quantity} maxLength={12} onChange={event => setDraft({ ...draft, quantity: event.target.value })} required /></div>
            <div><label htmlFor="item-unit">মাপ</label><select id="item-unit" value={draft.unit} onChange={event => setDraft({ ...draft, unit: event.target.value as Unit })}>{Object.entries(units).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          </div>
          <label htmlFor="item-price">প্রতি {units[draft.unit]} কত টাকা?</label>
          <div className="bazar-price-input"><span aria-hidden="true">৳</span><input id="item-price" inputMode="decimal" value={draft.unitPrice} maxLength={14} placeholder="যেমন: ১২০.৫০" onChange={event => setDraft({ ...draft, unitPrice: event.target.value })} aria-describedby="price-help" required /></div>
          <p id="price-help" className="bazar-hint">বাংলা বা ইংরেজি, যেকোনো অঙ্কে লেখো। মাপ বদলালে পরিমাণ আর দামও নিজে ঠিক করে নিও।</p>
          {editingId && <p className="bazar-hint">“বদলটা রাখো” চাপলে লিস্ট আর মোট খরচ নতুন করে হিসাব হবে।</p>}
          {formError && <p className="bazar-error" role="alert">{formError}</p>}
          <button className="button bazar-add" type="submit">{editingId ? 'বদলটা রাখো' : 'লিস্টে যোগ করো'}<span aria-hidden="true">＋</span></button>
          {editingId && <button className="bazar-text-button" type="button" onClick={() => { setEditingId(null); setDraft(emptyDraft); setFormError(''); }}>থাক, বদলাব না</button>}
        </form>
        <div className="bazar-budget">
          <label htmlFor="basket-budget">তোমার বাজেট <span>চাইলে দাও</span></label>
          <div className="bazar-price-input"><span aria-hidden="true">৳</span><input id="basket-budget" inputMode="decimal" value={budget} maxLength={14} placeholder="যেমন: ১০০০" onChange={event => { setBudget(event.target.value); setExportStatus(''); }} aria-invalid={!!parsedBudget.error} aria-describedby={parsedBudget.error ? 'budget-error' : 'budget-help'} /></div>
          {parsedBudget.error ? <p id="budget-error" className="bazar-error" role="alert">{parsedBudget.error}</p> : <p id="budget-help" className="bazar-hint">বাজেট না দিলেও মোট খরচ দেখবে।</p>}
        </div>
        <div className="bazar-margin-note"><span aria-hidden="true" className="bazar-note-line" /><p>পরে আবার লাগবে?<br /><strong>নিচে “লিস্টটা রেখে দাও” চাপো।</strong></p></div>
      </div>
      <div className="bazar-ledger">
        <div className="bazar-ledger-top"><span>তোমার লিস্ট</span><span>{new Intl.NumberFormat('bn-BD').format(items.length)}টা জিনিস</span></div>
        {items.length === 0 ? <div className="bazar-empty">
          <svg aria-hidden="true" width="100" height="108" viewBox="0 0 100 108" fill="none"><path d="M24 15h52v80H24z" stroke="currentColor" strokeWidth="1.5"/><path d="M38 10h25v12H38z" fill="#f2d379" stroke="currentColor" strokeWidth="1.5"/><path d="M36 42h29M36 54h29M36 66h19" stroke="currentColor" strokeWidth="1.5"/><circle cx="76" cy="81" r="15" fill="#fff" stroke="currentColor" strokeWidth="1.5"/><path d="M70 81h12M76 75v12" stroke="currentColor" strokeWidth="1.5"/></svg>
          <h3>লিস্টে এখনো কিছু নেই</h3><p>প্রথম জিনিসটা যোগ করো।<br />মোট কত হলো, এখানেই দেখবে।</p>
        </div> : <ol className="bazar-items">{items.map((item, index) => <li key={item.id}>
          <div className="bazar-item-main"><span className="bazar-item-number">{new Intl.NumberFormat('bn-BD').format(index + 1).padStart(2, '০')}</span><div><h3>{item.name}</h3><p>{formatQuantity(item.quantity)} {units[item.unit]} <span>×</span> {formatMoney(item.unitPrice)} টাকা / {units[item.unit]}</p></div><strong>{formatMoney(lineTotal(item))}<small>টাকা</small></strong></div>
          <div className="bazar-item-actions"><button type="button" aria-label={`${item.name} বদলাও`} onClick={() => editItem(item)}>বদলাও</button><span aria-hidden="true"/><button type="button" aria-label={`${item.name} লিস্ট থেকে বাদ দাও`} onClick={() => removeItem(item)}>বাদ দাও</button></div>
        </li>)}</ol>}
        <div className="bazar-total" aria-live="polite" aria-atomic="true"><span>সব মিলিয়ে</span><strong>৳ {formatMoney(total)}</strong>{difference !== null && !parsedBudget.error && <p className={difference < 0 ? 'bazar-over' : ''}>{difference < 0 ? 'বাজেটের বেশি' : 'বাজেট থেকে বাকি'} <b>{formatMoney(Math.abs(difference))} টাকা</b></p>}</div>
        <p className="bazar-ledger-foot">প্রতিটা জিনিসের খরচ কাছের পয়সায় মিলিয়ে ধরা হয়েছে।</p>
      </div>
    </div>
    <div className="bazar-save-row">
      <div><span className="bazar-save-dot" data-dirty={dirty} aria-hidden="true"/><strong>{!ready ? 'রাখা লিস্ট খুঁজছি…' : dirty ? 'নতুন বদলগুলো এখনো রাখা হয়নি' : hasSaved ? 'এই লিস্টটা এই ব্রাউজারে রাখা আছে' : 'লিস্টটা শুধু এই পাতায় আছে'}</strong><p>নিজে থেকে জমা হয় না। চাপলে এই ব্রাউজারে একটা লিস্ট রাখা থাকবে।</p></div>
      <div className="bazar-save-actions"><button type="button" className="button" onClick={saveCurrent} disabled={!ready || !!parsedBudget.error}>লিস্টটা রেখে দাও</button><button type="button" className="button button-secondary" onClick={() => dirty || hasDraft ? setConfirmation('reopen') : reopen()} disabled={!ready}>রাখা লিস্ট খোলো</button><button type="button" className="bazar-text-button bazar-delete" onClick={() => setConfirmation('clear')} disabled={!ready}>সব মুছে দাও</button></div>
    </div>
    <div className="bazar-status" role="status" aria-live="polite">{status}</div>
    {storageError && <button className="bazar-text-button bazar-delete" type="button" onClick={() => setConfirmation('stored')}>আগের রাখা লিস্টটা মুছে দাও</button>}
    {confirmation && <div className="bazar-confirm" role="alert">
      <strong>{confirmation === 'reopen' ? 'এখনকার লিস্ট আর লেখাগুলো বাদ দিয়ে রাখা লিস্টটা খুলবে?' : confirmation === 'clear' ? 'এই লিস্ট আর ব্রাউজারে রাখা লিস্ট, দুটোই মুছে দেবে?' : 'শুধু ব্রাউজারে রাখা পুরোনো লিস্টটা মুছবে?'}</strong>
      <p>{confirmation === 'stored' ? 'পর্দার লিস্টটা থাকবে, তবে মুছে দেওয়া লিস্ট আর ফেরত পাবে না।' : 'একবার গেলে আর ফেরত আনা যাবে না। চাইলে আগে ফাইলটা নামিয়ে রাখো।'}</p>
      <div><button type="button" className="button" onClick={confirmation === 'reopen' ? reopen : clearStored}>{confirmation === 'reopen' ? 'হ্যাঁ, রাখা লিস্ট খোলো' : 'হ্যাঁ, মুছে দাও'}</button><button type="button" className="button button-secondary" onClick={() => setConfirmation(null)}>না, থাক</button></div>
    </div>}
    <section className="bazar-export" aria-labelledby="export-heading">
      <div className="bazar-export-intro"><p className="eyebrow">লিস্টের একটা কপি রাখো</p><h2 id="export-heading">পাঠানোর আগে<br />একবার দেখে নাও</h2><p>নিজের কাছে রাখো, বা বাজারে যে যাবে তাকে পাঠাও। প্রিভিউতে যা দেখছ, ফাইলে আর প্রিন্টে ঠিক সেটাই থাকবে।</p>
        <label className="bazar-money-choice"><input type="checkbox" checked={includeMoney} onChange={event => { setIncludeMoney(event.target.checked); setExportStatus(''); }} /><span>দাম আর বাজেটও রাখো<small>না বাছলে শুধু জিনিসের নাম, পরিমাণ আর মাপ থাকবে।</small></span></label>
        <div className="bazar-export-actions"><button type="button" className="button" disabled={!items.length || !!parsedBudget.error} onClick={downloadList}>ফাইল ডাউনলোড করো <span aria-hidden="true">↓</span></button><button type="button" className="button button-secondary" disabled={!items.length || !!parsedBudget.error} onClick={() => { try { window.print(); } catch { setExportStatus('প্রিন্ট করা যাচ্ছে না। চাইলে লিস্টের ফাইলটা নামিয়ে নাও।'); } }}>প্রিন্ট করো</button></div>
        {!items.length && <p className="bazar-hint">আগে অন্তত একটা জিনিস যোগ করো।</p>}{parsedBudget.error && <p className="bazar-error">নামানো বা প্রিন্টের আগে বাজেটটা ঠিক করো, নইলে ঘরটা খালি রাখো।</p>}<p role="status" className="bazar-hint">{exportStatus}</p>
      </div>
      <div className="bazar-export-paper"><div className="bazar-preview-label"><span>যেমন দেখাবে</span><span>{includeMoney ? 'দামসহ' : 'দাম ছাড়া'}</span></div><pre className="bazar-print-content">{items.length ? exportedText : 'বাজার নোট\n\nজিনিস যোগ করলে লিস্টটা এখানে দেখবে।'}</pre></div>
    </section>
  </div>;
}
