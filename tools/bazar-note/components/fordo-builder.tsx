'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { cardSizes, loadCardFonts, type CardFormat } from '../../../shared/card-canvas';
import { shareLink } from '../../../shared/share-client';
import { FormatToggle, ShareBar, StickyNext, useInView } from '../../../shared/share-kit';
import { basketTotal, exportList, formatQuantity, lineTotal, MAX_ITEMS, MAX_QUANTITY, parseHundredths, units, type Item, type Unit } from '../lib/basket';
import { drawFordo, fordoBlob } from '../lib/draw-fordo';
import { bn, cleanText, fordoHash, fordoLine, fordoTitle, formatTaka, MAX_NAME, parseFordo, pricedCount, type Fordo } from '../lib/fordo';
import { isPreset, presetIds, presetItems, presets, type PresetId } from '../lib/presets';
import { loadBasket, loadMeta, META_KEY, saveBasket, STORAGE_KEY } from '../lib/storage';
import { ShopperList } from './shopper-list';

const TOOL = 'bazar-note';
type Draft = { name: string; quantity: string; unit: Unit; price: string };
const newDraft: Draft = { name: '', quantity: '১', unit: 'kg', price: '' };
// Stepper sizes in hundredths: half a kilo or litre, 50 grams, otherwise one.
const stepSize: Partial<Record<Unit, number>> = { kg: 50, litre: 50, gram: 5000 };
const errorText = (error: unknown) => error instanceof Error ? error.message : 'লেখাগুলো একবার দেখে নাও।';

function toItem(draft: Draft, id: string): Item {
  const name = draft.name.trim().replace(/\s+/g, ' ').slice(0, 80);
  if (!name || /[\u0000-\u001f\u007f]/.test(name)) throw new Error('জিনিসের নামটা লেখো।');
  const quantity = parseHundredths(draft.quantity);
  if (quantity === 0 || quantity > MAX_QUANTITY) throw new Error('পরিমাণ ০-এর বেশি আর ৯৯৯৯.৯৯-এর মধ্যে লেখো।');
  return { id, name, quantity, unit: draft.unit, unitPrice: draft.price.trim() ? parseHundredths(draft.price) : null };
}

function readBudget(value: string): { value: number | null; error: string } {
  if (!value.trim()) return { value: null, error: '' };
  try { return { value: parseHundredths(value), error: '' }; }
  catch { return { value: null, error: 'বাজেটটা ঠিক করে লেখো, যেমন ২০০০ বা ১৫০০.৫০।' }; }
}

