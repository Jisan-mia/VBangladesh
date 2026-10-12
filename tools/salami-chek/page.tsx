import "./product.css";
import { Faq, JsonLd, PageFrame } from "../../shared/site-shell";
import { site } from "./content";
import { SalamiTool } from "./components/salami-tool";
import { Messages } from "./components/messages";
import { bn } from "./lib/cheque";

export default function SalamiChekPage() {
  return (
    <PageFrame site={site}>
      <JsonLd site={site} />
      <div className="salami">
        <section className="salami-hero container" aria-labelledby="salami-title">
          <p className="salami-kicker">ঈদ সালামি · চেক আর খাতা</p>
          <h1 id="salami-title">সালামি চাও? <span>চেকটা কেটে পাঠাও</span></h1>
          <p className="salami-lead">{site.lead}</p>
        </section>
        <section className="container" id="tool" aria-label="সালামির চেক আর খাতা"><SalamiTool /></section>

        <section className="container section salami-messages" aria-labelledby="messages-title">
          <h2 id="messages-title">ঈদ সালামি চাওয়ার মেসেজ</h2>
          <p>চেকের সাথে লিখে পাঠাতে পারো। পছন্দেরটায় ‘কপি’ চাপো।</p>
          <Messages />
        </section>
        <section className="container section salami-guide" id="guide" aria-labelledby="guide-title">
          <h2 id="guide-title">{site.guideTitle}</h2>
          <ol>{site.steps.map((step, index) => <li key={step}><span aria-hidden="true">{bn(index + 1)}</span><p>{step}</p></li>)}</ol>
        </section>
        <Faq items={site.faq} />
      </div>
    </PageFrame>
  );
}
