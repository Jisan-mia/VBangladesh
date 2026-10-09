'use client';

import { useRef, useState } from 'react';
import { useHistory } from '../../../shared/use-history';
import { ArtworkDownloads } from '../../../shared/art-downloads';
import { BirdPortrait } from './bird-art';
import { PrintSheet } from './print-sheet';
import { birdPresets, defaultDesign, drawingName, palettes, patterns, type BirdDesign } from '../lib/bird';

export function ToyStudio() {
  const history = useHistory<BirdDesign>(defaultDesign);
  const design = history.value;
  const setDesign = history.commit;
  const [view, setView] = useState<'bird' | 'template'>('bird');
  const [notice, setNotice] = useState('');
  const artwork = useRef<SVGSVGElement>(null);

  async function printTemplate() {
    try {
      await document.fonts.ready;
      window.print();
      setNotice('প্রিন্টের উইন্ডোতে এ৪ ও ১০০% মাপ বেছে নিন। চাইলে পিডিএফ হিসেবে রাখুন।');
    } catch {
      setNotice('প্রিন্টের উইন্ডো খোলা যায়নি। ব্রাউজারের মেনু থেকে প্রিন্ট করার চেষ্টা করুন।');
    }
  }

  return <>
    <section className="paper-studio paper-screen" id="tool" aria-labelledby="studio-title">
      <div className="container">
        <div className="paper-studio-heading"><div><p className="eyebrow">একটি পাখি, আপনার পছন্দের সাজ</p><h2 id="studio-title">কেমন হবে আপনার পাখি?</h2></div><p>রং বদলান। নকশা দেখুন।<br />পছন্দ হলে ছক প্রিন্ট করুন।</p></div>
        <div className="paper-workbench">
          <div className="paper-canvas-column">
            <div className="paper-history" role="group" aria-label="পরিবর্তন ফিরিয়ে আনুন"><button type="button" disabled={!history.canUndo} onClick={history.undo}>আগের ধাপ</button><button type="button" disabled={!history.canRedo} onClick={history.redo}>পরের ধাপ</button></div>
            <div className="paper-view-switch" role="group" aria-label="পাখির ছবি অথবা কাটার ছক দেখুন"><button type="button" aria-pressed={view === 'bird'} onClick={() => setView('bird')}>পাখির ছবি</button><button type="button" aria-pressed={view === 'template'} onClick={() => setView('template')}>কাটার ছক</button></div>
            <div className={`paper-canvas paper-canvas-${view}`}>
              <div className="paper-bird-preview" hidden={view !== 'bird'}><BirdPortrait design={design} prefix="studio-bird" svgRef={artwork} /></div>
              {view === 'template' && <PrintSheet design={design} prefix="preview-sheet" />}
            </div>
            <div className="paper-caption"><span aria-hidden="true" />{view === 'bird' ? 'জোড়া দিলে কেমন দেখাতে পারে, তার নমুনা ছবি।' : 'প্রিন্টের ছক: দুটি অংশ ও বানানোর নিয়ম, এক পাতায়।'}</div>
          </div>
          <div className="paper-controls">
            <fieldset className="paper-fieldset paper-presets"><legend>এক ক্লিকে সাজান</legend><div>{birdPresets.map(preset => <button type="button" key={preset.label} onClick={() => setDesign(current => ({ ...current, paletteId: preset.paletteId, pattern: preset.pattern, finish: 'color' }))}>{preset.label}</button>)}</div><p>নাম একই থাকবে। রং ও নকশা বদলাবে।</p></fieldset>
            <fieldset className="paper-fieldset"><legend><span>১</span> কোন রং পছন্দ?</legend><div className="paper-palette-options">{palettes.map(palette => <label key={palette.id} className={design.paletteId === palette.id ? 'paper-palette-selected' : ''}><input type="radio" name="bird-palette" checked={design.paletteId === palette.id} onChange={() => setDesign({ ...design, paletteId: palette.id })} /><span className="paper-palette-swatch" style={{ background: palette.body }}><i style={{ background: palette.wing }} /></span><span>{palette.label}</span></label>)}</div></fieldset>
            <fieldset className="paper-fieldset"><legend><span>২</span> ডানায় কী নকশা হবে?</legend><div className="paper-pattern-options">{patterns.map(pattern => <label key={pattern.id}><input type="radio" name="bird-pattern" checked={design.pattern === pattern.id} onChange={() => setDesign({ ...design, pattern: pattern.id })} /><svg width="36" height="30" viewBox="0 0 36 30" aria-hidden="true">{pattern.id === 'flowers' ? <><path d="M18 7C22 1 29 7 24 12C32 14 27 22 22 19C20 28 12 24 13 19C4 22 4 13 12 12C8 5 15 1 18 7Z" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="18" cy="14" r="2.5" fill="currentColor"/></> : pattern.id === 'dots' ? <>{[8, 18, 28].map(x => <circle key={x} cx={x} cy="15" r="2.8" fill="currentColor" />)}</> : pattern.id === 'stripes' ? <path d="m7 24 8-18m0 18 8-18m0 18 8-18" stroke="currentColor" strokeWidth="2"/> : <path d="M7 15h22" stroke="currentColor" strokeWidth="1.5"/>}</svg><span>{pattern.label}</span></label>)}</div></fieldset>
            <div className="paper-name-field"><label htmlFor="bird-name">পাখির নাম <span>চাইলে লিখুন</span></label><input id="bird-name" value={design.name} onChange={event => setDesign({ ...design, name: event.target.value })} placeholder="যেমন: টুনটুনি" maxLength={24} autoComplete="off" /></div>
            <label className="paper-outline-choice"><input type="checkbox" checked={design.finish === 'outline'} onChange={event => setDesign({ ...design, finish: event.target.checked ? 'outline' : 'color' })} /><span><strong>শুধু রেখা</strong><small>প্রিন্ট করে নিজে রং করব</small></span></label>
            <button className="button paper-print-button" type="button" onClick={printTemplate}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 8V3h12v5M6 17H3V8h18v9h-3M6 14h12v7H6z" stroke="currentColor" strokeWidth="1.5"/><path d="M17 11h1" stroke="currentColor" strokeWidth="2"/></svg>ছক প্রিন্ট করুন</button>
            <p className="paper-print-hint">এক পাতার এ৪ ছক · পিডিএফও রাখতে পারবেন</p>
            <details className="paper-image-downloads"><summary>পাখির ছবি রাখুন বা শেয়ার করুন</summary><p>ছবিতে পাখির নামও থাকবে।</p><ArtworkDownloads svgRef={artwork} filename="কাগজের-মেলা-পাখি" /></details>
            <p className="paper-status" role="status">{notice}</p>
            <button type="button" className="paper-reset" onClick={() => { if (design.name && !window.confirm('নাম মুছে শুরুর সাজে ফিরবেন? আগের ধাপ দিয়ে আবার ফিরিয়ে আনতে পারবেন।')) return; setDesign(defaultDesign); setNotice('শুরুর রং ও নকশা ফিরিয়ে আনা হয়েছে।'); }}>শুরুর সাজ ফিরিয়ে আনুন</button>
          </div>
        </div>
        <p className="paper-live-name screen-reader-only" aria-live="polite">{drawingName(design.name)}</p>
        <p className="paper-test-note">ছকের ডিজিটাল মাপ পরীক্ষা করা হয়েছে। কাগজে কেটে জোড়া দেওয়ার পরীক্ষা এখনো করা হয়নি।</p>
      </div>
    </section>
    <div className="paper-print-sheet"><PrintSheet design={design} prefix="printed-sheet" /></div>
  </>;
}
