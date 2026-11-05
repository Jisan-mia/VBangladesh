import "./product.css";
import { GamePage } from "../../shared/game-player";
import { RiverGame } from "./components/river";
import { site } from "./content";

export default function BaicherNoukaPage() {
  return (
    <GamePage site={site} kicker="নৌকাবাইচ গেম · ছোটবেলার রেসিং, এবার নদীতে" title={<>ঢোলের তালে বৈঠা, <span>সবার আগে ঘাটে!</span></>}>
      <RiverGame />
    </GamePage>
  );
}
