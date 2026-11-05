import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { JuktobornoGame } from "./components/game";
import { parentNote, site } from "./content";
import { ORDER, levelOf, placeOf } from "./lib/levels";

const bn = new Intl.NumberFormat("bn-BD", { useGrouping: false });

export default function JuktobornoPage() {
  return (
    <GamePage site={site} kids title={site.headline} note={<ParentNote slug={site.slug} {...parentNote} />}
      more={<section className="jb-more" aria-labelledby="jb-print-title">
        <h3 id="jb-print-title">প্রিন্টের পাতা</h3>
        <p>প্রতিটা ধাপের ছবির শব্দ, প্রতিটার যুক্তবর্ণ ভেঙে লেখার ঘরসহ। ব্রাউজারের প্রিন্ট থেকে PDF হিসেবেও রাখা যায়।</p>
        <ul>{ORDER.map(id => <li key={id}><a href={`/juktoborno?print=${id}`}>{bn.format(placeOf(id))} · {levelOf(id).title}</a></li>)}<li><a href="/juktoborno?print">ভেঙে লেখো: দশটা শব্দ</a></li></ul>
      </section>}>
      <JuktobornoGame />
    </GamePage>
  );
}
