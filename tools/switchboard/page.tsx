import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { SwitchboardGame } from "./components/switchboard-game";

export default function SwitchboardPage() {
  return (
    <GamePage site={site} kicker="বাতি জ্বালানোর ধাঁধা · ৩০টা লেভেল" title={site.headline}>
      <SwitchboardGame />
    </GamePage>
  );
}
