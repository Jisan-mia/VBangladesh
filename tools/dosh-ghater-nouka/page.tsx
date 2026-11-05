import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { NoukaGame } from "./components/game";
import { parentNote, site } from "./content";

export default function DoshGhaterNoukaPage() {
  return (
    <GamePage site={site} kids title={site.headline} note={<ParentNote slug={site.slug} {...parentNote} />}>
      <NoukaGame />
    </GamePage>
  );
}
