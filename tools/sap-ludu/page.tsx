import "./product.css";
import Link from "next/link";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { LuduGame } from "./components/ludu-game";

export default function SapLuduPage() {
  return (
    <GamePage site={site} kicker={`${site.name} · এক ফোনে একা থেকে ৪ জন`} title={site.headline}
      more={<p className="sl-more">বাসায় আসল বোর্ড আছে? কে কয় দান জিতল, হিসাব রাখো <Link href="/cholo-kheli">চলো খেলি-তে →</Link></p>}>
      <LuduGame />
    </GamePage>
  );
}
