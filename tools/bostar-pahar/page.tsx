import "./product.css";
import Link from "next/link";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { BostarGame } from "./components/bostar-game";

export default function BostarPaharPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="bp-page">
        <section className="bp-hero container" aria-labelledby="bp-title">
          <p className="bp-hero-kicker">{site.name} · এক চাপের খেলা</p>
          <h1 id="bp-title">{site.headline}</h1>
          <p className="bp-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="বস্তার পাহাড় খেলো"><BostarGame /></section>
        <section className="container section bp-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
          <p className="bp-more">আরও এক চাপের খেলা: <Link href="/danguli">ডাংগুলি</Link> · <Link href="/dudh-uthlano">দুধ উথলানোর আগে</Link></p>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
