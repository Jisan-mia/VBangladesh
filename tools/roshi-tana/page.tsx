import "./product.css";
import { GamePage } from "../../shared/game-player";
import { RoshiGame } from "./components/game";
import { site } from "./content";

export default function RoshiTanaPage() {
  return (
    <GamePage site={site} title={site.headline}>
      <RoshiGame />
    </GamePage>
  );
}
