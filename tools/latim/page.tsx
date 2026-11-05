import "./product.css";
import Link from "next/link";
import { GamePage } from "../../shared/game-player";
import { LatimGame } from "./components/game";
import { site } from "./content";

export default function LatimPage() {
  return (
    <GamePage site={site} kicker={`${site.name} · উঠানের দেশি খেলা`} title={site.headline}
      more={
        <section className="lt-field-note" aria-label="আসল লাটিম খেললে">
          <p><b>আসল লাটিম খেলবে?</b> লাটিমের নিচে লোহার পেরেক থাকে। ছোড়ার সময় সামনে যেন কেউ না থাকে, বিশেষ করে ছোট বাচ্চা। আর আসল টিনের চালে উঠে খেলবে না।</p>
          <Link href="/cholo-kheli">আরও দেশি খেলার নিয়ম: চলো খেলি →</Link>
        </section>
      }>
      <LatimGame />
    </GamePage>
  );
}
