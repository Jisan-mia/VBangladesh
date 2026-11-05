import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { KarGame } from "./components/game";
import { parentNote, site } from "./content";
import { ORDER, levelOf, placeOf } from "./lib/levels";

const bn = new Intl.NumberFormat("bn-BD", { useGrouping: false });

export default function KarChinhoPage() {
  return (
    <GamePage site={site} kids title={site.headline} note={<ParentNote slug={site.slug} {...parentNote} />}
      more={<section className="kc-more" aria-labelledby="kc-print-title">
        <h3 id="kc-print-title">প্রিন্টের পাতা</h3>
        <p>প্রতিটা লেভেলের দশটা ছবি, প্রতিটা শব্দে একটা ফাঁকা ঘর। ব্রাউজারের প্রিন্ট থেকে PDF হিসেবেও রাখা যায়।</p>
        <ul>{ORDER.map(id => <li key={id}><a href={`/kar-chinho?print=${id}`}>{bn.format(placeOf(id))} · {levelOf(id).title}</a></li>)}</ul>
      </section>}>
      <KarGame />
    </GamePage>
  );
}
