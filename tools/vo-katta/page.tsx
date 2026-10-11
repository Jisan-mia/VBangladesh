import "./product.css";
import Link from "next/link";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { VoKattaGame } from "./components/vo-katta-game";

export default function VoKattaPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="vk-page">
        <section className="vk-hero container" aria-labelledby="vk-title">
          <p className="vk-hero-kicker">পুরান ঢাকার সাকরাইন, শীতের সন্ধ্যা, ছাদে ছাদে প্যাঁচ</p>
          <h1 id="vk-title">{site.headline}</h1>
          <p className="vk-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ভো-কাট্টা খেলো"><VoKattaGame /></section>
        <section className="container section vk-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="vk-maker">নিজের নাম লেখা ঘুড়ি বানাতে চাও? <Link href="/ghuri">ঘুড়ি আর ফানুস বানাও →</Link></p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
