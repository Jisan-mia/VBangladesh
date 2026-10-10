'use client';
import { useState } from 'react';
import { stations } from '../lib/fares';
import { bn, fareTable } from '../lib/ticket';

const table = fareTable();

export function FareChart() {
  const [from, setFrom] = useState(0);
  return <div className="chart">
    <label className="chart-pick"><span>কোন স্টেশন থেকে উঠবে?</span><select value={from} onChange={event => setFrom(Number(event.target.value))}>{stations.map((station, index) => <option key={station} value={index}>{station}</option>)}</select></label>
    <table className="chart-list">
      <caption>{stations[from]} থেকে একজনের একবারের ভাড়া</caption>
      <thead><tr><th scope="col">কোথায় নামবে</th><th scope="col">ভাড়া</th></tr></thead>
      <tbody>{stations.map((station, to) => to === from ? null : <tr key={station}><th scope="row">{station}</th><td>{bn(table[from][to]!)} টাকা</td></tr>)}</tbody>
    </table>

    <details className="chart-full">
      <summary>পুরো চার্টটা একসাথে দেখো <small>১৬ স্টেশন × ১৬ স্টেশন</small></summary>
      <p className="chart-how">বাঁয়ের স্টেশন থেকে ওপরের স্টেশনে গেলে একজনের ভাড়া, টাকায়। চার্টটা পাশে সরিয়ে দেখো।</p>
      <div className="chart-scroll" role="region" aria-labelledby="matrix-caption" tabIndex={0}>
        <table className="chart-matrix">
          <caption id="matrix-caption">মেট্রোরেলের পুরো ভাড়ার চার্ট (টাকা)</caption>
          <thead><tr><td className="chart-corner">থেকে ↓ · পর্যন্ত →</td>{stations.map(station => <th scope="col" key={station}>{station}</th>)}</tr></thead>
          <tbody>{stations.map((station, row) => <tr key={station}><th scope="row">{station}</th>{stations.map((_, column) => row === column
            ? <td key={column} className="chart-self"><span aria-hidden="true">—</span><span className="ticket-sr">একই স্টেশন</span></td>
            : <td key={column} data-fare={table[row][column]}>{bn(table[row][column]!)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  </div>;
}
