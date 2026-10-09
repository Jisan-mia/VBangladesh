'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode, type RefObject } from 'react';
import { SaveView } from './art-downloads';
import { isInAppBrowser, saveBlob } from './art-export';
import { loadPhoto, type CardFormat, type Photo } from './card-canvas';
import { sendSuggestion, shareLink } from './share-client';

export function useInView(ref: RefObject<Element | null>, threshold = 0.15) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return inView;
}

type ShareBarProps = {
  tool: string;
  fileName: string;
  /** Draws the current card as a PNG. */
  makeImage: () => Promise<Blob>;
  /** Changes whenever the card changes, so a file prepared earlier is never shared stale. */
  imageKey: string;
  /** Post text that travels with the image or link. */
  caption: string;
  /** The card's #hash state; when given, shared links reopen this exact card. */
  state?: string;
  disabled?: boolean;
  hint?: string;
};

/** Share (image + caption + link), download, and copy link — with the Facebook in-app browser fallback built in. */
export function ShareBar({ tool, fileName, makeImage, imageKey, caption, state, disabled, hint }: ShareBarProps) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [saveView, setSaveView] = useState('');
  const [manualLink, setManualLink] = useState('');
  const ready = useRef<{ key: string; file: File; link: string } | null>(null);

  useEffect(() => {
    setCanShareFiles(Boolean(navigator.canShare?.({ files: [new File([''], fileName, { type: 'image/png' })] })));
  }, [fileName]);
  useEffect(() => { setManualLink(''); }, [imageKey]);

  const link = () => state ? shareLink(tool, state) : Promise.resolve(window.location.origin + window.location.pathname);

  async function share() {
    if (disabled || busy) return;
    let prepared = ready.current?.key === imageKey ? ready.current : null;
    try {
      if (!prepared) {
        setBusy(true);
        const [blob, url] = await Promise.all([canShareFiles ? makeImage() : Promise.resolve(null), link()]);
        prepared = { key: imageKey, file: blob ? new File([blob], fileName, { type: 'image/png' }) : new File([], fileName), link: url };
        setBusy(false);
      }
      if (canShareFiles) await navigator.share({ files: [prepared.file], text: `${caption} ${prepared.link}` });
      else if (navigator.share) await navigator.share({ text: caption, url: prepared.link });
      else { await copy(prepared.link); return; }
      ready.current = null;
      setStatus('শেয়ার হয়ে গেছে! এবার দেখো কে কী বলে।');
    } catch (error) {
      setBusy(false);
      const name = error instanceof Error ? error.name : '';
      // Some browsers drop the tap's permission while the image is being made; keep it so the next tap shares instantly.
      if (name === 'NotAllowedError' && prepared) { ready.current = prepared; setStatus('ছবি তৈরি। আরেকবার “শেয়ার করো” চাপো।'); }
      else setStatus(name === 'AbortError' ? '' : 'সরাসরি শেয়ার হলো না। ছবিটা ডাউনলোড করে নিজে পোস্ট করো।');
    }
  }

  async function download() {
    if (disabled || busy) return;
    setBusy(true);
    try {
      const blob = await makeImage();
      if (isInAppBrowser()) { setSaveView(URL.createObjectURL(blob)); setStatus(''); }
      else { saveBlob(blob, fileName); setStatus('ছবি নেমে গেছে। গ্যালারি বা ডাউনলোড ফোল্ডারে দেখো।'); }
    } catch {
      setStatus('ছবিটা বানানো গেল না। আরেকবার চেষ্টা করো।');
    } finally { setBusy(false); }
  }

  async function copy(url?: string) {
    if (disabled) return;
    const target = url ?? await link();
    try {
      await navigator.clipboard.writeText(`${caption} ${target}`);
      setStatus('লিংক কপি হয়েছে। মেসেঞ্জার, হোয়াটসঅ্যাপ বা ফেসবুকে পেস্ট করে দাও।');
    } catch {
      // Safari can refuse clipboard writes after a network wait; show the link so it can be copied by hand.
      setManualLink(target);
      setStatus('নিজে কপি করে নাও: নিচের লিংকটা চেপে ধরে “Copy” বেছে নাও।');
    }
  }

  return <div className="kit-share">
    <button type="button" className="kit-primary kit-share-main" onClick={share} disabled={disabled || busy}>{busy ? 'একটু দাঁড়াও…' : 'শেয়ার করো'}</button>
    <div className="kit-share-row">
      <button type="button" className="kit-secondary" onClick={download} disabled={disabled || busy}>ছবি ডাউনলোড করো</button>
      <button type="button" className="kit-secondary" onClick={() => copy()} disabled={disabled}>লিংক কপি করো</button>
    </div>
    {manualLink && <input className="kit-manual-link" readOnly value={manualLink} onFocus={event => event.currentTarget.select()} aria-label="শেয়ারের লিংক" />}
    <p className="kit-status" role="status" aria-live="polite">{status || hint || ''}</p>
    {saveView && <SaveView src={saveView} alt={caption} onClose={() => setSaveView('')} />}
  </div>;
}

