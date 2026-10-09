'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { ArtworkDownloads } from '../../../shared/art-downloads';
import { FittedSvgText } from '../../../shared/fitted-svg-text';
import { useHistory } from '../../../shared/use-history';
import { cellAt, cellLines, cellName, cellPosition, colors, days, editCell, grid, limitText, parts, presetCells, swapCells, type Cell, type Routine } from '../lib/routine';
import '../product.css';

type Point = { x: number; y: number };
type CellDrag = { pointerId: number; source: number; start: Point; clientStart: Point; routine: Routine; moved: boolean; point: Point; target: number | null };

export function Editor() {
  const editor = useHistory<Routine>(() => ({ title: 'আমার সপ্তাহ', cells: presetCells('study') }));
  const [selected, setSelected] = useState(0);
  const [destination, setDestination] = useState(1);
  const [notice, setNotice] = useState('শুরুতে একটা নমুনা দেওয়া আছে। নিজের কাজ লিখে বদলে নাও।');
  const [preview, setPreview] = useState<{ source: number; point: Point; target: number | null } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<CellDrag | null>(null);
  const current = editor.value.cells[selected];

  function changeCell(change: Partial<Cell>) {
    if (!drag.current) editor.commit(value => ({ ...value, cells: editCell(value.cells, selected, change) }));
  }

  function swap(from: number, to: number) {
    if (drag.current) return;
    editor.commit(value => ({ ...value, cells: swapCells(value.cells, from, to) }));
    setSelected(to);
    setNotice(`${cellName(from)} আর ${cellName(to)}, দুই ঘরের কাজ আর রং অদলবদল হয়েছে।`);
  }

  function canvasPoint(point: Point): Point | null {
    const svg = svgRef.current;
    const matrix = svg?.getScreenCTM();
    if (!svg || !matrix) return null;
    const local = svg.createSVGPoint();
    local.x = point.x; local.y = point.y;
    return local.matrixTransform(matrix.inverse());
  }

  function startDrag(event: PointerEvent<SVGSVGElement>) {
    if (drag.current || !event.isPrimary || event.button !== 0) return;
    const raw = (event.target as Element).closest('[data-week-cell]')?.getAttribute('data-week-cell');
    if (raw === null || raw === undefined) return;
    const source = Number(raw);
    setSelected(source);
    event.currentTarget.focus({ preventScroll: true });
    if (!editor.value.cells[source].text) return;
    const clientStart = { x: event.clientX, y: event.clientY };
    const start = canvasPoint(clientStart);
    if (!start) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, source, start, clientStart, routine: editor.value, moved: false, point: start, target: source };
  }

  function moveDrag(event: PointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    const client = { x: event.clientX, y: event.clientY };
    if (!active.moved && Math.hypot(client.x - active.clientStart.x, client.y - active.clientStart.y) < 4) return;
    const point = canvasPoint(client);
    if (!point) return;
    event.preventDefault();
    active.moved = true;
    active.target = cellAt(point);
    const origin = cellPosition(active.source);
    active.point = { x: origin.x + point.x - active.start.x, y: origin.y + point.y - active.start.y };
    setPreview({ source: active.source, point: active.point, target: active.target });
  }

  function finishDrag(event: PointerEvent<SVGSVGElement>) {
    const active = drag.current;
    if (!active || active.pointerId !== event.pointerId) return;
    moveDrag(event);
    drag.current = null;
    setPreview(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!active.moved) return;
    if (active.target === null) { setNotice('ঘরের বাইরে ছেড়েছ, কাজটা আগের ঘরেই আছে।'); return; }
    editor.commit({ ...active.routine, cells: swapCells(active.routine.cells, active.source, active.target) });
    setSelected(active.target);
    setNotice('দুই ঘরের কাজ আর রং অদলবদল হয়েছে। ভুল হলে ‘এক ধাপ পেছাও’ চাপো।');
  }

  function cancelDrag(pointerId?: number) {
    const active = drag.current;
    if (!active || (pointerId !== undefined && pointerId !== active.pointerId)) return;
    drag.current = null;
    setPreview(null);
    if (svgRef.current?.hasPointerCapture(active.pointerId)) svgRef.current.releasePointerCapture(active.pointerId);
    setNotice('টানা বাতিল হয়েছে, ছক আগের মতোই আছে।');
  }

  function historyStep(step: 'undo' | 'redo') {
    if (drag.current) { cancelDrag(); return; }
    if (step === 'undo') editor.undo(); else editor.redo();
    setNotice(step === 'undo' ? 'এক ধাপ পেছনে গেছে।' : 'এক ধাপ এগিয়েছে।');
  }

  function canvasKey(event: KeyboardEvent<SVGSVGElement>) {
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Escape') { event.preventDefault(); cancelDrag(); return; }
    if (drag.current) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault(); historyStep(event.shiftKey ? 'redo' : 'undo'); return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    const row = Math.floor(selected / 4);
    const column = selected % 4;
    const next = event.key === 'ArrowLeft' ? row * 4 + Math.max(0, column - 1) : event.key === 'ArrowRight' ? row * 4 + Math.min(3, column + 1) : event.key === 'ArrowUp' ? Math.max(0, row - 1) * 4 + column : event.key === 'ArrowDown' ? Math.min(6, row + 1) * 4 + column : null;
    if (next !== null) {
      event.preventDefault();
      if (event.shiftKey) swap(selected, next); else setSelected(next);
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault(); changeCell({ text: '' });
    }
  }

  function preset(value: 'study' | 'home' | 'empty') {
    if (drag.current) return;
    editor.commit(routine => ({ ...routine, cells: presetCells(value) }));
    setNotice(value === 'empty' ? 'ছক খালি হয়ে গেছে। ভুল হলে ‘এক ধাপ পেছাও’ চাপো।' : 'নমুনা ছক চলে এসেছে। এবার নিজের মতো বদলে নাও।');
  }

  function changeTitle(text: string) {
    if (!drag.current) editor.commit(value => ({ ...value, title: limitText(text, 40) }));
  }

  async function print() {
    try { await document.fonts.ready; window.print(); }
    catch { setNotice('প্রিন্টের পাতা খুলল না। ব্রাউজারের মেনু থেকে প্রিন্ট করে দেখো।'); }
  }

  return <div className="studio-grid week-editor">
    <div className="studio-preview week-preview">
      <svg ref={svgRef} className="studio-art week-art" viewBox="0 0 1080 1160" width="1080" height="1160" role="img" tabIndex={0} aria-label={`${editor.value.title || 'আমার সপ্তাহ'}: সাত দিন, চার বেলার রুটিনের ছক`} aria-describedby="week-keyboard-help" onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={event => cancelDrag(event.pointerId)} onLostPointerCapture={event => cancelDrag(event.pointerId)} onKeyDown={canvasKey}>
        <rect width="1080" height="1160" fill="#fcfbf7"/>
        <rect x="48" y="45" width="8" height="62" rx="3" fill="#d9aa50"/>
        <FittedSvgText x="76" y="82" fontSize={36} fontWeight="600" fill="#284977" maxWidth={940}>{editor.value.title || 'আমার সপ্তাহ'}</FittedSvgText>
        <text x="76" y="119" fontFamily="Bangla" fontSize="17" fill="#7a8798">কাজের ফাঁকে নিজের জন্যও একটু সময়</text>
        <text x="60" y="182" fontFamily="Bangla" fontSize="18" fill="#78859a">দিন / বেলা</text>
        {parts.map((part, column) => <g key={part}><rect x={grid.x + column * (grid.width + grid.gap)} y="157" width={grid.width} height="43" rx="6" fill="#37599a"/><text x={grid.x + column * (grid.width + grid.gap) + grid.width / 2} y="186" textAnchor="middle" fontFamily="Bangla" fontSize="22" fill="white">{part}</text></g>)}
        {days.map((day, row) => <text key={day} x="58" y={grid.y + row * (grid.height + grid.gap) + 63} fontFamily="Bangla" fontSize="23" fill="#425775">{day}</text>)}
        {editor.value.cells.map((cell, index) => {
          const position = cellPosition(index);
          return <g key={index} data-week-cell={index} transform={`translate(${position.x} ${position.y})`} cursor={cell.text ? 'grab' : 'pointer'}>
            <rect width={grid.width} height={grid.height} rx="7" fill={cell.text ? colors.find(color => color.id === cell.color)!.fill : '#f3f2ed'} stroke="#dce0e6"/>
            {cellLines(cell.text).map((line, lineIndex) => <FittedSvgText key={lineIndex} x="14" y={46 + lineIndex * 29} fontSize={22} maxWidth={grid.width - 28} fill="#33445e">{line}</FittedSvgText>)}
            <g data-export-ignore="true" pointerEvents="none">{!cell.text && <text x={grid.width / 2} y="66" textAnchor="middle" fontSize="24" fill="#bcc4cc">+</text>}{(selected === index || preview?.target === index) && <rect x="2" y="2" width={grid.width - 4} height={grid.height - 4} rx="6" fill="none" stroke={preview?.target === index ? '#b48027' : '#37599a'} strokeWidth="4"/>}</g>
          </g>;
        })}
        {preview && <g data-export-ignore="true" pointerEvents="none" transform={`translate(${preview.point.x} ${preview.point.y})`} opacity=".85"><rect width={grid.width} height={grid.height} rx="7" fill={colors.find(color => color.id === editor.value.cells[preview.source].color)!.fill} stroke="#37599a" strokeWidth="3"/>{cellLines(editor.value.cells[preview.source].text).map((line, index) => <FittedSvgText key={index} x="14" y={46 + index * 29} fontSize={22} maxWidth={grid.width - 28} fill="#33445e">{line}</FittedSvgText>)}</g>}
        <path d="M48 1100h984" stroke="#d9dfe5"/>
        <text x="48" y="1133" fontFamily="Bangla" fontSize="17" fill="#6c7a8e">সপ্তাহের ছক · একটুখানি</text>
        <text x="1032" y="1133" textAnchor="end" fontFamily="Bangla" fontSize="15" fill="#8290a0">নিজের হাতে সাজানো সপ্তাহ</text>
      </svg>
      <p className="studio-note" id="week-keyboard-help">কাজের ঘর চেপে ধরে অন্য ঘরে টেনে নাও। কিবোর্ডে: তিরচিহ্নে ঘর বাছো, Shift আর তিরচিহ্নে বদলাও, Delete চাপলে লেখা মুছবে, Escape চাপলে টানা বাতিল হবে।</p>
      <div className="studio-history"><button type="button" disabled={!editor.canUndo || preview !== null} onClick={() => historyStep('undo')}>এক ধাপ পেছাও</button><button type="button" disabled={!editor.canRedo || preview !== null} onClick={() => historyStep('redo')}>এক ধাপ এগোও</button></div>
      <div inert={preview !== null}><ArtworkDownloads svgRef={svgRef} filename="আমার-সপ্তাহের-ছক"/></div>
      <div className="studio-actions"><button type="button" disabled={preview !== null} onClick={print}>ছক প্রিন্ট করো</button></div>
    </div>
    <div className="studio-panel" inert={preview !== null}>
      <h2>একটা ঘর বেছে লেখো</h2>
      <div className="week-selectors"><label className="studio-label" htmlFor="week-day">দিন<select id="week-day" value={Math.floor(selected / 4)} onChange={event => setSelected(Number(event.target.value) * 4 + selected % 4)}>{days.map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><label className="studio-label" htmlFor="week-part">বেলা<select id="week-part" value={selected % 4} onChange={event => setSelected(Math.floor(selected / 4) * 4 + Number(event.target.value))}>{parts.map((part, index) => <option key={part} value={index}>{part}</option>)}</select></label></div>
      <label className="studio-label" htmlFor="week-task">{cellName(selected)}: কী করবে?</label><input id="week-task" value={current.text} onChange={event => changeCell({ text: event.target.value })} placeholder="যেমন: গণিত অনুশীলন"/><p className="studio-note">৩২ অক্ষরের মধ্যে লেখো। যা লিখবে, ছবিতে সেটাই থাকবে।</p>
      <fieldset><legend>ঘরের রং</legend><div className="studio-choices week-colors">{colors.map(color => <button type="button" key={color.id} aria-pressed={current.color === color.id} onClick={() => changeCell({ color: color.id })}><span style={{ background: color.fill }}/>{color.name}</button>)}</div></fieldset>
      <div className="week-swap"><label className="studio-label" htmlFor="week-destination">কোন ঘরের সাথে বদলাবে?</label><select id="week-destination" value={destination} onChange={event => setDestination(Number(event.target.value))}>{editor.value.cells.map((cell, index) => <option key={index} value={index}>{cellName(index)}{cell.text ? ` — ${cell.text}` : ''}</option>)}</select><div className="studio-actions"><button type="button" disabled={selected === destination} onClick={() => swap(selected, destination)}>দুই ঘর বদলাও</button><button type="button" disabled={!current.text} onClick={() => changeCell({ text: '' })}>এই ঘর খালি করো</button></div></div>
      <label className="studio-label" htmlFor="week-title">ছকের নাম</label><input id="week-title" value={editor.value.title} onChange={event => changeTitle(event.target.value)}/>
      <fieldset className="week-presets"><legend>নমুনা থেকে শুরু করো</legend><div className="studio-choices"><button type="button" onClick={() => preset('study')}>পড়া ও বিরতি</button><button type="button" onClick={() => preset('home')}>ঘরের কাজ</button><button type="button" onClick={() => preset('empty')}>ছক খালি করো</button></div></fieldset>
      <p className="studio-live" role="status">{notice}</p><p className="studio-note">এটা কোনো রিমাইন্ডার দেয় না। পাতা বন্ধের আগে ছবি নামিয়ে রাখো বা প্রিন্ট করে নাও।</p>
    </div>
  </div>;
}
