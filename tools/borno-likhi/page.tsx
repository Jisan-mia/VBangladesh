import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { LikhiGame } from "./components/likhi-game";
import { parentNote, site } from "./content";
import { ORDER, levelOf, placeOf } from "./lib/levels";

const bn = new Intl.NumberFormat("bn-BD", { useGrouping: false });

export default function BornoLikhiPage() {
  return (
    <GamePage site={site} kids title={site.headline} note={<ParentNote slug={site.slug} {...parentNote} />}
      more={<section className="bl-more" aria-labelledby="bl-print-title">
        <h3 id="bl-print-title">খাতার পাতা প্রিন্ট করো</h3>
        <p>প্রতিটা সেটের জন্য একটা A4 পাতা: প্রতিটা বর্ণ একবার নম্বর আর তীরসহ, তিনবার ডট দিয়ে, আর একটা খালি ঘর। ব্রাউজারের প্রিন্ট থেকে PDF হিসেবেও রাখা যায়।</p>
        <ul>{ORDER.map(id => <li key={id}><a href={`/borno-likhi?print=${id}`}>{bn.format(placeOf(id))} · {levelOf(id).title}</a></li>)}</ul>
      </section>}>
      <LikhiGame />
    </GamePage>
  );
}
