import "./product.css";
import Link from "next/link";
import { GamePage } from "../../shared/game-player";
import { DanguliGame } from "./components/game";
import { site } from "./content";

export default function DanguliPage() {
  return (
    <GamePage site={site} kicker={`${site.name} · দুই চাপের দেশি খেলা`} title={site.headline}
      more={
        <section className="dg-field-note" aria-label="মাঠে খেললে">
          <p><b>মাঠে খেলবে?</b> খোলা মাঠে খেলো, রাস্তায় না। কাঠি চোখে লাগতে পারে, তাই মারার দিকে কেউ কাছে দাঁড়াবে না, আর জানালার দিকে মারবে না।</p>
          <Link href="/cholo-kheli">আরও দেশি খেলার নিয়ম: চলো খেলি →</Link>
        </section>
      }>
      <DanguliGame />
    </GamePage>
  );
}
