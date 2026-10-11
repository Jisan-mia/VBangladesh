import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { SuggestBox } from "../../shared/share-kit";
import { site } from "./content";
import { PackBuilder } from "./components/pack-builder";
import { bn, items, packs } from "./lib/pack";

export default function StarterPackPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="sp-site">
        <section className="sp-hero container" aria-labelledby="sp-title">
          <p className="sp-hero-kicker">মেলার খেলনার প্যাকেট · {bn(packs.length)}টা প্যাকেট · এআই ছাড়া</p>
          <h1 id="sp-title">তোমার স্টার্টার প্যাকে <span>কী কী?</span></h1>
          <p className="sp-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="স্টার্টার প্যাক বানাও"><PackBuilder /></section>

        <section className="container section sp-made" aria-labelledby="made-title">
          <h2 id="made-title">প্যাকেটগুলো কীভাবে বানানো</h2>
          <p>ছোটবেলায় মেলার দোকানে বা স্কুলের গেটে ঝুলত শক্ত কাগজে সাঁটা প্লাস্টিকের খেলনার প্যাকেট: মাঝখানে একটা পুতুল, চারপাশের খোপে তার জিনিসপত্র। এখানে সেই প্যাকেটেই তোমার চেনা জীবন।</p>
          <p>খেলনাটা আর {bn(Object.keys(items).length)}টা জিনিসের প্রতিটা আমাদের নিজেদের আঁকা, কোনো এআই ছবি নয়। খেলনাটার কোনো ছেলে-মেয়ে বা গায়ের রং নেই, শুধু প্যাকেটের রং। কোনো এলাকা, ধর্ম, পেশা বা চেহারা নিয়ে খোঁচা নেই। মজাটা সবার চেনা দিনগুলো থেকে: খাতা ধার, টিফিন বাটি, লাগেজে আচার, ঠান্ডা চা, বাসের টিকিট, খিচুড়ি। কোনো ব্র্যান্ডের নাম বা লোগো নেই।</p>
        </section>

        <section className="container section sp-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
        <section className="container section sp-suggest" aria-label="নতুন প্যাকেটের পরামর্শ"><SuggestBox tool="starter-pack" question="কোন প্যাকেট বা জিনিসটা থাকা উচিত ছিল?" placeholder="যেমন: এসএসসি পরীক্ষার্থী, শীতের সকালের প্যাকেট" /></section>
      </div>
    </PageFrame>
  );
}
