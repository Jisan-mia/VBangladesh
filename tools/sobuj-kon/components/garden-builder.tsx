'use client';
import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { FittedSvgText } from '../../../shared/fitted-svg-text';
import { ArtworkDownloads } from '../../../shared/art-downloads';
import { useHistory } from '../../../shared/use-history';
import { draggedPotPosition, gardenList, initialGarden, nearestSlot, plants, replacePlant, slots, swapPlants, type GardenPoint, type PlantId } from '../lib/garden';
import { PlantArt } from './plant-art';
const numeral = new Intl.NumberFormat('bn-BD');
const potColors = [{name:'পোড়ামাটি',color:'#bd7858'},{name:'চুনসাদা',color:'#e3d9c3'},{name:'নীল',color:'#6c8c9f'}];
const lights = [{name:'সকালের আলো',sky:'#e0ece7',wall:'#ecdfc6',floor:'#c6b292'},{name:'বিকেলের আলো',sky:'#f5d9b5',wall:'#f0cba9',floor:'#d4ac83'}];
type GardenDocument = { garden: Array<PlantId | null>; potIndex: number; lightIndex: number; caption: string };
type PotDrag = { pointerId: number; from: number; start: GardenPoint; clientStart: GardenPoint; document: GardenDocument; moved: boolean; position: GardenPoint; target: number | null };

