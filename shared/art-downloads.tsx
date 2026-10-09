'use client';

import { useEffect, useState, type RefObject } from 'react';
import { isInAppBrowser, saveBlob, svgPngBlob } from './art-export';

type ArtworkDownloadsProps = { svgRef: RefObject<SVGSVGElement | null>; filename: string };

// Facebook/Messenger in-app browsers can't save blob downloads, but long-press on an <img> works.
export function SaveView({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => () => URL.revokeObjectURL(src), [src]);
  return <div className="save-view" role="dialog" aria-modal="true" aria-labelledby="save-view-title"><div>
    <h2 id="save-view-title">ছবিটা চেপে ধরে রাখো</h2>
    <p>তারপর “ছবি সেভ করো” বা “Download image” বেছে নাও।</p>
    <img src={src} alt={alt} />
    <button type="button" className="button" onClick={onClose}>ঠিক আছে</button>
  </div></div>;
}

export function ArtworkDownloads({ svgRef, filename }: ArtworkDownloadsProps) {
  const pngName = filename.endsWith('.png') ? filename : filename + '.png';
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [canShare, setCanShare] = useState(false);
  const [saveView, setSaveView] = useState('');
  const [readyShare, setReadyShare] = useState<{ file: File; source: string } | null>(null);
  useEffect(() => {
    setCanShare(Boolean(navigator.canShare?.({ files: [new File([''], pngName, { type: 'image/png' })] })));
  }, [pngName]);

  async function download() {
    if (!svgRef.current || busy) return;
    setBusy(true);
    setMessage('ছবি বানানো হচ্ছে…');
    try {
      const blob = await svgPngBlob(svgRef.current);
      if (isInAppBrowser()) { setSaveView(URL.createObjectURL(blob)); setMessage(''); }
      else { saveBlob(blob, pngName); setMessage('ছবি নেমে গেছে। গ্যালারি বা ডাউনলোড ফোল্ডারে দেখো।'); }
    } catch {
      setMessage('ছবিটা বানানো গেল না। আরেকবার চেষ্টা করো।');
    } finally { setBusy(false); }
  }

  async function sendFile(file: File) {
    try {
      await navigator.share({ files: [file] });
      setMessage('শেয়ার হয়ে গেছে!');
      setReadyShare(null);
    } catch (error) {
      const name = error instanceof Error ? error.name : '';
      // Some browsers drop the tap's permission while the PNG is being made; keep the file so the next tap shares instantly.
      if (name === 'NotAllowedError') { setReadyShare({ file, source: svgRef.current?.outerHTML ?? '' }); setMessage('ছবি তৈরি। আরেকবার “শেয়ার করো” চাপো।'); }
      else { setReadyShare(null); setMessage(name === 'AbortError' ? '' : 'সরাসরি শেয়ার হলো না। ছবিটা নামিয়ে নিজে পোস্ট করো।'); }
    }
  }

  async function share() {
    if (!svgRef.current || busy) return;
    if (readyShare?.source === svgRef.current.outerHTML) return sendFile(readyShare.file);
    setBusy(true);
    setMessage('ছবি বানানো হচ্ছে…');
    try {
      const file = new File([await svgPngBlob(svgRef.current)], pngName, { type: 'image/png' });
      setBusy(false);
      await sendFile(file);
    } catch {
      setBusy(false);
      setMessage('ছবিটা বানানো গেল না। আরেকবার চেষ্টা করো।');
    }
  }

  return <div className="art-downloads">
    <div className="art-actions">{canShare && <button type="button" className="button" onClick={share} disabled={busy}>শেয়ার করো</button>}<button type="button" className={canShare ? 'button-secondary' : 'button'} onClick={download} disabled={busy}>{busy ? 'একটু দাঁড়াও…' : 'ছবি ডাউনলোড করো'}</button></div>
    <p className="art-status" role="status">{message || (canShare ? 'সরাসরি ফেসবুক-মেসেঞ্জারে পাঠাও, বা ছবিটা নামিয়ে রাখো।' : 'ছবিটা নামিয়ে রাখো, তারপর যেখানে খুশি পোস্ট করো।')}</p>
    {saveView && <SaveView src={saveView} alt="তোমার বানানো ছবি" onClose={() => setSaveView('')} />}
  </div>;
}
