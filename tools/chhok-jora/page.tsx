import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { ChhokGame } from "./components/chhok-game";

export default function ChhokJoraPage() {
  return (
    <GamePage site={site} kicker="খাতার পাতার ডট-বক্স খেলা, এবার নকশিকাঁথায়" title={site.headline}>
      <ChhokGame />
    </GamePage>
  );
}
