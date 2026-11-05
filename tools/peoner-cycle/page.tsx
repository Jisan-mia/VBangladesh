import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { RideGame } from "./components/ride-game";

export default function PeonerCyclePage() {
  return (
    <GamePage site={site} kicker="ছোটবেলার ব্রিক গেমের রেস, এবার গ্রামের পথে" title={<>ভোরের পথে চিঠি নিয়ে, <span>ক্রিং ক্রিং!</span></>}>
      <RideGame />
    </GamePage>
  );
}
