import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { GardenGame } from "./components/garden-game";

export default function AtirAamPage() {
  return (
    <GamePage site={site} title={site.headline}>
      <GardenGame />
    </GamePage>
  );
}
