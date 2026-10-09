import Link from 'next/link';
import { HubFrame } from '../shared/site-shell';
export default function NotFound() {
  return <HubFrame><section className="container prose hub-prose"><p className="eyebrow">পাতাটা পাওয়া যায়নি</p><h1>এই লিংকে কিছু নেই</h1><p>লিংকটা হয়তো ভুল লেখা, কিংবা পুরোনো। চিন্তা নেই, নিচ থেকে আবার শুরু করো।</p><Link className="button" href="/">প্রথম পাতায় চলো</Link></section></HubFrame>;
}
