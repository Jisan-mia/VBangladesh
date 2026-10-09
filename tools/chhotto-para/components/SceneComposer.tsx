'use client';

import { useRef, useState, type MouseEvent, type PointerEvent, type KeyboardEvent } from 'react';
import { ArtworkDownloads } from '../../../shared/art-downloads';
import { useHistory } from '../../../shared/use-history';
import { addObject, moveObject, objects, removeObject, starterScene, MAX_OBJECTS, type ObjectKind, type Position, type SceneObject, type Setting } from '../lib/scene';
import { sceneFormats, sceneFrame, sceneViewport, type SceneFormat } from '../lib/format';
import { dragPosition, passedDragThreshold } from '../lib/drag';
import { ObjectArt } from './ObjectArt';
import { SceneFront, SceneGround } from './SceneGround';

type SceneDocument = { setting: Setting; format: SceneFormat; items: SceneObject[]; caption: string };
type SceneDrag = { pointerId: number; id: string; origin: Position; start: Position; clientStart: Position; document: SceneDocument; moved: boolean; latest: SceneObject[] };
const directions = [
  { label: 'বাঁয়ে', x: -18, y: 0, symbol: '←', key: 'ArrowLeft' }, { label: 'ওপরে', x: 0, y: -18, symbol: '↑', key: 'ArrowUp' },
  { label: 'নিচে', x: 0, y: 18, symbol: '↓', key: 'ArrowDown' }, { label: 'ডানে', x: 18, y: 0, symbol: '→', key: 'ArrowRight' },
];

