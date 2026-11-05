import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { BhulGame } from "./components/bhul-game";

export default function BhulKothayPage() {
  return (
    <GamePage site={site} kicker="অমিল খোঁজার ধাঁধা · ৩০টা লেভেল" title={site.headline}>
      <BhulGame />
    </GamePage>
  );
}