export function GardenBuilder() {
  const editor = useHistory<GardenDocument>(() => ({ garden: [...initialGarden], potIndex: 0, lightIndex: 0, caption: 'আমার সবুজ কোণ' }));
  const { garden, potIndex, lightIndex, caption } = editor.value;
  const [selected, setSelected] = useState(3);
  const [notice, setNotice] = useState('');
  const [preview, setPreview] = useState<{ from: number; position: GardenPoint; target: number | null } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<PotDrag | null>(null);
  const light = lights[lightIndex];
  const list = gardenList(garden);

  function update(change: Partial<GardenDocument>) {
    if (!drag.current) editor.commit(current => ({ ...current, ...change }));
  }

  function place(plant: PlantId | null) {
    update({ garden: replacePlant(garden, selected, plant) });
    setNotice(plant ? 'এই জায়গায় গাছ বসেছে।' : 'এই জায়গার টব সরানো হয়েছে।');
  }

  function pointInGarden(client: GardenPoint): GardenPoint | null {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const point = svg.createSVGPoint();
    point.x = client.x; point.y = client.y;
    return point.matrixTransform(matrix.inverse());
  }

  function startDrag(event: PointerEvent<SVGSVGElement>) {
    if (drag.current || !event.isPrimary || event.button !== 0) return;
    const value = (event.target as Element).closest('[data-garden-slot]')?.getAttribute('data-garden-slot');
    if (value === null || value === undefined) return;
    const from = Number(value);
    setSelected(from);
    event.currentTarget.focus({ preventScroll: true });
    if (!garden[from]) return;
    const clientStart = { x: event.clientX, y: event.clientY };
    const start = pointInGarden(clientStart);
    if (!start) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, from, start, clientStart, document: editor.value, moved: false, position: slots[from], target: from };
  }

  function moveDrag(event: PointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const client = { x: event.clientX, y: event.clientY };
    if (!active.moved && Math.hypot(client.x - active.clientStart.x, client.y - active.clientStart.y) < 4) return;
    const point = pointInGarden(client);
    if (!point) return;
    event.preventDefault();
    active.moved = true;
    active.position = draggedPotPosition(slots[active.from], active.start, point);
    active.target = nearestSlot(active.position);
    setPreview({ from: active.from, position: active.position, target: active.target });
  }

  function finishDrag(event: PointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    moveDrag(event);
    drag.current = null;
    setPreview(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!active.moved) return;
    if (active.target === null) { setNotice('টবটি কোনো জায়গায় রাখা হয়নি। আগের জায়গায় ফিরেছে।'); return; }
    editor.commit({ ...active.document, garden: swapPlants(active.document.garden, active.from, active.target) });
    setSelected(active.target);
    setNotice('টবের জায়গা বদলেছে। সেখানে আরেকটি টব থাকলে দুটির জায়গা বদলানো হয়েছে।');
  }

  function cancelDrag(pointerId?: number) {
    const active = drag.current;
    if (!active || (pointerId !== undefined && active.pointerId !== pointerId)) return;
    drag.current = null;
    setPreview(null);
    if (svgRef.current?.hasPointerCapture(active.pointerId)) svgRef.current.releasePointerCapture(active.pointerId);
    setNotice('টেনে সরানো বাতিল হয়েছে। টব আগের জায়গাতেই আছে।');
  }

  function historyStep(step: 'undo' | 'redo') {
    if (drag.current) { cancelDrag(); return; }
    if (step === 'undo') editor.undo(); else editor.redo();
    setNotice(step === 'undo' ? 'আগের ধাপে ফিরেছেন।' : 'পরের ধাপে ফিরেছেন।');
  }

  function canvasKey(event: KeyboardEvent<SVGSVGElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Escape') { event.preventDefault(); cancelDrag(); return; }
    if (drag.current) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault(); historyStep(event.shiftKey ? 'redo' : 'undo'); return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault();
      const step = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const next = (selected + step + slots.length) % slots.length;
      if (event.shiftKey) update({ garden: swapPlants(garden, selected, next) });
      setSelected(next);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault(); place(null);
    }
  }

  function preset(kind: 'initial' | 'flowers' | 'empty') {
    const next: Array<PlantId | null> = kind === 'initial' ? [...initialGarden] : kind === 'flowers' ? ['marigold', 'marigold', 'hibiscus', null, 'hibiscus', 'vine'] : slots.map(() => null);
    update({ garden: next });
    setNotice(kind === 'empty' ? 'সব টব সরানো হয়েছে। আগের ধাপ বোতামে ফিরিয়ে নিতে পারবেন।' : 'নমুনা সাজানো হয়েছে। ছবির নাম, রং ও আলো একই আছে।');
  }

  return <div className="garden-workspace"><div className="garden-stage creative-preview"><svg ref={svgRef} viewBox="0 0 900 720" width="900" height="720" role="img" tabIndex={0} aria-describedby="garden-keyboard-help" onKeyDown={canvasKey} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={event => cancelDrag(event.pointerId)} onLostPointerCapture={event => cancelDrag(event.pointerId)} aria-label={`${caption || 'আমার সবুজ কোণ'} — ${numeral.format(garden.filter(Boolean).length)}টি গাছের সাজানো বারান্দা`}>
    <rect width="900" height="720" fill="#f6f3eb"/><circle cx="742" cy="155" r="51" fill={light.sky}/><path d="M129 167 585 77 799 238 740 555 441 650 100 497Z" fill="#e8e4d9" opacity=".45"/><path d="m142 165 335-80 287 172-346 95Z" fill={light.sky}/><path d="m142 165 335-80v265L142 469Z" fill={light.wall}/><path d="m477 85 287 172v276L477 350Z" fill="#e6d9c3"/><path d="m142 469 335-119 287 183-326 110Z" fill={light.floor}/><path d="m230 438 326 176m-225-211 325 178m-214-216 296 174M202 507l325-119M303 563l325-118M404 621l325-122" stroke="#af9879" strokeWidth="1.2" opacity=".5"/>
    <path d="m519 151 182 109v141L519 292Z" fill="#507372" stroke="#718579" strokeWidth="7"/><path d="m533 171 62 37v105l-62-36Z" fill="#acbcb1"/><path d="m609 217 79 47v108l-79-48Z" fill="#c8d6c6"/><path d="m617 255 26-27 27 44M540 225l29-39" stroke="#f3ead8" opacity=".5" strokeWidth="6"/>
    <path d="m201 304 210 53 48-17-211-52Z" fill="#a17b56"/><path d="m201 304 210 53v13l-210-53Z" fill="#7b6249"/><path d="M235 316v26m139 9v22" stroke="#796649" strokeWidth="8"/>
    {slots.map((slot,index)=><g key={slot.label} transform={`translate(${slot.x} ${slot.y}) scale(${slot.size})`} data-garden-slot={index} style={{cursor:garden[index] ? 'grab' : 'pointer'}}>{garden[index] && preview?.from !== index && <PlantArt kind={garden[index]!} pot={potColors[potIndex].color}/>}<g data-export-ignore="true"><ellipse cx="0" cy="5" rx="52" ry="18" fill={preview?.target===index?'#e3ba5566':selected===index?'#38634822':'transparent'} stroke={selected===index?'#386348':'#927b60'} strokeWidth={selected===index?3:1} strokeDasharray={selected===index?'0':'4 4'}/><circle cx="42" cy="-3" r="13" fill={selected===index?'#386348':'#f9f5eb'}/><text x="42" y="2" textAnchor="middle" fill={selected===index?'white':'#4c614d'} fontSize="15" fontFamily="Bangla">{numeral.format(index+1)}</text></g></g>)}
    {preview && garden[preview.from] && <g data-export-ignore="true" pointerEvents="none" transform={`translate(${preview.position.x} ${preview.position.y}) scale(${slots[preview.from].size})`}><PlantArt kind={garden[preview.from]!} pot={potColors[potIndex].color}/></g>}
    <path d="m142 468 296 175 326-110M142 417l296 171 326-108" fill="none" stroke="#53635c" strokeWidth="7"/>{[0,.2,.4,.6,.8,1].map(t=><path key={t} d={`M${142+296*t} ${417+171*t}v53M${438+326*t} ${588-108*t}v55`} stroke="#53635c" strokeWidth="4"/>)}
    <FittedSvgText x="72" y="60" fill="#365442" fontSize={29} maxWidth={756} fontWeight="600">{caption||'আমার সবুজ কোণ'}</FittedSvgText><text x="72" y="93" fill="#607364" fontSize="15" fontFamily="Bangla">নিজের মতো সাজানো বারান্দা</text><text x="72" y="693" fill="#607364" fontSize="13" fontFamily="Bangla">সাজানোর ছবি · মাপ অনুযায়ী নির্মাণ বা গাছের পরিচর্যার পরিকল্পনা নয়</text>
  </svg><p className="garden-editor-help" id="garden-keyboard-help">টব টেনে অন্য নম্বরে রাখুন। সেখানে টব থাকলে জায়গা বদলাবে। ছবিতে ফোকাস থাকলে তিরচিহ্নে জায়গা বাছুন, Shift ও তিরচিহ্নে টব সরান, Delete দিয়ে বাদ দিন।</p><div className="garden-editor-actions"><button type="button" disabled={!editor.canUndo || preview !== null} onClick={() => historyStep('undo')}>আগের ধাপ</button><button type="button" disabled={!editor.canRedo || preview !== null} onClick={() => historyStep('redo')}>পরের ধাপ</button></div><div inert={preview !== null}><ArtworkDownloads svgRef={svgRef} filename="আমার-সবুজ-কোণ"/></div></div><div className="creative-controls garden-controls"><h2>একটি টব দিয়ে শুরু করুন</h2><div className="garden-presets"><span>নমুনা সাজান</span><button type="button" onClick={() => preset('initial')}>শুরুর সাজ</button><button type="button" onClick={() => preset('flowers')}>ফুলের কোণ</button><button type="button" onClick={() => preset('empty')}>সব টব সরান</button></div><fieldset><legend>কোথায় বসাবেন?</legend><div className="garden-positions">{slots.map((slot,index)=><button key={slot.label} className="creative-choice" aria-pressed={selected===index} aria-label={`${numeral.format(index+1)} — ${slot.label}`} onClick={()=>setSelected(index)}>{numeral.format(index+1)}</button>)}</div><p className="creative-help" role="status">বেছে নিয়েছেন: {slots[selected].label}{notice && `। ${notice}`}</p></fieldset><fieldset><legend>কোন গাছটি রাখবেন?</legend><div className="garden-plants">{plants.map(plant=><button className="garden-plant" key={plant.id} aria-pressed={garden[selected]===plant.id} onClick={()=>place(plant.id)}><svg viewBox="-90 -220 180 250" width="70" height="85" aria-hidden="true"><PlantArt kind={plant.id} pot={potColors[potIndex].color}/></svg><span>{plant.name}</span></button>)}</div><button className="garden-remove" onClick={()=>place(null)} disabled={!garden[selected]}>এই জায়গার টব সরান</button></fieldset><fieldset><legend>টবের রং</legend><div className="creative-choices">{potColors.map((color,index)=><button className="creative-choice" key={color.name} aria-pressed={potIndex===index} onClick={()=>update({ potIndex: index })}>{color.name}</button>)}</div></fieldset><fieldset><legend>ছবির আলো</legend><div className="creative-choices">{lights.map((item,index)=><button className="creative-choice" key={item.name} aria-pressed={lightIndex===index} onClick={()=>update({ lightIndex: index })}>{item.name}</button>)}</div></fieldset><label className="creative-label" htmlFor="garden-name">ছবির নাম</label><input id="garden-name" value={caption} onChange={event=>update({ caption: Array.from(new Intl.Segmenter('bn',{granularity:'grapheme'}).segment(event.target.value),item=>item.segment).slice(0,26).join('') })}/><p className="creative-help">এটি গাছ দিয়ে ছবি সাজানোর জায়গা। ছবির আলো বদলালে গাছের উপযোগিতা যাচাই হয় না।</p></div><section className="garden-list" aria-labelledby="garden-list-heading"><div><p className="eyebrow">ছবির সঙ্গে গাছের তালিকা</p><h2 id="garden-list-heading">যে গাছগুলো রেখেছেন</h2><p>কেনার আগে স্থানীয় নার্সারিতে আপনার বারান্দার আলো ও জায়গার সঙ্গে মিলিয়ে নিন।</p></div><div>{list.length ? <ul>{list.map(plant=><li key={plant.id}><span>{plant.name}</span><strong>{numeral.format(plant.count)}টি</strong></li>)}</ul> : <p>এখনো কোনো গাছ রাখা নেই। উপরের জায়গা বেছে একটি গাছ বসান।</p>}<button className="button-secondary" disabled={preview !== null} onClick={()=>window.print()}>ছবি ও তালিকা প্রিন্ট করুন</button></div></section><div className="garden-print-notes"><h2>সাজানোর আগে মিলিয়ে নিন</h2><ul><li>কতক্ষণ সরাসরি রোদ আসে, দেখে নিন।</li><li>টবের পানি বের হওয়ার ব্যবস্থা ও চলাচলের জায়গা রাখুন।</li><li>গাছের পরিচর্যা স্থানীয় নার্সারিতে জেনে নিন।</li><li>ছবির মাপ দেখে তাক বা ভারী টব বসানোর সিদ্ধান্ত নেবেন না।</li></ul></div></div>;
}
