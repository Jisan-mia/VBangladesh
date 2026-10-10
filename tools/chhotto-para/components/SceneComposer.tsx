'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { cardSizes, loadCardFonts, type CardFormat } from '../../../shared/card-canvas';
import { FormatToggle, ShareBar, StickyNext, useInView } from '../../../shared/share-kit';
import { useHistory } from '../../../shared/use-history';
import { dragPosition, passedDragThreshold } from '../lib/drag';
import { cardBlob, drawCard, svgImage } from '../lib/draw-postcard';
import { bn, cardText, MAX_DISTRICT_LENGTH, MAX_NAME_LENGTH, MAX_PLACE_LENGTH, parseShareHash, possessive, shareHash, type Postcard } from '../lib/postcard';
import { addObject, moveObject, objects, removeObject, rooftopScene, starterScene, MAX_OBJECTS, type ObjectKind, type Position, type SceneObject, type Setting } from '../lib/scene';
import { ObjectArt } from './ObjectArt';
import { ScenePicture, sceneViewport } from './ScenePicture';

const TOOL = 'chhotto-para';
type SceneDocument = { setting: Setting; items: SceneObject[] };
type SceneDrag = { pointerId: number; id: string; origin: Position; start: Position; clientStart: Position; document: SceneDocument; moved: boolean; latest: SceneObject[] };
const settings = [['courtyard', 'গ্রামের উঠোন'], ['rooftop', 'শহরের ছাদ']] as const;
const directions = [
  { label: 'বাঁয়ে', x: -18, y: 0, symbol: '←', key: 'ArrowLeft' }, { label: 'ওপরে', x: 0, y: -18, symbol: '↑', key: 'ArrowUp' },
  { label: 'নিচে', x: 0, y: 18, symbol: '↓', key: 'ArrowDown' }, { label: 'ডানে', x: 18, y: 0, symbol: '→', key: 'ArrowRight' },
];

