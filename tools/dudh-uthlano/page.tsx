import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { DudhGame } from "./components/game";

export default function DudhUthlanoPage() {
  return (
    <GamePage site={site} kicker="১২টা রান্নাঘর · তিন জায়গায়" title={<>দুধটা দেখিস! <span>উথলানোর আগে নামাও</span></>}>
      <DudhGame />
    </GamePage>
  );
}
