import "./product.css";
import Link from "next/link";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { DanguliGame } from "./components/danguli-game";

export default function DanguliPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="dg-page">
        <section className="dg-hero container" aria-labelledby="dg-title">
          <p className="dg-hero-kicker">{site.name} · দুই চাপের দেশি খেলা</p>
          <h1 id="dg-title">{site.headline}</h1>
          <p className="dg-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="ডাংগুলি খেলো"><DanguliGame /></section>
        <section className="container dg-field-note" aria-label="মাঠে খেললে">
          <p><b>মাঠে খেলবে?</b> খোলা মাঠে খেলো, রাস্তায় না। কাঠি চোখে লাগতে পারে, তাই মারার দিকে কেউ কাছে দাঁড়াবে না, আর জানালার দিকে মারবে না।</p>
          <Link href="/cholo-kheli">আরও দেশি খেলার নিয়ম: চলো খেলি →</Link>
        </section>
        <section className="container section dg-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{new Intl.NumberFormat("bn-BD").format(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
