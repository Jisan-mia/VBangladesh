import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { BoardBuilder } from './components/board-builder';
import { site } from './content';

export default function RiksharongPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="rr-page">
        <section className="rr-hero container" aria-labelledby="rr-title">
          <h1 id="rr-title"><span className="rr-hero-kicker">রিকশা পেইন্টিং · এক মিনিটে</span> রিকশার পেছনে এবার <span>তোমার বোর্ড</span></h1>
          <p className="rr-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="রিকশার বোর্ড রাঙাও"><BoardBuilder /></section>
        <section className="container section rr-heritage" aria-labelledby="heritage-title">
          <h2 id="heritage-title">রিকশা পেইন্টিং: ঢাকার চলন্ত গ্যালারি</h2>
          <div>
            <p>ঢাকার রিকশার পেছনের টিনের বোর্ড, হুড আর সিটে যে ঝলমলে ছবি আঁকা থাকে, সেটাই রিকশা পেইন্টিং। কারিগরেরা হাতে, চড়া রঙে আঁকেন, তাই প্রতিটা রিকশা যেন রাস্তায় চলা একেকটা ছবি।</p>
            <p>২০২৩ সালের ডিসেম্বরে ইউনেস্কো ‘ঢাকার রিকশা ও রিকশাচিত্র’কে মানবতার অধরা সাংস্কৃতিক ঐতিহ্যের তালিকায় তুলেছে।</p>
          </div>
          <ul aria-label="রিকশা পেইন্টিংয়ের চেনা বিষয়">
            <li>ফুল আর লতাপাতা</li><li>ময়ূর, রাজহাঁস</li><li>নদী-নৌকার গ্রাম</li><li>সিনেমার নায়ক-নায়িকা</li><li>বাঘ-হরিণের মতো পশুপাখি</li>
          </ul>
          <p className="rr-honest">এখানকার বোর্ডটা সেই ঢঙ দেখে নতুন করে আঁকা, কোনো শিল্পীর কাজের কপি না। আসল রিকশাচিত্র দেখতে চাইলে পুরান ঢাকার রাস্তায় একবার ভালো করে তাকিয়ো।</p>
        </section>
        <section className="container section rr-guide" aria-labelledby="rr-guide-title">
          <h2 id="rr-guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat('bn-BD').format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
