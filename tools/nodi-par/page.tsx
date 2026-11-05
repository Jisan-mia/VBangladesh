import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { RiverGame } from "./components/river-game";

export default function NodiParPage() {
  return (
    <GamePage site={site} kicker="লাফের গেম · ৩০টা নদী" title={<>নৌকা, ভেলা, কচুরিপানায় <span>লাফিয়ে ওপারের ঘাটে</span></>}>
      <RiverGame />
    </GamePage>
  );
}
