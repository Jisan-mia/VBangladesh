import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { Typewriter } from "./components/typewriter";

export default function BanglaTypingPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bt-page">
        <section className="bt-hero container" aria-labelledby="bt-title">
          <h1 id="bt-title"><span className="bt-hero-kicker">বাংলা টাইপিং টেস্ট · ৬০ সেকেন্ড, যেকোনো কিবোর্ডে</span> মিনিটে কয়টা <span>বাংলা শব্দ?</span></h1>
          <p className="bt-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="বাংলা টাইপিং টেস্ট দাও"><Typewriter /></section>
        <section className="container section bt-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
