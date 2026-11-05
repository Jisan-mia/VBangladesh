import "./product.css";
import { GamePage } from "../../shared/game-player";
import { site } from "./content";
import { SudokuGame } from "./components/sudoku-game";

export default function SudokuPage() {
  return (
    <GamePage site={site}>
      <SudokuGame />
    </GamePage>
  );
}
