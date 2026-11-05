import "./product.css";
import { GamePage } from "../../shared/game-player";
import { AntennaGame } from "./components/antenna";
import { site } from "./content";

export default function AntennaPage() {
  return (
    <GamePage site={site} title={site.headline}>
      <AntennaGame />
    </GamePage>
  );
}
