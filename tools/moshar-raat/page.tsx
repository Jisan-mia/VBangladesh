import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { NightGame } from "./components/night-game";

export default function MosharRaatPage() {
  return (
    <GamePage site={site} title={<>ভোর পর্যন্ত বালিশটা <span>বাঁচাতে পারবে?</span></>}>
      <NightGame />
    </GamePage>
  );
}
