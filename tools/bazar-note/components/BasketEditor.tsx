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
  catch { return { value: null, error: 'বাজেটের পরিমাণটি ঠিক করে লিখুন। দশমিকের পরে সর্বোচ্চ দুই ঘর দিন। সর্বোচ্চ ৯,৯৯,৯৯৯.৯৯ টাকা লেখা যাবে।' }; }
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
        setStatus('সংরক্ষিত নোট খোলা হয়েছে।');
      }
    } catch {
      setStorageError(true);
      setStatus('সংরক্ষিত নোট পড়া যায়নি। পুরোনো তথ্য বদলানো হয়নি। নতুন তালিকা তৈরি করে ফাইল ডাউনলোড করতে পারবেন।');
    }
    setReady(true);
  }, []);

  function addItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError('');
    try {
      const quantity = parseHundredths(draft.quantity);
      if (quantity === 0 || quantity > MAX_QUANTITY) throw new Error('পরিমাণ ০-এর বেশি এবং সর্বোচ্চ ৯৯৯৯.৯৯ হতে হবে।');
      if (!draft.name.trim() || /[\u0000-\u001f\u007f]/.test(draft.name)) throw new Error('পণ্যের নাম লিখুন।');
      if (!editingId && items.length >= MAX_ITEMS) throw new Error('এক তালিকায় সর্বোচ্চ ১০০টি পণ্য রাখা যাবে।');
      const item: Item = { id: editingId ?? crypto.randomUUID(), name: draft.name.trim(), quantity, unit: draft.unit, unitPrice: parseHundredths(draft.unitPrice) };
      const nextItems = editingId ? items.map(existing => existing.id === editingId ? item : existing) : [...items, item];
      setItems(validateBasket({ items: nextItems, budget: basket.budget }).items);
      setExportStatus('');
      setStatus(editingId ? `${item.name}: তথ্য বদলেছে। রাখতে চাইলে আবার সংরক্ষণ করুন।` : `${item.name} তালিকায় যোগ হয়েছে।`);
      setEditingId(null);
      setDraft(emptyDraft);
      nameInput.current?.focus();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'পণ্যটি যোগ করা যায়নি। লেখা তথ্যগুলো মিলিয়ে নিন।');
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
    setStatus(`${item.name} তালিকা থেকে সরানো হয়েছে। পরিবর্তনটি রাখতে আবার সংরক্ষণ করুন।`);
  }

  function saveCurrent() {
    if (parsedBudget.error) { setStatus('সংরক্ষণ করার আগে বাজেটের পরিমাণ ঠিক করুন।'); return; }
    try {
      saveBasket(window.localStorage, basket);
      setSavedSnapshot(JSON.stringify(basket));
      setHasSaved(true);
      setStorageError(false);
      setStatus('তালিকা এই ব্রাউজারে সংরক্ষণ হয়েছে। পরে বদলালে আবার রাখুন।');
    } catch {
      setStorageError(true);
      setStatus('নোট সংরক্ষণ হয়নি। ব্রাউজারে জায়গা বা অনুমতির সমস্যা থাকতে পারে, অথবা পুরোনো নোট পড়া যাচ্ছে না। পর্দার তালিকা আছে। চাইলে ফাইল ডাউনলোড করে রাখুন।');
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
        setStatus('এই ব্রাউজারে কোনো সংরক্ষিত নোট নেই। বর্তমান তালিকা বদলানো হয়নি।');
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
      setStatus('সংরক্ষিত নোট খোলা হয়েছে।');
    } catch {
      setStorageError(true);
      setStatus('সংরক্ষিত নোট খোলা যায়নি। পর্দার তালিকা ও আগের তথ্য বদলানো হয়নি।');
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
        setStatus('এই তালিকা ও ব্রাউজারে সংরক্ষিত নোট মুছে গেছে।');
      } else setStatus('ব্রাউজারের পুরোনো নোট মুছে গেছে। পর্দার তালিকা আছে। চাইলে এবার সেটি সংরক্ষণ করুন।');
    } catch {
      setStatus('ব্রাউজারের নোট মোছা যায়নি। কোনো তথ্য বদলানো হয়নি। ব্রাউজারের অনুমতি পরীক্ষা করুন।');
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
      setExportStatus('ফাইল প্রস্তুত। ব্রাউজারের ডাউনলোডের তালিকা দেখুন।');
    } catch {
      setExportStatus('ফাইল ডাউনলোড করা যায়নি। নিচের লেখা কপি করুন বা প্রিন্ট করুন। আপনার তালিকা আছে।');
    }
  }

  return <div className="bazar-tool" id="tool">
    <div className="bazar-tool-heading">
      <div><p className="eyebrow">আপনার বাজারের হিসাব</p><h2>বাজারের তালিকা তৈরি করুন</h2></div>
      <p>প্রথম পণ্যটি যোগ করুন।<br />দাম আপনি দেবেন; এটি যাচাই করা বাজারদর নয়।</p>
    </div>
    <div className="bazar-workspace">
      <div className="bazar-entry">
        <form onSubmit={addItem} noValidate>
          <div className="bazar-form-heading"><span aria-hidden="true">+</span><h3>{editingId ? 'পণ্যটি বদলান' : 'কী কী লাগবে?'}</h3></div>
          <label htmlFor="item-name">পণ্যের নাম</label>
          <input ref={nameInput} id="item-name" value={draft.name} maxLength={80} placeholder="যেমন: চাল" autoComplete="off" onChange={event => setDraft({ ...draft, name: event.target.value })} required />
          <div className="bazar-input-pair">
            <div><label htmlFor="item-quantity">পরিমাণ</label><input id="item-quantity" inputMode="decimal" value={draft.quantity} maxLength={12} onChange={event => setDraft({ ...draft, quantity: event.target.value })} required /></div>
            <div><label htmlFor="item-unit">একক</label><select id="item-unit" value={draft.unit} onChange={event => setDraft({ ...draft, unit: event.target.value as Unit })}>{Object.entries(units).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          </div>
          <label htmlFor="item-price">প্রতি {units[draft.unit]} কত টাকা?</label>
          <div className="bazar-price-input"><span aria-hidden="true">৳</span><input id="item-price" inputMode="decimal" value={draft.unitPrice} maxLength={14} placeholder="যেমন: ১২০.৫০" onChange={event => setDraft({ ...draft, unitPrice: event.target.value })} aria-describedby="price-help" required /></div>
          <p id="price-help" className="bazar-hint">বাংলা বা ইংরেজি অঙ্কে লিখুন। একক বদলালে পরিমাণ ও দামও মিলিয়ে নিন।</p>
          {editingId && <p className="bazar-hint">“পরিবর্তন রাখুন” চাপলে তালিকা ও মোট খরচ বদলাবে।</p>}
          {formError && <p className="bazar-error" role="alert">{formError}</p>}
          <button className="button bazar-add" type="submit">{editingId ? 'পরিবর্তন রাখুন' : 'তালিকায় যোগ করুন'}<span aria-hidden="true">＋</span></button>
          {editingId && <button className="bazar-text-button" type="button" onClick={() => { setEditingId(null); setDraft(emptyDraft); setFormError(''); }}>পরিবর্তন বাতিল</button>}
        </form>
        <div className="bazar-budget">
          <label htmlFor="basket-budget">আপনার বাজেট <span>চাইলে দিন</span></label>
          <div className="bazar-price-input"><span aria-hidden="true">৳</span><input id="basket-budget" inputMode="decimal" value={budget} maxLength={14} placeholder="যেমন: ১০০০" onChange={event => { setBudget(event.target.value); setExportStatus(''); }} aria-invalid={!!parsedBudget.error} aria-describedby={parsedBudget.error ? 'budget-error' : 'budget-help'} /></div>
          {parsedBudget.error ? <p id="budget-error" className="bazar-error" role="alert">{parsedBudget.error}</p> : <p id="budget-help" className="bazar-hint">বাজেট না দিলেও মোট খরচ দেখতে পাবেন।</p>}
        </div>
        <div className="bazar-margin-note"><span aria-hidden="true" className="bazar-note-line" /><p>পরে আবার ব্যবহার করবেন?<br /><strong>তাহলে এই ব্রাউজারে রাখুন।</strong></p></div>
      </div>
      <div className="bazar-ledger">
        <div className="bazar-ledger-top"><span>আপনার তালিকা</span><span>{new Intl.NumberFormat('bn-BD').format(items.length)}টি পণ্য</span></div>
        {items.length === 0 ? <div className="bazar-empty">
          <svg aria-hidden="true" width="100" height="108" viewBox="0 0 100 108" fill="none"><path d="M24 15h52v80H24z" stroke="currentColor" strokeWidth="1.5"/><path d="M38 10h25v12H38z" fill="#f2d379" stroke="currentColor" strokeWidth="1.5"/><path d="M36 42h29M36 54h29M36 66h19" stroke="currentColor" strokeWidth="1.5"/><circle cx="76" cy="81" r="15" fill="#fff" stroke="currentColor" strokeWidth="1.5"/><path d="M70 81h12M76 75v12" stroke="currentColor" strokeWidth="1.5"/></svg>
          <h3>তালিকায় এখনো কিছু নেই</h3><p>প্রথম পণ্যটি যোগ করুন।<br />মোট খরচ এখানেই দেখবেন।</p>
        </div> : <ol className="bazar-items">{items.map((item, index) => <li key={item.id}>
          <div className="bazar-item-main"><span className="bazar-item-number">{new Intl.NumberFormat('bn-BD').format(index + 1).padStart(2, '০')}</span><div><h3>{item.name}</h3><p>{formatQuantity(item.quantity)} {units[item.unit]} <span>×</span> {formatMoney(item.unitPrice)} টাকা / {units[item.unit]}</p></div><strong>{formatMoney(lineTotal(item))}<small>টাকা</small></strong></div>
          <div className="bazar-item-actions"><button type="button" aria-label={`${item.name}: তথ্য বদলান`} onClick={() => editItem(item)}>বদলান</button><span aria-hidden="true"/><button type="button" aria-label={`${item.name} তালিকা থেকে সরান`} onClick={() => removeItem(item)}>সরান</button></div>
        </li>)}</ol>}
        <div className="bazar-total" aria-live="polite" aria-atomic="true"><span>সব মিলিয়ে</span><strong>৳ {formatMoney(total)}</strong>{difference !== null && !parsedBudget.error && <p className={difference < 0 ? 'bazar-over' : ''}>{difference < 0 ? 'বাজেটের বেশি' : 'বাজেট থেকে বাকি'} <b>{formatMoney(Math.abs(difference))} টাকা</b></p>}</div>
        <p className="bazar-ledger-foot">প্রতি পণ্যের খরচ নিকটতম পয়সায় মেলানো হয়েছে।</p>
      </div>
    </div>
    <div className="bazar-save-row">
      <div><span className="bazar-save-dot" data-dirty={dirty} aria-hidden="true"/><strong>{!ready ? 'সংরক্ষিত নোট খোঁজা হচ্ছে…' : dirty ? 'নতুন পরিবর্তন সংরক্ষণ করা হয়নি' : hasSaved ? 'এই তালিকা ব্রাউজারে সংরক্ষিত আছে' : 'তালিকা শুধু এই পাতায় আছে'}</strong><p>নিজে থেকে সংরক্ষণ হয় না। এই ব্রাউজারে একটি নোট রাখতে পারবেন।</p></div>
      <div className="bazar-save-actions"><button type="button" className="button" onClick={saveCurrent} disabled={!ready || !!parsedBudget.error}>এই ব্রাউজারে রাখুন</button><button type="button" className="button button-secondary" onClick={() => dirty || hasDraft ? setConfirmation('reopen') : reopen()} disabled={!ready}>রাখা নোট খুলুন</button><button type="button" className="bazar-text-button bazar-delete" onClick={() => setConfirmation('clear')} disabled={!ready}>সব মুছুন</button></div>
    </div>
    <div className="bazar-status" role="status" aria-live="polite">{status}</div>
    {storageError && <button className="bazar-text-button bazar-delete" type="button" onClick={() => setConfirmation('stored')}>ব্রাউজারের পুরোনো নোট মুছুন</button>}
    {confirmation && <div className="bazar-confirm" role="alert">
      <strong>{confirmation === 'reopen' ? 'বর্তমান তালিকা ও লেখা তথ্য বাদ দিয়ে আগের নোট খুলবেন?' : confirmation === 'clear' ? 'এই তালিকা ও ব্রাউজারে সংরক্ষিত নোট মুছবেন?' : 'শুধু ব্রাউজারের পুরোনো নোট মুছবেন?'}</strong>
      <p>{confirmation === 'stored' ? 'পর্দার তালিকা থাকবে। মুছে দেওয়া নোট আর ফেরত পাবেন না।' : 'পরে আর আগের তথ্য ফেরত পাবেন না। চাইলে আগে ফাইল ডাউনলোড করুন।'}</p>
      <div><button type="button" className="button" onClick={confirmation === 'reopen' ? reopen : clearStored}>{confirmation === 'reopen' ? 'হ্যাঁ, রাখা নোট খুলুন' : 'হ্যাঁ, মুছে দিন'}</button><button type="button" className="button button-secondary" onClick={() => setConfirmation(null)}>বাতিল</button></div>
    </div>}
    <section className="bazar-export" aria-labelledby="export-heading">
      <div className="bazar-export-intro"><p className="eyebrow">তালিকার একটি কপি রাখুন</p><h2 id="export-heading">পাঠানোর আগে<br />তালিকা দেখে নিন</h2><p>নিজের জন্য রাখুন বা পরিবারের কাউকে পাঠান। প্রিভিউতে যে লেখা দেখছেন, ফাইল ও প্রিন্টে সেটিই থাকবে।</p>
        <label className="bazar-money-choice"><input type="checkbox" checked={includeMoney} onChange={event => { setIncludeMoney(event.target.checked); setExportStatus(''); }} /><span>দাম ও বাজেটও রাখুন<small>শুরুতে শুধু পণ্যের নাম, পরিমাণ ও একক থাকবে।</small></span></label>
        <div className="bazar-export-actions"><button type="button" className="button" disabled={!items.length || !!parsedBudget.error} onClick={downloadList}>ফাইল ডাউনলোড করুন <span aria-hidden="true">↓</span></button><button type="button" className="button button-secondary" disabled={!items.length || !!parsedBudget.error} onClick={() => { try { window.print(); } catch { setExportStatus('প্রিন্ট করা যাচ্ছে না। চাইলে তালিকার ফাইল ডাউনলোড করুন।'); } }}>প্রিন্ট করুন</button></div>
        {!items.length && <p className="bazar-hint">আগে অন্তত একটি পণ্য যোগ করুন।</p>}{parsedBudget.error && <p className="bazar-error">ডাউনলোড বা প্রিন্টের আগে বাজেট ঠিক করুন অথবা ঘরটি খালি রাখুন।</p>}<p role="status" className="bazar-hint">{exportStatus}</p>
      </div>
      <div className="bazar-export-paper"><div className="bazar-preview-label"><span>পাঠানোর আগে দেখুন</span><span>{includeMoney ? 'দামসহ' : 'দাম ছাড়া'}</span></div><pre className="bazar-print-content">{items.length ? exportedText : 'বাজার নোট\n\nপণ্য যোগ করলে পাঠানোর তালিকা এখানে দেখবেন।'}</pre></div>
    </section>
  </div>;
}
