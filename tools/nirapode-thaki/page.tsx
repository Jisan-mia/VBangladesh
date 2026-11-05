import "./product.css";
import { GamePage } from "../../shared/game-player";
import { ParentNote } from "../../shared/kids-kit";
import { SafeGame } from "./components/game";
import { parentNote, site } from "./content";
import { SETS } from "./lib/sets";

export default function NirapodeThakiPage() {
  return (
    <GamePage site={site} kids title={site.headline} note={<ParentNote slug={site.slug} {...parentNote} />}
      more={<section className="nt-more" aria-labelledby="nt-facts-title">
        <h3 id="nt-facts-title">বড়দের জন্য: প্রতিটা দৃশ্যে একটা তথ্য, একটা কাজ</h3>
        <dl className="nt-facts">{SETS.map(item => <div key={item.id}><dt>{item.bn}</dt><dd>{item.parent.fact} {item.parent.action} <small>সূত্র: {item.parent.source}</small></dd></div>)}</dl>
      </section>}>
      <SafeGame />
    </GamePage>
  );
}
