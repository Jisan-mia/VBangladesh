import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { ShobdoGame } from "./components/shobdo-game";

export default function ShobdoKhojaPage() {
  return (
    <GamePage site={site} kicker="বাংলা ওয়ার্ড সার্চ · ফুল, মাছ, পিঠা, নদী…" title={site.headline}>
      <ShobdoGame />
    </GamePage>
  );
}
