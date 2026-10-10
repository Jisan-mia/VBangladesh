import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { TiffinTool } from './components/tiffin-tool';
import { site } from './content';

export default function BetonerBhagPage() {
  return <PageFrame site={site}>
    <JsonLd site={site} />
    <div className="bb-page">
      <section className="bb-hero container" aria-labelledby="bb-title">
        <p className="bb-kicker">টিফিন ক্যারিয়ারে মাসের হিসাব · শুধু শতাংশ</p>
        <h1 id="bb-title">বেতনের টাকা <span>কোথায় যায়?</span></h1>
        <p className="bb-lead">{site.lead}</p>
      </section>

      <section className="container" id="tool" aria-label="বেতনের ভাগ বসাও"><TiffinTool /></section>

      <section className="container section bb-honest" aria-labelledby="honest-title">
        <h2 id="honest-title">এখানে কোনো ‘ঠিক’ ভাগ নেই</h2>
        <p>কারও বাসা ভাড়া বেশি, কেউ বাড়িতে বেশি পাঠায়, কারও জমার বাটি এ মাসে ফাঁকা। সবার মাস আলাদা। এটা হিসাবের খাতা বা পরামর্শ না, শুধু নিজের মাসটা এক নজরে দেখা আর বন্ধুদের সাথে মেলানো।</p>
        <p>টাকার অঙ্ক কোথাও লাগে না। কার্ডে, লিংকে, সবখানে শুধু শতাংশ।</p>
      </section>

      <section className="container section bb-guide" id="guide" aria-labelledby="guide-title">
        <h2 id="guide-title">{site.guideTitle}</h2>
        <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat('bn-BD').format(index + 1)}</span><p>{step}</p></li>)}</ol>
      </section>
      <Faq items={site.faq} />
    </div>
  </PageFrame>;
}