export function SceneComposer() {
  const editor = useHistory<SceneDocument>(() => ({ setting: 'courtyard', items: starterScene() }));
  const { setting } = editor.value;
  const [preview, setPreview] = useState<SceneObject[] | null>(null);
  const items = preview ?? editor.value.items;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [place, setPlace] = useState('');
  const [district, setDistrict] = useState('');
  const [name, setName] = useState('');
  const [format, setFormat] = useState<CardFormat>('feed');
  const [site, setSite] = useState('');
  const [friend, setFriend] = useState<Postcard | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const sceneRef = useRef<SVGSVGElement | null>(null);
  const friendScene = useRef<SVGSVGElement | null>(null);
  const card = useRef<HTMLCanvasElement>(null);
  const friendCard = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const drag = useRef<SceneDrag | null>(null);
  const suppressClick = useRef(false);
  const selected = items.find(item => item.id === selectedId);
  const selectedKind = selected ? objects[selected.kind] : null;
  const postcard: Postcard = { setting, items: editor.value.items, place, district, name };
  const text = cardText(postcard);
  const state = shareHash(postcard);

  useEffect(() => {
    // In-page anchors (#result) also change the hash, so only a real shared postcard replaces the friend's.
    const readFriend = () => { const found = parseShareHash(window.location.hash); if (found) setFriend(found); };
    readFriend();
    setSite(window.location.host);
    window.addEventListener('hashchange', readFriend);
    return () => window.removeEventListener('hashchange', readFriend);
  }, []);

  // Redraw only on committed edits: a drag in progress would otherwise re-render the card on every frame.
  useEffect(() => {
    let cancelled = false;
    Promise.all([loadCardFonts(text.greeting + text.line), sceneRef.current ? svgImage(sceneRef.current, sceneViewport.width, sceneViewport.height) : Promise.reject()]).then(([, scene]) => {
      if (cancelled || !card.current) return;
      drawCard(card.current, scene, text, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [editor.value, place, district, name, format, site]);

  useEffect(() => {
    if (!friend) return;
    let cancelled = false;
    Promise.all([loadCardFonts(), friendScene.current ? svgImage(friendScene.current, sceneViewport.width, sceneViewport.height) : Promise.reject()]).then(([, scene]) => {
      if (!cancelled && friendCard.current) drawCard(friendCard.current, scene, cardText(friend), 'feed', site);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [friend, site]);

  function update(change: Partial<SceneDocument>) {
    if (!drag.current) editor.commit(current => ({ ...current, ...change }));
  }

  function add(kind: ObjectKind) {
    if (drag.current) return;
    try {
      const id = crypto.randomUUID();
      update({ items: addObject(items, { id, kind }) }); setSelectedId(id);
      setStatus(`${objects[kind].label} বসানো হলো। টেনে জায়গামতো নাও।`);
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
    if (!(event.target as Element).hasAttribute('data-ground')) return;
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
    if (sceneRef.current?.hasPointerCapture(active.pointerId)) sceneRef.current.releasePointerCapture(active.pointerId);
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
    update({ setting: value, items: value === 'courtyard' ? starterScene() : rooftopScene() }); setSelectedId(null);
    setStatus('নমুনাটা সাজিয়ে দিলাম। পছন্দ না হলে “এক ধাপ পেছাও” চাপো।');
  }

  const who = friend?.name ? possessive(friend.name) : 'তোমার বন্ধুর';
  const caption = place.trim() ? `আমার পাড়া, ${text.place}। এমনই ছিল আমার ছোটবেলার বিকেল। তোমার পাড়াটা কেমন ছিল?` : 'নিজের পাড়াটা সাজিয়ে একটা পোস্টকার্ড বানালাম। তোমার পাড়াটা কেমন ছিল?';

  return <div className="para-tool">
    {friend && <section className="para-friend" aria-labelledby="friend-title">
      <canvas ref={friendCard} width={cardSizes.feed.width} height={cardSizes.feed.height} role="img" aria-label={`${who} পাড়ার পোস্টকার্ড`} />
      <div>
        <p className="para-friend-kicker">তোমার নামে একটা পোস্টকার্ড এসেছে</p>
        <h2 id="friend-title">{who} পাড়া, {cardText(friend).place} থেকে।<br /><span>তোমার পাড়াটা কেমন ছিল?</span></h2>
        <a className="kit-primary" href="#para-scene">আমার পাড়া সাজাই</a>
      </div>
      <div hidden><ScenePicture setting={friend.setting} items={friend.items} svgRef={friendScene} /></div>
    </section>}

    <div className="para-photo" id="para-scene">
      <ScenePicture setting={setting} items={items} svgRef={sceneRef}
        interaction={{ className: 'para-scene', tabIndex: 0, 'aria-describedby': 'scene-keyboard-help', onKeyDown: canvasKey, onPointerDown: startDrag, onPointerMove: moveDrag, onPointerUp: finishDrag, onPointerCancel: event => cancelDrag(event.pointerId), onLostPointerCapture: event => cancelDrag(event.pointerId), onClick: tapScene }}
        ground={<path data-ground="true" d="m72 426 408-218 408 212-408 221Z" fill="transparent" cursor={selected ? 'crosshair' : 'default'} />}
        overlay={selected && selectedKind && <g data-export-ignore="true" pointerEvents="none" transform={`translate(${selected.x} ${selected.y})`}><ellipse cy="4" rx={selectedKind.width / 2 + 9} ry="22" fill="none" stroke="#466b56" strokeWidth="3" strokeDasharray="6 5" /><rect x={-selectedKind.width / 2 - 10} y={-selectedKind.height - 10} width={selectedKind.width + 20} height={selectedKind.height + 34} rx="12" fill="none" stroke="#537860" strokeOpacity=".6" strokeWidth="2" strokeDasharray="4 6" /></g>} />
    </div>
    <p className="para-status" role="status" aria-live="polite">{status || 'জিনিস ধরে টেনে সরাও, নিচের তাক থেকে ছুঁয়ে নতুন বসাও।'}</p>

    <div className="para-shelf" role="group" aria-label={`যা যা বসানো যায়, ${bn(items.length)} / ${bn(MAX_OBJECTS)}টা বসানো`}>
      {(Object.keys(objects) as ObjectKind[]).map(kind => { const object = objects[kind]; return <button key={kind} type="button" disabled={items.length >= MAX_OBJECTS} onClick={() => add(kind)} aria-label={`${object.label} বসাও`}>
        <svg viewBox={`${-object.width / 2 - 14} ${-object.height - 12} ${object.width + 28} ${object.height + 44}`} aria-hidden="true"><ObjectArt kind={kind} /></svg><span>{object.label}</span>
      </button>; })}
    </div>

    <div className="para-move">
      <label className="para-select"><span>কোনটা সরাবে?</span><select value={selectedId ?? ''} onChange={event => setSelectedId(event.target.value || null)}><option value="">একটা জিনিস বেছে নাও</option>{items.map((item, index) => <option key={item.id} value={item.id}>{objects[item.kind].label} · {bn(index + 1)}</option>)}</select></label>
      <div className="para-arrows" role="group" aria-label="জায়গা বদলাও">{directions.map(direction => <button type="button" key={direction.label} disabled={!selected} aria-label={selectedKind ? `${selectedKind.label} ${direction.label} সরাও` : `${direction.label} সরাও`} onClick={() => selected && reposition({ x: selected.x + direction.x, y: selected.y + direction.y })}><span aria-hidden="true">{direction.symbol}</span></button>)}</div>
      <button type="button" className="para-remove" disabled={!selected} onClick={removeSelected}>বাদ দাও</button>
    </div>
    <p className="para-hint" id="scene-keyboard-help">একবার ছুঁয়ে বেছে নিয়ে মাটিতে অন্য কোথাও চাপলেও সরে যাবে। কিবোর্ডে ছবিটায় থেকে Enter দিয়ে বাছো, তির দিয়ে সরাও, Delete দিয়ে বাদ দাও।</p>

    <div className="para-tools">
      <div className="para-toggle" role="group" aria-label="কোথায় সাজাবে">{settings.map(([value, label]) => <button type="button" key={value} aria-pressed={setting === value} onClick={() => { update({ setting: value }); setStatus(`এবার ${label}। জিনিসগুলো যেখানে ছিল সেখানেই আছে।`); }}>{label}</button>)}</div>
      <div className="para-history"><button type="button" disabled={!editor.canUndo || preview !== null} onClick={() => historyStep('undo')}>এক ধাপ পেছাও</button><button type="button" disabled={!editor.canRedo || preview !== null} onClick={() => historyStep('redo')}>এক ধাপ এগোও</button></div>
      <p className="para-presets"><span>নতুন করে:</span><button type="button" className="kit-link" disabled={preview !== null} onClick={() => usePreset('courtyard')}>উঠোনের বিকেল</button><button type="button" className="kit-link" disabled={preview !== null} onClick={() => usePreset('rooftop')}>ছাদের আড্ডা</button><button type="button" className="kit-link" disabled={preview !== null || !items.length} onClick={() => setResetOpen(true)}>সব সরাও</button></p>
    </div>
    {resetOpen && <div className="para-confirm" role="alert"><p><strong>সব জিনিস সরিয়ে খালি জায়গা থেকে শুরু করবে?</strong> মন বদলালে “এক ধাপ পেছাও” চাপলেই ফেরত আসবে।</p><div><button type="button" className="kit-primary" onClick={() => { update({ items: [] }); setSelectedId(null); setResetOpen(false); setStatus('সব সরানো হলো। তাক থেকে জিনিস ছুঁয়ে আবার সাজাও।'); }}>হ্যাঁ, সব সরাও</button><button type="button" className="kit-secondary" onClick={() => setResetOpen(false)}>না, থাক</button></div></div>}

    <StickyNext show={editor.canUndo && !resultVisible && preview === null} title={<><strong>পাড়া</strong> সাজানো হলো</>} sub="নাম লিখে পোস্টকার্ড বানাও" href="#result" label="পোস্টকার্ড বানাও" />

    <section className="para-result" id="result" ref={result} aria-labelledby="result-title">
      <h2 id="result-title">পাড়া থেকে একটা পোস্টকার্ড</h2>
      <p className="para-result-lead">পাড়া বা গ্রামের নাম লিখলে ডাকঘরের সিলে আর শুভেচ্ছায় বসে যাবে।</p>
      <div className="para-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={card} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-describedby="postcard-summary" />
          <figcaption id="postcard-summary" className="para-sr">শুভেচ্ছা, {text.greeting}। {text.line} {text.signature}</figcaption>
          {previewError && <p className="kit-status" role="alert">পোস্টকার্ডটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="para-result-controls">
          <label className="para-field"><span>পাড়া বা গ্রামের নাম</span><input value={place} maxLength={MAX_PLACE_LENGTH} onChange={event => setPlace(event.target.value)} placeholder="যেমন: কাশিমপুর" autoComplete="off" /></label>
          <div className="para-field-row">
            <label className="para-field"><span>জেলা <small>চাইলে</small></span><input value={district} maxLength={MAX_DISTRICT_LENGTH} onChange={event => setDistrict(event.target.value)} placeholder="যেমন: গাজীপুর" autoComplete="off" /></label>
            <label className="para-field"><span>তোমার নাম <small>চাইলে</small></span><input value={name} maxLength={MAX_NAME_LENGTH} onChange={event => setName(event.target.value)} placeholder="যেমন: রাফি" autoComplete="nickname" /></label>
          </div>
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={TOOL} fileName="chhotto-para.png" makeImage={async () => cardBlob(await svgImage(sceneRef.current!, sceneViewport.width, sceneViewport.height), text, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} disabled={!editor.value.items.length || preview !== null} hint={editor.value.items.length ? 'লিংক পেলে বন্ধু তোমার পোস্টকার্ড দেখবে, তারপর নিজের পাড়াটা সাজাবে।' : 'আগে তাক থেকে কয়েকটা জিনিস বসাও।'} />
        </div>
      </div>
    </section>
  </div>;
}
