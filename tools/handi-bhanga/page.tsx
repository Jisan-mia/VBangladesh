import "./product.css";
import { GamePage } from "../../shared/game-player";
import { HandiStall } from "./components/stall";
import { site } from "./content";

export default function HandiBhangaPage() {
  return (
    <GamePage site={site} kicker="বল দিয়ে ইট ভাঙার সেই গেম, এবার মেলার হাঁড়িতে" title={site.headline}>
      <HandiStall />
    </GamePage>
  );
}