export function FordoBuilder() {
  const [items, setItems] = useState<Item[]>(() => presetItems('week'));
  const [preset, setPreset] = useState<PresetId | ''>('week');
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');
  const [money, setMoney] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<Draft>(newDraft);
  const [editError, setEditError] = useState('');
  const [draft, setDraft] = useState<Draft>(newDraft);
  const [addError, setAddError] = useState('');
  const [status, setStatus] = useState('');
  const [undo, setUndo] = useState<{ items: Item[]; preset: PresetId | ''; label: string } | null>(null);
  const [storage, setStorage] = useState<'loading' | 'ok' | 'broken'>('loading');
  const [shared, setShared] = useState<Fordo | null>(null);
  const [typing, setTyping] = useState(false);
  const [touched, setTouched] = useState(false);
  const [format, setFormat] = useState<CardFormat>('feed');
  const [site, setSite] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const [copyStatus, setCopyStatus] = useState('');
  const [manualText, setManualText] = useState('');
  const preview = useRef<HTMLCanvasElement>(null);
  const addInput = useRef<HTMLInputElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);

  const parsedBudget = readBudget(budget);
  const priced = pricedCount(items);
  const total = basketTotal({ items });
  const hasMoney = parsedBudget.value !== null || priced > 0;
  const fordo: Fordo = { name: cleanText(name, MAX_NAME), preset, items, budget: parsedBudget.value, money: money && hasMoney };
  const state = fordoHash(fordo);
  const title = fordoTitle(fordo);

  useEffect(() => {
    const readShared = () => { const opened = parseFordo(window.location.hash); if (opened) setShared(opened); };
    readShared();
    window.addEventListener('hashchange', readShared);
    setSite(window.location.host);
    try {
      const saved = loadBasket(window.localStorage);
      const meta = loadMeta(window.localStorage);
      setName(cleanText(meta.name, MAX_NAME));
      if (saved) {
        setItems(saved.items);
        setBudget(saved.budget === null ? '' : formatQuantity(saved.budget));
        setPreset(isPreset(meta.preset) ? meta.preset : '');
      }
      setStorage('ok');
    } catch {
      setStorage('broken');
      setStatus('আগের রাখা ফর্দটা পড়া গেল না, ওটা যেমন ছিল তেমনই আছে। এই ফর্দটা ফোনে রাখা যাবে না, তবে পাঠাতে পারবে।');
    }
    return () => window.removeEventListener('hashchange', readShared);
  }, []);

  // Every change stays in this browser, so the list is there next week too.
  useEffect(() => {
    if (storage !== 'ok' || parsedBudget.error) return;
    try {
      saveBasket(window.localStorage, { items, budget: parsedBudget.value });
      window.localStorage.setItem(META_KEY, JSON.stringify({ name, preset }));
    } catch {
      setStorage('broken');
      setStatus('ফর্দটা এই ফোনে রাখা গেল না। হয়তো ব্রাউজারে জায়গা কম বা অনুমতি নেই। পর্দার ফর্দ ঠিক আছে, পাঠিয়ে দিতে পারো।');
    }
  }, [items, parsedBudget.value, parsedBudget.error, name, preset, storage]);

  useEffect(() => {
    let cancelled = false;
    loadCardFonts('বাজারের ফর্দ').then(() => {
      if (cancelled || !preview.current) return;
      drawFordo(preview.current, fordo, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
    // `state` holds every field the card draws; the length covers lists longer than a link carries.
  }, [state, items.length, format, site]);

  function choosePreset(id: PresetId | '') {
    setTouched(true);
    if (items.length) setUndo({ items, preset, label: 'আগের ফর্দটা ফিরিয়ে আনো' });
    const next = id ? presetItems(id) : [];
    setItems(next);
    setPreset(id);
    setEditingId(null);
    setStatus(id ? `${presets[id].label}: ${bn(next.length)}টা জিনিস বসেছে। পরিমাণ বা দাম বদলাতে, কিংবা বাদ দিতে জিনিসটায় চাপ দাও।` : 'খালি পাতা। নিচে একটা একটা করে লেখো।');
    if (!id) addInput.current?.focus();
  }

  function startEdit(item: Item) {
    setEditingId(item.id);
    setEdit({ name: item.name, quantity: formatQuantity(item.quantity), unit: item.unit, price: item.unitPrice === null ? '' : formatQuantity(item.unitPrice) });
    setEditError('');
  }

  function saveEdit(event: FormEvent) {
    event.preventDefault();
    try {
      const item = toItem(edit, editingId!);
      setItems(current => current.map(existing => existing.id === item.id ? item : existing));
      setTouched(true);
      setEditingId(null);
      setUndo(null);
      setStatus('');
    } catch (error) { setEditError(errorText(error)); }
  }

  function remove(item: Item) {
    setUndo({ items, preset, label: `${item.name} ফিরিয়ে আনো` });
    setItems(current => current.filter(existing => existing.id !== item.id));
    setEditingId(null);
    setStatus(`${item.name} বাদ গেছে।`);
  }

  function nudge(direction: 1 | -1) {
    setEdit(current => {
      const size = stepSize[current.unit] ?? 100;
      let value = 0;
      try { value = parseHundredths(current.quantity); } catch { /* start from zero */ }
      return { ...current, quantity: formatQuantity(Math.min(MAX_QUANTITY, Math.max(size, value + direction * size))) };
    });
  }

  function addItem(event: FormEvent) {
    event.preventDefault();
    try {
      if (items.length >= MAX_ITEMS) throw new Error('এক ফর্দে ১০০টার বেশি জিনিস রাখা যায় না।');
      const item = toItem(draft, crypto.randomUUID());
      setItems(current => [...current, item]);
      setTouched(true);
      setDraft({ ...newDraft, unit: draft.unit });
      setAddError('');
      setUndo(null);
      setStatus(`${item.name} ফর্দে উঠেছে।`);
      addInput.current?.focus();
    } catch (error) { setAddError(errorText(error)); }
  }

  function restore() {
    if (!undo) return;
    setItems(undo.items);
    setPreset(undo.preset);
    setUndo(null);
    setStatus('ফিরে এসেছে।');
  }

  function clearBroken() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setStorage('ok');
      setStatus('পুরোনো রাখা ফর্দটা মুছে গেছে। এখন থেকে এই ফর্দটা ফোনে থেকে যাবে।');
    } catch { setStatus('মোছা গেল না। ব্রাউজারের সেটিংসে এই সাইটের ডেটা রাখার অনুমতি আছে কি না, দেখো।'); }
  }

  async function copyText() {
    setCopyStatus('একটু দাঁড়াও…');
    const link = await shareLink(TOOL, state);
    const text = `${exportList(fordo, fordo.money ? 'money' : 'items', title).trim()}\n\nআসার সময় এগুলো এনো 🙂\nকেনা হলে টিক দিতে: ${link}`;
    try {
      await navigator.clipboard.writeText(text);
      setManualText('');
      setCopyStatus('কপি হয়েছে! হোয়াটসঅ্যাপ বা মেসেঞ্জারে পেস্ট করে দাও।');
    } catch {
      setManualText(text);
      setCopyStatus('নিজে কপি করে নাও: নিচের লেখাটা চেপে ধরে “Copy” বেছে নাও।');
    }
  }

  const caption = `${title}, ${bn(items.length)}টা জিনিস। আসার সময় এগুলো এনো 🙂 যা কেনা হবে, লিংকে টিক দিয়ে রাখা যাবে:`;
  const left = parsedBudget.value === null ? null : parsedBudget.value - total;

  return <div className="fordo-tool">
    {shared && <ShopperList fordo={shared} />}

    <div className="fordo-editor" id="fordo">
      {shared && <h2 className="fordo-own">নিজের একটা ফর্দ বানাবে?</h2>}
      <fieldset className="fordo-presets">
        <legend>কোন বাজারের ফর্দ? <small>চাপলেই চেনা লিস্ট বসবে</small></legend>
        <div className="kit-chips">
          {presetIds.map(id => <button type="button" key={id} aria-pressed={preset === id} onClick={() => choosePreset(id)}>{presets[id].chip}</button>)}
          <button type="button" aria-pressed={!preset && !items.length} onClick={() => choosePreset('')}>খালি পাতা</button>
        </div>
      </fieldset>
      <div className="fordo-status">
        <p role="status" aria-live="polite">{status}</p>
        {undo && <button type="button" className="kit-link" onClick={restore}>{undo.label}</button>}
        {storage === 'broken' && <button type="button" className="kit-link" onClick={clearBroken}>পুরোনো রাখা ফর্দটা মুছে দাও</button>}
      </div>

      <div className="fordo-desk"><div className="fordo-paper" onFocus={event => setTyping((event.target as HTMLElement).matches('input, select'))} onBlur={() => setTyping(false)}>
        <div className="fordo-paper-head"><h2>{title}</h2><span>{bn(items.length)}টা জিনিস</span></div>
        {items.length === 0 && <p className="fordo-empty">ফর্দ এখনো খালি। ওপর থেকে একটা বাজার বেছে নাও, নয়তো নিচে লেখো।</p>}
        <ol className="fordo-items">{items.map((item, index) => <li key={item.id} data-editing={editingId === item.id}>
          {editingId === item.id ? <form className="fordo-edit" onSubmit={saveEdit} noValidate>
            <label className="fordo-label">জিনিসের নাম<input value={edit.name} maxLength={80} autoComplete="off" onChange={event => setEdit({ ...edit, name: event.target.value })} /></label>
            <div className="fordo-edit-row">
              <div className="fordo-label">পরিমাণ<span className="fordo-stepper"><button type="button" onClick={() => nudge(-1)} aria-label="কমাও">−</button><input aria-label="পরিমাণ" inputMode="decimal" value={edit.quantity} maxLength={8} onChange={event => setEdit({ ...edit, quantity: event.target.value })} /><button type="button" onClick={() => nudge(1)} aria-label="বাড়াও">+</button></span></div>
              <label className="fordo-label">মাপ<select value={edit.unit} onChange={event => setEdit({ ...edit, unit: event.target.value as Unit })}>{Object.entries(units).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
            </div>
            <label className="fordo-label">প্রতি {units[edit.unit]} কত টাকা? <small>জানা থাকলে</small><input inputMode="decimal" value={edit.price} maxLength={12} placeholder="যেমন: ১২০" onChange={event => setEdit({ ...edit, price: event.target.value })} /></label>
            {editError && <p className="fordo-error" role="alert">{editError}</p>}
            <div className="fordo-edit-actions"><button type="submit" className="kit-primary">ঠিক আছে</button><button type="button" className="kit-secondary" onClick={() => remove(item)}>বাদ দাও</button><button type="button" className="kit-link" onClick={() => setEditingId(null)}>থাক</button></div>
          </form> : <button type="button" className="fordo-row" onClick={() => startEdit(item)}>
            <span className="fordo-num" aria-hidden="true">{bn(index + 1)}.</span>
            <span className="fordo-name">{item.name}</span>
            <span className="fordo-qty">{formatQuantity(item.quantity)} {units[item.unit]}{item.unitPrice !== null && <small>৳{formatTaka(lineTotal(item))}</small>}</span>
            <span className="fordo-sr">, বদলাও</span>
          </button>}
        </li>)}</ol>

        <form className="fordo-add" onSubmit={addItem} noValidate>
          <label className="fordo-sr" htmlFor="fordo-add-name">নতুন জিনিসের নাম</label>
          <input id="fordo-add-name" ref={addInput} value={draft.name} maxLength={80} autoComplete="off" placeholder="+ আরেকটা জিনিস লেখো" onChange={event => setDraft({ ...draft, name: event.target.value })} />
          <div className="fordo-add-row">
            <input aria-label="পরিমাণ" inputMode="decimal" value={draft.quantity} maxLength={8} onChange={event => setDraft({ ...draft, quantity: event.target.value })} />
            <select aria-label="মাপ" value={draft.unit} onChange={event => setDraft({ ...draft, unit: event.target.value as Unit })}>{Object.entries(units).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <button type="submit" className="kit-secondary">যোগ করো</button>
          </div>
          {addError && <p className="fordo-error" role="alert">{addError}</p>}
        </form>

        <div className="fordo-sum">
          <label className="fordo-budget">বাজেট <small>চাইলে দাও</small><span><b aria-hidden="true">৳</b><input inputMode="decimal" value={budget} maxLength={12} placeholder="যেমন: ২০০০" aria-invalid={!!parsedBudget.error} onChange={event => setBudget(event.target.value)} /></span></label>
          <p aria-live="polite">{priced ? <>হিসাব <strong>৳{formatTaka(total)}</strong>{priced < items.length && <small> ({bn(priced)}টার দাম দেওয়া)</small>}</> : <small>দাম বসালে মোট হিসাবও দেখবে।</small>}
            {left !== null && priced > 0 && <b className={left < 0 ? 'fordo-over' : 'fordo-left'}>{left < 0 ? `${formatTaka(-left)} টাকা বেশি` : `বাকি থাকবে ${formatTaka(left)} টাকা`}</b>}</p>
          {parsedBudget.error && <p className="fordo-error" role="alert">{parsedBudget.error}</p>}
        </div>
        <p className="fordo-note">দাম তোমার নিজের, বাজারের আজকের দর না। {storage === 'ok' ? 'ফর্দটা এই ফোনেই থেকে যায়।' : ''}</p>
      </div></div>
    </div>

    <StickyNext show={touched && !shared && items.length > 0 && !resultVisible && !typing && !editingId} title={<><strong>{bn(items.length)}টা</strong> জিনিস</>} sub={priced ? `হিসাব ${formatTaka(total)} টাকা` : 'ফর্দ তৈরি, এবার পাঠাও'} href="#result" label="ফর্দটা পাঠাও" />

    <section className="fordo-result" id="result" ref={result} aria-labelledby="result-title">
      <div className="fordo-result-head">
        <h2 id="result-title">{items.length ? <>ফর্দ তৈরি!<br /><span>যে বাজারে যাবে, তাকে পাঠাও</span></> : 'ফর্দটা এখনো খালি'}</h2>
        <p>{items.length ? 'লিংক খুলে সে কেনা জিনিসে টিক দিতে পারবে, আর কী বাকি, সেটাও দেখবে।' : 'ওপর থেকে একটা বাজার বেছে নাও বা জিনিস লেখো।'}</p>
      </div>
      <div className="fordo-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="fordo-card-text" />
          <figcaption id="fordo-card-text" className="fordo-sr">{title}: {items.map(item => `${item.name} ${formatQuantity(item.quantity)} ${units[item.unit]}`).join(', ')}। {fordoLine(fordo)}</figcaption>
          {previewError && <p className="kit-status" role="alert">ফর্দের ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="fordo-controls">
          <label className="fordo-label">কার ফর্দ? <small>না দিলেও চলবে</small><input value={name} maxLength={MAX_NAME} autoComplete="nickname" placeholder="যেমন: আম্মু" onChange={event => setName(event.target.value)} /></label>
          {hasMoney && <label className="fordo-check"><input type="checkbox" checked={money} onChange={event => setMoney(event.target.checked)} /><span>দাম আর বাজেটও দেখাও<small>না বাছলে শুধু জিনিস আর পরিমাণ যাবে।</small></span></label>}
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={TOOL} fileName="bazarer-fordo.png" makeImage={() => fordoBlob(fordo, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} disabled={!items.length} hint={items.length ? 'লিংকে ফর্দের জিনিসগুলো যায়, ছবি না।' : ''} />
          <div className="fordo-copy">
            <button type="button" className="kit-secondary" onClick={copyText} disabled={!items.length}>হোয়াটসঅ্যাপের জন্য লেখা কপি করো</button>
            <p className="kit-status" role="status">{copyStatus}</p>
            {manualText && <textarea readOnly value={manualText} rows={8} aria-label="ফর্দের লেখা" onFocus={event => event.currentTarget.select()} />}
          </div>
        </div>
      </div>
    </section>
  </div>;
}
