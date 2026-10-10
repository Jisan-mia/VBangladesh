import './product.css';
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { PrimerBuilder } from "./components/primer-builder";
import { alternatives, banglaUnder100, toBanglaDigits } from "./lib/number-words";

const bn = (n: number) => toBanglaDigits(String(n));
const words = [...banglaUnder100.slice(1), "একশো"];

export default function TakaKothayPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="tk-wrap">
        <section className="tk-hero container" aria-labelledby="tk-title">
          <p className="tk-kicker">ধারাপাত · চেক আর ফর্মের জন্য</p>
          <h1 id="tk-title">যেকোনো অঙ্ক, <span>কথায় লেখা</span></h1>
          <p className="tk-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="টাকার অঙ্ক কথায় লেখো"><PrimerBuilder /></section>

        <section className="container section tk-rules" aria-labelledby="rules-title">
          <h2 id="rules-title">টাকা কথায় লেখার নিয়ম</h2>
          <ol>
            <li><b>ঘর ভাগ করো:</b> ডান দিক থেকে তিন ঘর (শো আর একক), তারপর দুই ঘর হাজার, দুই ঘর লাখ, বাকিটা কোটি। ১২,৩৪,৫৬৭ = বারো <i>লাখ</i> চৌত্রিশ <i>হাজার</i> পাঁচ<i>শো</i> সাতষট্টি।</li>
            <li><b>শেষে ‘মাত্র’:</b> চেকে কথার শেষে ‘টাকা মাত্র’, ইংরেজিতে ‘Taka … Only’ লেখো, যাতে পরে কেউ কিছু জুড়ে দিতে না পারে।</li>
            <li><b>পয়সা আলাদা:</b> ‘… টাকা পঞ্চাশ পয়সা মাত্র’, ইংরেজিতে ‘… and Paisa Fifty Only’।</li>
            <li><b>অঙ্কে আর কথায় মিল:</b> দুটো না মিললে ব্যাংক চেক ফেরত দেয়। লেখা শেষে আরেকবার মিলিয়ে নাও।</li>
          </ol>
        </section>

        <section className="container section tk-table" id="ek-theke-eksho" aria-labelledby="table-title">
          <h2 id="table-title">১ থেকে ১০০, কথায়</h2>
          <p>ধারাপাতের সেই পাতা। কয়েকটা সংখ্যার আরেকটা প্রচলিত বানানও আছে, পাশে ছোট করে লেখা।</p>
          <ol>
            {words.map((word, index) => {
              const n = index + 1;
              return <li key={n} data-un={/^ঊন/.test(word) || undefined}><b>{bn(n)}</b><span>{word}{alternatives[n] && <small> / {alternatives[n]}</small>}</span></li>;
            })}
          </ol>
          <p className="tk-source">সূত্র/যাচাই: বাংলাদেশে প্রচলিত বাংলা একাডেমির বানান রীতি ধরে লেখা (ঊন- দিয়ে ঊনত্রিশ, ‘ো’ দিয়ে এগারো-ষোলো)। উইকিঅভিধানের বাংলা সংখ্যার তালিকা, উইকিপিডিয়া, বাংলা অভিধান আর জাতীয় পাঠ্যবইয়ের উদাহরণের সাথে মিলিয়ে দেখা। চেকে দুই বানানই চলে।</p>
        </section>

        <section className="container section tk-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
