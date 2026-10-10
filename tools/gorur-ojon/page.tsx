import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { CowArt } from './components/cow-art';
import { OjonTool } from './components/ojon-tool';
import { site } from './content';
import { checked, sources } from './lib/ojon';

export default function GorurOjonPage() {
  return <PageFrame site={site}>
    <JsonLd site={site} />
    <div className="ojon-page">
      <section className="ojon-hero container" aria-labelledby="ojon-title">
        <p className="ojon-kicker">দর্জির ফিতা হলেই চলবে · হাটে যাওয়ার আগে</p>
        <h1 id="ojon-title">ফিতা দিয়ে মাপো,<br /><span>গরুর ওজন কত?</span></h1>
        <p className="ojon-lead">{site.lead}</p>
      </section>

      <section className="container" id="tool" aria-label="গরুর ওজনের হিসাব"><OjonTool /></section>

      <section className="container section ojon-how" id="how" aria-labelledby="how-title">
        <h2 id="how-title">ফিতা কোথায় ধরবে</h2>
        <CowArt girthIn={50} lengthIn={42} girthLabel="১ · বুকের বেড়" lengthLabel="২ · দৈর্ঘ্য" guide />
        <ol>
          <li><span aria-hidden="true">১</span><p><strong>বুকের বেড়:</strong> গরুকে সমান মাটিতে চার পায়ে সোজা দাঁড় করাও। সামনের পায়ের ঠিক পেছন দিয়ে, কুঁজের পেছন ঘুরিয়ে বুকের চারদিকে ফিতা পেঁচাও। টানটান রাখো, কিন্তু চামড়া যেন দেবে না যায়।</p></li>
          <li><span aria-hidden="true">২</span><p><strong>দৈর্ঘ্য:</strong> কাঁধের সামনের উঁচু হাড় থেকে পেছনের পাছার উঁচু হাড় (পিন বোন, লেজের গোড়ার দুই পাশে) পর্যন্ত সোজা মাপো। লেজের ডগা বা মাথা ধরবে না।</p></li>
          <li><span aria-hidden="true">৩</span><p>দুটো মাপ ইঞ্চিতে হলে ইঞ্চি, সেন্টিমিটারে হলে সেন্টিমিটার বেছে নাও। দুবার মেপে মিলিয়ে নিলে ভুল কমে। বেড়ের মাপ গুণ হয় দুবার, তাই ওটায় ভুল হলে ওজনে বেশি গড়বড় হয়।</p></li>
        </ol>
      </section>

      <section className="container section ojon-source" id="source" aria-labelledby="source-title">
        <h2 id="source-title">হিসাবটা কোথা থেকে, নিজেই মিলিয়ে নাও</h2>
        <p>এটা <strong>শেফারের সূত্র</strong> (Schaeffer’s formula): ইঞ্চিতে বুকের বেড় × বুকের বেড় × দৈর্ঘ্য ÷ ৩০০ = পাউন্ডে আনুমানিক জীবিত ওজন। দৈর্ঘ্য ধরা হয় কাঁধের হাড় থেকে পিন বোন পর্যন্ত। পাউন্ড থেকে কেজি: ১ পাউন্ড = ০.৪৫৩৫৯২৩৭ কেজি। সেন্টিমিটারে দিলে আগে ইঞ্চিতে বদলে নিই (১ ইঞ্চি = ২.৫৪ সেমি), তাই দুই এককে একই উত্তর আসে। অনেক লেখায় যে “÷ ৬৬০ = কেজি” দেখো, সেটাও এই সূত্রই, শুধু কেজিতে বদলানো।</p>
        <p><strong>মণ:</strong> এখন দেশজুড়ে ৪০ কেজিতে এক মণ ধরা হয়, হাটেও তাই। পুরোনো সের-তোলার হিসাবে ১ মণ = ৪০ সের ≈ ৩৭.৩২ কেজি; সেভাবে ধরলে মণের সংখ্যা একটু বেশি আসবে।</p>
        <p><strong>কতটা ঠিক?</strong> এটা আনুমানিক, ১০–২০% কমবেশি হতে পারে। গরু কতটা মোটা, পেট ভরা না খালি, জাত, বয়স আর মাপার ভুলে ওজন বদলায়; বাছুর আর বিদেশি জাতের ক্রস গরুতে ভুল বেশি হতে পারে। ঠিক ওজন জানতে পাল্লায় (ডিজিটাল স্কেলে) মাপাও।</p>
        <p>গরুর ওজন থেকে মাংস কত হবে বা দাম কত হওয়া উচিত, এখানে বলা হয় না। মাংসের ভাগে তুমি যে কেজি লেখো, শুধু সেটাই ভাগ হয়। তিন ভাগ প্রচলিত রীতি, বাধ্যতামূলক নয়; নিয়ম নিয়ে প্রশ্ন থাকলে তোমার এলাকার আলেমের কাছে জেনে নিও।</p>
        <p className="ojon-checked">সূত্রগুলো মিলিয়ে দেখা হয়েছে {checked}।</p>
        <ul className="ojon-links">{sources.map(source => <li key={source.url}><a href={source.url} rel="external">{source.label} ↗</a></li>)}</ul>
      </section>

      <section className="container section ojon-guide" id="guide" aria-labelledby="guide-title">
        <h2 id="guide-title">{site.guideTitle}</h2>
        <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat('bn-BD').format(index + 1)}</span><p>{step}</p></li>)}</ol>
      </section>
      <Faq items={site.faq} />
    </div>
  </PageFrame>;
}
