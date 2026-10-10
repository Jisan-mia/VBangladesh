'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { cardSizes, loadCardFonts, type CardFormat } from '../../../shared/card-canvas';
import { FormatToggle, ShareBar, StickyNext, useInView } from '../../../shared/share-kit';
import { ticketBlob, drawTicket } from '../lib/draw-ticket';
import { fareSource, stations } from '../lib/fares';
import { bn, createTicket, defaultTrip, MAX_PEOPLE, parseTrip, tripHash, type Trip } from '../lib/ticket';

const TOOL = 'bhara';

export function FareCalculator() {
  const [trip, setTrip] = useState<Trip>(defaultTrip);
  const [shared, setShared] = useState(false);
  const [touched, setTouched] = useState(false);
  const [format, setFormat] = useState<CardFormat>('feed');
  const [site, setSite] = useState('');
  const [message, setMessage] = useState('');
  const [previewError, setPreviewError] = useState(false);
  const preview = useRef<HTMLCanvasElement>(null);
  const result = useRef<HTMLElement>(null);
  const resultVisible = useInView(result);
  const ticket = useMemo(() => createTicket(trip), [trip]);
  const state = tripHash(trip);

  useEffect(() => {
    const opened = parseTrip(window.location.hash);
    if (opened) { setTrip(opened); setShared(true); }
    // Chart and in-page anchors also change the hash; only a real route replaces the trip.
    const follow = () => { const next = parseTrip(window.location.hash); if (next) setTrip(next); };
    window.addEventListener('hashchange', follow);
    setSite(window.location.host);
    return () => window.removeEventListener('hashchange', follow);
  }, []);

  useEffect(() => {
    if (!ticket) return;
    let cancelled = false;
    loadCardFonts('উত্তরা মতিঝিল ভাড়া').then(() => {
      if (cancelled || !preview.current) return;
      drawTicket(preview.current, ticket, format, site);
      setPreviewError(false);
    }).catch(() => { if (!cancelled) setPreviewError(true); });
    return () => { cancelled = true; };
  }, [ticket, format, site]);

  function change(next: Partial<Trip>) { setTrip(current => ({ ...current, ...next })); setTouched(true); setMessage(''); }

  const summary = ticket ? `ভাড়া কত?\n${ticket.fromName} → ${ticket.toName}\nএকক যাত্রার টিকিট, একজনের একবারের ভাড়া: ${bn(ticket.fare)} টাকা\n${bn(ticket.people)} জন · ${ticket.journey}\nমোট ${bn(ticket.total)} টাকা\nপাসের বা অন্য কোনো ছাড়, আর স্টেশন পর্যন্ত যাওয়া-আসার খরচ ধরা নেই। ভাড়া ডিএমটিসিএলের সরকারি নথির সাথে মেলানো: ${fareSource.checked}। বের হওয়ার আগে ভাড়া বদলেছে কি না দেখে নিও। এটা টিকিট না।` : '';
  const caption = ticket ? `মেট্রোতে ${ticket.fromName} থেকে ${ticket.toName}: একজনের ভাড়া ${bn(ticket.fare)} টাকা${ticket.total !== ticket.fare ? `, ${bn(ticket.people)} জনের ${ticket.journey} মিলিয়ে ${bn(ticket.total)} টাকা` : ''}। তোমার স্টেশন থেকে কত, দেখে নাও:` : '';
  async function copy() {
    try { await navigator.clipboard.writeText(summary); setMessage('কপি হয়ে গেছে! যেখানে খুশি পেস্ট করো।'); }
    catch { setMessage('কপি হলো না। নিচে “হিসাবের পুরো লেখা” খুলে নিজে বেছে কপি করো।'); }
  }

  return <div className="ticket-tool">
    {shared && ticket && <div className="ticket-shared" role="note">
      <p><strong>তোমাকে এই হিসাবটা পাঠানো হয়েছে।</strong> ফেরার পথেও একজনের ভাড়া একই, {bn(ticket.fare)} টাকা।</p>
      <div><button type="button" className="kit-secondary" onClick={() => change({ from: trip.to, to: trip.from })}>ফেরার পথ দেখাও</button><a className="kit-link" href="#chart">সব স্টেশনের ভাড়া</a></div>
    </div>}

    <div className="ticket">
      <div className="ticket-band"><span>ঢাকা মেট্রোরেল</span><span>একক যাত্রা</span></div>
      <div className="ticket-route">
        <label className="ticket-field"><span>কোথা থেকে উঠবে</span><select value={trip.from} onChange={event => change({ from: Number(event.target.value) })}>{stations.map((station, index) => <option key={station} value={index}>{station}</option>)}</select></label>
        <button type="button" className="ticket-swap" onClick={() => change({ from: trip.to, to: trip.from })} aria-label="স্টেশন দুটো উল্টে দাও" title="উল্টে দাও"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4v15m0 0-4-4m4 4 4-4M16 20V5m0 0-4 4m4-4 4 4" /></svg></button>
        <label className="ticket-field"><span>কোথায় নামবে</span><select value={trip.to} onChange={event => change({ to: Number(event.target.value) })}>{stations.map((station, index) => <option key={station} value={index}>{station}</option>)}</select></label>
      </div>
      <ol className="ticket-line" aria-hidden="true">{stations.map((station, index) => <li key={station} data-end={index === trip.from || index === trip.to} data-ridden={index > Math.min(trip.from, trip.to) && index < Math.max(trip.from, trip.to)} />)}</ol>
      <div className="ticket-stub" aria-live="polite" aria-atomic="true">
        {ticket ? <p className="ticket-fare"><span>একজনের একবারের ভাড়া</span><strong>{bn(ticket.fare)}<small> টাকা</small></strong></p>
          : <p className="ticket-same">ওঠা আর নামার স্টেশন একই হয়ে গেছে। আলাদা দুটো স্টেশন বেছে নাও।</p>}
        <div className="ticket-group">
          <div className="ticket-people" role="group" aria-label="কয়জন যাবে">
            <button type="button" onClick={() => change({ people: trip.people - 1 })} disabled={trip.people <= 1} aria-label="একজন কমাও">−</button>
            <output>{bn(trip.people)} জন</output>
            <button type="button" onClick={() => change({ people: trip.people + 1 })} disabled={trip.people >= MAX_PEOPLE} aria-label="একজন বাড়াও">+</button>
          </div>
          <fieldset className="kit-chips ticket-journey"><legend className="ticket-sr">যাত্রা</legend>
            <button type="button" aria-pressed={trip.journeys === 1} onClick={() => change({ journeys: 1 })}>শুধু যাওয়া</button>
            <button type="button" aria-pressed={trip.journeys === 2} onClick={() => change({ journeys: 2 })}>যাওয়া-আসা</button>
          </fieldset>
        </div>
        {ticket && <p className="ticket-total"><span>মোট</span><strong>{bn(ticket.total)} টাকা</strong></p>}
        <p className="ticket-fine">একক যাত্রার টিকিট ধরে হিসাব। পাসের বা অন্য কোনো ছাড়, আর স্টেশন পর্যন্ত যাওয়ার খরচ এতে নেই। এটা টিকিট না।</p>
      </div>
    </div>

    <StickyNext show={touched && !!ticket && !resultVisible} title={<><strong>{ticket ? bn(ticket.total) : ''} টাকা</strong> মোট</>} sub={ticket ? `${ticket.fromName} → ${ticket.toName}` : ''} href="#result" label="হিসাবটা পাঠাও" />

    <section className="ticket-result" id="result" ref={result} aria-labelledby="result-title">{ticket && <>
      <h2 id="result-title">মেট্রোতে কেউ আসছে?<br /><span>ভাড়াটা আগেই জানিয়ে দাও</span></h2>
      <p className="ticket-result-line">{ticket.line}</p>
      <div className="ticket-result-body">
        <figure className="kit-card" data-format={format}>
          <canvas ref={preview} width={cardSizes[format].width} height={cardSizes[format].height} role="img" aria-label={`${ticket.fromName} থেকে ${ticket.toName}, একজনের ভাড়া ${bn(ticket.fare)} টাকা, ${bn(ticket.people)} জন ${ticket.journey}, মোট ${bn(ticket.total)} টাকা`} />
          {previewError && <p className="kit-status" role="alert">ছবিটা দেখানো যাচ্ছে না। পাতাটা একবার রিলোড করে দেখো।</p>}
        </figure>
        <div className="ticket-controls">
          <FormatToggle value={format} onChange={setFormat} />
          <ShareBar tool={TOOL} fileName="metro-bhara.png" makeImage={() => ticketBlob(ticket, format, site)} imageKey={`${state}|${format}`} caption={caption} state={state} hint="লিংক খুললে এই দুই স্টেশন আর কয়জন, সব বসানো থাকবে।" />
          <div className="ticket-copy">
            <button type="button" className="kit-link" onClick={copy}>হিসাবটা লেখায় কপি করো</button>
            <p className="kit-status" role="status">{message}</p>
            <details><summary>হিসাবের পুরো লেখা</summary><pre>{summary}</pre></details>
          </div>
        </div>
      </div>
    </>}</section>
  </div>;
}
