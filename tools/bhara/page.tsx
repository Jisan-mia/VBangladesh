import './product.css';
import { Faq, JsonLd, PageFrame } from '../../shared/site-shell';
import { FareCalculator } from './components/fare-calculator';
import { FareChart } from './components/fare-chart';
import { site } from './content';
import { fareSource } from './lib/fares';

export default function BharaPage() {
  return <PageFrame site={site}>
    <JsonLd site={site} />
    <div className="bhara">
      <section className="bhara-hero container" aria-labelledby="bhara-title">
        <h1 id="bhara-title"><span className="bhara-kicker">মেট্রো রেলের ভাড়া · উত্তরা উত্তর থেকে মতিঝিল</span> মেট্রোতে যাচ্ছ?<br /><span>ভাড়াটা দেখে নাও</span></h1>
        <p className="bhara-lead">{site.lead} <a href="#chart">পুরো ভাড়ার তালিকা ↓</a></p>
      </section>

      <section className="container" id="tool" aria-label="ভাড়ার হিসাব"><FareCalculator /></section>

      <section className="container section bhara-chart" id="chart" aria-labelledby="chart-title">
        <p className="bhara-kicker">ভাড়ার তালিকা</p>
        <h2 id="chart-title">মেট্রোরেলের ভাড়ার চার্ট</h2>
        <p className="bhara-muted">১৬টা স্টেশন, একক যাত্রার টিকিটে একজনের একবারের ভাড়া। একটা স্টেশন বেছে নাও, বাকি সব স্টেশনের ভাড়া দেখবে। দুই দিকেই ভাড়া একই।</p>
        <FareChart />
        <p className="bhara-chart-source">ভাড়া ডিএমটিসিএলের সরকারি নথি থেকে নেওয়া। নথির তারিখ {fareSource.published}, আমরা মিলিয়ে দেখেছি {fareSource.checked}।</p>
      </section>

      <section className="container section bhara-source" aria-labelledby="source-heading">
        <h2 id="source-heading">ভাড়াগুলো কোথা থেকে, নিজেই মিলিয়ে নাও</h2>
        <p>সব ভাড়া <strong>ডিএমটিসিএলের ওয়েবসাইটে দেওয়া সরকারি নথি</strong> থেকে নেওয়া। নথির তারিখ {fareSource.published}, আমরা মিলিয়ে দেখেছি {fareSource.checked}।</p>
        <p>ভাড়া বা ট্রেনের সময় বদলালে এখানে নিজে থেকে বদলায় না। তাই বের হওয়ার আগে স্টেশনের নোটিশ বা ডিএমটিসিএলের সাইটে একবার দেখে নিও। এমআরটি পাস বা র‍্যাপিড পাসের ছাড়, অন্য কোনো ছাড়, আর স্টেশন পর্যন্ত রিকশা-বাসের খরচ এই হিসাবে নেই।</p>
        <div className="bhara-source-links"><a href={fareSource.page} rel="external">সরকারি ভাড়ার তালিকা দেখো ↗</a><a href={fareSource.document} rel="external">মূল নথি (PDF) দেখো ↗</a></div>
        <p className="bhara-small">একটুখানি স্বাধীনভাবে বানানো। আমরা ডিএমটিসিএলের কেউ না, টিকিটও বিক্রি করি না।</p>
      </section>

      <section className="container section bhara-guide" id="guide" aria-labelledby="guide-title">
        <h2 id="guide-title">{site.guideTitle}</h2>
        <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat('bn-BD').format(index + 1)}</span><p>{step}</p></li>)}</ol>
      </section>
      <Faq items={site.faq} />
    </div>
  </PageFrame>;
}
