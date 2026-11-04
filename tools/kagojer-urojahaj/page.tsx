import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { FlightGame } from "./components/flight-game";

export default function KagojerUrojahajPage() {
  return (
    <GamePage site={site} kicker="ক্লাসঘর থেকে নদীর ঘাট · ১২টা উড়ান" title={<>খাতার পাতার প্লেন ছোড়ো, <span>লাল দাগে নামাও</span></>}>
      <FlightGame />
    </GamePage>
  );
}
