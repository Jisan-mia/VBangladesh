'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { calendarFile, dateInputs, deadlineState, formatDeadline, MAX_ENTRIES, MAX_TASKS, parseDeadline, textList, validateEntries, validateSource, type Deadline, type DeadlineState } from '../lib/deadlines';
import { loadEntries, saveEntries, STORAGE_KEY } from '../lib/storage';

type Draft = { title: string; source: string; date: string; time: string; tasks: string };
const emptyDraft: Draft = { title: '', source: '', date: '', time: '২৩:৫৯', tasks: 'আবেদনের শর্ত মিলিয়ে দেখা\nকাগজপত্র প্রস্তুত করা\nআবেদন জমা দেওয়া' };
const stateNames: Record<DeadlineState, string> = { upcoming: 'সময় আছে', today: 'আজ শেষ দিন', overdue: 'সময় পেরিয়েছে', done: 'শেষ করেছি' };
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
      if (saved) { setEntries(saved); setSavedSnapshot(JSON.stringify(saved)); setHasSaved(true); setStatus('সংরক্ষিত তালিকা খোলা হয়েছে।'); }
    } catch { setStorageError(true); setStatus('সংরক্ষিত তালিকা পড়া যায়নি। পুরোনো তথ্য বদলানো হয়নি। নতুন তালিকা তৈরি করে ফাইল ডাউনলোড করতে পারবেন।'); }
    setReady(true);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', refreshTime); document.removeEventListener('visibilitychange', refreshTime); };
  }, []);

  function addEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    try {
      if (!draft.title.trim()) throw new Error('আবেদন বা কাজটির নাম লিখুন।');
      if (!editingId && entries.length >= MAX_ENTRIES) throw new Error('এক তালিকায় সর্বোচ্চ ৫০টি আবেদন রাখা যাবে।');
      const labels = draft.tasks.split(/\r?\n/).map(label => label.trim()).filter(Boolean);
      if (labels.length > MAX_TASKS) throw new Error('এক আবেদনের জন্য সর্বোচ্চ ১২টি কাজ লিখুন।');
      const existing = entries.find(entry => entry.id === editingId);
      const entry: Deadline = { id: editingId ?? crypto.randomUUID(), title: draft.title.trim(), source: validateSource(draft.source), dueAt: parseDeadline(draft.date, draft.time), complete: existing?.complete ?? false,
        tasks: labels.map(label => ({ label, done: existing?.tasks.find(task => task.label === label)?.done ?? false })) };
      const next = existing ? entries.map(item => item.id === entry.id ? entry : item) : [...entries, entry];
      setEntries(validateEntries(next));
      setStatus(existing ? 'আবেদনের তথ্য বদলেছে। পরিবর্তন রাখতে আবার সংরক্ষণ করুন।' : 'আবেদনটি তালিকায় যোগ হয়েছে। বিজ্ঞপ্তির সঙ্গে তারিখ মিলিয়ে নিন।');
      setDraft(emptyDraft); setEditingId(null); titleInput.current?.focus();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'আবেদনটি যোগ করা যায়নি। লেখা তথ্যগুলো মিলিয়ে নিন।'); }
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
      else setStatus('আবেদনটি আর তালিকায় নেই। আপনি যা লিখছিলেন, তা বদলানো হয়নি।');
      return;
    }
    if (confirmation === 'reopen') { reopen(); return; }
    clearStored();
  }

  function removeEntry(entry: Deadline) {
    setEntries(entries.filter(item => item.id !== entry.id));
    if (editingId === entry.id) { setDraft(emptyDraft); setEditingId(null); setError(''); }
    setStatus(`${entry.title} তালিকা থেকে সরানো হয়েছে। পরিবর্তনটি রাখতে আবার সংরক্ষণ করুন।`);
  }

  function toggleTask(entry: Deadline, label: string) {
    setEntries(entries.map(item => item.id === entry.id ? { ...item, tasks: item.tasks.map(task => task.label === label ? { ...task, done: !task.done } : task) } : item));
    setStatus('কাজের অগ্রগতি বদলেছে। রাখতে চাইলে আবার সংরক্ষণ করুন।');
  }

  function saveCurrent() {
    try {
      saveEntries(window.localStorage, entries);
      setSavedSnapshot(JSON.stringify(entries)); setHasSaved(true); setStorageError(false);
      setStatus('তালিকা এই ব্রাউজারে সংরক্ষণ হয়েছে। পরে বদলালে আবার রাখুন।');
    } catch { setStorageError(true); setStatus('তালিকা সংরক্ষণ হয়নি। ব্রাউজারের অনুমতি, জায়গা বা পুরোনো তথ্যের সমস্যা হতে পারে। পর্দার তালিকা আছে। চাইলে ফাইল ডাউনলোড করে রাখুন।'); }
  }

  function reopen() {
    setConfirmation(null);
    try {
      const saved = loadEntries(window.localStorage);
      if (!saved) { setHasSaved(false); setSavedSnapshot('[]'); setStorageError(false); setStatus('এই ব্রাউজারে কোনো সংরক্ষিত তালিকা নেই। বর্তমান তথ্য বদলানো হয়নি।'); return; }
      setEntries(saved); setSavedSnapshot(JSON.stringify(saved)); setHasSaved(true); setStorageError(false);
      setDraft(emptyDraft); setEditingId(null); setError('');
      setStatus('সংরক্ষিত তালিকা খোলা হয়েছে।');
    } catch { setStorageError(true); setStatus('সংরক্ষিত তালিকা খোলা যায়নি। পর্দার ও ব্রাউজারের তথ্য বদলানো হয়নি।'); }
  }

  function clearStored() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      setSavedSnapshot('[]'); setHasSaved(false); setStorageError(false);
      if (confirmation === 'clear') { setEntries([]); setDraft(emptyDraft); setEditingId(null); setError(''); setStatus('এই তালিকা ও ব্রাউজারে সংরক্ষিত তথ্য মুছে গেছে।'); }
      else setStatus('ব্রাউজারের পুরোনো তালিকা মুছে গেছে। পর্দার তথ্য আছে। চাইলে এবার সংরক্ষণ করুন।');
    } catch { setStatus('ব্রাউজারের তথ্য মোছা যায়নি। কোনো তালিকা বদলানো হয়নি। ব্রাউজারের অনুমতি পরীক্ষা করুন।'); }
    setConfirmation(null);
  }

  function exportCalendar(entry: Deadline) {
    try {
      downloadFile({ text: calendarFile(entry, Date.now()), name: 'shesh-tarikh.ics', type: 'text/calendar;charset=utf-8' });
      setStatus(`${entry.title}: ক্যালেন্ডারের ফাইল প্রস্তুত। ফাইল খুলে ক্যালেন্ডারে যোগ করুন, তারপর মনে করিয়ে দেওয়ার সময় ঠিক করুন।`);
    } catch { setStatus('ক্যালেন্ডারের ফাইল তৈরি হয়নি। আপনার তালিকা আছে। চাইলে তারিখটি ক্যালেন্ডারে নিজে লিখে রাখুন।'); }
  }

  function exportText() {
    try { downloadFile({ text: textList(orderedEntries), name: 'shesh-tarikh.txt', type: 'text/plain;charset=utf-8' }); setStatus('তালিকার ফাইল প্রস্তুত। ব্রাউজারের ডাউনলোডের তালিকা দেখুন।'); }
    catch { setStatus('ফাইল ডাউনলোড করা যায়নি। নিচে তালিকার লেখা খুলে কপি করুন। আপনার তথ্য আছে।'); }
  }

  return <section className="deadline-tool container" id="tool" aria-labelledby="planner-heading">
    <div className="deadline-tool-heading"><div><p className="eyebrow">আপনার আবেদনের তালিকা</p><h2 id="planner-heading">শেষ তারিখ লিখে রাখুন</h2></div><p>বিজ্ঞপ্তি দেখে তারিখ ও সময় লিখুন।<br />সব সময় ঢাকার হিসাবে দেখানো হবে।</p></div>
    <div className="deadline-workspace">
      <div className="deadline-entry"><form onSubmit={addEntry} noValidate>
        <div className="deadline-form-heading"><span aria-hidden="true">＋</span><h3>{editingId ? 'তথ্য বদলান' : 'আবেদন যোগ করুন'}</h3></div>
        <label htmlFor="deadline-title">আবেদন বা কাজের নাম</label><input ref={titleInput} id="deadline-title" value={draft.title} maxLength={100} placeholder="যেমন: বিশ্ববিদ্যালয়ে ভর্তি আবেদন" onChange={event => setDraft({ ...draft, title: event.target.value })} required />
        <label htmlFor="deadline-source">মূল বিজ্ঞপ্তির লিংক</label><input id="deadline-source" inputMode="url" value={draft.source} maxLength={2048} placeholder="https://…" autoComplete="off" onChange={event => setDraft({ ...draft, source: event.target.value })} aria-describedby="source-help" required /><p className="deadline-hint" id="source-help">বিজ্ঞপ্তি খুলে শেষ তারিখ ও সময় মিলিয়ে নিন।</p>
        <div className="deadline-date-fields"><div><label htmlFor="deadline-date">শেষ তারিখ</label><input id="deadline-date" value={draft.date} maxLength={10} placeholder="৩১/১০/২০২৬" onChange={event => setDraft({ ...draft, date: event.target.value })} aria-describedby="date-help" required /></div><div><label htmlFor="deadline-time">শেষ সময়</label><input id="deadline-time" value={draft.time} maxLength={5} placeholder="২৩:৫৯" onChange={event => setDraft({ ...draft, time: event.target.value })} aria-describedby="date-help" required /></div></div>
        <p className="deadline-hint" id="date-help">দিন/মাস/বছর লিখুন, সময় দিন ২৪ ঘণ্টার হিসাবে। বাংলা বা ইংরেজি অঙ্ক দুটোই চলে। ২৩:৫৯ সময়টি বিজ্ঞপ্তি অনুযায়ী বদলান।</p>
        <label htmlFor="deadline-tasks">বাকি কাজগুলো <span>চাইলে বদলান</span></label><textarea id="deadline-tasks" rows={4} value={draft.tasks} maxLength={1500} onChange={event => setDraft({ ...draft, tasks: event.target.value })} aria-describedby="tasks-help" /><p className="deadline-hint" id="tasks-help">প্রতি লাইনে একটি কাজ লিখুন, সর্বোচ্চ ১২টি। শুরুতে দেওয়া কাজগুলো চাইলে বদলান।</p>
        {editingId && <p className="deadline-hint">“পরিবর্তন রাখুন” চাপলে তালিকা বদলাবে। যে কাজের লেখা বদলাননি, সেটির টিক থাকবে।</p>}{error && <p className="deadline-error" role="alert">{error}</p>}
        <button className="button deadline-add" type="submit">{editingId ? 'পরিবর্তন রাখুন' : 'তালিকায় যোগ করুন'}<span aria-hidden="true">＋</span></button>
        {editingId && <button type="button" className="deadline-text-button" onClick={() => { setDraft(emptyDraft); setEditingId(null); setError(''); }}>পরিবর্তন বাতিল</button>}
      </form><p className="deadline-form-note">এখানে শুধু নিজের হিসাব রাখছেন। এখান থেকে কোনো আবেদন জমা হয় না।</p></div>
      <div className="deadline-agenda">
        <div className="deadline-agenda-header"><h3>আপনার শেষ তারিখগুলো</h3><span>{banglaNumber.format(pending)}টি বাকি</span></div>
        {entries.length === 0 ? <div className="deadline-empty"><svg width="115" height="118" viewBox="0 0 115 118" fill="none" aria-hidden="true"><path d="M24 28h70v69H24z" fill="#faf4f5" stroke="currentColor" strokeWidth="1.5"/><path d="M24 46h70M41 20v17M77 20v17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M39 61h8m10 0h8m10 0h8M39 77h8m10 0h8" stroke="currentColor" strokeWidth="2"/><circle cx="91" cy="94" r="15" fill="#fff" stroke="currentColor" strokeWidth="1.5"/><path d="m86 94 4 4 7-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg><h3>এখনো কোনো আবেদন নেই</h3><p>আবেদন যোগ করুন। শেষ সময়<br />আর বাকি কাজ এখানে দেখবেন।</p></div> : <ol className="deadline-list">{orderedEntries.map(entry => {
          const state = deadlineState(entry, now ?? 0);
          const doneCount = entry.tasks.filter(task => task.done).length;
          return <li key={entry.id} className="deadline-card" data-state={state}>
            <div className="deadline-card-top"><span className="deadline-state">{stateNames[state]}</span><span className="deadline-card-count">{banglaNumber.format(doneCount)}/{banglaNumber.format(entry.tasks.length)} কাজ</span></div>
            <h3>{entry.title}</h3><p className="deadline-due"><svg width="16" height="17" viewBox="0 0 16 17" fill="none" aria-hidden="true"><path d="M2 4h12v11H2zM2 7h12M5 1v5m6-5v5" stroke="currentColor" strokeWidth="1.2"/></svg><time dateTime={new Date(entry.dueAt).toISOString()}>{formatDeadline(entry.dueAt)}</time><span>ঢাকা</span></p>
            <a className="deadline-source" href={entry.source} target="_blank" rel="noopener noreferrer">বিজ্ঞপ্তি খুলুন <span aria-hidden="true">↗</span><span className="screen-reader-only"> — নতুন ট্যাবে খুলবে</span></a>
            {entry.tasks.length > 0 && <ul className="deadline-checklist" aria-label={`${entry.title}: প্রস্তুতির কাজ`}>{entry.tasks.map(task => <li key={task.label}><label><input type="checkbox" checked={task.done} onChange={() => toggleTask(entry, task.label)} /><span>{task.label}</span></label></li>)}</ul>}
            <label className="deadline-complete"><input type="checkbox" checked={entry.complete} onChange={() => { setEntries(entries.map(item => item.id === entry.id ? { ...item, complete: !item.complete } : item)); setStatus('আবেদনের অবস্থা বদলেছে। পরিবর্তন রাখতে আবার সংরক্ষণ করুন।'); }} /><span>এই আবেদন শেষ করেছি</span></label>
            <div className="deadline-card-actions"><button type="button" onClick={() => exportCalendar(entry)}>ক্যালেন্ডারে নিন <span aria-hidden="true">↓</span></button><button type="button" onClick={() => requestEdit(entry)} aria-label={`${entry.title}: তথ্য বদলান`}>বদলান</button><button type="button" className="deadline-delete" onClick={() => removeEntry(entry)} aria-label={`${entry.title} তালিকা থেকে সরান`}>সরান</button></div>
          </li>;
        })}</ol>}
        <p className="deadline-agenda-note">“সময় আছে” মানে আপনার লেখা শেষ সময় এখনো আসেনি। বিজ্ঞপ্তিতে কোনো পরিবর্তন এসেছে কি না, দেখে নিন।</p>
      </div>
    </div>
    <div className="deadline-save"><div><strong><span aria-hidden="true" data-dirty={dirty}/>{!ready ? 'সংরক্ষিত তালিকা খোঁজা হচ্ছে…' : dirty ? 'নতুন পরিবর্তন সংরক্ষণ করা হয়নি' : hasSaved ? 'এই তালিকা ব্রাউজারে সংরক্ষিত আছে' : 'তালিকা শুধু এই পাতায় আছে'}</strong><p>নিজে থেকে সংরক্ষণ হয় না। তথ্য বদলালে আবার রাখুন।</p></div><div className="deadline-save-actions"><button type="button" className="button" disabled={!ready} onClick={saveCurrent}>এই ব্রাউজারে রাখুন</button><button type="button" className="button button-secondary" disabled={!ready} onClick={() => dirty || hasDraft ? setConfirmation('reopen') : reopen()}>রাখা তালিকা খুলুন</button><button type="button" className="deadline-text-button deadline-delete" disabled={!ready} onClick={() => setConfirmation('clear')}>সব মুছুন</button></div></div>
    <p className="deadline-status" role="status" aria-live="polite">{status}</p>
    {storageError && <button type="button" className="deadline-text-button deadline-delete" onClick={() => setConfirmation('stored')}>ব্রাউজারের পুরোনো তালিকা মুছুন</button>}
    {confirmation && <div className="deadline-confirm" role="alert">
      <strong>{confirmingEdit ? 'এখনকার লেখা বাদ দিয়ে অন্য আবেদনটি খুলবেন?' : confirmation === 'reopen' ? 'বর্তমান তালিকা ও লেখা তথ্য বাদ দিয়ে আগের তালিকা খুলবেন?' : confirmation === 'clear' ? 'এই তালিকা ও ব্রাউজারে সংরক্ষিত তথ্য মুছবেন?' : 'শুধু ব্রাউজারের পুরোনো তালিকা মুছবেন?'}</strong>
      <p>{confirmingEdit ? 'এখন যে তথ্য লিখছেন, তা বাদ যাবে। তালিকার আবেদনগুলো বদলাবে না।' : confirmation === 'stored' ? 'পর্দার তালিকা থাকবে। মুছে দেওয়া তথ্য আর ফেরত পাবেন না।' : 'পরে আর আগের তথ্য ফেরত পাবেন না। চাইলে আগে তালিকার ফাইল ডাউনলোড করুন।'}</p>
      <div><button type="button" className="button" onClick={confirmAction}>{confirmingEdit ? 'হ্যাঁ, অন্য আবেদনটি খুলুন' : confirmation === 'reopen' ? 'হ্যাঁ, রাখা তালিকা খুলুন' : 'হ্যাঁ, মুছে দিন'}</button><button type="button" className="button button-secondary" onClick={() => setConfirmation(null)}>বাতিল</button></div>
    </div>}
    <div className="deadline-export"><div><p className="eyebrow">তালিকার একটি কপি রাখুন</p><h2>ক্যালেন্ডারেও তারিখ রাখুন</h2><p>আবেদনের পাশে “ক্যালেন্ডারে নিন” চাপুন। ফাইলটি নিজের ক্যালেন্ডারে যোগ করে মনে করিয়ে দেওয়ার সময় ঠিক করুন। শুধু ডাউনলোড করলে কোনো বার্তা আসবে না।</p><p>পুরো তালিকাও টেক্সট ফাইল হিসেবে রাখতে পারবেন। এতে আবেদনের নাম, লিংক, তারিখ ও কাজের অগ্রগতি থাকবে।</p><button type="button" className="button button-secondary" disabled={!entries.length} onClick={exportText}>তালিকা ডাউনলোড করুন <span aria-hidden="true">↓</span></button></div><div className="deadline-calendar-note"><span className="deadline-note-number" aria-hidden="true">মনে রাখুন</span><h3>তারিখ বদলালে<br />ক্যালেন্ডারেও ঠিক করুন</h3><p>এই তালিকা ক্যালেন্ডারের সঙ্গে যুক্ত নয়। এখানে তারিখ বদলালে ক্যালেন্ডারেও নিজে ঠিক করুন। একই ফাইল বারবার যোগ করলে একই কাজ একাধিকবার দেখা যেতে পারে।</p><details><summary>তালিকার লেখা দেখুন</summary><pre>{entries.length ? textList(orderedEntries) : 'আবেদন যোগ করলে তালিকার লেখা এখানে দেখবেন।'}</pre></details></div></div>
  </section>;
}
