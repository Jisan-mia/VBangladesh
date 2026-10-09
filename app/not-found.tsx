import Link from 'next/link';
import { HubFrame } from '../shared/site-shell';
export default function NotFound() {
  return <HubFrame><section className="container prose hub-prose"><p className="eyebrow">পাতাটি পাওয়া যায়নি</p><h1>এই লিংকে কোনো পাতা নেই</h1><p>লিংকটি ভুল বা পুরোনো হতে পারে। সবগুলো টুলের তালিকায় গিয়ে পছন্দেরটি বেছে নিন।</p><Link className="button" href="/#tools">সবগুলো দেখুন</Link></section></HubFrame>;
}
