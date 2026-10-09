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
      setStatus(`${objects[kind].label} বসানো হলো। টেনে বা নিচের তির চেপে জায়গামতো নাও।`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'বসানো গেল না। আরেকবার চেষ্টা করো।'); }
  }

  function reposition(position: Position) {
    if (!selected || drag.current) return;
    update({ items: moveObject(items, selected.id, position) });
    setStatus(`${objects[selected.kind].label} সরে গেছে।`);
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
    if (!selected) { setStatus('আগে একটা জিনিস ছুঁয়ে বেছে নাও, তারপর যেখানে বসাতে চাও সেখানে চাপো।'); return; }
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
    setStatus(`${objects[item.kind].label} ধরেছ। টেনে যেখানে খুশি নাও।`);
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
      setStatus('জায়গা বদলে গেছে। পছন্দ না হলে “এক ধাপ পেছাও” চাপো।');
    }
  }

  function cancelDrag(pointerId?: number) {
    const active = drag.current;
    if (!active || (pointerId !== undefined && active.pointerId !== pointerId)) return;
    drag.current = null;
    setPreview(null);
    suppressClick.current = true;
    if (svgRef.current?.hasPointerCapture(active.pointerId)) svgRef.current.releasePointerCapture(active.pointerId);
    setStatus('টানা থামানো হলো, জিনিসটা আগের জায়গায় ফিরে গেছে।');
  }

  function historyStep(step: 'undo' | 'redo') {
    if (drag.current) { cancelDrag(); return; }
    if (step === 'undo') editor.undo(); else editor.redo();
    setSelectedId(null);
    setStatus(step === 'undo' ? 'আগেরটা ফিরিয়ে আনা হলো।' : 'আবার করা হলো।');
  }

  function removeSelected() {
    if (!selected || drag.current) return;
    update({ items: removeObject(items, selected.id) }); setSelectedId(null);
    setStatus(`${objects[selected.kind].label} বাদ দেওয়া হলো।`);
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
    setStatus('নমুনাটা সাজিয়ে দিলাম। তোমার লেখা আর ছবির মাপ যেমন ছিল তেমনই আছে।');
  }

  return <section className="para-composer container" id="tool" aria-labelledby="scene-heading">
    <div className="para-tool-title"><div><p className="eyebrow">নিজের মতো সাজাও</p><h2 id="scene-heading">আজ কোথায় বসবে আড্ডা?</h2></div><div className="para-setting" aria-label="কোথায় সাজাবে">{([['courtyard', 'গ্রামের উঠোন'], ['rooftop', 'শহরের ছাদ']] as const).map(([value, label]) => <button type="button" key={value} aria-pressed={setting === value} onClick={() => { update({ setting: value }); setStatus(`এবার ${label}। বসানো জিনিসগুলো যেখানে ছিল সেখানেই আছে।`); }}>{label}</button>)}</div></div>
    <div className="para-format"><span>ছবির মাপ</span><div className="para-setting" role="group" aria-label="ছবির মাপ">{(Object.keys(sceneFormats) as SceneFormat[]).map(value => <button type="button" key={value} aria-pressed={format === value} onClick={() => { update({ format: value }); setStatus(`এবার ${sceneFormats[value].label}-এর মাপে ছবি হবে। সাজানো দৃশ্য আর লেখা একই আছে।`); }}>{sceneFormats[value].label} <span>{sceneFormats[value].ratio}</span></button>)}</div></div>
    <div className="para-editor-actions"><div><button type="button" disabled={!editor.canUndo || preview !== null} onClick={() => historyStep('undo')}>এক ধাপ পেছাও</button><button type="button" disabled={!editor.canRedo || preview !== null} onClick={() => historyStep('redo')}>এক ধাপ এগোও</button></div><div><span>নমুনা থেকে শুরু</span><button type="button" disabled={preview !== null} onClick={() => usePreset('courtyard')}>উঠোনের বিকেল</button><button type="button" disabled={preview !== null} onClick={() => usePreset('rooftop')}>ছাদের আড্ডা</button></div></div>
    <div className="para-studio">
      <div className="para-canvas-column">
        <div className="para-canvas-wrap">
          <div className="para-canvas-top"><span><span aria-hidden="true"/>তোমার পাড়া</span><span>{new Intl.NumberFormat('bn-BD').format(items.length)} / ১৮টা জিনিস</span></div>
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
          <p className="para-canvas-hint" id="scene-keyboard-help">জিনিস ধরে টেনে সরাও, বা একবার ছুঁয়ে বেছে নিয়ে মাটিতে যেখানে চাও চাপো। কিবোর্ডে ছবিটায় থেকে Enter দিয়ে বাছো, তির দিয়ে সরাও, Delete দিয়ে বাদ দাও।</p>
        </div>
        <div className="para-controls">
          <div className="para-selection"><label htmlFor="selected-object">কোনটা সরাবে?</label><select id="selected-object" value={selectedId ?? ''} onChange={event => setSelectedId(event.target.value || null)}><option value="">একটা জিনিস বেছে নাও</option>{items.map((item, index) => <option key={item.id} value={item.id}>{objects[item.kind].label} · {new Intl.NumberFormat('bn-BD').format(index + 1)}</option>)}</select></div>
          <div className="para-position"><span>জায়গা বদলাও</span><div>{directions.map(direction => <button type="button" key={direction.label} disabled={!selected} aria-label={selectedKind ? `${selectedKind.label} ${direction.label} সরাও` : `${direction.label} সরাও`} onClick={() => selected && reposition({ x: selected.x + direction.x, y: selected.y + direction.y })}><b aria-hidden="true">{direction.symbol}</b>{direction.label}</button>)}</div></div>
          <button type="button" className="para-remove" disabled={!selected} onClick={removeSelected}>বাছা জিনিসটা বাদ দাও</button>
        </div>
        <p className="para-status" role="status" aria-live="polite">{status || 'একটা উঠোন সাজিয়ে রেখেছি। জিনিস বসিয়ে, সরিয়ে নিজের পাড়ার মতো করে নাও।'}</p>
      </div>
      <aside className="para-shelf" aria-labelledby="shelf-heading">
        <div className="para-shelf-title"><div><p className="eyebrow">যা যা বসানো যায়</p><h3 id="shelf-heading">ছুঁলেই বসে যাবে</h3></div><span aria-hidden="true">＋</span></div>
        <div className="para-object-grid">{Object.entries(objects).map(([kind, object]) => <button key={kind} type="button" disabled={items.length >= MAX_OBJECTS} onClick={() => add(kind as ObjectKind)} aria-label={`${object.label} বসাও`}><svg viewBox={`${-object.width / 2 - 14} ${-object.height - 12} ${object.width + 28} ${object.height + 44}`} width="92" height="90" aria-hidden="true"><ObjectArt kind={kind as ObjectKind}/></svg><span>{object.label}</span><b aria-hidden="true">+</b></button>)}</div>
        <p className="para-shelf-note">একই জিনিস কয়েকবারও বসাতে পারো। সব মিলিয়ে ১৮টা পর্যন্ত।</p>
      </aside>
    </div>
    <div className="para-finish">
      <div className="para-caption"><label htmlFor="scene-caption">ছবির নিচে কী লিখবে? <span>চাইলে</span></label><input id="scene-caption" value={caption} maxLength={32} onChange={event => update({ caption: event.target.value })} placeholder="যেমন: নানাবাড়ির উঠোন"/><p>৩২ অক্ষরের মধ্যে লেখো। লেখাটাও ছবিতে থাকবে।</p></div>
      <div className="para-download"><div inert={preview !== null}><ArtworkDownloads svgRef={svgRef} filename={`chhotto-para-${format}`}/></div><p>{layout.label}-এর মাপে ছবি নামবে। বাছার দাগ ছবিতে আসবে না।</p></div>
    </div>
    <div className="para-reset"><p>সাজানোটা কোথাও জমা থাকে না। পাতা বন্ধ করার আগে ছবিটা নামিয়ে রাখো।</p><button type="button" onClick={() => setResetOpen(true)}>সব সরিয়ে নতুন করে শুরু করো</button></div>
    {resetOpen && <div className="para-reset-confirm" role="alert"><div><strong>সব জিনিস সরিয়ে খালি জায়গা থেকে শুরু করবে?</strong><p>তোমার লেখা আর উঠোন বা ছাদ যেমন আছে থাকবে। মন বদলালে “এক ধাপ পেছাও” চাপলেই জিনিসগুলো ফেরত আসবে।</p></div><button type="button" className="button" onClick={() => { update({ items: [] }); setSelectedId(null); setResetOpen(false); setStatus('সব সরানো হলো। তাক থেকে জিনিস ছুঁয়ে আবার সাজাও।'); }}>হ্যাঁ, সব সরাও</button><button type="button" className="button button-secondary" onClick={() => setResetOpen(false)}>না, থাক</button></div>}
  </section>;
}
