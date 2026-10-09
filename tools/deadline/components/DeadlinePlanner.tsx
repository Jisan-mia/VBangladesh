'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { calendarFile, dateInputs, deadlineState, formatDeadline, MAX_ENTRIES, MAX_TASKS, parseDeadline, textList, validateEntries, validateSource, type Deadline, type DeadlineState } from '../lib/deadlines';
import { loadEntries, saveEntries, STORAGE_KEY } from '../lib/storage';

type Draft = { title: string; source: string; date: string; time: string; tasks: string };
const emptyDraft: Draft = { title: '', source: '', date: '', time: '২৩:৫৯', tasks: 'যোগ্যতা মিলিয়ে দেখা\nকাগজপত্র গোছানো\nআবেদন জমা দেওয়া' };
const stateNames: Record<DeadlineState, string> = { upcoming: 'সময় আছে', today: 'আজ শেষ দিন', overdue: 'সময় শেষ', done: 'শেষ করেছি' };
const banglaNumber = new Intl.NumberFormat('bn-BD');

function downloadFile(file: { text: string; name: string; type: string }) {
  const url = URL.createObjectURL(new Blob([file.text], { type: file.type }));
  const link = document.createElement('a');
  link.href = url; link.download = file.name;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export function DeadlinePlanner() {
  const [entries, setEntries] = useState<Deadline[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState('[]');
  const [hasSaved, setHasSaved] = useState(false);
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [confirmation, setConfirmation] = useState<'clear' | 'stored' | 'reopen' | { editId: string } | null>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const dirty = JSON.stringify(entries) !== savedSnapshot;
  const hasDraft = editingId !== null || JSON.stringify(draft) !== JSON.stringify(emptyDraft);
  const orderedEntries = entries.slice().sort((left, right) => Number(left.complete) - Number(right.complete) || left.dueAt - right.dueAt);
  const pending = entries.filter(entry => !entry.complete).length;
  const confirmingEdit = typeof confirmation === 'object' && confirmation !== null;

  useEffect(() => {
    const refreshTime = () => setNow(Date.now());
    refreshTime();
    const interval = window.setInterval(refreshTime, 30000);
    window.addEventListener('focus', refreshTime);
    document.addEventListener('visibilitychange', refreshTime);
    try {
      const saved = loadEntries(window.localStorage);
      if (saved) { setEntries(saved); setSavedSnapshot(JSON.stringify(saved)); setHasSaved(true); setStatus('আগে রেখে দেওয়া লিস্টটা খুলেছে।'); }
    } catch { setStorageError(true); setStatus('আগে রাখা লিস্টটা পড়া গেল না। ওটা যেমন ছিল তেমনই আছে। চাইলে নতুন লিস্ট বানিয়ে ফাইল নামিয়ে রাখতে পারো।'); }
    setReady(true);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refreshTime); document.removeEventListener('visibilitychange', refreshTime); };
  }, []);

  function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      if (!draft.title.trim()) throw new Error('আবেদনের একটা নাম লেখো।');
      if (!editingId && entries.length >= MAX_ENTRIES) throw new Error('এক লিস্টে ৫০টার বেশি আবেদন রাখা যায় না।');
      const labels = draft.tasks.split(/\r?\n/).map(label => label.trim()).filter(Boolean);
      if (labels.length > MAX_TASKS) throw new Error('একটা আবেদনে ১২টার বেশি কাজ রাখা যায় না।');
      const existing = entries.find(entry => entry.id === editingId);
      const entry: Deadline = { id: editingId ?? crypto.randomUUID(), title: draft.title.trim(), source: validateSource(draft.source), dueAt: parseDeadline(draft.date, draft.time), complete: existing?.complete ?? false,
        tasks: labels.map(label => ({ label, done: existing?.tasks.find(task => task.label === label)?.done ?? false })) };
      const next = existing ? entries.map(item => item.id === entry.id ? entry : item) : [...entries, entry];
      setEntries(validateEntries(next));
      setStatus(existing ? 'বদলে গেছে। মনে রাখতে চাইলে আবার রেখে দাও।' : 'লিস্টে উঠে গেছে! সার্কুলারের সাথে তারিখটা একবার মিলিয়ে নিও।');
      setDraft(emptyDraft); setEditingId(null); titleInput.current?.focus();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'আবেদনটা যোগ করা গেল না। যা লিখেছ, একবার দেখে নাও।'); }
  }

  function requestEdit(entry: Deadline) {
    if (editingId === entry.id) { titleInput.current?.focus(); return; }
    if (hasDraft) { setConfirmation({ editId: entry.id }); return; }
    editEntry(entry);
  }

  function editEntry(entry: Deadline) {
    setEditingId(entry.id);
    setDraft({ title: entry.title, source: entry.source, ...dateInputs(entry.dueAt), tasks: entry.tasks.map(task => task.label).join('\n') });
    setError(''); titleInput.current?.focus();
  }

  function confirmAction() {
    if (typeof confirmation === 'object' && confirmation !== null) {
      const entry = entries.find(item => item.id === confirmation.editId);
      setConfirmation(null);
      if (entry) editEntry(entry);
      else setStatus('ওই আবেদনটা আর লিস্টে নেই। তুমি যা লিখছিলে, সেটা যেমন ছিল তেমনই আছে।');
      return;
    }
    if (confirmation === 'reopen') { reopen(); return; }
    clearStored();
  }

  function removeEntry(entry: Deadline) {
    setEntries(entries.filter(item => item.id !== entry.id));
    if (editingId === entry.id) { setDraft(emptyDraft); setEditingId(null); setError(''); }
    setStatus(`${entry.title} লিস্ট থেকে বাদ গেল। এভাবেই রাখতে চাইলে আবার রেখে দাও।`);
  }

  function toggleTask(entry: Deadline, label: string) {
    setEntries(entries.map(item => item.id === entry.id ? { ...item, tasks: item.tasks.map(task => task.label === label ? { ...task, done: !task.done } : task) } : item));
    setStatus('টিক বদলেছে। মনে রাখতে চাইলে আবার রেখে দাও।');
  }

  function saveCurrent() {
    try {
      saveEntries(window.localStorage, entries);
      setSavedSnapshot(JSON.stringify(entries)); setHasSaved(true); setStorageError(false);
      setStatus('রেখে দেওয়া হলো! এই ব্রাউজারে খুললেই লিস্টটা পাবে। পরে কিছু বদলালে আবার রেখে দিও।');
    } catch { setStorageError(true); setStatus('লিস্টটা রাখা গেল না। ব্রাউজারে জায়গা বা অনুমতির সমস্যা থাকতে পারে, অথবা আগে রাখা লিস্টটা পড়া যাচ্ছে না। পর্দার লিস্ট ঠিক আছে, চাইলে ফাইল নামিয়ে রাখো।'); }
  }

  function reopen() {
    setConfirmation(null);
    try {
      const saved = loadEntries(window.localStorage);
      if (!saved) { setHasSaved(false); setSavedSnapshot('[]'); setStorageError(false); setStatus('এই ব্রাউজারে আগে রাখা কোনো লিস্ট নেই। পর্দার লিস্ট যেমন ছিল, তেমনই আছে।'); return; }
      setEntries(saved); setSavedSnapshot(JSON.stringify(saved)); setHasSaved(true); setStorageError(false);
      setDraft(emptyDraft); setEditingId(null); setError('');
      setStatus('আগে রেখে দেওয়া লিস্টটা খুলেছে।');
    } catch { setStorageError(true); setStatus('রাখা লিস্টটা খোলা গেল না। পর্দার আর ব্রাউজারের, দুই লিস্টই যেমন ছিল তেমন আছে।'); }
  }

  function clearStored() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setSavedSnapshot('[]'); setHasSaved(false); setStorageError(false);
      if (confirmation === 'clear') { setEntries([]); setDraft(emptyDraft); setEditingId(null); setError(''); setStatus('সব মুছে গেছে। পর্দায় বা ব্রাউজারে, কোথাও লিস্টটা আর নেই।'); }
      else setStatus('ব্রাউজারের পুরোনো লিস্ট মুছে গেছে। পর্দার লিস্ট আছে, চাইলে এবার রেখে দাও।');
    } catch { setStatus('মোছা গেল না, কোনো লিস্ট বদলায়নি। ব্রাউজারের সেটিংসে এই সাইটের অনুমতি দেখে আরেকবার চেষ্টা করো।'); }
    setConfirmation(null);
  }

  function exportCalendar(entry: Deadline) {
    try {
      downloadFile({ text: calendarFile(entry, Date.now()), name: 'shesh-tarikh.ics', type: 'text/calendar;charset=utf-8' });
      setStatus(`${entry.title}: ক্যালেন্ডারের ফাইল তৈরি। ফাইলটা খুলে ক্যালেন্ডারে যোগ করো, তারপর রিমাইন্ডারের সময় ঠিক করে দাও।`);
    } catch { setStatus('ক্যালেন্ডারের ফাইল বানানো গেল না। তোমার লিস্ট ঠিক আছে। চাইলে তারিখটা ক্যালেন্ডারে নিজেই লিখে রাখো।'); }
  }

  function exportText() {
    try { downloadFile({ text: textList(orderedEntries), name: 'shesh-tarikh.txt', type: 'text/plain;charset=utf-8' }); setStatus('লিস্টের ফাইল তৈরি। ব্রাউজারের ডাউনলোডে খুঁজে দেখো।'); }
    catch { setStatus('ফাইলটা নামানো গেল না। তোমার লিস্ট ঠিক আছে, নিচে ‘লিস্টের লেখা দেখো’ খুলে কপি করে নাও।'); }
  }

  return <section className="deadline-tool container" id="tool" aria-labelledby="planner-heading">
    <div className="deadline-tool-heading"><div><p className="eyebrow">তোমার আবেদনের লিস্ট</p><h2 id="planner-heading">শেষ তারিখ লিখে রাখো</h2></div><p>সার্কুলার দেখে তারিখ আর সময় লেখো।<br />সময়টা ঢাকার হিসাবে ধরা হবে।</p></div>
    <div className="deadline-workspace">
      <div className="deadline-entry"><form onSubmit={addEntry} noValidate>
        <div className="deadline-form-heading"><span aria-hidden="true">＋</span><h3>{editingId ? 'আবেদনটা বদলাও' : 'নতুন আবেদন যোগ করো'}</h3></div>
        <label htmlFor="deadline-title">আবেদনের নাম</label><input ref={titleInput} id="deadline-title" value={draft.title} maxLength={100} placeholder="যেমন: বিশ্ববিদ্যালয় ভর্তি, ব্যাংকের চাকরি" onChange={event => setDraft({ ...draft, title: event.target.value })} required />
        <label htmlFor="deadline-source">সার্কুলারের লিংক</label><input id="deadline-source" inputMode="url" value={draft.source} maxLength={2048} placeholder="https://…" autoComplete="off" onChange={event => setDraft({ ...draft, source: event.target.value })} aria-describedby="source-help" required /><p className="deadline-hint" id="source-help">সার্কুলার খুলে শেষ তারিখ আর সময়টা মিলিয়ে নাও।</p>
        <div className="deadline-date-fields"><div><label htmlFor="deadline-date">শেষ তারিখ</label><input id="deadline-date" value={draft.date} maxLength={10} placeholder="৩১/১০/২০২৬" onChange={event => setDraft({ ...draft, date: event.target.value })} aria-describedby="date-help" required /></div><div><label htmlFor="deadline-time">শেষ সময়</label><input id="deadline-time" value={draft.time} maxLength={5} placeholder="২৩:৫৯" onChange={event => setDraft({ ...draft, time: event.target.value })} aria-describedby="date-help" required /></div></div>
        <p className="deadline-hint" id="date-help">দিন/মাস/বছর করে লেখো। সময় ২৪ ঘণ্টার হিসাবে, যেমন বিকেল ৫টা মানে ১৭:০০। বাংলা-ইংরেজি দুই অঙ্কই চলে। ২৩:৫৯ সার্কুলার দেখে বদলে নিও।</p>
        <label htmlFor="deadline-tasks">কী কী কাজ বাকি <span>নিজের মতো বদলাও</span></label><textarea id="deadline-tasks" rows={4} value={draft.tasks} maxLength={1500} onChange={event => setDraft({ ...draft, tasks: event.target.value })} aria-describedby="tasks-help" /><p className="deadline-hint" id="tasks-help">প্রতি লাইনে একটা কাজ, ১২টার মধ্যে। আগে থেকে লেখাগুলো বদলাতে বা মুছতে পারো।</p>
        {editingId && <p className="deadline-hint">“বদলটা রাখো” চাপলে লিস্ট বদলাবে। যে কাজের লেখা বদলাওনি, তার টিক থেকে যাবে।</p>}{error && <p className="deadline-error" role="alert">{error}</p>}
        <button className="button deadline-add" type="submit">{editingId ? 'বদলটা রাখো' : 'লিস্টে যোগ করো'}<span aria-hidden="true">＋</span></button>
        {editingId && <button type="button" className="deadline-text-button" onClick={() => { setDraft(emptyDraft); setEditingId(null); setError(''); }}>থাক, বদলাব না</button>}
      </form><p className="deadline-form-note">এখানে শুধু নিজের হিসাব রাখছ। এখান থেকে কোনো আবেদন জমা হয় না।</p></div>
      <div className="deadline-agenda">
        <div className="deadline-agenda-header"><h3>তোমার শেষ তারিখগুলো</h3><span>{banglaNumber.format(pending)}টা বাকি</span></div>
        {entries.length === 0 ? <div className="deadline-empty"><svg width="115" height="118" viewBox="0 0 115 118" fill="none" aria-hidden="true"><path d="M24 28h70v69H24z" fill="#faf4f5" stroke="currentColor" strokeWidth="1.5"/><path d="M24 46h70M41 20v17M77 20v17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M39 61h8m10 0h8m10 0h8M39 77h8m10 0h8" stroke="currentColor" strokeWidth="2"/><circle cx="91" cy="94" r="15" fill="#fff" stroke="currentColor" strokeWidth="1.5"/><path d="m86 94 4 4 7-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><h3>এখনো কোনো আবেদন নেই</h3><p>একটা আবেদন যোগ করো। শেষ সময়<br />আর বাকি কাজ এখানে দেখবে।</p></div> : <ol className="deadline-list">{orderedEntries.map(entry => {
          const state = deadlineState(entry, now ?? 0);
          const doneCount = entry.tasks.filter(task => task.done).length;
          return <li key={entry.id} className="deadline-card" data-state={state}>
            <div className="deadline-card-top"><span className="deadline-state">{stateNames[state]}</span><span className="deadline-card-count">{banglaNumber.format(doneCount)}/{banglaNumber.format(entry.tasks.length)} কাজ</span></div>
            <h3>{entry.title}</h3><p className="deadline-due"><svg width="16" height="17" viewBox="0 0 16 17" fill="none" aria-hidden="true"><path d="M2 4h12v11H2zM2 7h12M5 1v5m6-5v5" stroke="currentColor" strokeWidth="1.2"/></svg><time dateTime={new Date(entry.dueAt).toISOString()}>{formatDeadline(entry.dueAt)}</time><span>ঢাকা</span></p>
            <a className="deadline-source" href={entry.source} target="_blank" rel="noopener noreferrer">সার্কুলার খোলো <span aria-hidden="true">↗</span><span className="screen-reader-only"> — নতুন ট্যাবে খুলবে</span></a>
            {entry.tasks.length > 0 && <ul className="deadline-checklist" aria-label={`${entry.title}: বাকি কাজের লিস্ট`}>{entry.tasks.map(task => <li key={task.label}><label><input type="checkbox" checked={task.done} onChange={() => toggleTask(entry, task.label)} /><span>{task.label}</span></label></li>)}</ul>}
            <label className="deadline-complete"><input type="checkbox" checked={entry.complete} onChange={() => { setEntries(entries.map(item => item.id === entry.id ? { ...item, complete: !item.complete } : item)); setStatus('আবেদনের অবস্থা বদলেছে। মনে রাখতে চাইলে আবার রেখে দাও।'); }} /><span>এই আবেদন শেষ করেছি</span></label>
            <div className="deadline-card-actions"><button type="button" onClick={() => exportCalendar(entry)}>ক্যালেন্ডারে নাও <span aria-hidden="true">↓</span></button><button type="button" onClick={() => requestEdit(entry)} aria-label={`${entry.title} বদলাও`}>বদলাও</button><button type="button" className="deadline-delete" onClick={() => removeEntry(entry)} aria-label={`${entry.title} লিস্ট থেকে বাদ দাও`}>বাদ দাও</button></div>
          </li>;
        })}</ol>}
        <p className="deadline-agenda-note">“সময় আছে” মানে তোমার লেখা শেষ সময় এখনো আসেনি। সার্কুলারে নতুন কিছু এল কি না, মাঝে মাঝে দেখে নিও।</p>
      </div>
    </div>
    <div className="deadline-save"><div><strong><span aria-hidden="true" data-dirty={dirty}/>{!ready ? 'রাখা লিস্ট খোঁজা হচ্ছে…' : dirty ? 'নতুন বদলগুলো এখনো রাখা হয়নি' : hasSaved ? 'লিস্টটা এই ব্রাউজারে রাখা আছে' : 'লিস্টটা শুধু এই পাতায় আছে'}</strong><p>নিজে থেকে রাখা হয় না। কিছু বদলালে আবার রেখে দিও।</p></div><div className="deadline-save-actions"><button type="button" className="button" disabled={!ready} onClick={saveCurrent}>এই ব্রাউজারে রেখে দাও</button><button type="button" className="button button-secondary" disabled={!ready} onClick={() => dirty || hasDraft ? setConfirmation('reopen') : reopen()}>রাখা লিস্ট খোলো</button><button type="button" className="deadline-text-button deadline-delete" disabled={!ready} onClick={() => setConfirmation('clear')}>সব মুছে দাও</button></div></div>
    <p className="deadline-status" role="status" aria-live="polite">{status}</p>
    {storageError && <button type="button" className="deadline-text-button deadline-delete" onClick={() => setConfirmation('stored')}>ব্রাউজারের পুরোনো লিস্ট মুছে দাও</button>}
    {confirmation && <div className="deadline-confirm" role="alert">
      <strong>{confirmingEdit ? 'এখন যা লিখছ, সেটা বাদ দিয়ে ওই আবেদনটা খুলবে?' : confirmation === 'reopen' ? 'পর্দার লিস্ট আর লেখা বাদ দিয়ে আগে রাখা লিস্টটা খুলবে?' : confirmation === 'clear' ? 'পর্দার লিস্ট আর ব্রাউজারে রাখা লিস্ট, সব মুছে দেবে?' : 'শুধু ব্রাউজারের পুরোনো লিস্টটা মুছে দেবে?'}</strong>
      <p>{confirmingEdit ? 'যা লিখছিলে, সেটা চলে যাবে। লিস্টের আবেদনগুলো যেমন আছে তেমনই থাকবে।' : confirmation === 'stored' ? 'পর্দার লিস্ট থাকবে। মুছে দেওয়া লিস্ট আর ফেরত আসবে না।' : 'এরপর আর ফেরত আনা যাবে না। চাইলে আগে লিস্টের ফাইলটা নামিয়ে রাখো।'}</p>
      <div><button type="button" className="button" onClick={confirmAction}>{confirmingEdit ? 'হ্যাঁ, ওটা খোলো' : confirmation === 'reopen' ? 'হ্যাঁ, রাখা লিস্ট খোলো' : 'হ্যাঁ, মুছে দাও'}</button><button type="button" className="button button-secondary" onClick={() => setConfirmation(null)}>না, থাক</button></div>
    </div>}
    <div className="deadline-export"><div><p className="eyebrow">লিস্টের একটা কপি রাখো</p><h2>ক্যালেন্ডারেও তারিখটা তুলে রাখো</h2><p>আবেদনের পাশে “ক্যালেন্ডারে নাও” চাপো। ফাইলটা ক্যালেন্ডারে যোগ করে রিমাইন্ডারের সময় ঠিক করে দাও। শুধু নামিয়ে রাখলে কোনো রিমাইন্ডার আসবে না।</p><p>পুরো লিস্টটাও একটা টেক্সট ফাইলে রাখতে পারো। তাতে আবেদনের নাম, লিংক, তারিখ আর কোন কাজ হলো, সব থাকবে।</p><button type="button" className="button button-secondary" disabled={!entries.length} onClick={exportText}>পুরো লিস্ট ডাউনলোড করো <span aria-hidden="true">↓</span></button></div><div className="deadline-calendar-note"><span className="deadline-note-number" aria-hidden="true">মনে রেখো</span><h3>তারিখ বদলালে<br />ক্যালেন্ডারেও বদলে নিও</h3><p>এই লিস্ট আর তোমার ক্যালেন্ডার জোড়া না। এখানে তারিখ বদলালে ক্যালেন্ডারে নিজেই বদলাতে হবে। একই ফাইল বারবার যোগ করলে একই আবেদন কয়েকবার দেখাতে পারে।</p><details><summary>লিস্টের লেখা দেখো</summary><pre>{entries.length ? textList(orderedEntries) : 'আবেদন যোগ করলে লিস্টের লেখা এখানে দেখবে।'}</pre></details></div></div>
  </section>;
}
