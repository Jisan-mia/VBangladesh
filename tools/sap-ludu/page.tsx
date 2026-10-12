import "./product.css";
import Link from "next/link";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { SapLuduGame } from "./components/sap-ludu-game";

export default function SapLuduPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="sl-page">
        <section className="sl-hero container" aria-labelledby="sl-title">
          <h1 id="sl-title"><span className="sl-hero-kicker">{site.name} · এক ফোনে একা থেকে ৪ জন</span> {site.headline}</h1>
          <p className="sl-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="সাপলুডু খেলো"><SapLuduGame /></section>
        <section className="container sl-board-note" aria-label="আসল বোর্ডে খেললে">
          <p><b>বাসায় বোর্ড আছে?</b> আসল লুডু বোর্ডে খেললে কে কয় দান জিতল, সেই হিসাব রাখো চলো খেলি-তে।</p>
          <Link href="/cholo-kheli">স্কোর রাখো চলো খেলি-তে →</Link>
        </section>
        <section className="container section sl-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <p>{site.guideIntro}</p>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
