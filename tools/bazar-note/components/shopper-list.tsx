'use client';

import { useEffect, useMemo, useState } from 'react';
import { formatQuantity, units } from '../lib/basket';
import { bn, fordoHash, fordoTitle, formatTaka, readTicks, tickKey, toggleTick, type Fordo } from '../lib/fordo';

/** The list as the shopper sees it: tick what's bought, see what's left. Ticks stay in this browser only. */
export function ShopperList({ fordo }: { fordo: Fordo }) {
  const key = useMemo(() => tickKey(fordoHash(fordo)), [fordo]);
  const [ticks, setTicks] = useState<number[]>([]);
  const [onlyLeft, setOnlyLeft] = useState(false);
  const count = fordo.items.length;

  useEffect(() => {
    try { setTicks(readTicks(window.localStorage, key, count)); } catch { setTicks([]); }
  }, [key, count]);

  function toggle(index: number) {
    const next = toggleTick(ticks, index);
    setTicks(next);
    try { window.localStorage.setItem(key, JSON.stringify(next)); } catch { /* ticks still work for this visit */ }
  }

  const left = count - ticks.length;
  return <section className="shop" aria-labelledby="shop-title">
    <p className="shop-kicker">তোমার জন্য একটা ফর্দ এসেছে</p>
    <h2 id="shop-title">{fordoTitle(fordo)}</h2>
    <p className="shop-meta">{bn(count)}টা জিনিস{fordo.budget !== null && <>, বাজেট <strong>{formatTaka(fordo.budget)} টাকা</strong></>}। কেনা হলে টিক দাও, টিকগুলো এই ফোনেই থেকে যাবে।</p>
    <div className="shop-progress">
      <p role="status" aria-live="polite">{left ? <>কেনা হয়েছে <strong>{bn(ticks.length)}টা</strong> · বাকি <strong>{bn(left)}টা</strong></> : <strong>সব কেনা শেষ! এবার বাসায় ফেরো 🙂</strong>}</p>
      <span aria-hidden="true"><i style={{ width: `${Math.round((ticks.length / count) * 100)}%` }} /></span>
    </div>
    <ul className="shop-list">{fordo.items.map((item, index) => onlyLeft && ticks.includes(index) ? null : <li key={item.id}>
      <label>
        <input type="checkbox" checked={ticks.includes(index)} onChange={() => toggle(index)} />
        <span className="shop-name">{item.name}</span>
        <span className="shop-qty">{formatQuantity(item.quantity)} {units[item.unit]}{item.unitPrice !== null && <small>প্রতি {units[item.unit]} ৳{formatTaka(item.unitPrice)}</small>}</span>
      </label>
    </li>)}</ul>
    <div className="shop-actions">
      <button type="button" className="kit-secondary" aria-pressed={onlyLeft} onClick={() => setOnlyLeft(value => !value)}>{onlyLeft ? 'সবগুলো দেখাও' : 'শুধু বাকিগুলো দেখাও'}</button>
      <a className="kit-link" href="#fordo">নিজের একটা ফর্দ বানাও ↓</a>
    </div>
  </section>;
}
