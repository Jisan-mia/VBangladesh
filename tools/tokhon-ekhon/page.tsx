import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { Wallet } from "./components/wallet";
import { CHECKED, CPI, SOURCE_URL, WB_UPDATED } from "./lib/cpi";
import { bn, bnYear, createCard, years, LATEST_YEAR } from "./lib/tokhon";

const cpiText = new Intl.NumberFormat("bn-BD", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export default function TokhonEkhonPage() {
  const example = createCard({ year: 1995, amount: 100, birth: false });
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="tokhon">
        <section className="tokhon-hero container" aria-labelledby="tokhon-title">
          <p className="tokhon-kicker">টাকার মান · {bnYear(years[0])} থেকে {bnYear(LATEST_YEAR)}</p>
          <h1 id="tokhon-title">{site.headline}</h1>
          <p className="tokhon-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="সাল আর টাকা বেছে নাও"><Wallet /></section>

        <section className="container section tokhon-method" id="source" aria-labelledby="method-title">
          <h2 id="method-title">হিসাবটা কোথা থেকে আসে</h2>
          <p>একটাই তথ্যসূত্র: বাংলাদেশ পরিসংখ্যান ব্যুরোর (বিবিএস) ভোক্তা মূল্যসূচক, বছরের গড়, ২০১০ = ১০০ ধরে। আমরা নিয়েছি বিশ্বব্যাংকের তথ্যভান্ডার থেকে (সূচক FP.CPI.TOTL), যেখানে এটা আইএমএফ হয়ে আসে।</p>
          <p>হিসাব: তখনকার টাকা × ({bnYear(LATEST_YEAR)}-এর সূচক ÷ সেই সালের সূচক)। যেমন ১৯৯৫-এর সূচক {cpiText.format(CPI[1995])}, {bnYear(LATEST_YEAR)}-এর {cpiText.format(CPI[LATEST_YEAR])}। তাই ১৯৯৫-এর ১০০ টাকা ≈ এখনকার {bn(example.now)} টাকা।</p>
          <p>এটা সব জিনিসের গড় দাম। চাল, তেল, বাসভাড়া, বাড়িভাড়া একেকটা একেক হারে বেড়েছে, তাই ফলটা আনুমানিক। আলাদা জিনিসের পুরোনো দাম রাখিনি: ফেসবুকে ঘোরা ‘আগের দিনের দাম’-এর অনেক ছবিতে সাল ভুল থাকে।</p>
          <details className="tokhon-table">
            <summary>প্রতি সালের ১০০ টাকা এখন কত <small>পুরো তালিকা</small></summary>
            <table>
              <thead><tr><th scope="col">সাল</th><th scope="col">সূচক</th><th scope="col">১০০ টাকা ≈ এখন</th></tr></thead>
              <tbody>{years.map(year => <tr key={year}><th scope="row">{bnYear(year)}</th><td>{cpiText.format(CPI[year])}</td><td>{bn(createCard({ year, amount: 100, birth: false }).now)} টাকা</td></tr>)}</tbody>
            </table>
          </details>
          <p className="tokhon-source">সূত্র/যাচাই: <a href={SOURCE_URL} target="_blank" rel="noopener">বিশ্বব্যাংক, Consumer price index (2010 = 100), Bangladesh</a> · বিশ্বব্যাংকের হালনাগাদ: {WB_UPDATED} · যাচাই করা: {CHECKED} · বছরে একবার হালনাগাদ হয়।</p>
        </section>

        <section className="container section tokhon-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bnYear(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
