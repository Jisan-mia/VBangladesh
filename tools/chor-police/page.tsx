import "./product.css";
import Link from "next/link";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { ChitGame } from "./components/chit-game";

export default function ChorPolicePage() {
  return (
    <GamePage site={site} kicker={`${site.name} · এক ফোনে চারজন`} title={site.headline}
      more={<Link className="cp-more-link" href="/cholo-kheli">মাঠের দেশি খেলার নিয়ম চাও? চলো খেলি →</Link>}>
      <ChitGame />
    </GamePage>
  );
}
