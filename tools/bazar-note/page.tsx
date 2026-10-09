import './product.css';
import { PageFrame, Faq, JsonLd } from '../../shared/site-shell';
import { site } from './content';
import { BasketEditor } from './components/BasketEditor';

export default function Home() {
  return <PageFrame site={site}>
    <JsonLd site={site} />
    <div className="bazar-home">
      <section className="bazar-hero container" aria-labelledby="hero-heading">
        <div className="bazar-hero-copy"><p className="eyebrow"><span aria-hidden="true" />বাজারে যাওয়ার আগে</p><h1 id="hero-heading">বাজারের তালিকা,<br /><span>খরচের হিসাবও</span></h1><p className="bazar-hero-lead">কী কিনবেন, কতটুকু লাগবে, কত খরচ হবে—<br className="bazar-wide-break" />সব এক তালিকায় গুছিয়ে রাখুন।</p><a className="button" href="#tool">{site.cta}<span aria-hidden="true">↗</span></a><p className="bazar-hero-note">বিনামূল্যে · নাম বা অ্যাকাউন্ট লাগে না</p></div>
        <div className="bazar-hero-art" aria-label="দুটি পণ্যের নমুনা হিসাব: মোট ২০০.৭৫ টাকা">
          <div className="bazar-art-label">বাজারের আগে হিসাব মিলিয়ে নিন</div>
          <svg className="bazar-bag" viewBox="0 0 230 280" fill="none" aria-hidden="true"><path d="M28 101h173l-14 159H46L28 101Z" fill="#ecdb9f" stroke="#123c60" strokeWidth="2"/><path d="m45 118 14 124M184 120l-11 121" stroke="#123c60" strokeOpacity=".23"/><path d="M80 103V80a35 35 0 0 1 70 0v23" stroke="#123c60" strokeWidth="3"/><path d="m51 99-8-43c-2-10 6-19 13-14L90 98M155 102l16-60c3-10 12-10 14-1l-2 61" fill="#f5f8f2" stroke="#123c60" strokeWidth="2"/><path d="m47 57 15 4m-11 15 21 3m102-23 9 4m-13 14 12 3" stroke="#123c60" strokeWidth="2"/><path d="M94 92C65 65 110 52 116 80c5-35 45-21 28 8" fill="#8eae94" stroke="#123c60" strokeWidth="2"/><path d="M89 97c3-30 36-25 43-3" fill="#a5bea7" stroke="#123c60" strokeWidth="2"/><path d="M91 156h55m-48 14h42m-46 38h47" stroke="#123c60" strokeWidth="2"/><path d="M89 190c8-12 17-12 26 0 8-12 18-12 26 0" stroke="#123c60" strokeWidth="2"/></svg>
          <div className="bazar-sample-receipt" aria-hidden="true"><span className="bazar-receipt-clip"/><p>আজকের তালিকা <span>নমুনা</span></p><div><strong>চাল</strong><span>১.৫ কেজি</span><b>১৮০.৭৫</b></div><div><strong>ডিম</strong><span>২ পিস</span><b>২০.০০</b></div><footer><span>মোট টাকা</span><strong>২০০.৭৫</strong></footer><small>আপনার দেওয়া দামের হিসাব</small></div>
          <svg className="bazar-art-scribble" viewBox="0 0 115 55" aria-hidden="true" fill="none"><path d="M4 14c43 43 62 4 58-6-6-14-23 12 1 24 19 10 35 5 45-1m-11-6 13 5-10 9" stroke="#123c60" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
      </section>
      <div className="bazar-trust-strip"><div className="container"><p><span aria-hidden="true">০১</span>নিজের দেওয়া দাম</p><p><span aria-hidden="true">০২</span>মোট খরচ ও বাজেট</p><p><span aria-hidden="true">০৩</span>পাঠানোর আগে দেখে নিন</p></div></div>
      <div className="container"><BasketEditor /></div>
      <section className="bazar-how container section" aria-labelledby="how-heading"><div><p className="eyebrow">দাম লেখার সময়</p><h2 id="how-heading">একক অনুযায়ী<br />দাম লিখুন</h2></div><div><p>কেজি বাছলে প্রতি কেজির দাম দিন। হালি বাছলে প্রতি হালির দাম। একক বদলালে পরিমাণ বা দাম নিজে থেকে বদলাবে না।</p><p>দোকানে দাম আলাদা পেলে পণ্যের পাশে <strong>“বদলান”</strong> চাপুন। খরচ বাজেট ছাড়িয়ে গেলে কত টাকা বেশি হচ্ছে, সেটিও দেখতে পাবেন।</p><a href="/bazar-note/guide">ব্যবহারের নিয়ম পড়ুন <span aria-hidden="true">↗</span></a></div></section>
    </div>
    <Faq items={site.faq} />
  </PageFrame>;
}
