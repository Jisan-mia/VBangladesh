'use client';

import { useEffect, useState, type RefObject } from 'react';
import { downloadArtwork, svgPngBlob } from './art-export';

type ArtworkDownloadsProps = { svgRef: RefObject<SVGSVGElement | null>; filename: string };

export function ArtworkDownloads({ svgRef, filename }: ArtworkDownloadsProps) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [canShare, setCanShare] = useState(false);
  const [readyShare, setReadyShare] = useState<{ file: File; source: string } | null>(null);
  useEffect(() => {
    const probe = new File([''], 'ছবি.png', { type: 'image/png' });
    setCanShare(Boolean(navigator.canShare?.({ files: [probe] })));
  }, []);

  async function download() {
    if (!svgRef.current || busy) return;
    setBusy(true);
    setMessage('ছবি তৈরি হচ্ছে…');
    try {
      await downloadArtwork(svgRef.current, filename);
      setMessage('ছবি ডাউনলোডের জন্য পাঠানো হয়েছে।');
    } catch {
      setMessage('ছবি তৈরি করা যায়নি। আবার চেষ্টা করুন।');
    } finally { setBusy(false); }
  }

  async function share() {
    if (!svgRef.current || busy) return;
    const source = svgRef.current.outerHTML;
    if (readyShare?.source === source) {
      try {
        await navigator.share({ files: [readyShare.file] });
        setMessage('শেয়ারের ধাপ শেষ হয়েছে।');
      } catch (error) {
        setMessage(error instanceof Error && error.name === 'AbortError' ? 'শেয়ার করা বাতিল হয়েছে।' : 'সরাসরি শেয়ার করা যায়নি। ছবি ডাউনলোড করে পাঠাতে পারবেন।');
      }
      setReadyShare(null);
      return;
    }
    setBusy(true);
    setMessage('শেয়ার করার ছবি তৈরি হচ্ছে…');
    try {
      const blob = await svgPngBlob(svgRef.current);
      const file = new File([blob], filename.endsWith('.png') ? filename : filename + '.png', { type: 'image/png' });
      setReadyShare({ file, source });
      setMessage('ছবি প্রস্তুত। এখন শেয়ার করুন বোতামে চাপুন।');
    } catch {
      setMessage('ছবি তৈরি করা যায়নি। আবার চেষ্টা করুন।');
    } finally { setBusy(false); }
  }

  return <div className="art-downloads"><div className="art-actions"><button type="button" className="button" onClick={download} disabled={busy}>{busy ? 'ছবি তৈরি হচ্ছে…' : 'ছবি ডাউনলোড করুন'}</button>{canShare && <button type="button" className="button-secondary" onClick={share} disabled={busy}>{readyShare ? 'এখন শেয়ার করুন' : 'শেয়ারের ছবি তৈরি করুন'}</button>}</div><p className="art-status" role="status">{message || 'ছবি রেখে পরে পছন্দের অ্যাপে শেয়ার করতে পারবেন।'}</p></div>;
}
