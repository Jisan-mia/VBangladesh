import './product.css';
import { PageFrame, Faq, JsonLd } from '../../shared/site-shell';
import { site } from './content';
import { DeadlinePlanner } from './components/DeadlinePlanner';

export default function Home() {
  return <PageFrame site={site}>
    <JsonLd site={site}/>
    <div className="deadline-home">
      <section className="deadline-hero container" aria-labelledby="deadline-hero-heading">
        <div className="deadline-hero-copy"><p className="eyebrow"><span aria-hidden="true"/>আবেদনের ব্যক্তিগত তালিকা</p><h1 id="deadline-hero-heading">শেষ তারিখ আর<br/><span>বাকি কাজ এক জায়গায়</span></h1><p className="deadline-lead">আবেদনের শেষ সময় লিখে রাখুন। বিজ্ঞপ্তির লিংক আর বাকি কাজগুলোও পাশে থাকুক।</p><a className="button" href="#tool">{site.cta}<span aria-hidden="true">↗</span></a><p className="deadline-hero-note">বিনামূল্যে · অ্যাকাউন্ট লাগে না · তথ্য আপনার ব্রাউজারে</p></div>
        <div className="deadline-hero-visual" aria-hidden="true"><div className="deadline-decoration"><div className="deadline-dotted-path"/></div><div className="deadline-small-tab">শেষ দিনের আগে যা করতে হবে</div><div className="deadline-calendar"><span className="deadline-ring first"/><span className="deadline-ring second"/><div className="deadline-calendar-month">অক্টোবর <span>নমুনা</span></div><strong>৩১</strong><span className="deadline-calendar-day">শেষ সময় · রাত ১১:৫৯</span><div className="deadline-calendar-line"/></div><div className="deadline-hero-checklist"><p>আমার প্রস্তুতি</p><div><span className="checked">✓</span>বিজ্ঞপ্তি পড়েছি</div><div><span className="checked">✓</span>কাগজপত্র গুছিয়েছি</div><div><span/>আবেদন জমা দেব</div><footer><span/><span/><span/></footer></div><svg className="deadline-pencil" viewBox="0 0 26 172" fill="none"><path d="M6 20h14v122l-7 22-7-22V20Z" fill="#d6b984" stroke="#5c3b53" strokeWidth="1.4"/><path d="M6 20V10a7 7 0 0 1 14 0v10H6Z" fill="#d8b9c4" stroke="#5c3b53" strokeWidth="1.4"/><path d="M6 27h14M13 29v110M6 142l7-4 7 4m-11 13h8" stroke="#5c3b53" strokeWidth="1.4"/></svg></div>
      </section>
      <div className="deadline-steps-strip"><div className="container"><p><span>০১</span>তারিখ লিখুন</p><i aria-hidden="true"/><p><span>০২</span>বাকি কাজ লিখুন</p><i aria-hidden="true"/><p><span>০৩</span>কাজ হলে টিক দিন</p></div></div>
      <DeadlinePlanner/>
      <section className="deadline-boundary container section" aria-labelledby="boundary-heading"><div className="deadline-boundary-icon" aria-hidden="true"><svg width="36" height="40" viewBox="0 0 36 40" fill="none"><path d="M8 5h15l6 6v24H8V5Z" stroke="currentColor" strokeWidth="1.5"/><path d="M23 5v7h6M13 19h11m-11 6h8" stroke="currentColor" strokeWidth="1.5"/></svg></div><div><p className="eyebrow">মূল বিজ্ঞপ্তি দেখে নিন</p><h2 id="boundary-heading">জমা দেওয়ার আগে<br/>তারিখ মিলিয়ে নিন</h2></div><p>কর্তৃপক্ষ সময় বাড়াতে বা নিয়ম বদলাতে পারে। এখানে সেই তথ্য নিজে থেকে বদলাবে না। আবেদন জমা দেওয়ার আগে মূল বিজ্ঞপ্তিতে শেষ সময় ও নিয়ম মিলিয়ে নিন।</p></section>
    </div>
    <Faq items={site.faq}/>
  </PageFrame>;
}
