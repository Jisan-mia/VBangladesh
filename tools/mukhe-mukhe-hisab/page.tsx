import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { HisabPlay } from "./components/hisab-play";

export default function MukheMukheHisabPage() {
  return (
    <GamePage site={site} title={site.headline}>
      <HisabPlay />
    </GamePage>
  );
}