export function SceneComposer() {
  const editor = useHistory<SceneDocument>(() => ({ setting: 'courtyard', format: 'post', items: starterScene(), caption: 'এক বিকেলের গল্প' }));
  const { setting, format, caption } = editor.value;
  const [preview, setPreview] = useState<SceneObject[] | null>(null);
  const items = preview ?? editor.value.items;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const sceneRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<SceneDrag | null>(null);
  const suppressClick = useRef(false);
  const layout = sceneFormats[format];
  const frame = sceneFrame(format);
  const selected = items.find(item => item.id === selectedId);
  const selectedKind = selected ? objects[selected.kind] : null;
  const sorted = items.slice().sort((left, right) => left.y - right.y);

  function update(change: Partial<SceneDocument>) {
    if (!drag.current) editor.commit(current => ({ ...current, ...change }));
  }

  function add(kind: ObjectKind) {
    if (drag.current) return;
    try {
      const id = crypto.randomUUID();
      update({ items: addObject(items, { id, kind }) }); setSelectedId(id);
      setStatus(`${objects[kind].label} যোগ হয়েছে। টেনে সরান অথবা নিচের বোতাম ব্যবহার করুন।`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'যোগ করা যায়নি। আবার চেষ্টা করুন।'); }
  }

  function reposition(position: Position) {
    if (!selected || drag.current) return;
    update({ items: moveObject(items, selected.id, position) });
    setStatus(`${objects[selected.kind].label} সরানো হয়েছে।`);
  }

  function scenePoint(client: Position): Position | null {
    const svg = sceneRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = svg.createSVGPoint();
    point.x = client.x; point.y = client.y;
    return point.matrixTransform(matrix.inverse());
  }

  function tapScene(event: MouseEvent<SVGSVGElement>) {
    if ((event.nativeEvent as globalThis.PointerEvent).isPrimary === false) return;
    if (suppressClick.current) { suppressClick.current = false; return; }
    if (drag.current) return;
    const target = event.target as Element;
    if (!target.hasAttribute('data-ground')) return;
    if (!selected) { setStatus('আগে একটি জিনিস বেছে নিন। তারপর যেখানে বসাতে চান, সেখানে চাপুন।'); return; }
    const point = scenePoint({ x: event.clientX, y: event.clientY });
    if (point) reposition(point);
  }

  function startDrag(event: PointerEvent<SVGSVGElement>) {
    if (drag.current || !event.isPrimary || event.button !== 0) return;
    suppressClick.current = false;
    const id = (event.target as Element).closest('[data-object-id]')?.getAttribute('data-object-id');
    const item = items.find(candidate => candidate.id === id);
    if (!item) return;
    const clientStart = { x: event.clientX, y: event.clientY };
    const start = scenePoint(clientStart);
    if (!start) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(item.id);
    drag.current = { pointerId: event.pointerId, id: item.id, origin: item, start, clientStart, document: editor.value, moved: false, latest: items };
    setPreview(items);
    setStatus(`${objects[item.kind].label} বেছে নেওয়া হয়েছে। টেনে জায়গা বদলান।`);
  }

  function moveDrag(event: PointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const client = { x: event.clientX, y: event.clientY };
    if (!active.moved && !passedDragThreshold(active.clientStart, client)) return;
    const point = scenePoint(client);
    if (!point) return;
    event.preventDefault();
    active.moved = true;
    active.latest = moveObject(active.document.items, active.id, dragPosition(active.origin, active.start, point));
    setPreview(active.latest);
  }

  function finishDrag(event: PointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    moveDrag(event);
    drag.current = null;
    setPreview(null);
    suppressClick.current = active.moved;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (active.moved) {
      editor.commit({ ...active.document, items: active.latest });
      setStatus('জায়গা বদলেছে। আগের ধাপ বোতামে ফিরিয়ে নিতে পারবেন।');
    }
  }

  function cancelDrag(pointerId?: number) {
    const active = drag.current;
    if (!active || (pointerId !== undefined && active.pointerId !== pointerId)) return;
    drag.current = null;
    setPreview(null);
    suppressClick.current = true;
    if (svgRef.current?.hasPointerCapture(active.pointerId)) svgRef.current.releasePointerCapture(active.pointerId);
    setStatus('টেনে সরানো বাতিল হয়েছে। আগের জায়গায় ফিরেছে।');
  }

  function historyStep(step: 'undo' | 'redo') {
    if (drag.current) { cancelDrag(); return; }
    if (step === 'undo') editor.undo(); else editor.redo();
    setSelectedId(null);
    setStatus(step === 'undo' ? 'আগের ধাপে ফিরেছেন।' : 'পরের ধাপে ফিরেছেন।');
  }

  function removeSelected() {
    if (!selected || drag.current) return;
    update({ items: removeObject(items, selected.id) }); setSelectedId(null);
    setStatus(`${objects[selected.kind].label} সরিয়ে দেওয়া হয়েছে।`);
  }

  function canvasKey(event: KeyboardEvent<SVGSVGElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Escape') { event.preventDefault(); cancelDrag(); return; }
    if (drag.current) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault(); historyStep(event.shiftKey ? 'redo' : 'undo'); return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const direction = directions.find(item => item.key === event.key);
    if (direction) {
      event.preventDefault();
      if (selected) reposition({ x: selected.x + direction.x, y: selected.y + direction.y });
      else if (items.length) setSelectedId(items[0].id);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault(); removeSelected();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (items.length) setSelectedId(items[(items.findIndex(item => item.id === selectedId) + 1) % items.length].id);
    }
  }

  function usePreset(value: Setting) {
    const next = value === 'courtyard' ? starterScene() : [
      { id: 'roof-1', kind: 'tank' as const, x: 335, y: 355 },
      { id: 'roof-2', kind: 'clothesline' as const, x: 615, y: 345 },
      { id: 'roof-3', kind: 'plant' as const, x: 685, y: 453 },
      { id: 'roof-4', kind: 'chair' as const, x: 445, y: 480 },
      { id: 'roof-5', kind: 'tea' as const, x: 530, y: 525 },
      { id: 'roof-6', kind: 'kite' as const, x: 515, y: 375 },
    ];
    update({ setting: value, items: next }); setSelectedId(null);
    setStatus('নমুনা সাজানো হয়েছে। আপনার লেখা ও ছবির মাপ একই আছে।');
  }

  return <section className="para-composer container" id="tool" aria-labelledby="scene-heading">
    <div className="para-tool-title"><div><p className="eyebrow">আপনার মতো সাজান</p><h2 id="scene-heading">আজ কোথায় বসবে আড্ডা?</h2></div><div className="para-setting" aria-label="দৃশ্যের জায়গা">{([['courtyard', 'গ্রামের উঠোন'], ['rooftop', 'শহরের ছাদ']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={setting === value} onClick={() => { update({ setting: value }); setStatus(`${label} বেছে নেওয়া হয়েছে। বসানো জিনিসগুলো একই জায়গায় আছে।`); }}>{label}</button>)}</div></div>
    <div className="para-format"><span>ছবির মাপ</span><div className="para-setting" role="group" aria-label="ছবির মাপ">{(Object.keys(sceneFormats) as SceneFormat[]).map(value => <button type="button" key={value} aria-pressed={format === value} onClick={() => { update({ format: value }); setStatus(`${sceneFormats[value].label} মাপ বেছে নেওয়া হয়েছে। সাজানো দৃশ্য ও লেখা একই আছে।`); }}>{sceneFormats[value].label} <span>{sceneFormats[value].ratio}</span></button>)}</div></div>
    <div className="para-editor-actions"><div><button type="button" disabled={!editor.canUndo || preview !== null} onClick={() => historyStep('undo')}>আগের ধাপ</button><button type="button" disabled={!editor.canRedo || preview !== null} onClick={() => historyStep('redo')}>পরের ধাপ</button></div><div><span>নমুনা সাজান</span><button type="button" disabled={preview !== null} onClick={() => usePreset('courtyard')}>উঠোনের বিকেল</button><button type="button" disabled={preview !== null} onClick={() => usePreset('rooftop')}>ছাদের আড্ডা</button></div></div>
    <div className="para-studio">
      <div className="para-canvas-column">
        <div className="para-canvas-wrap">
          <div className="para-canvas-top"><span><span aria-hidden="true"/>আপনার দৃশ্য</span><span>{new Intl.NumberFormat('bn-BD').format(items.length)} / ১৮টি জিনিস</span></div>
          <svg ref={svgRef} viewBox={`0 0 ${layout.width} ${layout.height}`} width={layout.width} height={layout.height} role="img" aria-label={`${layout.label} মাপে ${setting === 'courtyard' ? 'গ্রামের উঠোন' : 'শহরের ছাদ'}: ${items.map(item => objects[item.kind].label).join(', ')}${caption ? '। ' + caption : ''}`} tabIndex={0} aria-describedby="scene-keyboard-help" onKeyDown={canvasKey} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={event => cancelDrag(event.pointerId)} onLostPointerCapture={event => cancelDrag(event.pointerId)} onClick={tapScene} className="para-canvas" xmlns="http://www.w3.org/2000/svg">
            <rect width={layout.width} height={layout.height} fill="#faf6e9"/>
            <text x="540" y={layout.titleY} textAnchor="middle" fontFamily="Bangla, sans-serif" fontSize={format === 'story' ? 48 : 30} fill="#657657">ছোট্ট পাড়া</text>
            <text x="540" y={layout.settingY} textAnchor="middle" fontFamily="Bangla, sans-serif" fontSize={format === 'story' ? 24 : 18} fill="#939980">{setting === 'courtyard' ? 'গ্রামের উঠোন' : 'শহরের ছাদ'}</text>
            {format === 'story' && <path d="M495 420h90M495 1630h90" fill="none" stroke="#c6c9ae" strokeWidth="2"/>}
            <svg ref={sceneRef} {...frame} viewBox={`0 0 ${sceneViewport.width} ${sceneViewport.height}`}>
            <circle cx="809" cy="112" r="38" fill="#edcf8c" opacity=".52"/>
            <SceneGround setting={setting}/>
            <path data-ground="true" d="m72 426 408-218 408 212-408 221Z" fill="transparent" cursor={selected ? 'crosshair' : 'default'}/>
            {sorted.map(item => <g key={item.id} data-object-id={item.id} transform={`translate(${item.x} ${item.y})`} cursor="grab"><ObjectArt kind={item.kind}/></g>)}
            <SceneFront setting={setting}/>
            {selected && selectedKind && <g data-export-ignore="true" pointerEvents="none" transform={`translate(${selected.x} ${selected.y})`}><ellipse cy="4" rx={selectedKind.width / 2 + 9} ry="22" fill="none" stroke="#466b56" strokeWidth="2.5" strokeDasharray="6 5"/><rect x={-selectedKind.width / 2 - 10} y={-selectedKind.height - 10} width={selectedKind.width + 20} height={selectedKind.height + 34} rx="12" fill="none" stroke="#537860" strokeOpacity=".6" strokeWidth="1.5" strokeDasharray="4 6"/></g>}
            </svg>
            {caption && <text x="540" y={layout.captionY} textAnchor="middle" fontFamily="Bangla, sans-serif" fontSize="32" fontWeight="500" fill="#53634a">{caption}</text>}
          </svg>
          <p className="para-canvas-hint" id="scene-keyboard-help">জিনিস টেনে সরান। চাপ দিয়ে বেছেও জায়গা বদলাতে পারবেন। ছবিতে ফোকাস থাকলে Enter দিয়ে জিনিস বাছুন, তিরচিহ্ন দিয়ে সরান, Delete দিয়ে বাদ দিন।</p>
        </div>
        <div className="para-controls">
          <div className="para-selection"><label htmlFor="selected-object">কোনটি সরাবেন?</label><select id="selected-object" value={selectedId ?? ''} onChange={event => setSelectedId(event.target.value || null)}><option value="">একটি জিনিস বেছে নিন</option>{items.map((item, index) => <option key={item.id} value={item.id}>{objects[item.kind].label} · {new Intl.NumberFormat('bn-BD').format(index + 1)}</option>)}</select></div>
          <div className="para-position"><span>জায়গা বদলান</span><div>{directions.map(direction => <button type="button" key={direction.label} disabled={!selected} aria-label={selectedKind ? `${selectedKind.label} ${direction.label} সরান` : `${direction.label} সরান`} onClick={() => selected && reposition({ x: selected.x + direction.x, y: selected.y + direction.y })}><b aria-hidden="true">{direction.symbol}</b>{direction.label}</button>)}</div></div>
          <button type="button" className="para-remove" disabled={!selected} onClick={removeSelected}>বেছে নেওয়াটি সরান</button>
        </div>
        <p className="para-status" role="status" aria-live="polite">{status || 'শুরুতে একটি দৃশ্য সাজানো আছে। জিনিস যোগ করে বা সরিয়ে নিজের মতো করে নিন।'}</p>
      </div>
      <aside className="para-shelf" aria-labelledby="shelf-heading">
        <div className="para-shelf-title"><div><p className="eyebrow">যা যা রাখা যায়</p><h3 id="shelf-heading">একটা করে যোগ করুন</h3></div><span aria-hidden="true">＋</span></div>
        <div className="para-object-grid">{Object.entries(objects).map(([kind, object]) => <button key={kind} type="button" disabled={items.length >= MAX_OBJECTS} onClick={() => add(kind as ObjectKind)} aria-label={`${object.label} যোগ করুন`}><svg viewBox={`${-object.width / 2 - 14} ${-object.height - 12} ${object.width + 28} ${object.height + 44}`} width="92" height="90" aria-hidden="true"><ObjectArt kind={kind as ObjectKind}/></svg><span>{object.label}</span><b aria-hidden="true">+</b></button>)}</div>
        <p className="para-shelf-note">একই জিনিস একাধিকবার রাখতে পারবেন। এক দৃশ্যে সর্বোচ্চ ১৮টি।</p>
      </aside>
    </div>
    <div className="para-finish">
      <div className="para-caption"><label htmlFor="scene-caption">ছবির নিচে কী লিখবেন? <span>চাইলে দিন</span></label><input id="scene-caption" value={caption} maxLength={32} onChange={event => update({ caption: event.target.value })} placeholder="যেমন: ছুটির দিনের বিকেল"/><p>সর্বোচ্চ ৩২ অক্ষর। লেখাটিও ছবিতে থাকবে।</p></div>
      <div className="para-download"><div inert={preview !== null}><ArtworkDownloads svgRef={svgRef} filename={`chhotto-para-${format}`}/></div><p>{layout.label} মাপে ছবি নামবে। জিনিস বাছার দাগ থাকবে না।</p></div>
    </div>
    <div className="para-reset"><p>দৃশ্য নিজে থেকে সংরক্ষণ হয় না। পাতা বন্ধ করার আগে ছবি নামিয়ে রাখুন।</p><button type="button" onClick={() => setResetOpen(true)}>সব সরিয়ে শুরু করুন</button></div>
    {resetOpen && <div className="para-reset-confirm" role="alert"><div><strong>সব জিনিস সরিয়ে খালি জায়গা থেকে শুরু করবেন?</strong><p>আপনার লেখা ও বেছে নেওয়া জায়গা থাকবে। চাইলে “আগের ধাপ” দিয়ে জিনিসগুলো ফেরাতে পারবেন।</p></div><button type="button" className="button" onClick={() => { update({ items: [] }); setSelectedId(null); setResetOpen(false); setStatus('সব জিনিস সরানো হয়েছে। পাশের তাক থেকে আবার সাজানো শুরু করুন।'); }}>হ্যাঁ, সব সরান</button><button type="button" className="button button-secondary" onClick={() => setResetOpen(false)}>বাতিল</button></div>}
  </section>;
}
