import "./product.css";
import { GamePage } from "../../shared/game-player";
import { PenaltyGame } from "./components/penalty";
import { site } from "./content";

export default function PenaltyPage() {
  return (
    <GamePage site={site}>
      <PenaltyGame />
    </GamePage>
  );
}
