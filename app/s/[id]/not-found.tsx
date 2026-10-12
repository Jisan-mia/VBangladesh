import { HubFrame, RescueTools } from '../../../shared/site-shell';
export const metadata = { title: 'কার্ডটা আর নেই | একটুখানি', robots: { index: false, follow: true } };
// A friend's card link that no longer exists (links are deleted after a year, or the address was cut short).
export default function SharedNotFound() {
  return <HubFrame><section className="container prose hub-prose"><p className="eyebrow">কার্ডটা আর নেই</p><h1>এই কার্ডটা আর খোলা যাচ্ছে না</h1><p>শেয়ার করা লিংক এক বছর পর মুছে যায়, কিংবা লিংকটা পুরোটা আসেনি। মন খারাপ কোরো না, নিজেরটা বানিয়ে ফেলো।</p><RescueTools /></section></HubFrame>;
}
