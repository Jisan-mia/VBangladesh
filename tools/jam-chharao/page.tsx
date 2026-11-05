import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { JamGame } from "./components/jam-game";

export default function JamChharaoPage() {
  return (
    <GamePage site={site} title={<>জ্যামে আটকা CNG, <span>পথ করে দাও</span></>}>
      <JamGame />
    </GamePage>
  );
}
