import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { PatiGame } from "./components/pati-game";

export default function PatiBuniPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="pb-page">
        <section className="pb-hero container" aria-labelledby="pb-title">
          <p className="pb-hero-kicker">পুরোনো দিনের ব্লক গেম, এবার বেতের ফালিতে</p>
          <h1 id="pb-title">সারি ভরাও, <span>শীতলপাটি বোনো</span></h1>
          <p className="pb-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="পাটি বুনি খেলো"><PatiGame /></section>
        <section className="container section pb-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p className="pb-guide-intro">{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="pb-credit">শীতলপাটি বোনা সিলেট অঞ্চলের পাটিকরদের হাতের কাজ। এই খেলা শুধু সেই কাজকে মনে করিয়ে দেয়, কোনো শিল্পী বা সংগঠনের সাথে আমাদের যোগ নেই।</p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
