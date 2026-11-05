import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { MonerGame } from "./components/game";
import { site } from "./content";

export default function MonerRongPage() {
  return (
    <GamePage site={site} kids note={<ParentNote
      learns="অনুভূতির নাম: খুশি, মন খারাপ, রাগ, ভয়, অবাক, লজ্জা। মুখ দেখে মন বোঝা, আর কী করলে ভালো লাগে। প্রতিটা অনুভূতির নিজের একটা রং আছে।"
      age="৪–৯ বছর। পড়তে জানতে হয় না: ছবি দেখে মুখ বাছলেই চলে। ছবির নিচের লাইনটা তুমি পড়ে শোনাও।"
      together="প্রতিটা ছবির শেষে প্রশ্নটা জিজ্ঞেস করো: ‘তোমার কখনো এমন হয়েছে?’ তারপর তুমিও নিজের একটা গল্প বলো।" />}>
      <MonerGame />
    </GamePage>
  );
}
