import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { CarromGame } from "./components/carrom-game";

export default function CarromPage() {
  return (
    <GamePage site={site} kicker="ক্যারম বোর্ড খেলা · একা বা দুজনে">
      <CarromGame />
    </GamePage>
  );
}
