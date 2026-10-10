import test from 'node:test';
import assert from 'node:assert/strict';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FareChart } from '../components/fare-chart';
import { banglaNumber, metroFare, stations } from '../lib/fares';
import { createTicket, defaultTrip, fareTable, parseTrip, tripHash } from '../lib/ticket';
import { share } from '../share';

test('fare table agrees with the fare function for every station pair', () => {
  const table = fareTable();
  assert.equal(table.length, stations.length);
  for (let from = 0; from < stations.length; from++) {
    assert.equal(table[from].length, stations.length);
    for (let to = 0; to < stations.length; to++) assert.equal(table[from][to], metroFare(from, to));
  }
});

test('the rendered chart shows the published fare in every cell, and each list row too', () => {
  const html = renderToStaticMarkup(createElement(FareChart));
  const body = html.match(/<table class="chart-matrix">[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? '';
  const rows = [...body.matchAll(/<tr>([\s\S]*?)<\/tr>/g)].map(row => ({
    name: row[1].match(/<th scope="row">([^<]*)<\/th>/)?.[1],
    cells: [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(cell => cell[1]),
  }));
  assert.deepEqual(rows.map(row => row.name), [...stations]);
  rows.forEach((row, from) => {
    assert.equal(row.cells.length, stations.length);
    row.cells.forEach((cell, to) => assert.equal(cell, from === to ? '<span aria-hidden="true">—</span><span class="ticket-sr">একই স্টেশন</span>' : banglaNumber(metroFare(from, to)!)));
  });
  const header = [...(html.match(/<table class="chart-matrix">[\s\S]*?<thead>([\s\S]*?)<\/thead>/)?.[1] ?? '').matchAll(/<th scope="col">([^<]*)<\/th>/g)].map(match => match[1]);
  assert.deepEqual(header, [...stations]);
  const list = [...(html.match(/<table class="chart-list">[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/)?.[1] ?? '').matchAll(/<th scope="row">([^<]*)<\/th><td>([^<]*) টাকা<\/td>/g)];
  assert.deepEqual(list.map(match => [match[1], match[2]]), stations.slice(1).map((station, index) => [station, banglaNumber(metroFare(0, index + 1)!)]));
});

test('trip state round-trips through the link', () => {
  for (const trip of [defaultTrip, { from: 4, to: 10, people: 3, journeys: 2 as const }, { from: 15, to: 0, people: 20, journeys: 1 as const }]) {
    assert.deepEqual(parseTrip('#' + tripHash(trip)), trip);
    assert.equal(share.normalize(tripHash(trip)), tripHash(trip));
  }
});

test('hostile or broken links never become a free or invented trip', () => {
  for (const hash of ['', '#', 'f=2&t=2', 'f=-1&t=3', 'f=16&t=0', 'f=1.5&t=3', 'f=0x1&t=3', 'f=1e1&t=3', 'f=&t=4', 'f=০&t=৫', 'result', 'f=0&t=99']) {
    assert.equal(parseTrip(hash), null, hash);
    assert.equal(share.normalize(hash), null, hash);
  }
  // Out-of-range or odd group sizes fall back to one person; anything but j=2 is a single journey.
  assert.deepEqual(parseTrip('f=3&t=8&n=0&j=3'), { from: 3, to: 8, people: 1, journeys: 1 });
  assert.deepEqual(parseTrip('f=3&t=8&n=21'), { from: 3, to: 8, people: 1, journeys: 1 });
  assert.deepEqual(parseTrip('f=3&t=8&n=৫'), { from: 3, to: 8, people: 1, journeys: 1 });
  assert.equal(share.normalize('f=3&t=8&n=999999&x=<script>'), 'f=3&t=8&n=1');
});

test('ticket totals come from the published fare', () => {
  const ticket = createTicket({ from: 0, to: 15, people: 3, journeys: 2 })!;
  assert.equal(ticket.fare, 100);
  assert.equal(ticket.total, 600);
  assert.equal(createTicket({ from: 7, to: 7, people: 1, journeys: 1 }), null);
});

test('link preview names the route and the one-person fare', () => {
  assert.equal(share.preview('f=0&t=15&n=1').title, 'উত্তরা উত্তর → মতিঝিল: ১০০ টাকা');
  assert.match(share.preview('f=0&t=15&n=3&j=2').description, /৩ জন · যাওয়া-আসা · মোট ৬০০ টাকা/);
  assert.equal(share.preview('garbage').title, 'মেট্রোরেলের ভাড়া কত?');
});
