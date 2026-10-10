import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { JomiTool } from './components/jomi-tool';
import { site } from './content';
import { amountText, checked, convert, sources, units } from './lib/units';

export default function JomiPage() {
  return <PageFrame site={site}>
    <JsonLd site={site} />
    <div className="jomi-page">
      <section className="jomi-hero container" aria-labelledby="jomi-title">
        <p className="jomi-kicker">আমিনের শিকল লাগবে না · সরকারি মান ধরে</p>
        <h1 id="jomi-title">শতাংশ, কাঠা, বিঘা<br /><span>কোনটা কত?</span></h1>
        <p className="jomi-lead">{site.lead}</p>
      </section>

      <section className="container" id="tool" aria-label="জমির মাপের হিসাব"><JomiTool /></section>

      <section className="container section jomi-source" id="source" aria-labelledby="source-title">
        <h2 id="source-title">মাপগুলো কোথা থেকে, নিজেই মিলিয়ে নাও</h2>
        <p>সব হিসাব বর্গফুট ধরে করা। প্রতিটা একক কত বর্গফুট, সেটা ভূমি মন্ত্রণালয়ের “ভূমি পরিমাপের আদর্শ একক” তালিকা থেকে নেওয়া, আমরা মিলিয়ে দেখেছি {checked}।</p>
        <table className="jomi-table">
          <caption>এক এককে কত বর্গফুট</caption>
          <tbody>{units.filter(unit => unit.id !== 'sqft').map(unit => <tr key={unit.id}><th scope="row">১ {unit.label}{'also' in unit ? <small> ({unit.also})</small> : null}</th><td>{unit.sqft.toLocaleString('bn-BD', { maximumFractionDigits: 4 })} বর্গফুট</td></tr>)}</tbody>
        </table>
        <p>১ বিঘা = ২০ কাঠা, ১ কাঠা = ১৬ ছটাক, ১ একর = ১০০ শতাংশ। সরকারি তালিকায় ১ বিঘাকে “৩৩ শতাংশ” লেখা থাকে; ১৪,৪০০ ÷ ৪৩৫.৬ করলে আসে {amountText(convert(1, 'bigha', 'shotangsho'))}, তাই এখানে সেটাই দেখায়। বর্গমিটারের হিসাব ১ ফুট = ০.৩০৪৮ মিটার ধরে।</p>
        <p><strong>তোমার এলাকায় আলাদা হতে পারে।</strong> শতাংশ আর একর সারা দেশে এক, কিন্তু অনেক জায়গায় বিঘা-কাঠার মাপ অন্য রকম চলে। গণ্ডা, কানি এখানে রাখিনি, কারণ এলাকাভেদে এগুলোর মাপ এত আলাদা যে সরকারি তালিকাতেও একাধিক মান লেখা।</p>
        <p>এটা শুধু এককের হিসাব। জমি মাপা, দাগ-খতিয়ান বা দলিলের কাজ এটা না। কেনাবেচা বা ভাগাভাগির আগে আমিন, সার্ভেয়ার বা ভূমি অফিসে মিলিয়ে নিও।</p>
        <ul className="jomi-links">{sources.map(source => <li key={source.url}><a href={source.url} rel="external">{source.label} ↗</a></li>)}</ul>
      </section>

      <section className="container section jomi-guide" id="guide" aria-labelledby="guide-title">
        <h2 id="guide-title">{site.guideTitle}</h2>
        <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat('bn-BD').format(index + 1)}</span><p>{step}</p></li>)}</ol>
      </section>
      <Faq items={site.faq} />
    </div>
  </PageFrame>;
}