export function FormatToggle({ value, onChange }: { value: CardFormat; onChange: (format: CardFormat) => void }) {
  return <fieldset className="kit-chips">
    <legend>কোথায় দেবে?</legend>
    <button type="button" aria-pressed={value === 'feed'} onClick={() => onChange('feed')}>ফেসবুক পোস্ট</button>
    <button type="button" aria-pressed={value === 'story'} onClick={() => onChange('story')}>স্টোরি</button>
  </fieldset>;
}

export function PhotoPicker({ value, onChange, label = 'ছবি', note = 'চাইলে দাও, তোমার ফোনেই থাকবে' }: { value: Photo | null; onChange: (photo: Photo | null) => void; label?: string; note?: string }) {
  const [error, setError] = useState('');
  async function pick(file: File | undefined) {
    if (!file) return;
    try { onChange(await loadPhoto(file)); setError(''); }
    catch { setError('ছবিটা খোলা গেল না। অন্য একটা ছবি দিয়ে চেষ্টা করো।'); }
  }
  return <div className="kit-photo">
    <span>{label} <small>{note}</small></span>
    <div>
      <label className="kit-secondary">{value ? 'ছবি বদলাও' : 'ছবি দাও'}<input type="file" accept="image/*" onChange={event => { pick(event.target.files?.[0]); event.target.value = ''; }} /></label>
      {value && <button type="button" className="kit-link" onClick={() => onChange(null)}>ছবি সরাও</button>}
    </div>
    {error && <p className="kit-status" role="alert">{error}</p>}
  </div>;
}

/** The single next step, pinned to the bottom of the screen until its target scrolls into view. */
export function StickyNext({ show, title, sub, href, label }: { show: boolean; title: ReactNode; sub?: string; href: string; label: string }) {
  return <div className="kit-sticky" data-show={show} aria-hidden={!show}>
    <p>{title}{sub && <span>{sub}</span>}</p>
    <a className="kit-primary kit-sticky-cta" href={href} tabIndex={show ? 0 : -1}>{label}</a>
  </div>;
}

export function SuggestBox({ tool, question, placeholder }: { tool: string; question: string; placeholder: string }) {
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle');
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (text.trim().length < 2 || state === 'sending') return;
    setState('sending');
    const ok = await sendSuggestion(tool, text.trim());
    setState(ok ? 'sent' : 'failed');
    if (ok) setText('');
  }
  return <form className="kit-suggest" onSubmit={submit}>
    <label htmlFor={`suggest-${tool}`}>{question}</label>
    <div>
      <input id={`suggest-${tool}`} value={text} maxLength={300} onChange={event => { setText(event.target.value); if (state !== 'sending') setState('idle'); }} placeholder={placeholder} />
      <button type="submit" className="kit-secondary" disabled={state === 'sending' || text.trim().length < 2}>{state === 'sending' ? 'যাচ্ছে…' : 'পাঠাও'}</button>
    </div>
    <p className="kit-status" role="status" aria-live="polite">{state === 'sent' ? 'পেয়ে গেছি, ধন্যবাদ! পরের বার যোগ করার চেষ্টা করব।' : state === 'failed' ? 'পাঠানো গেল না। একটু পরে আবার চেষ্টা করো।' : 'নাম বা ফোন নম্বর লাগবে না।'}</p>
  </form>;
}
