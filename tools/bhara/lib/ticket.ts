import { banglaNumber, metroFare, passengerCount, stations, tripTotal } from './fares';

export type Trip = { from: number; to: number; people: number; journeys: 1 | 2 };
export type Ticket = Trip & { fromName: string; toName: string; fare: number; total: number; stops: number; journey: string; line: string };

export const MAX_PEOPLE = 20;
export const defaultTrip: Trip = { from: 0, to: stations.length - 1, people: 1, journeys: 1 };
export const bn = banglaNumber;

// Share links store positions in `stations`, so that list must never be reordered.
export function tripHash({ from, to, people, journeys }: Trip) {
  return `f=${from}&t=${to}&n=${people}${journeys === 2 ? '&j=2' : ''}`;
}

export function parseTrip(hash: string): Trip | null {
  const params = new URLSearchParams(hash.replace(/^#/, ''));
  const station = (key: string) => { const value = params.get(key) ?? ''; return /^\d{1,2}$/.test(value) ? Number(value) : -1; };
  const from = station('f'), to = station('t');
  if (metroFare(from, to) === null) return null;
  const people = /^\d{1,2}$/.test(params.get('n') ?? '') ? passengerCount(params.get('n')!) : null;
  return { from, to, people: people ?? 1, journeys: params.get('j') === '2' ? 2 : 1 };
}

/** One human line per ticket, chosen from the route and the group. Says nothing about travel time. */
export function ticketLine({ from, to, people, journeys }: Trip) {
  const stops = Math.abs(to - from);
  if (stops === stations.length - 1) return 'এ মাথা থেকে ও মাথা, পুরো লাইনটাই পাড়ি!';
  if (stops === 1) return 'মাত্র এক স্টেশন, উঠতে না উঠতেই নামার পালা।';
  if (people >= 4) return 'দলবেঁধে মেট্রোয়! সবার টিকিটের টাকা আগেই গুছিয়ে নিও।';
  if (journeys === 2) return 'যাওয়া-আসা দুটোই, ফেরার টিকিটের টাকাও আলাদা রেখো।';
  return 'ভাড়া জেনে বের হলে কাউন্টারে আর হিসাব কষতে হয় না।';
}

export function createTicket(trip: Trip): Ticket | null {
  const fare = metroFare(trip.from, trip.to);
  if (fare === null) return null;
  return {
    ...trip,
    fromName: stations[trip.from],
    toName: stations[trip.to],
    fare,
    total: tripTotal({ fare, passengers: trip.people, journeys: trip.journeys }),
    stops: Math.abs(trip.to - trip.from),
    journey: trip.journeys === 2 ? 'যাওয়া-আসা' : 'শুধু যাওয়া',
    line: ticketLine(trip),
  };
}

/** The whole published chart, built from metroFare so the table can never disagree with the calculator. */
export const fareTable = () => stations.map((_, from) => stations.map((_, to) => metroFare(from, to)));
