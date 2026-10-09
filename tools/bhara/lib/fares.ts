export const fareSource = {
  page: 'https://dmtcl.gov.bd/pages/static-pages/6922df5a933eb65569e2169f',
  document: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-dmtcl/2026/5/f1402a32-4693-4459-8ebc-6406d4f93c2c.pdf',
  checked: '৯ অক্টোবর ২০২৬',
  published: '৮ সেপ্টেম্বর ২০২২',
};
export const stations = ['উত্তরা উত্তর', 'উত্তরা সেন্টার', 'উত্তরা দক্ষিণ', 'পল্লবী', 'মিরপুর ১১', 'মিরপুর ১০', 'কাজীপাড়া', 'শেওড়াপাড়া', 'আগারগাঁও', 'বিজয় সরণি', 'ফার্মগেট', 'কারওয়ান বাজার', 'শাহবাগ', 'ঢাকা বিশ্ববিদ্যালয়', 'বাংলাদেশ সচিবালয়', 'মতিঝিল'] as const;
// Published matrix, page 2 of fareSource.document; each row contains only later stations.
const fares = [
  [20,20,30,30,40,40,50,60,60,70,80,80,90,90,100],
  [20,20,30,30,40,40,50,60,60,70,80,80,90,90],
  [20,20,30,30,40,40,50,60,60,70,70,80,90],
  [20,20,20,30,30,40,50,50,60,60,70,80],
  [20,20,20,30,40,40,50,50,60,70,70],
  [20,20,20,30,30,40,50,50,60,60],
  [20,20,20,30,40,40,50,50,60],
  [20,20,20,30,40,40,50,50],
  [20,20,20,30,30,40,50],
  [20,20,20,30,40,40],
  [20,20,20,30,30],
  [20,20,20,30],
  [20,20,20],
  [20,20],
  [20],
  [],
] as const;
export function metroFare(from: number, to: number): number | null {
  if (![from, to].every(value => Number.isInteger(value) && value >= 0 && value < stations.length) || from === to) return null;
  const low = Math.min(from, to);
  return fares[low][Math.max(from, to) - low - 1];
}
export function passengerCount(input: string): number | null {
  const normalized = input.trim().replace(/[০-৯]/g, digit => String('০১২৩৪৫৬৭৮৯'.indexOf(digit)));
  if (!/^\d{1,2}$/.test(normalized)) return null;
  const count = Number(normalized);
  return count >= 1 && count <= 20 ? count : null;
}
export function tripTotal(options: { fare: number; passengers: number; journeys: 1 | 2 }) {
  if (!Number.isInteger(options.fare) || options.fare < 20 || options.fare > 100 || !Number.isInteger(options.passengers) || options.passengers < 1 || options.passengers > 20 || ![1,2].includes(options.journeys)) throw new Error('Invalid trip');
  return options.fare * options.passengers * options.journeys;
}
export const banglaNumber = (value: number) => new Intl.NumberFormat('bn-BD').format(value);
