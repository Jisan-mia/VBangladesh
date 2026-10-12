import { HubFrame, RescueTools } from '../shared/site-shell';
export const metadata = { title: 'পাতাটা পাওয়া যায়নি | একটুখানি', robots: { index: false, follow: true } };
export default function NotFound() {
  return <HubFrame><section className="container prose hub-prose"><p className="eyebrow">পাতাটা পাওয়া যায়নি</p><h1>এই লিংকে কিছু নেই</h1><p>লিংকটা হয়তো ভুল লেখা, কিংবা পুরোনো। খুঁজে দেখো, নয়তো নিচের একটা দিয়ে শুরু করো।</p><RescueTools /></section></HubFrame>;
}
