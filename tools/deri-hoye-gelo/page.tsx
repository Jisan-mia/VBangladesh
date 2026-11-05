import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { LateGame } from "./components/late-game";

export default function DeriHoyeGeloPage() {
  return (
    <GamePage site={site} kicker="স্কুলে দেরি · ১২টা লেভেল" title={<>ঘণ্টা বাজছে, <span>জলদি গেটে চলো!</span></>}>
      <LateGame />
    </GamePage>
  );
}
