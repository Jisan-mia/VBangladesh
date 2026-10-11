import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { MeterTool } from "./components/meter-tool";
import { site } from "./content";
import { appliances, bn, hoursText, noteOf, taka, takaExact } from "./lib/meter";
import { stepRange, tariff, tariffInfo } from "./lib/tariff";

export default function BidyutBillPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bb-page">
        <section className="bb-hero container" aria-labelledby="bb-title">
          <p className="bb-kicker">পুরোনো মিটারের হিসাব · আনুমানিক</p>
          <h1 id="bb-title">কোন যন্ত্রে <span>কত বিল আসে?</span></h1>
          <p className="bb-lead">{site.lead}</p>
        </section>

        <section className="container" id="tool" aria-label="বিদ্যুৎ বিলের হিসাব"><MeterTool /></section>

        <section className="container section bb-tariff" id="tariff" aria-labelledby="tariff-title">
          <h2 id="tariff-title">আবাসিক বিদ্যুতের দাম, এখন</h2>
          <p>{tariffInfo.title} · {tariffInfo.effective} থেকে। প্রতিটা ধাপের ইউনিট সেই ধাপের দরে হিসাব হয়: ২০০ ইউনিট হলে প্রথম ৭৫টা প্রথম ধাপে, বাকি ১২৫টা দ্বিতীয় ধাপে।</p>
          <table>
            <caption className="bb-sr">আবাসিক (এলটি-এ) বিদ্যুতের প্রতি ইউনিটের দাম</caption>
            <thead><tr><th scope="col">মাসে কত ইউনিট</th><th scope="col">প্রতি ইউনিট</th></tr></thead>
            <tbody>
              <tr><th scope="row">লাইফলাইন: ০–{bn(tariff.lifeline.upTo)} <small>শুধু মাসে {bn(tariff.lifeline.upTo)}-এর মধ্যে থাকলে</small></th><td>{takaExact(tariff.lifeline.rate)} টাকা</td></tr>
              {tariff.steps.map(step => <tr key={step.label}><th scope="row">{step.label}: {stepRange(step)}</th><td>{takaExact(step.rate)} টাকা</td></tr>)}
            </tbody>
          </table>
          <ul className="bb-terms">
            <li><strong>ডিমান্ড চার্জ:</strong> অনুমোদিত লোডের প্রতি কিলোওয়াটে মাসে {taka(tariff.demandPerKw)} টাকা।</li>
            <li><strong>ভ্যাট:</strong> এনার্জি আর ডিমান্ড চার্জের ওপর {bn(tariff.vat * 100)}%।</li>
            <li><strong>প্রিপেইড:</strong> ভ্যাট বাদে মূল বিলের ওপর ০.৫% রিবেট (এই হিসাবে ধরা হয়নি)।</li>
            <li><strong>মিটার ভাড়া:</strong> কোম্পানি আর মিটারভেদে আলাদা, তাই ধরা হয়নি।</li>
          </ul>
          <p className="bb-checked">সূত্র: {tariffInfo.order}। যাচাই করা: {tariffInfo.checked}। দাম বদলালে এখানে নতুন আদেশের তারিখসহ বদলানো হবে।</p>
          <ul className="bb-links">{tariffInfo.sources.map(source => <li key={source.url}><a href={source.url} rel="external">{source.label} ↗</a></li>)}</ul>

          <h3>যন্ত্রগুলোর সাধারণ মান</h3>
          <p>যন্ত্রভেদে ওয়াট কমবেশি হয়। আসল ওয়াট যন্ত্রের গায়ের লেবেলে লেখা থাকে, ওপরে ওয়াটে চাপ দিয়ে বসাতে পারো। ১ ইউনিট = ১,০০০ ওয়াট এক ঘণ্টা।</p>
          <table className="bb-watts">
            <caption className="bb-sr">কোন যন্ত্রে মাসে কত ইউনিট (সাধারণ মান)</caption>
            <thead><tr><th scope="col">যন্ত্র (একটা)</th><th scope="col">ওয়াট</th><th scope="col">দিনে</th><th scope="col">মাসে</th></tr></thead>
            <tbody>{appliances.map(item => <tr key={item.id}><th scope="row">{item.label}{noteOf(item) && <small>{noteOf(item)}</small>}</th><td>{bn(item.watts)}</td><td>{hoursText(item.hours)} ঘণ্টা</td><td>{bn((item.watts * item.hours * 30) / 1000)} ইউনিট</td></tr>)}</tbody>
          </table>
        </section>

        <section className="container section bb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="bb-honest">এটা আনুমানিক হিসাব, তোমার মিটারের বিলই আসল। এখানে কোনো বিদ্যুৎ কোম্পানির অ্যাকাউন্ট, বিল বা মিটারের তথ্য দেখা যায় না।</p>
        </section>
        <Faq items={site.faq} />
        <section className="container section bb-suggest" aria-label="যন্ত্রের পরামর্শ"><SuggestBox tool="bidyut-bill" question="কোন যন্ত্রটা এখানে থাকা উচিত ছিল?" placeholder="যেমন: গিজার, ওয়াশিং মেশিন" /></section>
      </div>
    </PageFrame>
  );
}
